package main

import (
	"testing"
)

func Test_getFirstLink(t *testing.T) {
	tests := []struct {
		name string
		msg  string
		want string
	}{
		{name: "first link", want: "http://www.example.com", msg: "# Title\nhttp://www.example.com\n"},
		{name: "multiple links", want: "http://www.example.com", msg: "# Title\nhttp://www.example.com\n\n##heading\nhttp://www.bogus.com/slash"},
		{name: "embedded link", want: "http://www.example.com", msg: "# Title\n[Example](http://www.example.com)\n\n"},
		{name: "multiple embedded links", want: "http://www.example.com",
			msg: "# Title\n[Example](http://www.example.com)\n\n##heading\n[Bogus](http://www.bogus.com/slash)"},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if got := getFirstLink(tt.msg); got != tt.want {
				t.Errorf("getFirstLink() = %v, want %v", got, tt.want)
			}
		})
	}
}
