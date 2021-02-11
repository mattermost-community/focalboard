package client

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"io/ioutil"
	"net/http"
	"strings"

	"github.com/mattermost/focalboard/server/model"
)

const (
	API_URL_SUFFIX = "/api/v1"
)

type Response struct {
	StatusCode int
	Error      error
	Header     http.Header
}

func BuildResponse(r *http.Response) *Response {
	return &Response{
		StatusCode: r.StatusCode,
		Header:     r.Header,
	}
}

func BuildErrorResponse(r *http.Response, err error) *Response {
	statusCode := 0
	header := make(http.Header)
	if r != nil {
		statusCode = r.StatusCode
		header = r.Header
	}

	return &Response{
		StatusCode: statusCode,
		Error:      err,
		Header:     header,
	}
}

func closeBody(r *http.Response) {
	if r.Body != nil {
		_, _ = io.Copy(ioutil.Discard, r.Body)
		_ = r.Body.Close()
	}
}

func toJSON(v interface{}) string {
	b, _ := json.Marshal(v)
	return string(b)
}

type Client struct {
	Url        string
	ApiUrl     string
	HttpClient *http.Client
	HttpHeader map[string]string
}

func NewClient(url string, sessionToken string) *Client {
	url = strings.TrimRight(url, "/")
	headers := map[string]string{
		"X-Requested-With": "XMLHttpRequest",
		"Authorization":    "Bearer " + sessionToken,
	}
	return &Client{url, url + API_URL_SUFFIX, &http.Client{}, headers}
}

func (c *Client) DoApiGet(url string, etag string) (*http.Response, error) {
	return c.DoApiRequest(http.MethodGet, c.ApiUrl+url, "", etag)
}

func (c *Client) DoApiPost(url string, data string) (*http.Response, error) {
	return c.DoApiRequest(http.MethodPost, c.ApiUrl+url, data, "")
}

func (c *Client) doApiPostBytes(url string, data []byte) (*http.Response, error) {
	return c.doApiRequestBytes(http.MethodPost, c.ApiUrl+url, data, "")
}

func (c *Client) DoApiPut(url string, data string) (*http.Response, error) {
	return c.DoApiRequest(http.MethodPut, c.ApiUrl+url, data, "")
}

func (c *Client) doApiPutBytes(url string, data []byte) (*http.Response, error) {
	return c.doApiRequestBytes(http.MethodPut, c.ApiUrl+url, data, "")
}

func (c *Client) DoApiDelete(url string) (*http.Response, error) {
	return c.DoApiRequest(http.MethodDelete, c.ApiUrl+url, "", "")
}

func (c *Client) DoApiRequest(method, url, data, etag string) (*http.Response, error) {
	return c.doApiRequestReader(method, url, strings.NewReader(data), etag)
}

func (c *Client) doApiRequestBytes(method, url string, data []byte, etag string) (*http.Response, error) {
	return c.doApiRequestReader(method, url, bytes.NewReader(data), etag)
}

func (c *Client) doApiRequestReader(method, url string, data io.Reader, etag string) (*http.Response, error) {
	rq, err := http.NewRequest(method, url, data)
	if err != nil {
		return nil, err
	}

	if c.HttpHeader != nil && len(c.HttpHeader) > 0 {
		for k, v := range c.HttpHeader {
			rq.Header.Set(k, v)
		}
	}

	rp, err := c.HttpClient.Do(rq)
	if err != nil || rp == nil {
		return nil, err
	}

	if rp.StatusCode == 304 {
		return rp, nil
	}

	if rp.StatusCode >= 300 {
		defer closeBody(rp)
		b, err := ioutil.ReadAll(rp.Body)
		if err != nil {
			return rp, fmt.Errorf("error when parsing response with code %d: %w", rp.StatusCode, err)
		}
		return rp, fmt.Errorf(string(b))
	}

	return rp, nil
}

func (c *Client) GetBlocksRoute() string {
	return "/blocks"
}

func (c *Client) GetBlockRoute(id string) string {
	return fmt.Sprintf("%s/%s", c.GetBlocksRoute(), id)
}

func (c *Client) GetSubtreeRoute(id string) string {
	return fmt.Sprintf("%s/subtree", c.GetBlockRoute(id))
}

func (c *Client) GetBlocks() ([]model.Block, *Response) {
	r, err := c.DoApiGet(c.GetBlocksRoute(), "")
	if err != nil {
		return nil, BuildErrorResponse(r, err)
	}
	defer closeBody(r)

	return model.BlocksFromJSON(r.Body), BuildResponse(r)
}

func (c *Client) InsertBlocks(blocks []model.Block) (bool, *Response) {
	r, err := c.DoApiPost(c.GetBlocksRoute(), toJSON(blocks))
	if err != nil {
		return false, BuildErrorResponse(r, err)
	}
	defer closeBody(r)

	return true, BuildResponse(r)
}

func (c *Client) DeleteBlock(blockID string) (bool, *Response) {
	r, err := c.DoApiDelete(c.GetBlockRoute(blockID))
	if err != nil {
		return false, BuildErrorResponse(r, err)
	}
	defer closeBody(r)

	return true, BuildResponse(r)
}

func (c *Client) GetSubtree(blockID string) ([]model.Block, *Response) {
	r, err := c.DoApiGet(c.GetSubtreeRoute(blockID), "")
	if err != nil {
		return nil, BuildErrorResponse(r, err)
	}
	defer closeBody(r)

	return model.BlocksFromJSON(r.Body), BuildResponse(r)
}

// Sharing

func (c *Client) GetSharingRoute(rootID string) string {
	return fmt.Sprintf("/sharing/%s", rootID)
}

func (c *Client) GetSharing(rootID string) (*model.Sharing, *Response) {
	r, err := c.DoApiGet(c.GetSharingRoute(rootID), "")
	if err != nil {
		return nil, BuildErrorResponse(r, err)
	}
	defer closeBody(r)

	sharing := model.SharingFromJSON(r.Body)
	return &sharing, BuildResponse(r)
}

func (c *Client) PostSharing(sharing model.Sharing) (bool, *Response) {
	r, err := c.DoApiPost(c.GetSharingRoute(sharing.ID), toJSON(sharing))
	if err != nil {
		return false, BuildErrorResponse(r, err)
	}
	defer closeBody(r)

	return true, BuildResponse(r)
}
