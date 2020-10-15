import React from "react"

type Props = {
	onChanged: (isOn: boolean) => void
	isOn: boolean
	style?: React.CSSProperties
}

type State = {
	isOn: boolean
}

// Switch is an on-off style switch / checkbox
class Switch extends React.Component<Props, State> {
	static defaultProps = {
		isMarkdown: false,
		isMultiline: false
	}

	elementRef = React.createRef<HTMLDivElement>()
	innerElementRef = React.createRef<HTMLDivElement>()

	constructor(props: Props) {
		super(props)
		this.state = { isOn: props.isOn }
	}

	focus() {
		this.elementRef.current.focus()
		// Put cursor at end
		document.execCommand("selectAll", false, null)
		document.getSelection().collapseToEnd()
	}

	render() {
		const { style } = this.props
		const { isOn } = this.state

		const className = isOn ? "octo-switch on" : "octo-switch"
		const element =
			<div
				ref={this.elementRef}
				className={className}
				style={style}
				onClick={() => { this.onClicked() }}
			>
				<div ref={this.innerElementRef} className="octo-switch-inner"></div>
			</div>

		return element
	}

	private async onClicked() {
		const newIsOn = !this.state.isOn
		this.setState({ isOn: newIsOn })

		const { onChanged } = this.props

		onChanged(newIsOn)
	}
}

export { Switch }
