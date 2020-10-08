interface UndoCommand {
	checkpoint: number
	undo: () => void
	redo: () => void
	description?: string
}

//
// General-purpose undo manager
//
class UndoManager {
	static shared = new UndoManager()

	onStateDidChange?: () => void

	private commands: UndoCommand[] = []
	private index = -1
	private limit = 0
	private isExecuting = false

	get currentCheckpoint() {
		if (this.index < 0) {
			return 0
		}
		return this.commands[this.index].checkpoint
	}

	get undoDescription(): string | undefined {
		const command = this.commands[this.index]
		if (!command) {
			return undefined
		}

		return command.description
	}

	get redoDescription(): string | undefined {
		const command = this.commands[this.index + 1]
		if (!command) {
			return undefined
		}

		return command.description
	}

	private async execute(command: UndoCommand, action: "undo" | "redo") {
		if (!command || typeof command[action] !== "function") {
			return this
		}
		this.isExecuting = true

		await command[action]()

		this.isExecuting = false
		return this
	}

	async perform(
		redo: () => void,
		undo: () => void,
		description?: string,
		isDiscardable = false
	): Promise<UndoManager> {
		await redo()
		return this.registerUndo({ undo, redo }, description, isDiscardable)
	}

	registerUndo(
		command: { undo: () => void; redo: () => void },
		description?: string,
		isDiscardable = false
	): UndoManager {
		if (this.isExecuting) {
			return this
		}
		// If we are here after having called undo, invalidate items higher on the stack
		this.commands.splice(this.index + 1, this.commands.length - this.index)

		let checkpoint: number
		if (isDiscardable) {
			checkpoint =
				this.commands.length > 1
					? this.commands[this.commands.length - 1].checkpoint
					: 0
		} else {
			checkpoint = Date.now()
		}

		const internalCommand = {
			checkpoint,
			undo: command.undo,
			redo: command.redo,
			description,
		}
		this.commands.push(internalCommand)

		// If limit is set, remove items from the start
		if (this.limit && this.commands.length > this.limit) {
			this.commands = this.commands.splice(
				0,
				this.commands.length - this.limit
			)
		}

		// Set the current index to the end
		this.index = this.commands.length - 1

		if (this.onStateDidChange) {
			this.onStateDidChange()
		}

		return this
	}

	async undo() {
		const command = this.commands[this.index]
		if (!command) {
			return this
		}

		await this.execute(command, "undo")
		this.index -= 1

		if (this.onStateDidChange) {
			this.onStateDidChange()
		}

		return this
	}

	async redo() {
		const command = this.commands[this.index + 1]
		if (!command) {
			return this
		}

		await this.execute(command, "redo")
		this.index += 1

		if (this.onStateDidChange) {
			this.onStateDidChange()
		}

		return this
	}

	clear() {
		const prevSize = this.commands.length

		this.commands = []
		this.index = -1

		if (this.onStateDidChange && prevSize > 0) {
			this.onStateDidChange()
		}
	}

	get canUndo() {
		return this.index !== -1
	}

	get canRedo() {
		return this.index < this.commands.length - 1
	}
}

export { UndoManager }
