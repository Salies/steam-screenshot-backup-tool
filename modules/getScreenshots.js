const fs = require('fs'), path = require('path'), sanitize = require("sanitize-filename"), axios = require('axios').default;

let d;

async function getScreenshots(){
    await fs.readFile('data.json', 'utf8', function readFileCallback(err, data){
        if(err) throw err;
    
        d = JSON.parse(data);

        fs.mkdir("games", { recursive: true }, (err) => {
            if (err) throw err;
            downloadScreenshot(0);
        });
    });
}

function downloadScreenshot(n){
    console.log(`Downloading screenshot ${n + 1} of ${d.length}`);

    if(d[n].downloaded){
        console.log('Screenshot already downloaded.');
        return downloadScreenshot(n + 1);
    }

    const g_name = sanitize(`${d[n].game.name} (${d[n].game.appid})`),
    dir = `games/${g_name}`;

    fs.mkdir(dir, { recursive: true }, (err) => {
        if(err) throw err;

        const img_path = `${dir}/${n}.jpg`,
        writer = fs.createWriteStream(img_path),
        request = {
            method: 'get',
            url: d[n].url,
            responseType:'stream'
        };
    
        axios(request)
        .then(function (response) {
          response.data.pipe(writer);
    
          return new Promise((resolve, reject) => {
            writer.on('finish', ()=>{
                d[n] = {...d[n], downloaded:true};

                fs.writeFile('data.json', JSON.stringify(d), () => {
                    downloadScreenshot(n + 1);
                });
            });
            writer.on('error', reject)
          });
        })
        .catch(function (error) {
            throw error;
        });
    });
}

module.exports = getScreenshots;