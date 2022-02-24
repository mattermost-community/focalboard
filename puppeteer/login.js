const EMAIL = 'focalboard@mattermost.com';
const USERNAME = 'focalboard_user';
const PASSWORD = 'focalboard_password';

/**
 * @param {puppeteer.Browser} browser
 * @param {{url: string, options: LHCI.CollectCommand.Options}} context
 */
module.exports = async (browser, context) => {
    // launch browser for LHCI
    const page = await browser.newPage();
    await login(page)

    // close session for next run
    await page.close();
};

async function login(page) {
    await page.goto('http://localhost:8000/login');
    await page.type('#login-username', USERNAME);
    await page.type('#login-password', PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForNavigation();
}

async function signup(page) {
    await page.goto('http://localhost:8000/register');
    await page.type('#login-email', EMAIL);
    await page.type('#login-username', USERNAME);
    await page.type('#login-password', PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForNavigation();
}

async function uploadData(page) {
    await page.click('.SidebarSettingsMenu');
    await page.click('#import');
    const [fileChooser] = await Promise.all([
        page.waitForFileChooser(),
        page.click('div[aria-label="Import archive"]'),
    ]);
    await fileChooser.accept(['./focalboard-internal.boardarchive']);
    await page.waitForSelector();
}
