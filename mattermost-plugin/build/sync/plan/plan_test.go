package plan_test

import (
	"encoding/json"
	"fmt"
	"testing"

	"github.com/stretchr/testify/assert"

	"github.com/mattermost/mattermost-plugin-starter-template/build/sync/plan"
)

func TestUnmarshalPlan(t *testing.T) {
	assert := assert.New(t)
	rawJSON := []byte(`
{
  "checks": [
    {"type": "repo_is_clean", "params": {"repo": "template"}}
  ],
  "actions": [
    {
      "paths": ["abc"],
      "actions": [{
        "type": "overwrite_file",
        "params": {"create": true},
        "conditions": [{
          "type": "exists",
          "params": {"repo": "plugin"}
        }]
      }]
    }
  ]
}`)
	var p plan.Plan
	err := json.Unmarshal(rawJSON, &p)
	assert.Nil(err)
	expectedCheck := plan.RepoIsCleanChecker{}
	expectedCheck.Params.Repo = "template"

	expectedAction := plan.OverwriteFileAction{}
	expectedAction.Params.Create = true
	expectedActionCheck := plan.PathExistsChecker{}
	expectedActionCheck.Params.Repo = "plugin"
	expectedAction.Conditions = []plan.Check{&expectedActionCheck}
	expected := plan.Plan{
		Checks: []plan.Check{&expectedCheck},
		Actions: []plan.ActionSet{{
			Paths: []string{"abc"},
			Actions: []plan.Action{
				&expectedAction,
			},
		}},
	}
	assert.Equal(expected, p)
}

type mockCheck struct {
	returnErr  error
	calledWith string // Path parameter the check was called with.
}

// Check implements the plan.Check interface.
func (m *mockCheck) Check(path string, c plan.Setup) error {
	m.calledWith = path
	return m.returnErr
}

type mockAction struct {
	runErr     error // Error to be returned by Run.
	checkErr   error // Error to be returned by Check.
	calledWith string
}

// Check implements plan.Action interface.
func (m *mockAction) Check(path string, c plan.Setup) error {
	return m.checkErr
}

// Run implements plan.Action interface.
func (m *mockAction) Run(path string, c plan.Setup) error {
	m.calledWith = path
	return m.runErr
}

// TestRunPlanSuccessfully tests a successful execution of a sync plan.
func TestRunPlanSuccessfully(t *testing.T) {
	assert := assert.New(t)

	setup := plan.Setup{} // mocked actions and checks won't be accessing the setup.

	preCheck := &mockCheck{}
	action1 := &mockAction{}
	action2 := &mockAction{}

	p := &plan.Plan{
		Checks: []plan.Check{preCheck},
		Actions: []plan.ActionSet{{
			Paths: []string{"somepath"},
			Actions: []plan.Action{
				action1,
				action2,
			},
		}},
	}
	err := p.Execute(setup)
	assert.Nil(err)

	assert.Equal("", preCheck.calledWith)
	assert.Equal("somepath", action1.calledWith)
	assert.Equal("", action2.calledWith) // second action was not called.
}

// TestRunPlanPreCheckFail checks the scenario where a sync plan precheck
// fails, aborting the whole operation.
func TestRunPlanPreCheckFail(t *testing.T) {
	assert := assert.New(t)

	setup := plan.Setup{} // mocked actions and checks won't be accessing the setup.

	preCheck := &mockCheck{returnErr: plan.CheckFailf("check failed")}
	action1 := &mockAction{}
	action2 := &mockAction{}

	p := &plan.Plan{
		Checks: []plan.Check{preCheck},
		Actions: []plan.ActionSet{{
			Paths: []string{"somepath"},
			Actions: []plan.Action{
				action1,
				action2,
			},
		}},
	}
	err := p.Execute(setup)
	assert.EqualError(err, "failed check: check failed")

	assert.Equal("", preCheck.calledWith)
	// None of the actions were executed.
	assert.Equal("", action1.calledWith)
	assert.Equal("", action2.calledWith)
}

// TestRunPlanActionCheckFails tests the situation where an action's
// check returns a recoverable error, forcing the plan to execute the fallback action.
func TestRunPlanActionCheckFails(t *testing.T) {
	assert := assert.New(t)

	setup := plan.Setup{} // mocked actions and checks won't be accessing the setup.

	action1 := &mockAction{checkErr: plan.CheckFailf("action check failed")}
	action2 := &mockAction{}

	p := &plan.Plan{
		Actions: []plan.ActionSet{{
			Paths: []string{"somepath"},
			Actions: []plan.Action{
				action1,
				action2,
			},
		}},
	}
	err := p.Execute(setup)
	assert.Nil(err)

	assert.Equal("", action1.calledWith)         // First action was not run.
	assert.Equal("somepath", action2.calledWith) // Second action was run.
}

// TestRunPlanNoFallbacks tests the case where an action's check fails,
// but there are not more fallback actions for that path.
func TestRunPlanNoFallbacks(t *testing.T) {
	assert := assert.New(t)

	setup := plan.Setup{} // mocked actions and checks won't be accessing the setup.

	action1 := &mockAction{checkErr: plan.CheckFailf("fail")}
	action2 := &mockAction{checkErr: plan.CheckFailf("fail")}

	p := &plan.Plan{
		Actions: []plan.ActionSet{{
			Paths: []string{"somepath"},
			Actions: []plan.Action{
				action1,
				action2,
			},
		}},
	}
	err := p.Execute(setup)
	assert.Nil(err)

	// both actions were not executed.
	assert.Equal("", action1.calledWith)
	assert.Equal("", action2.calledWith)
}

// TestRunPlanCheckError tests the scenario where a plan check fails with
// an unexpected error. Plan execution is aborted.
func TestRunPlanCheckError(t *testing.T) {
	assert := assert.New(t)

	setup := plan.Setup{} // mocked actions and checks won't be accessing the setup.

	preCheck := &mockCheck{returnErr: fmt.Errorf("fail")}
	action1 := &mockAction{}
	action2 := &mockAction{}

	p := &plan.Plan{
		Checks: []plan.Check{preCheck},
		Actions: []plan.ActionSet{{
			Paths: []string{"somepath"},
			Actions: []plan.Action{
				action1,
				action2,
			},
		}},
	}
	err := p.Execute(setup)
	assert.EqualError(err, "failed check: fail")

	assert.Equal("", preCheck.calledWith)
	// Actions were not run.
	assert.Equal("", action1.calledWith)
	assert.Equal("", action2.calledWith)
}

// TestRunPlanActionError tests the scenario where an action fails,
// aborting the whole sync process.
func TestRunPlanActionError(t *testing.T) {
	assert := assert.New(t)

	setup := plan.Setup{} // mocked actions and checks won't be accessing the setup.

	preCheck := &mockCheck{}
	action1 := &mockAction{runErr: fmt.Errorf("fail")}
	action2 := &mockAction{}

	p := &plan.Plan{
		Checks: []plan.Check{preCheck},
		Actions: []plan.ActionSet{{
			Paths: []string{"somepath"},
			Actions: []plan.Action{
				action1,
				action2,
			},
		}},
	}
	err := p.Execute(setup)
	assert.EqualError(err, "action failed: fail")

	assert.Equal("", preCheck.calledWith)
	assert.Equal("somepath", action1.calledWith)
	assert.Equal("", action2.calledWith) // second action was not called.
}
