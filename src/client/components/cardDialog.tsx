import React from "react"
import { Block } from "../block"
import { BlockIcons } from "../blockIcons"
import { BoardTree } from "../boardTree"
import { CardTree } from "../cardTree"
import { Menu, MenuOption } from "../menu"
import { Mutator } from "../mutator"
import { IBlock } from "../octoTypes"
import { OctoUtils } from "../octoUtils"
import { PropertyMenu } from "../propertyMenu"
import { OctoListener } from "../octoListener"
import { OctoClient } from "../octoClient"
import { Utils } from "../utils"
import Button from "./button"
import { Editable } from "./editable"
import { MarkdownEditor } from "./markdownEditor"

type Props = {
	boardTree: BoardTree
	card: IBlock
	mutator: Mutator
	onClose: () => void
}

type State = {
	isHoverOnCover: boolean
	cardTree: CardTree | null
}

class CardDialog extends React.Component<Props, State> {
	private titleRef = React.createRef<Editable>()
	private cardListener: OctoListener

	constructor(props: Props) {
		super(props)
		this.state = { isHoverOnCover: false, cardTree: null }
	}

	keydownHandler = (e: KeyboardEvent) => {
		if (e.target !== document.body) { return }

		if (e.keyCode === 27) {
			this.close()
			e.stopPropagation()
		}
	}

	componentDidMount() {
		this.cardListener = new OctoListener()
		this.cardListener.open(this.props.card.id, async () => {
			await cardTree.sync()
			this.setState({cardTree: cardTree})
		})
		const cardTree = new CardTree(new OctoClient(), this.props.card.id)
		cardTree.sync().then(() => {
			this.setState({cardTree})
		});

		document.addEventListener("keydown", this.keydownHandler)
	}

	componentDidUpdate(prevProps: Props, prevState: State) {
		if (this.titleRef.current && prevState.cardTree === null && this.state.cardTree !== null) {
			this.titleRef.current.focus()
		}
	}

	componentWillUnmount() {
		document.removeEventListener("keydown", this.keydownHandler)
	}

