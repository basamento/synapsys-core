// Collect license and notice files from modules used by the Core binary.
package main

import (
	"bufio"
	"fmt"
	"io"
	"io/fs"
	"os"
	"os/exec"
	"path/filepath"
	"sort"
	"strings"
)

func main() {
	if len(os.Args) != 2 {
		fail(fmt.Errorf("usage: collect-go-licenses OUTPUT"))
	}
	output := os.Args[1]
	format := "{{if and .Module (not .Module.Main)}}{{.Module.Path}}@{{.Module.Version}}|{{.Module.Dir}}{{end}}"
	cmd := exec.Command("go", "list", "-deps", "-f", format, "./cmd/api")
	cmd.Stderr = os.Stderr
	cmd.Env = os.Environ()
	if target := os.Getenv("LICENSE_TARGETOS"); target != "" {
		cmd.Env = append(cmd.Env, "GOOS="+target)
	}
	if target := os.Getenv("LICENSE_TARGETARCH"); target != "" {
		cmd.Env = append(cmd.Env, "GOARCH="+target)
	}
	data, err := cmd.Output()
	if err != nil {
		fail(err)
	}
	modules := map[string]string{}
	scanner := bufio.NewScanner(strings.NewReader(string(data)))
	for scanner.Scan() {
		parts := strings.SplitN(scanner.Text(), "|", 2)
		if len(parts) == 2 {
			modules[parts[0]] = parts[1]
		}
	}
	if err := scanner.Err(); err != nil {
		fail(err)
	}
	if len(modules) == 0 {
		fail(fmt.Errorf("no third-party modules found"))
	}
	if err := os.MkdirAll(output, 0755); err != nil {
		fail(err)
	}
	names := make([]string, 0, len(modules))
	for name := range modules {
		names = append(names, name)
	}
	sort.Strings(names)
	if err := os.WriteFile(filepath.Join(output, "modules.txt"), []byte(strings.Join(names, "\n")+"\n"), 0644); err != nil {
		fail(err)
	}
	for _, name := range names {
		root := modules[name]
		count := 0
		err := filepath.WalkDir(root, func(p string, entry fs.DirEntry, walkErr error) error {
			if walkErr != nil {
				return walkErr
			}
			if entry.IsDir() || !entry.Type().IsRegular() {
				return nil
			}
			lower := strings.ToLower(entry.Name())
			if !strings.HasPrefix(lower, "license") && !strings.HasPrefix(lower, "licence") && !strings.HasPrefix(lower, "copying") && !strings.HasPrefix(lower, "notice") {
				return nil
			}
			rel, err := filepath.Rel(root, p)
			if err != nil {
				return err
			}
			dest := filepath.Join(output, name, rel)
			if err := os.MkdirAll(filepath.Dir(dest), 0755); err != nil {
				return err
			}
			if err := copyFile(p, dest); err != nil {
				return err
			}
			count++
			return nil
		})
		if err != nil {
			fail(err)
		}
		if count == 0 {
			fail(fmt.Errorf("no license or notice files found for %s", name))
		}
	}
	fmt.Printf("Collected license files for %d Go modules.\n", len(names))
}

func copyFile(src, dest string) error {
	in, err := os.Open(src)
	if err != nil {
		return err
	}
	defer in.Close()
	out, err := os.Create(dest)
	if err != nil {
		return err
	}
	_, copyErr := io.Copy(out, in)
	closeErr := out.Close()
	if copyErr != nil {
		return copyErr
	}
	return closeErr
}

func fail(err error) { fmt.Fprintln(os.Stderr, err); os.Exit(1) }
