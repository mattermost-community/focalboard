package main

import (
	"bytes"
	"encoding/json"
	"fmt"

	pluginapi "github.com/mattermost/mattermost-plugin-api"

	"github.com/mattermost/mattermost-server/v6/shared/mlog"
)

const (
	pluginTargetType = "focalboard_plugin_adapter"
)

// pluginTargetFactory creates a plugin log adapter when a custom target type appears in
// the logging configuration.
type pluginTargetFactory struct {
	logService *pluginapi.LogService
}

func newPluginTargetFactory(logService *pluginapi.LogService) pluginTargetFactory {
	return pluginTargetFactory{
		logService: logService,
	}
}

func (ptf pluginTargetFactory) createTarget(targetType string, options json.RawMessage) (mlog.Target, error) {
	if targetType != pluginTargetType {
		return nil, ErrInvalidTargetType{targetType}
	}
	return newPluginAdapterTarget(ptf.logService), nil
}

// pluginLogAdapter is a simple log target that writes to the plugin API.
type pluginLogAdapter struct {
	logService *pluginapi.LogService
}

func newPluginAdapterTarget(logService *pluginapi.LogService) mlog.Target {
	return &pluginLogAdapter{
		logService: logService,
	}
}

func (pla *pluginLogAdapter) Init() error {
	return nil
}

func (pla *pluginLogAdapter) Shutdown() error {
	return nil
}

func (pla *pluginLogAdapter) Write(p []byte, rec *mlog.LogRec) (int, error) {
	fields := rec.Fields()

	args := make([]interface{}, 0, len(fields)*2)
	buf := &bytes.Buffer{}
	var err error
	for _, fld := range fields {
		err = fld.ValueString(buf, mlog.ShouldQuote)
		if err != nil {
			return 0, err
		}
		args = append(args, fld.Key, buf.String())
		buf.Reset()
	}

	switch rec.Level() {
	case mlog.LvlDebug:
		pla.logService.Debug(rec.Msg(), args...)
	case mlog.LvlError:
		pla.logService.Error(rec.Msg(), args...)
	case mlog.LvlInfo:
		pla.logService.Info(rec.Msg(), args...)
	case mlog.LvlWarn:
		pla.logService.Warn(rec.Msg(), args...)
	case mlog.LvlCritical, mlog.LvlFatal:
		args = append(args, mlog.String("level", rec.Level().Name))
		pla.logService.Error(rec.Msg(), args...)
	default:
		args = append(args, mlog.String("level", rec.Level().Name))
		pla.logService.Info(rec.Msg(), args...)
	}
	return 0, nil
}

// ErrInvalidTargetType is returned when a log config factory does not recognize the
// target type.
type ErrInvalidTargetType struct {
	name string
}

func (e ErrInvalidTargetType) Error() string {
	return fmt.Sprintf("invalid log target type '%s'", e.name)
}