	render() {
		const { boardTree, mutator, card } = this.props
		const { cardTree } = this.state
		const { board } = boardTree
		if (cardTree === null) {
			return null
		}

		const { comments } = cardTree

		const newCommentPlaceholderText = "Add a comment..."

		const backgroundRef = React.createRef<HTMLDivElement>()
		const newCommentRef = React.createRef<Editable>()
		const sendCommentButtonRef = React.createRef<HTMLDivElement>()
		let contentElements
		if (cardTree.contents.length > 0) {
			contentElements =
				<div className="octo-content">
					{cardTree.contents.map(block => {
						if (block.type === "text") {
							const cardText = block.title
							return <div key={block.id} className="octo-block octo-hover-container">
								<div className="octo-block-margin">
									<div className="octo-button octo-hovercontrol square octo-hover-item" onClick={(e) => { this.showContentBlockMenu(e, block) }}>
										<div className="imageOptions" />
									</div>
								</div>
								<MarkdownEditor text={cardText} placeholderText="Edit text..." onChanged={(text) => {
									Utils.log(`change text ${block.id}, ${text}`)
									mutator.changeTitle(block, text, "edit card text")
								}} />
							</div>
						} else if (block.type === "image") {
							const url = block.fields.url
							return <div key={block.id} className="octo-block octo-hover-container">
								<div className="octo-block-margin">
									<div className="octo-button octo-hovercontrol square octo-hover-item" onClick={(e) => { this.showContentBlockMenu(e, block) }}>
										<div className="imageOptions" />
									</div>
								</div>
								<img src={url} alt={block.title}></img>
							</div>
						}

						return <div></div>
					})}
				</div>

		} else {
			contentElements = <div className="octo-content">
				<div className="octo-block octo-hover-container">
					<div className="octo-block-margin"></div>
					<MarkdownEditor
						text=""
						placeholderText="Add a description..."
						onChanged={(text) => {
							const order = cardTree.contents.length * 1000
							const block = new Block({ type: "text", parentId: card.id, title: text, order })
							mutator.insertBlock(block, "add card text")
						}} />
				</div>
			</div>
		}

		const icon = card.icon

		// TODO: Replace this placeholder
		const username = "John Smith"
		const userImageUrl = `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" style="fill: rgb(192, 192, 192);"><rect width="100" height="100" /></svg>`

		const element =
			<div
				ref={backgroundRef}
				className="dialog-back"
				onMouseDown={(e) => {
					if (e.target === backgroundRef.current) { this.close() }
				}}>
				<div className="dialog" >
					<div className="toolbar">
						<div className="octo-spacer"></div>
						<Button text="..." onClick={(e) => {
							Menu.shared.options = [
								{ id: "delete", name: "Delete" },
							]
							Menu.shared.onMenuClicked = async (optionId: string, type?: string) => {
								switch (optionId) {
									case "delete":
										console.log(`Delete card: ${card.title} (${card.id})`)
										await mutator.deleteBlock(card, "delete card")
										this.close()
										break
								}
							}
							Menu.shared.showAtElement(e.target as HTMLElement)
						}}></Button>
					</div>
					<div className="content">
						{icon ?
							<div className="octo-button octo-icon octo-card-icon" onClick={(e) => { this.iconClicked(e) }}>{icon}</div>
							: undefined
						}
						<div
							className="octo-hovercontrols"
							onMouseOver={() => { this.setState({ ...this.state, isHoverOnCover: true }) }}
							onMouseLeave={() => { this.setState({ ...this.state, isHoverOnCover: false }) }}
						>
							<Button
								style={{ display: (!icon && this.state.isHoverOnCover) ? null : "none" }}
								onClick={() => {
									const newIcon = BlockIcons.shared.randomIcon()
									mutator.changeIcon(card, newIcon)
								}}
							>Add Icon</Button>
						</div>

						<Editable ref={this.titleRef} className="title" text={card.title} placeholderText="Untitled" onChanged={(text) => { mutator.changeTitle(card, text) }} />

						{/* Property list */}

						<div className="octo-propertylist">
							{board.cardProperties.map(propertyTemplate => {
								return (
									<div key={propertyTemplate.id} className="octo-propertyrow">
										<div className="octo-button octo-propertyname" onClick={(e) => {
											const menu = PropertyMenu.shared
											menu.property = propertyTemplate
											menu.onNameChanged = (propertyName) => {
												Utils.log(`menu.onNameChanged`)
												mutator.renameProperty(board, propertyTemplate.id, propertyName)
											}

											menu.onMenuClicked = async (command) => {
												switch (command) {
													case "type-text":
														await mutator.changePropertyType(board, propertyTemplate, "text")
														break
													case "type-number":
														await mutator.changePropertyType(board, propertyTemplate, "number")
														break
													case "type-createdTime":
														await mutator.changePropertyType(board, propertyTemplate, "createdTime")
														break
													case "type-updatedTime":
														await mutator.changePropertyType(board, propertyTemplate, "updatedTime")
														break
													case "type-select":
														await mutator.changePropertyType(board, propertyTemplate, "select")
														break
													case "delete":
														await mutator.deleteProperty(boardTree, propertyTemplate.id)
														break
													default:
														Utils.assertFailure(`Unhandled menu id: ${command}`)
												}
											}
											menu.showAtElement(e.target as HTMLElement)
										}}>{propertyTemplate.name}</div>
										{OctoUtils.propertyValueEditableElement(mutator, card, propertyTemplate)}
									</div>
								)
							})}

							<div
								className="octo-button octo-propertyname"
								style={{ textAlign: "left", width: "150px", color: "rgba(55, 53, 37, 0.4)" }}
								onClick={async () => {
									// TODO: Show UI
									await mutator.insertPropertyTemplate(boardTree)
								}}>+ Add a property</div>
						</div>

						{/* Comments */}

						<hr />
						<div className="commentlist">
							{comments.map(comment => {
								const optionsButtonRef = React.createRef<HTMLDivElement>()
								const showCommentMenu = (e: React.MouseEvent, activeComment: IBlock) => {
									Menu.shared.options = [
										{ id: "delete", name: "Delete" }
									]
									Menu.shared.onMenuClicked = (id) => {
										switch (id) {
											case "delete": {
												mutator.deleteBlock(activeComment)
												break
											}
										}
									}
									Menu.shared.showAtElement(e.target as HTMLElement)
								}

								return <div key={comment.id} className="comment" onMouseOver={() => { optionsButtonRef.current.style.display = null }} onMouseLeave={() => { optionsButtonRef.current.style.display = "none" }}>
									<div className="comment-header">
										<img className="comment-avatar" src={userImageUrl} />
										<div className="comment-username">{username}</div>
										<div className="comment-date">{(new Date(comment.createAt)).toLocaleTimeString()}</div>
										<div ref={optionsButtonRef} className="octo-hoverbutton square" style={{ display: "none" }} onClick={(e) => { showCommentMenu(e, comment) }}>...</div>
									</div>
									<div className="comment-text">{comment.title}</div>
								</div>
							})}

							{/* New comment */}

							<div className="commentrow">
								<img className="comment-avatar" src={userImageUrl} />
								<Editable
									ref={newCommentRef}
									className="newcomment"
									placeholderText={newCommentPlaceholderText}
									onChanged={(text) => { return }}
									onFocus={() => {
										sendCommentButtonRef.current.style.display = null
									}}
									onBlur={() => {
										if (!newCommentRef.current.text) {
											sendCommentButtonRef.current.style.display = "none"
										}
									}}
									onKeyDown={(e) => {
										if (e.keyCode === 13 && !(e.metaKey || e.ctrlKey) && !e.shiftKey && !e.altKey) {
											sendCommentButtonRef.current.click()
										}
									}}
								></Editable>

								<div ref={sendCommentButtonRef} className="octo-button filled" style={{ display: "none" }}
									onClick={(e) => {
										const text = newCommentRef.current.text
										console.log(`Send comment: ${newCommentRef.current.text}`)
										this.sendComment(text)
										newCommentRef.current.text = undefined
										newCommentRef.current.blur()
									}}
								>Send</div>
							</div>
						</div>

						<hr />
					</div>

					{/* Content blocks */}

					<div className="content fullwidth">
						{contentElements}
					</div>

					<div className="content">
						<div className="octo-hoverpanel octo-hover-container">
							<div
								className="octo-button octo-hovercontrol octo-hover-item"
								onClick={(e) => {
									Menu.shared.options = [
										{ id: "text", name: "Text" },
										{ id: "image", name: "Image" },
									]
									Menu.shared.onMenuClicked = async (optionId: string, type?: string) => {
										switch (optionId) {
											case "text":
												const order = cardTree.contents.length * 1000
												const block = new Block({ type: "text", parentId: card.id, order })
												await mutator.insertBlock(block, "add text")
												break
											case "image":
												Utils.selectLocalFile(
													(file) => {
														mutator.createImageBlock(card.id, file, cardTree.contents.length * 1000)
													},
													".jpg,.jpeg,.png")
												break
										}
									}
									Menu.shared.showAtElement(e.target as HTMLElement)
								}}
							>Add content</div>
						</div>
					</div>

				</div >
			</div >

		return element
	}

