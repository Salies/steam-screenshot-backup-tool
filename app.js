const puppeteer = require('puppeteer'), getPage = require('./modules/getPage'), writeScreenshotUrls = require('./modules/getScreenshotUrl'), getScreenshots = require('./modules/getScreenshots');

(async () => {
    /*const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.setDefaultNavigationTimeout(0);

    //await getPage(page, 1);
    //await writeScreenshotUrls(page);
    await browser.close();*/

    await getScreenshots();
})();