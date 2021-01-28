package main

import (
	"context"
	"log"
	"os"
	"os/exec"
	"strconv"

	"github.com/webview/webview"
)

func runServer(ctx context.Context) {
	cmd := exec.CommandContext(ctx, "./focalboard-server", "--monitorpid", strconv.FormatInt(int64(os.Getpid()), 10), "--single-user")
	cmd.Stdout = os.Stdout
	err := cmd.Run()
	if err != nil {
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
	w.Navigate("http://localhost:8088")
	w.Run()
	cancel()
}
