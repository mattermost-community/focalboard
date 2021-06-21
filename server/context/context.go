package context

import (
	"context"
	"net"
	"net/http"
)

type contextKey struct {
	key string
}

var connContextKey = &contextKey{"http-conn"}

// SetContextConn stores the connection in the request context.
func SetContextConn(ctx context.Context, c net.Conn) context.Context {
	return context.WithValue(ctx, connContextKey, c)
}

// GetContextConn gets the stored connection from the request context.
func GetContextConn(r *http.Request) net.Conn {
	value := r.Context().Value(connContextKey)
	if value == nil {
		return nil
	}

	return value.(net.Conn)
}
