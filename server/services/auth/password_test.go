package auth

import (
	"math/rand"
	"strings"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestPasswordHash(t *testing.T) {
	hash := HashPassword("Test")

	assert.True(t, ComparePassword(hash, "Test"), "Passwords don't match")
	assert.False(t, ComparePassword(hash, "Test2"), "Passwords should not have matched")
}

func TestGeneratePassword(t *testing.T) {
	passwordRandomSource = rand.NewSource(12345)

	t.Run("Should be the minimum length or 4, whichever is less", func(t *testing.T) {
		password1 := GeneratePassword(5)
		assert.Len(t, password1, 5)
		password2 := GeneratePassword(10)
		assert.Len(t, password2, 10)
		password3 := GeneratePassword(1)
		assert.Len(t, password3, 4)
	})

	t.Run("Should contain at least one of symbols, upper case, lower case and numbers", func(t *testing.T) {
		password := GeneratePassword(4)
		require.Len(t, password, 4)
		assert.Contains(t, []rune(PasswordUpperCaseLetters), []rune(password)[0])
		assert.Contains(t, []rune(PasswordNumbers), []rune(password)[1])
		assert.Contains(t, []rune(PasswordLowerCaseLetters), []rune(password)[2])
		assert.Contains(t, []rune(PasswordSpecialChars), []rune(password)[3])
	})
}

func TestIsPasswordValidWithSettings(t *testing.T) {
	for name, tc := range map[string]struct {
		Password                 string
		Settings                 PasswordSettings
		ExpectedFailingCriterias []string
	}{
		"Short": {
			Password: strings.Repeat("x", 3),
			Settings: PasswordSettings{
				MinimumLength: 3,
				Lowercase:     false,
				Uppercase:     false,
				Number:        false,
				Symbol:        false,
			},
		},
		"Long": {
			Password: strings.Repeat("x", PasswordMaximumLength),
			Settings: PasswordSettings{
				MinimumLength: 3,
				Lowercase:     false,
				Uppercase:     false,
				Number:        false,
				Symbol:        false,
			},
		},
		"TooShort": {
			Password: strings.Repeat("x", 2),
			Settings: PasswordSettings{
				MinimumLength: 3,
				Lowercase:     false,
				Uppercase:     false,
				Number:        false,
				Symbol:        false,
			},
			ExpectedFailingCriterias: []string{"min-length"},
		},
		"TooLong": {
			Password: strings.Repeat("x", PasswordMaximumLength+1),
			Settings: PasswordSettings{
				MinimumLength: 3,
				Lowercase:     false,
				Uppercase:     false,
				Number:        false,
				Symbol:        false,
			},
			ExpectedFailingCriterias: []string{"max-length"},
		},
		"MissingLower": {
			Password: "AAAAAAAAAAASD123!@#",
			Settings: PasswordSettings{
				MinimumLength: 3,
				Lowercase:     true,
				Uppercase:     false,
				Number:        false,
				Symbol:        false,
			},
			ExpectedFailingCriterias: []string{"lowercase"},
		},
		"MissingUpper": {
			Password: "aaaaaaaaaaaaasd123!@#",
			Settings: PasswordSettings{
				MinimumLength: 3,
				Uppercase:     true,
				Lowercase:     false,
				Number:        false,
				Symbol:        false,
			},
			ExpectedFailingCriterias: []string{"uppercase"},
		},
		"MissingNumber": {
			Password: "asasdasdsadASD!@#",
			Settings: PasswordSettings{
				MinimumLength: 3,
				Number:        true,
				Lowercase:     false,
				Uppercase:     false,
				Symbol:        false,
			},
			ExpectedFailingCriterias: []string{"number"},
		},
		"MissingSymbol": {
			Password: "asdasdasdasdasdASD123",
			Settings: PasswordSettings{
				MinimumLength: 3,
				Symbol:        true,
				Lowercase:     false,
				Uppercase:     false,
				Number:        false,
			},
			ExpectedFailingCriterias: []string{"symbol"},
		},
		"MissingMultiple": {
			Password: "asdasdasdasdasdasd",
			Settings: PasswordSettings{
				MinimumLength: 3,
				Lowercase:     true,
				Uppercase:     true,
				Number:        true,
				Symbol:        true,
			},
			ExpectedFailingCriterias: []string{"uppercase", "number", "symbol"},
		},
		"Everything": {
			Password: "asdASD!@#123",
			Settings: PasswordSettings{
				MinimumLength: 3,
				Lowercase:     true,
				Uppercase:     true,
				Number:        true,
				Symbol:        true,
			},
		},
	} {
		t.Run(name, func(t *testing.T) {
			as := New(tc.Settings)
			err := as.IsPasswordValid(tc.Password)
			if len(tc.ExpectedFailingCriterias) == 0 {
				assert.NoError(t, err)
			} else {
				require.Error(t, err)
				assert.Equal(t, tc.ExpectedFailingCriterias, err.(*InvalidPasswordError).FailingCriterias)
			}
		})
	}
}
