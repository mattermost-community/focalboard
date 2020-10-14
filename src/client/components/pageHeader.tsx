import React from "react"

type Props = {
}

class PageHeader extends React.Component<Props> {
	render() {
		return (
			<div className="page-header">
				<a href="/">OCTO</a>
			</div>
		)
	}
}

export { PageHeader }
