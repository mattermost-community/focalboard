// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

package auth

type AuthService struct {
	passwordSettings PasswordSettings
}

func New(passwordSettings PasswordSettings) *AuthService {
	return &AuthService{
		passwordSettings: passwordSettings,
	}
}
