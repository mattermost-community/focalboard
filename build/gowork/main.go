package main

import (
	"fmt"
	"os"
	"strings"
)

const (
	filename = "go.work"
)

func main() {
	force := false
	if len(os.Args) == 2 && strings.ToLower(os.Args[1]) == "-f" {
		force = true
	}

	if _, err := os.Stat(filename); err == nil && !force {
		// go.work already exists and force flag not specified
		fmt.Fprintln(os.Stdout, "go.work already exists and -f (force) not specified; nothing to do.")
		os.Exit(0)
	}

	f, err := os.Create(filename)
	if err != nil {
		fmt.Fprintf(os.Stderr, "error creating %s: %s", filename, err.Error())
		os.Exit(-1)
	}
	defer f.Close()

	isCI := isCI()
	content := makeGoWork(isCI)

	_, err = f.WriteString(content)
	if err != nil {
		fmt.Fprintf(os.Stderr, "error writing %s: %s", filename, err.Error())
		os.Exit(-1)
	}

	fmt.Fprintln(os.Stdout, "go.work written successfully.")
}

func makeGoWork(ci bool) string {
	repos := []string{
		"mattermost-server",
		"enterprise",
	}

	var b strings.Builder

	b.WriteString("go 1.18\n\n")
	b.WriteString("use ./mattermost-plugin\n")
	b.WriteString("use ./server\n")

	for repoIdx := range repos {
		if isEnvVarTrue(fmt.Sprintf("USE_LOCAL_%s_REPO", strings.ToUpper(repos[repoIdx])), true) {
			b.WriteString(fmt.Sprintf("use ../%s\n", repos[repoIdx]))
		}
	}

	if ci {
		b.WriteString("use ./linux\n")
	}

	return b.String()
}

func isCI() bool {
	vars := map[string]bool{
		// var name: must_be_true  (false means being defined is enough)
		"CIRCLECI":       true,
		"GITHUB_ACTIONS": true,
		"GITLAB_CI":      false,
		"TRAVIS":         true,
	}

	for name, mustBeTrue := range vars {
		if isEnvVarTrue(name, mustBeTrue) {
			return true
		}
	}
	return false
}

func isEnvVarTrue(name string, mustBeTrue bool) bool {
	val, ok := os.LookupEnv(name)
	if !ok {
		return false
	}

	if !mustBeTrue {
		return true
	}

	switch strings.ToLower(val) {
	case "t", "1", "true", "y", "yes":
		return true
	}
	return false
}
