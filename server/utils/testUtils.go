package utils

import "github.com/stretchr/testify/mock"

var Anything = mock.MatchedBy(func(any) bool { return true })
