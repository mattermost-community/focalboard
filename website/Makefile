
BASE_URL?=https://www.focalboard.com

.PHONY: dist
dist:
	rm -rf ./dist
	hugo -s site --destination ../dist/html -b$(BASE_URL)

.PHONY: run
run:
	hugo server --buildDrafts --disableFastRender -F -s site
