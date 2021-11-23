package integrationtests

import (
	"testing"

	"github.com/mattermost/focalboard/server/model"
	"github.com/mattermost/focalboard/server/services/store"
	"github.com/mattermost/focalboard/server/utils"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func createTestSubscriptions(th *TestHelper, num int, workspaceID string, userID string) ([]*model.Subscription, error) {
	newSubs := make([]*model.Subscription, 0, num)

	for n := 0; n < num; n++ {
		sub := &model.Subscription{
			BlockType:      model.TypeCard,
			BlockID:        utils.NewID(utils.IDTypeCard),
			WorkspaceID:    workspaceID,
			SubscriberType: model.SubTypeUser,
			SubscriberID:   userID,
		}

		subNew, resp := th.Client.CreateSubscription(workspaceID, sub)
		if resp.Error != nil {
			return nil, resp.Error
		}
		newSubs = append(newSubs, subNew)
	}
	return newSubs, nil
}

func TestCreateSubscription(t *testing.T) {
	th := SetupTestHelper().InitBasic()
	defer th.TearDown()

	container := store.Container{
		WorkspaceID: utils.NewID(utils.IDTypeWorkspace),
	}

	user, resp := th.Client.GetMe()
	require.NoError(t, resp.Error)

	t.Run("Create valid subscription", func(t *testing.T) {
		subs, err := createTestSubscriptions(th, 5, container.WorkspaceID, user.ID)
		require.NoError(t, err)
		require.Len(t, subs, 5)

		// fetch the newly created subscriptions and compare
		subsFound, resp := th.Client.GetSubscriptions(container.WorkspaceID, user.ID)
		require.NoError(t, resp.Error)
		require.Len(t, subsFound, 5)
		assert.ElementsMatch(t, subs, subsFound)
	})

	t.Run("Create invalid subscription", func(t *testing.T) {
		sub := &model.Subscription{
			WorkspaceID:  container.WorkspaceID,
			SubscriberID: user.ID,
		}
		_, resp := th.Client.CreateSubscription(container.WorkspaceID, sub)
		require.Error(t, resp.Error)
	})
}

func TestDeleteSubscription(t *testing.T) {
	th := SetupTestHelper().InitBasic()
	defer th.TearDown()

	container := store.Container{
		WorkspaceID: utils.NewID(utils.IDTypeWorkspace),
	}

	user, resp := th.Client.GetMe()
	require.NoError(t, resp.Error)

	t.Run("Delete valid subscription", func(t *testing.T) {
		subs, err := createTestSubscriptions(th, 3, container.WorkspaceID, user.ID)
		require.NoError(t, err)
		require.Len(t, subs, 3)

		resp := th.Client.DeleteSubscription(container.WorkspaceID, subs[1].BlockID, user.ID)
		require.NoError(t, resp.Error)

		// fetch the subscriptions and ensure the list is correct
		subsFound, resp := th.Client.GetSubscriptions(container.WorkspaceID, user.ID)
		require.NoError(t, resp.Error)
		require.Len(t, subsFound, 2)

		assert.Contains(t, subsFound, subs[0])
		assert.Contains(t, subsFound, subs[2])
		assert.NotContains(t, subsFound, subs[1])
	})

	t.Run("Delete invalid subscription", func(t *testing.T) {
		resp := th.Client.DeleteSubscription(container.WorkspaceID, "bogus", user.ID)
		require.Error(t, resp.Error)
	})
}
