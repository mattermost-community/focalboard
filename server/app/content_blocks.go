package app

import (
	"fmt"

	"github.com/mattermost/focalboard/server/model"
	"github.com/pkg/errors"
)

func (a *App) MoveContentBlock(block *model.Block, dstBlock *model.Block, where string, userID string) error {
	if block.ParentID != dstBlock.ParentID {
		message := fmt.Sprintf("invalid dstBlockId")
		return model.NewErrBadRequest(message)
	}

	card, err := a.GetBlockByID(block.ParentID)
	if err != nil {
		return err
	}

	contentOrder := card.Fields["contentOrder"].([]interface{})
	newContentOrder := []interface{}{}
	foundDst := false
	foundSrc := false
	for _, id := range contentOrder {
		stringID, ok := id.(string)
		if !ok {
			newContentOrder = append(newContentOrder, id)
			continue
		}

		if dstBlock.ID == stringID {
			foundDst = true
			if where == "after" {
				newContentOrder = append(newContentOrder, id)
				newContentOrder = append(newContentOrder, block.ID)
			} else {
				newContentOrder = append(newContentOrder, block.ID)
				newContentOrder = append(newContentOrder, id)
			}
			continue
		}

		if block.ID == stringID {
			foundSrc = true
			continue
		}

		newContentOrder = append(newContentOrder, id)
	}

	if !foundSrc {
		message := fmt.Sprintf("source block not found")
		return model.NewErrBadRequest(message)
	}

	if !foundDst {
		message := fmt.Sprintf("destination block not found")
		return model.NewErrBadRequest(message)
	}

	patch := &model.BlockPatch{
		UpdatedFields: map[string]interface{}{
			"contentOrder": newContentOrder,
		},
	}

	_, err = a.PatchBlock(block.ParentID, patch, userID)
	if errors.Is(err, model.ErrPatchUpdatesLimitedCards) {
		return err
	}
	if err != nil {
		return err
	}
	return nil
}
