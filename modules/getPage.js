const fs = require('fs');

function filterResponse($){
    console.log('filtrando...');
}

let nPages = 1;

async function getPage(page, n, tries=1){
    //example: invalid page 
    //let p = `https://steamcommunity.com/id/sonicsalies/screenshots/?appid=123&sort=newestfirst&browsefilter=myfiles&view=grid`;
    let p = `https://steamcommunity.com/id/sonicsalies/screenshots/?appid=0&p=${n}&sort=newestfirst&browsefilter=myfiles&view=grid`;
    await page.goto(p);

    const notfound = await page.$('#NoItemsContainer');

    if(notfound){
        console.log(`No screenshots available in the page. This might be a glitch, retrying... (${tries})`);

        if(tries === 5){
            console.log('5 tries');
            return false;
        }

        return getPage(page, n, tries + 1);
    }

    //document.querySelectorAll('a.profile_media_item')
    const pages = await page.$('div.pagingPageLinks > a:nth-last-child(2)');

    //get total number of pages
    if(n === 1 && pages) {nPages = await page.evaluate(pages => pages.textContent, pages); console.log(`There's a total of ${nPages}.`);};

    console.log(`Analyzing page ${n} of ${nPages}`);

    let sel = 'a.profile_media_item';

    const elements = await page.evaluate((sel) => {
        let elements = Array.from(document.querySelectorAll(sel));
        let links = elements.map(element => {
            return element.href
        })
        return links;
    }, sel);

    //console.log(elements.length);

    writeURL(elements);

    if(n < nPages){
        return getPage(page, n + 1);
    }

    console.log('Finished getting pages.');

    return true;
}

function writeURL(arr){
    let d = [];
    arr.forEach(el => d.push({"fileURL":el}));

    fs.stat('data.json', function(err, stat) {
        if(err == null) {
            fs.readFile('data.json', 'utf8', function readFileCallback(err, data){
                if (err){
                    console.log(err);
                } else {
                let oldData = JSON.parse(data), newData = oldData.concat(d);
                fs.writeFile('data.json', JSON.stringify(newData), 'utf8', () => console.log(`Page wrriten.`));
            }});
        } else if(err.code === 'ENOENT') {
            console.log('data.json does not exist. Creating...');
            fs.writeFile('data.json', JSON.stringify(d), () => console.log('File created.\nPage wrriten.'));
        } else {
            console.log('Some other error: ', err.code);
        }
    });
};

module.exports = getPage;