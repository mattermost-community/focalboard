# Focalboard Web Clipper Browser Extension ✂️

This is the Focalboard Web Clipper browser extension. It aims at supporting various use cases around converting web content from your browser directly into Focalboard cards.

⚠️ **Warning:** The extension is currently in an early and experimental state. Use it at your own risk only. Don't expect any eye candy.

## Status

The extension currently is in a proof-of-concept state with minimal functionality. The only supported use case at the time is building a read-later list. Things that work:

- Logging in to the Focalboard server from the extension settings
- Selecting a board to capture cards into from the extension settings
- Saving websites (title & URL) into cards from a page action (like e.g. Pocket does it)

Only Firefox was tested so far but polyfills have already been enabled so there's a good chance that it'll work in Chrome and maybe even Safari, too.

### Next Steps

We're really at the very beginning here so there's a lot to be done. Notable tasks include:

- Improve the React code by extracting components
- Style the options and popup pages to mimic the look and feel of Focalboard
- Replace the logo with something better (the current one was snatched from the Focalboard Windows app)
- Link to the extension's options page from page action error messages
- Clip parts of a website into image attachments on cards
- Extract website content in reader mode into card descriptions
- Optimise the logic for finding the first URL property (currently the whole board subtree has to be requested because there is no other API available)
- Add some tests
- Test the extension on Chrome / Safari and add infrastructure to facilitate this in future (e.g. `.web-ext-config.js`)
- Add an onboarding (displayed after first install) and upboarding (displayed after update) page
- Distribute the extension via the various browser add-on stores (ok, maybe too early 😜)

## Hacking

First, install dependencies with

```
$ npm i
```

You can then compile and bundle the code with

```
$ npm run watchdev
```

This will write output into `dist/dev/` and automatically recompile and bundle on any source change.

To run the extension in a separate Firefox instance, use

```
$ npm run servedev
```

Note that in the above commands you can substitue `dev` with `prod` to build and run the extension with production settings.

## Distribution

To build a distributable ZIP archive, run

```
$ npm run build
```

The archive will be placed into the `web-ext-artifacts` folder.
