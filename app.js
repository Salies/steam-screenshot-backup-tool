const puppeteer = require('puppeteer'), 
fs = require('fs'), 
readline = require("readline"), 
getPage = require('./modules/getPage'), 
writeScreenshotUrls = require('./modules/getScreenshotUrl'), 
rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function askUser(p, b){
    rl.question("Insert a Steam profile URL:", function(url){
        if(url.slice(-1) === "/"){
            url = url.slice(0, -1);
        }

        getPage(p, 1, 1, b, url);
        rl.close();
    });
}

(async () => {
    const browser = await puppeteer.launch(),
    page = await browser.newPage();
    await page.setDefaultNavigationTimeout(0);

    fs.stat('data.json', function(err, stat) {
        if(!err) {
            rl.question("data.json already exists. Overwrite? (y/n)", function(data_bool) {
                let response;
                if(data_bool === "y"){
                    response = true;
                }
                else if(data_bool === "n"){
                    response = false;
                }
                else{
                    console.log("Invalid answer.");
                    return process.exit(0);
                }

                if(response){
                    fs.unlink('data.json', (err) => {
                        if (err) throw err;
                        askUser(page, browser);
                    });
                }
                else{
                    writeScreenshotUrls(browser, page);
                    rl.close();
                }
            });
        } else if(err.code === 'ENOENT') {
            askUser(page, browser);
        }
    });
})();