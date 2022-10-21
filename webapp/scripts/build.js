const ejs = require('ejs');
const fs = require('fs');
const path = require('path');

const sassPlugin = require('esbuild-sass-plugin').sassPlugin;
const postcss = require('postcss');
const postcssUrl = require("postcss-url")

require('esbuild').build({
    entryPoints: ['src/main.tsx', 'src/userSettings.ts'],
    bundle: true,
    sourcemap: process.env.NODE_ENV === 'dev' || process.env.NODE_ENV === 'watch',
    minify: process.env.NODE_ENV === 'production',
    watch: process.env.NODE_ENV === 'watch',
    outdir: 'pack/static',
    mainFields: ['module', 'main'],
    define: {global: 'window'},
    target: [
        'chrome100',
        'edge44',
        'firefox91',
        'safari14',
    ],
    loader: {
        '.png': 'file',
        '.ttf': 'file',
        '.eot': 'file',
        '.tiff': 'file',
        '.svg': 'file',
        '.woff2': 'file',
        '.woff': 'file',
        '.jpg': 'file',
        '.jpeg': 'file',
        '.gif': 'file',
    },
    plugins: [
        sassPlugin(
            {
                type: 'style',
                async transform(source, resolveDir, filePath) {
                    const {css} = await postcss().use(postcssUrl({url: 'inline'})).process(source, {from: filePath, to: `pack/static/index.css`});
                    return css;
                }
            },
        ),
    ]
}).catch(() => process.exit(1)).then(() => {
    const version = new Date().getTime();
    ejs.renderFile('./html-templates/page.ejs', {version}, {}, function (err, str) {
      if (err) console.error(err)
      fs.writeFileSync(path.join(__dirname, '..', 'pack', 'index.html'), str)
    })
}).catch(() => process.exit(1))
