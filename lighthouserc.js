module.exports = {
    ci: {
        collect: {
            url: ['http://localhost:8000/bjgjcpx9p3jgu3p9ksjbihwhgca/vsn1ccwu4b3djbyiq5hhnai4qjc'],
            startServerCommand: './bin/focalboard-server',
            puppeteerScript: "./puppeteer/login.js",
            settings: {
                // Don't clear localStorage/IndexedDB/etc before loading the page.
                disableStorageReset: true,
                headful: true,
                preset: "desktop"
            }
        },
        upload: {
            target: 'temporary-public-storage',
        },
    },
};
