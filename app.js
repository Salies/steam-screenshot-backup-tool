const puppeteer = require('puppeteer'), fs = require('fs'), getPage = require('./modules/getPage'),  writeScreenshotUrls = require('./modules/getScreenshotUrl');

(async () => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.setDefaultNavigationTimeout(0);

    fs.stat('data.json', function(err, stat) {
        if(err == null) {
            writeScreenshotUrls(browser, page);
        } else if(err.code === 'ENOENT') {
            getPage(browser, page, 1);
        }
    });
})();