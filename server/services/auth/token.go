package auth

import (
	"time"

	"github.com/dgrijalva/jwt-go"
)

func CreateToken(userID string, appSecret string) (string, error) {
	claims := jwt.MapClaims{}
	claims["authorized"] = true
	claims["user_id"] = userID
	claims["exp"] = time.Now().Add(time.Minute * 15).Unix()
	at := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	token, err := at.SignedString([]byte(appSecret))
	if err != nil {
		return "", err
	}
	return token, nil
}
