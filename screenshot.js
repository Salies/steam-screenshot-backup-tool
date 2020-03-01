const piexif = require('piexifjs');
const puppeteer = require('puppeteer');
const fs = require('fs');
const fetch = require('node-fetch');
const util = require('util');
const streamPipeline = util.promisify(require('stream').pipeline)
const path = require('path');
const async = require("async");
const sanitize = require("sanitize-filename");

let browser, page, lastPage, hrefs;

function delay(time) {
    return new Promise(function(resolve) { 
        setTimeout(resolve, time)
    });
 }

/*fs.writeFile('data.json', JSON.stringify([]), 'utf8', ()=>{
    console.log('Rewrote data.json.');
});*/

async function pageGrab(n){
    await delay(3000);
    await page.goto(`https://steamcommunity.com/id/winterschwert/screenshots/?p=${n}&sort=newestfirst&view=grid`);
    hrefs = await page.$$eval('a.profile_media_item.modalContentLink.ugc', as => as.map(a => {
        let desc = a.querySelector('q');
        if(desc){
            desc = desc.innerHTML;
        }
        //console.log(desc);

        return {href:a.href, description:desc, appid:a.getAttribute("data-appid")};
    }));
    console.log(hrefs)

    /*if(hrefs.length === 0){
        if(!retry){
            console.log("Couldn't reach screenshots, retrying.")
            await page.reload({ waitUntil: ["networkidle0", "domcontentloaded"] });
            hrefs = await page.$$eval('a.profile_media_item.modalContentLink.ugc', as => as.map(a => a.href));
        }
        else{
            return false;
        }
    }*/

    if(hrefs.length === 0){
        return pageGrab(n);
    }

    if(n == 1){
        try{
            lastPage = await page.$eval('a.pagingPageLink:nth-last-of-type(2)', e => e.innerHTML);
        }
        catch{
            console.log('só tem uma página')
        }
    }

    fs.readFile('data.json', 'utf8', (err, data) => {
        if (err){
            throw err;
        } 

        let d = JSON.parse(data);
        let newData = JSON.stringify(d.concat(hrefs));
        fs.writeFile('data.json', newData, 'utf8', ()=>{
            console.log('Saved page');
        });
    });

    if(n != lastPage){
        console.log('Indo pra próxima página')
        return pageGrab(n + 1);
    }

    return hrefs;
}

async function procScreenshots(data){
    //await getScreenshot(data[0]);
    let l = data.length, i = 1;
    await async.eachSeries(data, function(item, callback){
        console.log(`Downloading screenshot ${i} of ${l}`)
        getScreenshot(item).then(function(){
            i++;
            callback();
        })
    });
}

async function getScreenshot(obj){
    await delay(3000);
    try{
        await page.goto(obj.href);
    }
    catch{
        getScreenshot(obj);
    }
    let screenshotURL, gameName, res;
    try{
        screenshotURL = await page.$eval('.actualmediactn a', e => e.href);
        gameName = await page.$eval('.screenshotAppName a', e => e.innerHTML);
    }
    catch{
        getScreenshot(obj);
    }

    //from https://github.com/node-fetch/node-fetch/issues/375#issuecomment-495953540
    try{
        fetch(screenshotURL).then((res)=>{
            const fileName = screenshotURL.split("/")[5] + ".jpg";
            const dir = "screenshots/" + sanitize(gameName) + ` (${obj.appid})`;
            const fullDir = dir + "/" + fileName;
        
            if (!fs.existsSync(dir)){ //synchronous so it happens before the pipe
                fs.mkdirSync(dir, { recursive: true });
            }
        
            streamPipeline(res.body, fs.createWriteStream(fullDir)).then(()=>{
                console.log('Imagem salva')
                if(obj.description){
                    setDescription(fullDir, obj.description).then(()=>{
                        return;
                    })
                }
            })
        })
    }
    catch{
        getScreenshot(obj);
    }
}

function toCharCode(input){
    let output = [];
    let s = input.split("");
    for(i = 0; i< s.length; i++){
        output.push(input.charCodeAt(i), 0);
    }

    output.push(0, 0);

    return output;
}

async function setDescription(fileDir, desc){
    return fs.readFile(fileDir, (err, data) => {
        if(err){throw err}

        const r = data.toString("binary");

        let zeroth = {};
        zeroth[piexif.ImageIFD.XPComment] = toCharCode(desc);

        const exifObj = {"0th":zeroth};

        let exifBytes, newData, newJpeg;

        try{
            exifBytes = piexif.dump(exifObj);
            newData = piexif.insert(exifBytes, r);
            newJpeg = Buffer.from(newData, "binary");
        }
        catch{
            //This is common, as the commentaries for an image are limited to a very narrow ammount of characters. Japanese letters, for example, are not supported.
            return fs.writeFile(`${path.dirname(fileDir)}/${path.basename(fileDir, '.jpg')}.txt`, desc, function() {
                if(err){throw err}
                console.log("ERROR: Description couldn't be added to image as a commentary. The description was saved in a txt file. Check the tool's documentation for more information on the matter.");
            }); 
        }

        fs.writeFile(fileDir, newJpeg, function(err) {
            if(err){throw err}
        });
    });
}

(async () => {
    browser = await puppeteer.launch({headless:false});
    page = await browser.newPage(); 
    //await pageGrab(1);
    const j = await util.promisify(fs.readFile)('data.backup.json', 'utf8')
    await procScreenshots(JSON.parse(j));

    //await setDescription('file.jpg', 'eae manito');

    await browser.close();
})();

/*
Features to add:
- Optimize data storing (store file id instead of the whole url)
- Name the screenshots as they're named by Steam (by date and order)
*/