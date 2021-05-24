sync
====

The sync tool is a proof-of-concept implementation of a tool for synchronizing mattermost plugin
repositories with the mattermost-plugin-starter-template repo.

Overview
--------

At its core the tool is just a collection of checks and actions that are executed according to a
synchronization plan (see [./build/sync/plan.yml](https://github.com/mattermost/mattermost-plugin-starter-template/blob/sync/build/sync/plan.yml)
for an example). The plan defines a set of files
and/or directories that need to be kept in sync between the plugin repository and the template (this
repo).

For each set of paths, a set of actions to be performed is outlined. No more than one action of that set
will be executed - the first one whose checks pass. Other actions are meant to act as fallbacks.
The idea is to be able to e.g. overwrite a file if it has no local changes or apply a format-specific
merge algorithm otherwise.

Before running each action, the tool will check if any checks are defined for that action. If there
are any, they will be executed and their results examined. If all checks pass, the action will be executed.
If there is a check failure, the tool will locate the next applicable action according to the plan and
start over with it.

The synchronization plan can also run checks before running any actions, e.g. to check if the source and
target worktrees are clean.

Running
-------

The tool can be executed from the root of this repository with a command:
```
$ go run ./build/sync/main.go ./build/sync/plan.yml ../mattermost-plugin-github
```

(assuming `mattermost-plugin-github` is the target repository we want to synchronize with the source).

plan.yml
---------

The `plan.yml` file (located in `build/sync/plan.yml`) consists of two parts:
  - checks
  - actions

The `checks` section defines tests to run before executing the plan itself. Currently the only available such check is `repo_is_clean` defined as:
```
type: repo_is_clean
params:
  repo: source
```
The `repo` parameter takes one of two values:
- `source` - the `mattermost-plugin-starter-template` repository
- `target` - the repository of the plugin being updated.

The `actions` section defines actions to be run as part of the synchronization.
Each entry in this section has the form:
```
paths:
  - path1
  - path2
actions:
  - type: action_type
    params:
      action_parameter: value
    conditions:
      - type: check_type
        params:
          check_parameter: value
```

`paths` is a list of file or directory paths (relative to the root of the repository)
synchronization should be performed on.

Each action in the `actions` section is defined by its type. Currently supported action types are:
  - `overwrite_file` - overwrite the specified file in the `target` repository with the file in the `source` repository.
  - `overwrite_directory` - overwrite a directory.

Both actions accept a parameter called `create` which determines if the file or directory should be created if it does not exist in the target repository.

The `conditions` part of an action definition defines tests that need to pass for the
action to be run. Available checks are:
  - `exists`
  - `file_unaltered`

The `exists` check takes a single parameter - `repo` (referencing either the source or target repository) and it passes only if the file or directory the action is about to be run on exists. If the repo parameter is not specified, it will default to `target`.

The `file_unaltered` check is only applicable to file paths. It passes if the file
has not been altered - i.e. it is identical to some version of that same file in the reference repository (usually `source`). This check takes two parameters:
  - `in` - repository to check the file in, default `target`
  - `compared-to` - repository to check the file against, default `source`.

When multiple actions are specified for a set of paths, the `sync` tool will only
execute a single action for each path. The first action in the list, whose conditions
are all satisfied will be executed.

If an acton fails due to an error, the synchronization run will be aborted.

Caveat emptor
-------------

This is a very basic proof-of-concept and there are many things that should be improved/implemented:
(in no specific order)

   1. Format-specific merge actions for `go.mod`, `go.sum`, `webapp/package.json` and other files should
       be implemented.
   2. Better logging should be implemented.
   3. Handling action dependencies should be investigated.
      e.g. if the `build` directory is overwritten, that will in some cases mean that the go.mod file also needs
      to be updated.
   4. Storing the tree-hash of the template repository that the plugin was synchronized with would allow
      improving the performance of the tool by restricting the search space when examining if a file
      has been altered in the plugin repository.
