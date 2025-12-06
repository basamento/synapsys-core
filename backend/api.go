package main

import (
    "encoding/json"
    "net/http"
)

type Todo struct {
    ID    int64  `json:"id"`
    Title string `json:"title"`
    Done  bool   `json:"done"`
}

func todosHandler(w http.ResponseWriter, r *http.Request) {
    switch r.Method {
    case http.MethodGet:
        listTodos(w, r)
    case http.MethodPost:
        createTodo(w, r)
    default:
        w.WriteHeader(http.StatusMethodNotAllowed)
    }
}

func listTodos(w http.ResponseWriter, r *http.Request) {
    rows, err := db.Query(`SELECT id, title, done FROM todos ORDER BY id DESC`)
    if err != nil {
        http.Error(w, err.Error(), http.StatusInternalServerError)
        return
    }
    defer rows.Close()

    var todos []Todo
    for rows.Next() {
        var t Todo
        if err := rows.Scan(&t.ID, &t.Title, &t.Done); err != nil {
            http.Error(w, err.Error(), http.StatusInternalServerError)
            return
        }
        todos = append(todos, t)
    }

    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(todos)
}

func createTodo(w http.ResponseWriter, r *http.Request) {
    var in struct {
        Title string `json:"title"`
    }
    if err := json.NewDecoder(r.Body).Decode(&in); err != nil {
        http.Error(w, err.Error(), http.StatusBadRequest)
        return
    }

    res, err := db.Exec(`INSERT INTO todos (title, done) VALUES (?, 0)`, in.Title)
    if err != nil {
        http.Error(w, err.Error(), http.StatusInternalServerError)
        return
    }
    id, _ := res.LastInsertId()

    t := Todo{ID: id, Title: in.Title, Done: false}
    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(t)
}