	async sendComment(text: string) {
		const { mutator, card } = this.props

		Utils.assertValue(card)

		const block = new Block({ type: "comment", parentId: card.id, title: text })
		await mutator.insertBlock(block, "add comment")
	}

	private showContentBlockMenu(e: React.MouseEvent, block: IBlock) {
		const { mutator, card } = this.props
		const { cardTree } = this.state
		const index = cardTree.contents.indexOf(block)

		const options: MenuOption[] = []
		if (index > 0) {
			options.push({ id: "moveUp", name: "Move up" })
		}
		if (index < cardTree.contents.length - 1) {
			options.push({ id: "moveDown", name: "Move down" })
		}

		options.push(
			{ id: "insertAbove", name: "Insert above", type: "submenu" },
			{ id: "delete", name: "Delete" }
		)

		Menu.shared.options = options
		Menu.shared.subMenuOptions.set("insertAbove", [
			{ id: "text", name: "Text" },
			{ id: "image", name: "Image" },
		])
		Menu.shared.onMenuClicked = (optionId: string, type?: string) => {
			switch (optionId) {
				case "moveUp": {
					if (index < 1) { Utils.logError(`Unexpected index ${index}`); return }
					const previousBlock = cardTree.contents[index - 1]
					const newOrder = OctoUtils.getOrderBefore(previousBlock, cardTree.contents)
					Utils.log(`moveUp ${newOrder}`)
					mutator.changeOrder(block, newOrder, "move up")
					break
				}
				case "moveDown": {
					if (index >= cardTree.contents.length - 1) { Utils.logError(`Unexpected index ${index}`); return }
					const nextBlock = cardTree.contents[index + 1]
					const newOrder = OctoUtils.getOrderAfter(nextBlock, cardTree.contents)
					Utils.log(`moveDown ${newOrder}`)
					mutator.changeOrder(block, newOrder, "move down")
					break
				}
				case "insertAbove-text": {
					const newBlock = new Block({ type: "text", parentId: card.id })
					// TODO: Handle need to reorder all blocks
					newBlock.order = OctoUtils.getOrderBefore(block, cardTree.contents)
					Utils.log(`insert block ${block.id}, order: ${block.order}`)
					mutator.insertBlock(newBlock, "insert card text")
					break
				}
				case "insertAbove-image": {
					Utils.selectLocalFile(
						(file) => {
							mutator.createImageBlock(card.id, file, OctoUtils.getOrderBefore(block, cardTree.contents))
						},
						".jpg,.jpeg,.png")

					break
				}
				case "delete": {
					mutator.deleteBlock(block)
					break
				}
			}
		}
		Menu.shared.showAtElement(e.target as HTMLElement)
	}

	private iconClicked(e: React.MouseEvent) {
		const { mutator, card } = this.props

		Menu.shared.options = [
			{ id: "random", name: "Random" },
			{ id: "remove", name: "Remove Icon" },
		]
		Menu.shared.onMenuClicked = (optionId: string, type?: string) => {
			switch (optionId) {
				case "remove":
					mutator.changeIcon(card, undefined, "remove icon")
					break
				case "random":
					const newIcon = BlockIcons.shared.randomIcon()
					mutator.changeIcon(card, newIcon)
					break
			}
		}
		Menu.shared.showAtElement(e.target as HTMLElement)
	}

	close() {
		Menu.shared.hide()
		PropertyMenu.shared.hide()

		this.props.onClose()
	}
}

export { CardDialog }
