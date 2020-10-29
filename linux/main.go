package main

import (
	"log"
	"os"
	"os/exec"
	"strconv"

	"github.com/webview/webview"
)

func runOctoTasks() {
	cmd := exec.Command("./bin/octoserver", "--monitorpid", strconv.FormatInt(int64(os.Getpid()), 10))
	cmd.Stdout = os.Stdout
	err := cmd.Run()
	if err != nil {
		log.Fatal(err)
	}
	log.Printf("Just ran subprocess %d, exiting\n", cmd.Process.Pid)
}

func main() {
	os.Chdir("../")
	debug := true
	w := webview.New(debug)
	defer w.Destroy()
	go runOctoTasks()

	w.SetTitle("Octo Tasks")
	w.SetSize(1024, 768, webview.HintNone)
	w.Navigate("http://localhost:8000")
	w.Run()
}
