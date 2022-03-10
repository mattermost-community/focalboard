package app

import (
	"context"
	"sync/atomic"
	"time"

	"github.com/mattermost/mattermost-server/v6/shared/mlog"
)

const (
	queueSize = 100
	poolSize  = 5
)

// notifyCallback is a func that can enqueued in the notifier and will be
// called when dequeued.
type notifyCallback func() error

// changeNotifer provides a simple thread pool for processing block change notifications.
type changeNotifer struct {
	queue chan notifyCallback
	done  chan struct{}
	alive chan int

	idone uint32

	logger *mlog.Logger
}

// newChangeNotifier creates a new changeNotifier and starts a thread pool to service it.
func newChangeNotifier(logger *mlog.Logger) *changeNotifer {
	cn := &changeNotifer{
		queue:  make(chan notifyCallback, queueSize),
		done:   make(chan struct{}),
		alive:  make(chan int, poolSize),
		logger: logger,
	}

	for i := 0; i < poolSize; i++ {
		go cn.loop(i)
	}

	return cn
}

// shutdown stops accepting enqueues and exits all pool threads. This method waits
// as long as the context allows for the threads to exit.
// Returns true if the pool exited, false on timeout.
func (cn *changeNotifer) shutdown(context context.Context) bool {
	if !atomic.CompareAndSwapUint32(&cn.idone, 0, 1) {
		// already shutdown
		return true
	}

	// signal threads to exit
	close(cn.done)

	// wait for the threads to exit or timeout
	count := 0
	for count < poolSize {
		select {
		case <-cn.alive:
			count++
		case <-context.Done():
			return false
		}
	}

	// try to drain any remaining callbacks
	for {
		select {
		case f := <-cn.queue:
			cn.exec(f)
		case <-context.Done():
			return false
		default:
			return true
		}
	}
}

// enqueue adds a callback to the queue.
func (cn *changeNotifer) enqueue(f notifyCallback) {
	if atomic.LoadUint32(&cn.idone) != 0 {
		cn.logger.Debug("changeNotifier skipping enqueue, notifier is shutdown")
		return
	}

	select {
	case cn.queue <- f:
	default:
		start := time.Now()
		cn.queue <- f
		dur := time.Since(start)
		cn.logger.Warn("changeNotifier queue backlog", mlog.Duration("wait_time", dur))
	}
}

func (cn *changeNotifer) loop(id int) {
	defer func() {
		cn.logger.Debug("changeNotifier thread exited", mlog.Int("id", id))
		cn.alive <- id
	}()

	for {
		select {
		case f := <-cn.queue:
			cn.exec(f)
		case <-cn.done:
			return
		}
	}
}

func (cn *changeNotifer) exec(f notifyCallback) {
	// don't let a panic in the callback exit the thread.
	defer func() {
		if r := recover(); r != nil {
			cn.logger.Error("changeNotifier callback panic", mlog.Any("panic", r))
		}
	}()

	if err := f(); err != nil {
		cn.logger.Error("changeNotifier callback error", mlog.Err(err))
	}
}
