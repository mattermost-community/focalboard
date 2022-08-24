import {ContentBlockTypes} from '../../../blocks/block'

export type BlockInputProps = {
    onChange: (value: string) => void
    value: string
    onCancel: () => void
    onSave: (val: string) => void
}

export type ContentType = {
    name: ContentBlockTypes
    displayName: string
    slashCommand: string
    prefix: string
    Input: React.FunctionComponent<BlockInputProps>
    render: (value: string) => React.ReactNode
    runSlashCommand: (changeType: (contentType: ContentType) => void, changeValue: (value: string) => void, ...args: string[]) => void
    nextType?: string
}
