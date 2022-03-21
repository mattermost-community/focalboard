package main

import (
	"bytes"
	"fmt"
	"io"

	"github.com/mattermost/focalboard/server/model"
)

func getIcon(idx int) string {
	icons := []string{
		"💡",
		"🎉",
		"📅",
		"🎯",
		"🐤",
		"🛠️",
	}
	return icons[idx%6]
}

func generateBoards(total int) []model.Board {
	boards := make([]model.Board, 0, total)

	for i := 0; i < total; i++ {
		b := model.Board{
			ID:              fmt.Sprintf("board-%d", i),
			TeamID:          "team-id",
			ChannelID:       "",
			CreatedBy:       "user-id",
			ModifiedBy:      "user-id",
			Type:            model.BoardTypeOpen,
			Title:           fmt.Sprintf("Board %d", i),
			Description:     fmt.Sprintf("Board description %d", i),
			Icon:            getIcon(i),
			ShowDescription: true,
			IsTemplate:      false,
			TemplateVersion: 0,
			Properties:      map[string]interface{}{},
			CardProperties: []map[string]interface{}{
				{
					"id":   "ae9ar615xoknd8hw8py7mbyr7zo",
					"name": "Status",
					"options": []map[string]string{
						{
							"color": "propColorGray",
							"id":    "awna1nuarjca99m9s4uiy9kwj5h",
							"value": "Idea 💡",
						},
						{
							"color": "propColorOrange",
							"id":    "a9ana1e9w673o5cp8md4xjjwfto",
							"value": "Draft",
						},
						{
							"color": "propColorPurple",
							"id":    "apy9dcd7zmand615p3h53zjqxjh",
							"value": "In Review",
						},
						{
							"color": "propColorBlue",
							"id":    "acri4cm3bmay55f7ksztphmtnga",
							"value": "Ready to Publish",
						},
						{
							"color": "propColorGreen",
							"id":    "amsowcd9a8e1kid317r7ttw6uzh",
							"value": "Published 🎉",
						},
					},
					"type": "select",
				},
				{
					"id":   "aysx3atqexotgwp5kx6h5i5ancw",
					"name": "Type",
					"options": []map[string]string{
						{
							"color": "propColorOrange",
							"id":    "aywiofmmtd3ofgzj95ysky4pjga",
							"value": "Press Release",
						},
						{
							"color": "propColorGreen",
							"id":    "apqdgjrmsmx8ngmp7zst51647de",
							"value": "Sponsored Post",
						},
						{
							"color": "propColorPurple",
							"id":    "a3woynbjnb7j16e74uw3pubrytw",
							"value": "Customer Story",
						},
						{
							"color": "propColorRed",
							"id":    "aq36k5pkpfcypqb3idw36xdi1fh",
							"value": "Product Release",
						},
						{
							"color": "propColorGray",
							"id":    "azn66pmk34adygnizjqhgiac4ia",
							"value": "Partnership",
						},
						{
							"color": "propColorBlue",
							"id":    "aj8y675weso8kpb6eceqbpj4ruw",
							"value": "Feature Announcement",
						},
						{
							"color": "propColorYellow",
							"id":    "a3xky7ygn14osr1mokerbfah5cy",
							"value": "Article",
						},
					},
					"type": "select",
				},
				{
					"id":   "ab6mbock6styfe6htf815ph1mhw",
					"name": "Channel",
					"options": []map[string]string{
						{
							"color": "propColorBrown",
							"id":    "a8xceonxiu4n3c43szhskqizicr",
							"value": "Website",
						},
						{
							"color": "propColorGreen",
							"id":    "a3pdzi53kpbd4okzdkz6khi87zo",
							"value": "Blog",
						},
						{
							"color": "propColorOrange",
							"id":    "a3d9ux4fmi3anyd11kyipfbhwde",
							"value": "Email",
						},
						{
							"color": "propColorRed",
							"id":    "a8cbbfdwocx73zn3787cx6gacsh",
							"value": "Podcast",
						},
						{
							"color": "propColorPink",
							"id":    "aigjtpcaxdp7d6kmctrwo1ztaia",
							"value": "Print",
						},
						{
							"color": "propColorBlue",
							"id":    "af1wsn13muho59e7ghwaogxy5ey",
							"value": "Facebook",
						},
						{
							"color": "propColorGray",
							"id":    "a47zajfxwhsg6q8m7ppbiqs7jge",
							"value": "LinkedIn",
						},
						{
							"color": "propColorYellow",
							"id":    "az8o8pfe9hq6s7xaehoqyc3wpyc",
							"value": "Twitter",
						},
					},
					"type": "multiSelect",
				},
				{
					"id":      "ao44fz8nf6z6tuj1x31t9yyehcc",
					"name":    "Assignee",
					"options": []string{},
					"type":    "person",
				},
				{
					"id":      "a39x5cybshwrbjpc3juaakcyj6e",
					"name":    "Due Date",
					"options": []string{},
					"type":    "date",
				},
				{
					"id":      "agqsoiipowmnu9rdwxm57zrehtr",
					"name":    "Publication Date",
					"options": []string{},
					"type":    "date",
				},
				{
					"id":      "ap4e7kdg7eip7j3c3oyiz39eaoc",
					"name":    "Link",
					"options": []string{},
					"type":    "url",
				},
			},
			ColumnCalculations: map[string]interface{}{},
			CreateAt:           model.GetMillis(),
			UpdateAt:           model.GetMillis(),
			DeleteAt:           0,
		}
		boards = append(boards, b)
	}
	return boards
}

