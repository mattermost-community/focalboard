import React from "react"

import './button.scss';

type Props = {
	onClick?: (e: React.MouseEvent<HTMLDivElement>) => void
	style?: React.CSSProperties
	backgroundColor?: string
	text?: string
	title?: string
}

class Button extends React.Component<Props> {
	render() {
		const style = {...this.props.style, backgroundColor: this.props.backgroundColor}
		return (
			<div
				onClick={this.props.onClick}
				className="Button octo-button"
				style={style}
				title={this.props.title}>
				{this.props.children}
				{this.props.text}
			</div>)
	}
}

export { Button }
