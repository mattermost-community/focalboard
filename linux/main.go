package main

import (
	"context"
	"fmt"
	"log"
	"os"
	"os/exec"
	"path/filepath"
	"strconv"

	"github.com/google/uuid"
	"github.com/webview/webview"
)

var sessionToken string = "su-" + uuid.New().String()

func runServer(ctx context.Context) {
	executable, err := os.Executable()
	if err != nil {
		log.Println("Failed to get os.Executable()")
		log.Fatal(err)
	}

	serverExecutable := filepath.Join(filepath.Dir(executable), "focalboard-server")

	cmd := exec.CommandContext(ctx, serverExecutable, "--monitorpid", strconv.FormatInt(int64(os.Getpid()), 10), "-single-user")
	cmd.Env = []string{fmt.Sprintf("FOCALBOARD_SINGLE_USER_TOKEN=%s", sessionToken)}
	cmd.Stdout = os.Stdout
	err = cmd.Run()
	if err != nil {
		log.Println("Failed to start server")
		log.Fatal(err)
	}
	log.Printf("Just ran subprocess %d, exiting\n", cmd.Process.Pid)
}

func main() {
	debug := true
	w := webview.New(debug)
	defer w.Destroy()
	ctx, cancel := context.WithCancel(context.Background())
	go runServer(ctx)

	w.SetTitle("Focalboard")
	w.SetSize(1024, 768, webview.HintNone)

	script := fmt.Sprintf("localStorage.setItem('sessionId', '%s');", sessionToken)
	w.Init(script)

	w.Navigate("http://localhost:8088")
	w.Run()
	cancel()
}
