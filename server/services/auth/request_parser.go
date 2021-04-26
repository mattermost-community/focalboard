// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

package auth

import (
	"net/http"
	"strings"
)

const (
	HEADER_TOKEN         = "token"
	HEADER_AUTH          = "Authorization"
	HEADER_BEARER        = "BEARER"
	SESSION_COOKIE_TOKEN = "FOCALBOARDAUTHTOKEN"
)

type TokenLocation int

const (
	TokenLocationNotFound TokenLocation = iota
	TokenLocationHeader
	TokenLocationCookie
	TokenLocationQueryString
)

func (tl TokenLocation) String() string {
	switch tl {
	case TokenLocationNotFound:
		return "Not Found"
	case TokenLocationHeader:
		return "Header"
	case TokenLocationCookie:
		return "Cookie"
	case TokenLocationQueryString:
		return "QueryString"
	default:
		return "Unknown"
	}
}

func ParseAuthTokenFromRequest(r *http.Request) (string, TokenLocation) {
	authHeader := r.Header.Get(HEADER_AUTH)

	// Attempt to parse the token from the cookie
	if cookie, err := r.Cookie(SESSION_COOKIE_TOKEN); err == nil {
		return cookie.Value, TokenLocationCookie
	}

	// Parse the token from the header
	if len(authHeader) > 6 && strings.ToUpper(authHeader[0:6]) == HEADER_BEARER {
		// Default session token
		return authHeader[7:], TokenLocationHeader
	}

	if len(authHeader) > 5 && strings.ToLower(authHeader[0:5]) == HEADER_TOKEN {
		// OAuth token
		return authHeader[6:], TokenLocationHeader
	}

	// Attempt to parse token out of the query string
	if token := r.URL.Query().Get("access_token"); token != "" {
		return token, TokenLocationQueryString
	}

	return "", TokenLocationNotFound
}
