package jsonldriver

import (
	"bufio"
	"encoding/json"
	"fmt"
	"os"

	"github.com/mattermost/focalboard/server/model"
)

type JsonlDriver struct {
	data []*model.Block
}

func New(filename string) (*JsonlDriver, error) {
	f, err := os.Open(filename)
	if err != nil {
		return nil, err
	}
	defer f.Close()

	var blocks []*model.Block

	scanner := bufio.NewScanner(f)
	for scanner.Scan() {
		var block model.Block
		err = json.Unmarshal(scanner.Bytes(), &block)
		if err != nil {
			return nil, err
		}
		blocks = append(blocks, &block)
	}

	return &JsonlDriver{
		data: blocks,
	}, nil
}

func (jd *JsonlDriver) Blocks(boardID string) ([]*model.Block, error) {
	result := []*model.Block{}
	fmt.Println("data", jd.data)
	for _, block := range jd.data {
		if block.BoardID == boardID {
			result = append(result, block)
		}
	}
	return result, nil
}

func (jd *JsonlDriver) GetBlocksByIDs(ids []string) ([]*model.Block, error) {
	result := []*model.Block{}
	for _, id := range ids {
		for _, block := range jd.data {
			if block.ID == id {
				result = append(result, block)
			}
		}
	}
	return result, nil
}
