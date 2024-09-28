# Import scripts

This subfolder contains scripts to import data from other systems. It is at an early stage. At present, there are examples of basic importing from the following:
* Trello
* Asana
* Notion
* Jira
* Todoist
* Nextcloud Deck

## Trello

The base structure for importing archive is the same for every method:

```
- board.boardarchive:       a normal zip archive with changed extension
-- version.json             version metadata
-- {boardId}:               folder with name equal to boardId
--- board.jsonl             jsonl board metadata generated for board with importTrello.ts
--- {attachments}           attachments from trello in format {trello_attachment_id}.{extensions}
```

To create board.jsonl use *.json board data file from trello and command:
```
node -r ts-node/register importTrello.ts -i {trello_board_data}.json -o board.jsonl
```

Add attachments to the {boardId} folder, the fastest way is to download them thourgh the same {trello_board_data}.json (you can get origin json from trello export option) with your API keys, the name pattern is `${trello_attachment_id}.${fileExtension}`:
<details>
  <summary>NodeJS example</summary>

    ```javascript
        const fs = require('fs');
        const fetch = require('node-fetch');
        const path = require('path');

        const API_KEY = 'XXXXXX';
        const TOKEN = 'XXXXXX';
        const baseURL = 'https://api.trello.com/1';

        async function downloadFile(metaUrl, dest, card) {
            const headers = {
                'Authorization': `OAuth oauth_consumer_key="${API_KEY}", oauth_token="${TOKEN}"`
            }

            let response = await fetch(metaUrl, { headers });
            if (!response.ok) {
                throw new Error(`Failed to fetch metadata from ${metaUrl}. Status: ${response.statusText}`);
            }

            const metadata = await response.json();

            // Now, fetch the actual file using the provided download format
            const fileUrl = `https://api.trello.com/1/cards/${card.id}/attachments/${metadata.id}/download/${metadata.fileName}`;
            response = await fetch(fileUrl, { headers });

            if (!response.ok) {
                throw new Error(`Failed to fetch file from ${fileUrl}. Status: ${response.statusText}`);
            }

            const buffer = await response.buffer();
            await fs.promises.writeFile(dest, buffer);
        }

        async function main() {
            try {
                const data = JSON.parse(fs.readFileSync('data.json', 'utf8'));

                if (!data.cards || data.cards.length === 0) {
                    console.log("No cards found.");
                    return;
                }

                console.log('Cards: ' + data.cards.length)

                for (const card of data.cards) {
                    if (!card.attachments || card.attachments.length === 0) {
                        console.log(`Card ${card.id} has no attachments.`);
                        continue;
                    }

                    for (const attachment of card.attachments) {
                        const fileExtension = path.extname(attachment.fileName || '');
                        const fileName = `${attachment.id}${fileExtension}`;

                        // Build the Trello API URL
                        const downloadUrl = `${baseURL}/cards/${card.id}/attachments/${attachment.id}?key=${API_KEY}&token=${TOKEN}`;
                        try {
                            await downloadFile(downloadUrl, `./downloads/${fileName}`, card);
                            console.log(`File saved as ./downloads/${fileName}`);
                        } catch (err){
                            //Sometimes attachs cannot be downloaded
                            console.log(err)
                        }
                    }
                }
            } catch (error) {
                console.error(`Error: ${error.message}`);
            }
        }

        main()
    ```
</details>

[Contribute code](https://mattermost.github.io/focalboard/) to expand this.
