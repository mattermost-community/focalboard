module.exports = {
    ci: {
        collect: {
            url: [
                'http://localhost:8000/byumge79udt8ut8x3ok9jo7xggo/vz1jgngxfwifftcka86upt11fyw', // all tasks view
                'http://localhost:8000/byumge79udt8ut8x3ok9jo7xggo/vrh4d1mg4dpy65guz8b87m4zh5w', // by priority - kanban view
                'http://localhost:8000/byumge79udt8ut8x3ok9jo7xggo/vpqgzdxh96tgq9eht55joqgd9ta', // by status
                'http://localhost:8000/byumge79udt8ut8x3ok9jo7xggo/vw3og338nqidhxn9mkprhmauroo', // gallery view
                'http://localhost:8000/byumge79udt8ut8x3ok9jo7xggo/vksq3tsg9xpb3fkjdcj9gngzz7h', // calender view
            ],
            startServerCommand: './bin/focalboard-server -dbconfig=./focalboard-lighthouse.db > ./bin/focalboard.logs',
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
