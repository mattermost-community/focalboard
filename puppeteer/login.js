/**
 * @param {puppeteer.Browser} browser
 * @param {{url: string, options: LHCI.CollectCommand.Options}} context
 */
module.exports = async (browser, context) => {
    // launch browser for LHCI
    const page = await browser.newPage();
    await page.goto('http://localhost:8000/login');
    await page.type('#login-username', 'harshil.sharma');
    await page.type('#login-password', 'mattermost');
    await page.click('[type="submit"]');
    await page.waitForNavigation();
    // close session for next run
    await page.close();
};
