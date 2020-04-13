const fs = require('fs'), getScreenshots = require('./getScreenshots');

let d, p, b;

async function writeScreenshotUrls(browser, page){
    await fs.readFile('data.json', 'utf8', function readFileCallback(err, data){
        if(err) throw err;
    
        d = JSON.parse(data), p = page, b = browser;
        getScreenshotUrl(0);
    });
}

async function getScreenshotUrl(n){
    if(d[n].url){
        console.log(`DATA FOR screenshot ${n + 1} of ${d.length} already downloaded.`);
        return getScreenshotUrl(n + 1);
    };

    console.log(`Downloading DATA FOR screenshot ${n + 1} of ${d.length}.`);

    await p.goto(d[n].fileURL);
    
    const screenshot_a = await p.$('.actualmediactn a');
    const screenshot_href = await p.evaluate(screenshot_a =>  screenshot_a.href, screenshot_a);

    console.log(screenshot_href);

    const gameName_el = await p.$('.screenshotAppName');
    const gameName = await p.evaluate(gameName_el =>  gameName_el.textContent, gameName_el);

    console.log(gameName);

    let game_appid = "";
    const gameAppID_el = await p.$('body > div.responsive_page_frame.with_header > div.responsive_page_content > div.responsive_page_template_content > div.apphub_HomeHeaderContent > div.apphub_HeaderTop > div.apphub_OtherSiteInfo.responsive_hidden > a');
    if(gameAppID_el){
        game_appid = await p.evaluate(gameAppID_el =>  gameAppID_el.getAttribute('data-appid'), gameAppID_el);
        console.log(game_appid);
    }

    let screenshot_description = false;
    const description_el = await p.$('#description');
    if(description_el){
        //alternative to remove the quotes
        /*const s = await p.evaluate(description_el =>  description_el.textContent, description_el);
        screenshot_description = s.substring(1, s.length-1);*/
        
        screenshot_description = await p.evaluate(description_el =>  description_el.textContent, description_el);
    }

    d[n] = {...d[n], url:screenshot_href, description:screenshot_description, game:{name:gameName, appid:game_appid}};

    fs.writeFile('data.json', JSON.stringify(d), () => {
        console.log('Data written.');
        if(n < d.length - 1){
            return getScreenshotUrl(n + 1);
        }

        b.close(); //no need to wait for this since it Puppeteer won't be used from this point on
        console.log('Browser closed. Onto the downloads.');
        getScreenshots();
    });
}

module.exports = writeScreenshotUrls;