interface BoardFields {
  isTemplate: boolean
}

export default interface Board {
  id: string
  title: string
  fields: BoardFields
}
