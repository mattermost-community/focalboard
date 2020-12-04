package main

import (
	"context"
	"log"
	"os"
	"os/exec"
	"strconv"

	"github.com/webview/webview"
)

func runOctoTasks(ctx context.Context) {
	cmd := exec.CommandContext(ctx, "./octoserver", "--monitorpid", strconv.FormatInt(int64(os.Getpid()), 10), "--single-user")
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
	go runOctoTasks(ctx)

	w.SetTitle("Octo Tasks")
	w.SetSize(1024, 768, webview.HintNone)
	w.Navigate("http://localhost:8000")
	w.Run()
	cancel()
}
