package web

import (
	"github.com/mattermost/mattermost-server/v6/shared/mlog"
	"github.com/stretchr/testify/require"
	"net/url"
	"strconv"
	"testing"
)

func Test_NewServer(t *testing.T) {
	tests := []struct {
		name       string
		rootPath   string
		serverRoot string
		ssl        bool
		port       int
		localOnly  bool
		logger     *mlog.Logger
	}{
		{
			name:       "should return Server with given properties",
			rootPath:   "./test/path/to/root",
			serverRoot: "https://some-fake-server.com/fake-url",
			ssl:        false,
			port:       9999, // fake port number
			localOnly:  false,
			logger:     &mlog.Logger{},
		},
		{
			name:       "should return local server with given properties",
			rootPath:   "./test/path/to/root",
			serverRoot: "https://some-fake-server.com/fake-url",
			ssl:        false,
			port:       3000, // fake port number
			localOnly:  true,
			logger:     &mlog.Logger{},
		},
		{
			name:       "should match Server properties when ssl true",
			rootPath:   "./test/path/to/root",
			serverRoot: "https://some-fake-server.com/fake-url",
			ssl:        true,
			port:       8000, // fake port number
			localOnly:  false,
			logger:     &mlog.Logger{},
		},
		{
			name:       "should return local server with given properties",
			rootPath:   "./test/path/to/root",
			serverRoot: "https://localhost:8080/fake-url",
			ssl:        true,
			port:       9999, // fake port number
			localOnly:  true,
			logger:     &mlog.Logger{},
		},
	}

	for _, test := range tests {

		t.Run(test.name, func(t *testing.T) {
			baseURL := ""
			url, err := url.Parse(test.serverRoot)
			if err != nil {
				test.logger.Error("Invalid ServerRoot setting", mlog.Err(err))
			}
			baseURL = url.Path

			ws := NewServer(test.rootPath, test.serverRoot, test.port, test.ssl, test.localOnly, test.logger)

			require.NotNilf(t, ws, "The webserver object is nil!")

			require.Equalf(t, baseURL, ws.baseURL, "baseURL does not match")
			require.Equalf(t, test.rootPath, ws.rootPath, "rootPath does not match")
			require.Equalf(t, test.port, ws.port, "rootPath does not match")
			require.Equalf(t, test.ssl, ws.ssl, "logger pointer does not match")
			require.Equalf(t, test.logger, ws.logger, "logger pointer does not match")

			if test.localOnly == true {
				expectedServerAddr := "localhost:" + strconv.Itoa(test.port)
				require.Equalf(t, expectedServerAddr, ws.Server.Addr, "localhost address not as matching!")
			} else {
				expectedServerAddr := ":" + strconv.Itoa(test.port)
				require.Equalf(t, expectedServerAddr, ws.Server.Addr, "server address not matching!")
			}

		})
	}
}
