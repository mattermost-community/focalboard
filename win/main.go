package main

import (
	"context"
	"log"
	"os"
	"os/exec"

	"github.com/gonutz/w32"
	"github.com/zserge/lorca"
)

func runOctoTasks(ctx context.Context) *exec.Cmd {
	// cmd := exec.CommandContext(ctx, "bin\\octoserver.exe", "--monitorpid", strconv.FormatInt(int64(os.Getpid()), 10))
	cmd := exec.CommandContext(ctx, "bin\\octoserver.exe --single-user")
	// cmd := exec.CommandContext(ctx, "cmd.exe", "/C", "start", "./bin/octoserver.exe", "--monitorpid", strconv.FormatInt(int64(os.Getpid()), 10))
	// cmd := exec.CommandContext(ctx, "cmd.exe", "/C", "start", "./bin/octoserver.exe")

	// cmd.SysProcAttr = &syscall.SysProcAttr{HideWindow: true}
	cmd.Stdout = os.Stdout
	go func() {
		err := cmd.Run()
		if err != nil {
			log.Fatal(err)
		}
		log.Printf("Just ran subprocess %d, exiting\n", cmd.Process.Pid)
	}()

	return cmd
}

func main() {
	// log.Printf("PID: %s", strconv.FormatInt(int64(os.Getpid()), 10))
	hideConsole()

	ctx, cancel := context.WithCancel(context.Background())
	cmd := runOctoTasks(ctx)

	ui, err := lorca.New("http://localhost:8088", "", 1024, 768)
	if err != nil {
		log.Fatal(err)
	}
	// defer ui.Close()

	log.Printf("Started")
	<-ui.Done()

	log.Printf("App Closed")
	cancel()
	if err := cmd.Process.Kill(); err != nil {
		log.Fatal("failed to kill process: ", err)
	}
}

func hideConsole() {
	console := w32.GetConsoleWindow()
	if console != 0 {
		_, consoleProcID := w32.GetWindowThreadProcessId(console)
		if w32.GetCurrentProcessId() == consoleProcID {
			w32.ShowWindowAsync(console, w32.SW_HIDE)
		}
	}
}
