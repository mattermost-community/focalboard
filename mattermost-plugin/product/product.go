// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

package product

import (
	"fmt"

	"github.com/mattermost/mattermost-server/v6/app"
)

func init() {
	app.RegisterProduct("boards", app.ProductManifest{
		Initializer:  NewBoards,
		Dependencies: map[app.ServiceKey]struct{}{},
	})
}

type Boards struct {
}

func NewBoards(mmServer *app.Server, services map[app.ServiceKey]interface{}) (app.Product, error) {
	for _, service := range services {
		fmt.Printf("Services available: %T\n", service)
	}
	return &Boards{}, nil
}

func (b *Boards) Start() error {
	fmt.Printf("\n\n -------- STARTING BOARDS -------- \n\n\n")
	return nil
}

func (b *Boards) Stop() error {
	fmt.Printf("\n\n -------- STOPPING BOARDS -------- \n\n\n")
	return nil
}
