package model

type VirtualLink struct {
	ID         string                 `json:"id"`
	Name       string                 `json:"name"`
	Properties map[string]interface{} `json:"properties"`
}