func generateViewsForBoard(boardID string, total int) []model.Block {
	contents := make([]model.Block, 0, total)

	viewTypes := []string{
		"board",
		"table",
		"calendar",
		"gallery",
	}

	for i := 0; i < total; i++ {
		c := model.Block{
			ID:         fmt.Sprintf("%s-view-%d", boardID, i),
			BoardID:    boardID,
			ParentID:   boardID,
			Schema:     1,
			CreatedBy:  "user-id",
			ModifiedBy: "user-id",
			Title:      fmt.Sprintf("View %d", i),
			Type:       model.TypeView,
			Fields: map[string]interface{}{
				"cardOrder":          []string{},
				"viewType":           viewTypes[i%4],
				"collapsedOptionIds": []string{},
				"columnCalculations": map[string]interface{}{},
				"columnWidths":       map[string]interface{}{},
				"defaultTemplateId":  "",
				"filter": map[string]interface{}{
					"filters":   []string{},
					"operation": "and",
				},
				"hiddenOptionIds":    []string{},
				"kanbanCalculations": map[string]interface{}{},
				"sortOptions":        []map[string]interface{}{},
				"visibleOptionIds":   []string{},
				"visiblePropertyIds": []string{},
			},
			CreateAt: model.GetMillis(),
			UpdateAt: model.GetMillis(),
			DeleteAt: 0,
		}
		contents = append(contents, c)
	}
	return contents
}

func generateCardsForBoard(boardID string, total int, totalContents int) []model.Block {
	cards := make([]model.Block, 0, total)

	for i := 0; i < total; i++ {
		contentOrder := []string{}
		for j := 0; j < totalContents; j++ {
			contentOrder = append(contentOrder, fmt.Sprintf("%s-card-%d-content-%d", boardID, i, j))
		}

		c := model.Block{
			ID:         fmt.Sprintf("%s-card-%d", boardID, i),
			BoardID:    boardID,
			ParentID:   boardID,
			CreatedBy:  "user-id",
			ModifiedBy: "user-id",
			Type:       model.TypeCard,
			Title:      fmt.Sprintf("Card %d", i),
			Fields: map[string]interface{}{
				"contentOrder": contentOrder,
				"icon":         "🎯",
				"isTemplate":   false,
				"properties":   map[string]interface{}{},
			},
			CreateAt: model.GetMillis(),
			UpdateAt: model.GetMillis(),
			DeleteAt: 0,
		}
		cards = append(cards, c)
	}
	return cards
}

func generateContentsForCard(boardID string, cardID string, total int) []model.Block {
	contents := make([]model.Block, 0, total)

	for i := 0; i < total; i++ {
		c := model.Block{
			ID:         fmt.Sprintf("%s-%s-content-%d", boardID, cardID, i),
			BoardID:    boardID,
			ParentID:   cardID,
			CreatedBy:  "user-id",
			ModifiedBy: "user-id",
			Title:      fmt.Sprintf("Content %d", i),
			Type:       model.TypeText,
			Fields:     map[string]interface{}{},
			CreateAt:   model.GetMillis(),
			UpdateAt:   model.GetMillis(),
			DeleteAt:   0,
		}
		contents = append(contents, c)
	}
	return contents
}

func generateCommentsForCard(boardID string, cardID string, total int) []model.Block {
	contents := make([]model.Block, 0, total)

	for i := 0; i < total; i++ {
		c := model.Block{
			ID:         fmt.Sprintf("%s-%s-comment-%d", boardID, cardID, i),
			BoardID:    boardID,
			ParentID:   cardID,
			CreatedBy:  "user-id",
			ModifiedBy: "user-id",
			Title:      fmt.Sprintf("Comment %d", i),
			Type:       model.TypeComment,
			Fields:     map[string]interface{}{},
			CreateAt:   model.GetMillis(),
			UpdateAt:   model.GetMillis(),
			DeleteAt:   0,
		}
		contents = append(contents, c)
	}
	return contents
}

func generateFileContent(boardID, filename string) io.Reader {
	return bytes.NewBuffer([]byte(fmt.Sprintf("%s-%s", boardID, filename)))
}
