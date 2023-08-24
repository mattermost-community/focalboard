# Share and collaborate

You can share boards with your Mattermost teams and within your Mattermost channel conversations.

## Share a board internally

To share a board with team members internally, select **Share** in the top-right corner of the board, then select **Copy link** from the **Share** tab below. Paste the copied link in a channel or direct message to share the board with other team members. Only team members who have permissions to the board will be able to open the board from the shared link.

## Share cards in channel conversations

Cards can be linked and shared with team members directly with Mattermost Channels. When you share a link to a card within a channel, the card details are automatically displayed in a preview. This preview highlights what the card is about at a glance without having to navigate to it.

To share a card, you'll need to copy the card link first:

- Open a card and select the options menu **(...)** at the top right of the card, then select **Copy link**.
- Alternatively, you can open the board view and hover your mouse over any card to access the options menu **(...)** for the card and select **Copy link** from there.

After you've copied the link, paste it into any channel or direct message to share the card. A preview of the card will display within the channel with a link back to the card on the board.

## Control access to boards

Boards belong to teams, and any member of a team can be granted access to a board.

**Note**: If you're using a Focalboard plugin version prior to v7.2, boards are tied to channel workspaces and board membership is determined by channel membership. In this case, roles and permissions information on this page won't be applicable to you.

### Board roles

The level of access to a board is determined by a user’s assigned board role. Individual board membership always gets precedence, followed by highest (most permissive) group role.

- **Admin**: Can modify the board, its contents, and its permissions. By default, board creators are also admins of the board.
- **Editor**: Can modify the board and its contents.
- **Commenter**: Can add comments to cards.
- **Viewer**: Can view the board and its contents but can't comment or edit the board.

| **Board permissions**              | **Admin** | **Editor** | **Commenter** | **Viewer** |
|------------------------------------|-----------|------------|---------------|------------|
| Modify permissions                 |     X     |            |               |            |
| Delete a board                     |     X     |            |               |            |
| Rename a board                     |     X     |     X      |               |            |
| Add, edit, and delete views        |     X     |     X      |               |            |
| Add, edit, and delete cards        |     X     |     X      |               |            |
| Comment and delete my own comments |     X     |     X      |       X       |            |
| Delete any comment                 |     X     |            |               |            |
| View a board                       |     X     |     X      |       X       |     X      |

## System admin access

System admins can access any board across the server provided they have the board's URL without having to request permission or be manually added. When a system admin joins a board, their default role is admin. System admins will have an **Admin** label assigned to their name on the participants list.

## Team admin access

Team admins can access any board within their team provided they have the board's URL without having to request permission or be manually added. When a system admin joins a board, their default role is admin. Team admins will have a **Team admin** label assigned to their name on the participants list.

## Manage team access

Board admins can manage team access to their board by selecting **Share** in the top-right corner of the board. On the dropdown next to **Everyone at… Team** option, select a minimum board role for everyone on the team. You can also easily assign the new roles to the entire team and/or to individual team members.

Minimum default board roles reduce permission ambiguity and prevent security loopholes. The minimum default role means that board admins can't assign individual board members a role lower than the team role. If the team role is set to **Editor** then the board admin will only be able to assign the **Editor** or **Admin** role to individual team members. Lower roles will not be available for selection unless the admin changes the minimum board role.

Depending on the role selected, everyone on the team will have access to the board with a minimum of the permissions from the role selected. Users can get elevated permissions based on their individual board membership. The default team access for a newly created board is **None**, which means nobody on the team has access to the board.

## Manage individual board membership

Only board admins can manage user permissions on a board, including adding, changing, and removing members.

To add individual users from the team as explicit members of the board, open the **Share** dialog on the board, search for individual team members, then assign a role to set their permissions for the board. The role for individual board members overrides any role specified for team access.

- To change a board member’s role, open the **Share** dialog, select the role dropdown next to the user’s name, then select another role from the list.
- To remove a member from a board, open the **Share** dialog, select the role dropdown next to the user’s name, then select **Remove member**.

Board admins can also add individual members using the autocomplete list from @mentions and the person properties. To add an individual from the autocomplete list, type their username in an @mention or in the **Person** or **Multi-person** properties, then assign a role to the user from the confirmation dialog, and select **Add to board**.

On boards with team access, board members with **Editor** or **Commenter** roles can also add individuals to the board from the autocomplete list. Board members added in this manner will be assigned the default minimum board role.

## Channel role groups

Board admins can add a channel to a board to grant all its members Editor access. To do this, select **Share** in the top-right corner of the board, search for the channel name, and add it to the board as a user. The default role is Editor. Doing so also [links the board back to the channel](link-boards-to-mattermost-channels) where the board will appear on the channel RHS.

To unlink the channel from the board, open the **Share** dialog, select the role dropdown next to the channel’s name, then select **Unlink**.

Remember, a board can only be linked to one channel at a time. Linking another channel to the same board will automatically remove the link from the previous channel.

## Guest accounts

From version v7.4 of the Focalboard plugin, [Mattermost guest accounts](https://docs.mattermost.com/onboard/guest-accounts.html#guest-accounts) are supported. If you're not able to access this functionality, you may be on an earlier version of the Focalboard plugin.

Guests can:

- Access boards where they're added as an explicit member of the board, but can't manage team access or add channels to boards.
- Access existing boards, but can't create new boards. Guests also don't have access to the template picker and can't duplicate an existing board.
- Search for boards where they're currently an explicit member.
- Be assigned the Viewer, Commenter, or Editor roles, but not the Admin role.
- Only @mention current members on the board.
