.PHONY: dist
dist:
	rm -rf ./dist
	hugo -s site --destination ../dist/html

.PHONY: run
run:
	hugo server --buildDrafts --disableFastRender -F -s site
