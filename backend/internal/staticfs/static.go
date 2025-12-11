package staticfs

import (
	"embed"
	"io/fs"
	"os"
)

//go:embed all:static
var Embedded embed.FS

// Static returns the embedded FS if available,
// otherwise falls back to the local ./static folder (for dev mode).
func Static() fs.FS {
	sub, err := fs.Sub(Embedded, "static")
	if err == nil {
		return sub
	}
	return os.DirFS("./static")
}
