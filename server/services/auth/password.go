package auth

import (
	"fmt"
	"math/rand"
	"strings"
	"time"

	"golang.org/x/crypto/bcrypt"
)

var passwordRandomSource = rand.NewSource(time.Now().Unix())

const (
	PasswordMaximumLength    = 64
	PasswordSpecialChars     = "!\"\\#$%&'()*+,-./:;<=>?@[]^_`|~"
	PasswordNumbers          = "0123456789"
	PasswordUpperCaseLetters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
	PasswordLowerCaseLetters = "abcdefghijklmnopqrstuvwxyz"
	PasswordAllChars         = PasswordSpecialChars + PasswordNumbers + PasswordUpperCaseLetters + PasswordLowerCaseLetters

	InvalidLowercasePassword = "lowercase"
	InvalidMinLengthPassword = "min-length"
	InvalidMaxLengthPassword = "max-length"
	InvalidNumberPassword    = "number"
	InvalidUppercasePassword = "uppercase"
	InvalidSymbolPassword    = "symbol"
)

// HashPassword generates a hash using the bcrypt.GenerateFromPassword
func HashPassword(password string) string {
	hash, err := bcrypt.GenerateFromPassword([]byte(password), 10)
	if err != nil {
		panic(err)
	}

	return string(hash)
}

// ComparePassword compares the hash
func ComparePassword(hash, password string) bool {
	if len(password) == 0 || len(hash) == 0 {
		return false
	}

	err := bcrypt.CompareHashAndPassword([]byte(hash), []byte(password))
	return err == nil
}

func GeneratePassword(minimumLength int) string {
	r := rand.New(passwordRandomSource)

	// Make sure we are guaranteed at least one of each type to meet any possible password complexity requirements.
	password := string([]rune(PasswordUpperCaseLetters)[r.Intn(len(PasswordUpperCaseLetters))]) +
		string([]rune(PasswordNumbers)[r.Intn(len(PasswordNumbers))]) +
		string([]rune(PasswordLowerCaseLetters)[r.Intn(len(PasswordLowerCaseLetters))]) +
		string([]rune(PasswordSpecialChars)[r.Intn(len(PasswordSpecialChars))])

	for len(password) < minimumLength {
		i := r.Intn(len(PasswordAllChars))
		password = password + string([]rune(PasswordAllChars)[i])
	}

	return password
}

type InvalidPasswordError struct {
	FailingCriterias []string
}

func (ipe *InvalidPasswordError) Error() string {
	return fmt.Sprintf("invalid password, failing criterias: %s", strings.Join(ipe.FailingCriterias, ", "))
}

type PasswordSettings struct {
	MinimumLength int
	Lowercase     bool
	Number        bool
	Uppercase     bool
	Symbol        bool
}

func IsPasswordValid(password string, settings PasswordSettings) error {
	err := &InvalidPasswordError{
		FailingCriterias: []string{},
	}

	if len(password) < settings.MinimumLength {
		err.FailingCriterias = append(err.FailingCriterias, InvalidMinLengthPassword)
	}

	if len(password) > PasswordMaximumLength {
		err.FailingCriterias = append(err.FailingCriterias, InvalidMaxLengthPassword)
	}

	if settings.Lowercase {
		if !strings.ContainsAny(password, PasswordLowerCaseLetters) {
			err.FailingCriterias = append(err.FailingCriterias, InvalidLowercasePassword)
		}
	}

	if settings.Uppercase {
		if !strings.ContainsAny(password, PasswordUpperCaseLetters) {
			err.FailingCriterias = append(err.FailingCriterias, InvalidUppercasePassword)
		}
	}

	if settings.Number {
		if !strings.ContainsAny(password, PasswordNumbers) {
			err.FailingCriterias = append(err.FailingCriterias, InvalidNumberPassword)
		}
	}

	if settings.Symbol {
		if !strings.ContainsAny(password, PasswordSpecialChars) {
			err.FailingCriterias = append(err.FailingCriterias, InvalidSymbolPassword)
		}
	}

	if len(err.FailingCriterias) > 0 {
		return err
	}

	return nil
}
