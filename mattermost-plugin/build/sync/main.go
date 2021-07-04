package main

import (
	"flag"
	"fmt"
	"io/ioutil"
	"os"
	"path/filepath"

	"sigs.k8s.io/yaml"

	"github.com/mattermost/mattermost-plugin-starter-template/build/sync/plan"
)

func main() {
	verbose := flag.Bool("verbose", false, "enable verbose output")
	flag.Usage = func() {
		fmt.Fprintf(flag.CommandLine.Output(), "Update a pluging directory with /mattermost-plugin-starter-template/.\n")
		fmt.Fprintf(flag.CommandLine.Output(), "Usage of %s:\n", os.Args[0])
		fmt.Fprintf(flag.CommandLine.Output(), "%s <plan.yml> <plugin_directory>\n", os.Args[0])
		flag.PrintDefaults()
	}

	flag.Parse()
	// TODO: implement proper command line parameter parsing.
	if len(os.Args) != 3 {
		fmt.Fprintf(os.Stderr, "running: \n $ sync [plan.yaml] [plugin path]\n")
		os.Exit(1)
	}

	syncPlan, err := readPlan(os.Args[1])
	if err != nil {
		fmt.Fprintf(os.Stderr, "coud not load plan: %s\n", err)
		os.Exit(1)
	}

	srcDir, err := os.Getwd()
	if err != nil {
		fmt.Fprintf(os.Stderr, "failed to get current directory: %s\n", err)
		os.Exit(1)
	}

	trgDir, err := filepath.Abs(os.Args[2])
	if err != nil {
		fmt.Fprintf(os.Stderr, "could not determine target directory: %s\n", err)
		os.Exit(1)
	}

	srcRepo, err := plan.GetRepoSetup(srcDir)
	if err != nil {
		fmt.Fprintf(os.Stderr, "%s\n", err)
		os.Exit(1)
	}
	trgRepo, err := plan.GetRepoSetup(trgDir)
	if err != nil {
		fmt.Fprintf(os.Stderr, "%s\n", err)
		os.Exit(1)
	}

	planSetup := plan.Setup{
		Source:         srcRepo,
		Target:         trgRepo,
		VerboseLogging: *verbose,
	}
	err = syncPlan.Execute(planSetup)
	if err != nil {
		fmt.Fprintf(os.Stderr, "%s\n", err)
		os.Exit(1)
	}
}

func readPlan(path string) (*plan.Plan, error) {
	raw, err := ioutil.ReadFile(path)
	if err != nil {
		return nil, fmt.Errorf("failed to read plan file %q: %v", path, err)
	}

	var p plan.Plan
	err = yaml.Unmarshal(raw, &p)
	if err != nil {
		return nil, fmt.Errorf("failed to unmarshal plan yaml: %v", err)
	}

	return &p, err
}
