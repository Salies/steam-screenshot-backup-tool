const piexif = require('piexifjs'), fs = require('fs'), path = require('path');

function toCharCode(input){
    let output = [];
    let s = input.split("");
    for(i = 0; i< s.length; i++){
        output.push(input.charCodeAt(i), 0);
    }

    output.push(0, 0);

    return output;
}

function setDescription(fileDir, desc){
    return fs.readFile(fileDir, (err, data) => {
        if(err){throw err}

        const r = data.toString("binary");

        let zeroth = {}, exifBytes, newData, newJpeg;
        zeroth[piexif.ImageIFD.XPComment] = toCharCode(desc);

        const exifObj = {"0th":zeroth};

        try{
            exifBytes = piexif.dump(exifObj);
            newData = piexif.insert(exifBytes, r);
            newJpeg = Buffer.from(newData, "binary");
        }
        catch{
            //This is common, as the commentaries for an image are limited to a very narrow ammount of characters. Kanji, for example, are not supported.
            return fs.writeFile(`${path.basename(fileDir, '.jpg')}.txt`, desc, function() {
                if(err){throw err}
                console.log("ERROR: Description couldn't be added to image as a commentary. The description was saved to .txt file. Check the tool's documentation for more information on the matter.");
            }); 
        }

        fs.writeFile(fileDir, newJpeg, function(err) {
            if(err){throw err}
        });
    });
}

module.exports = setDescription;