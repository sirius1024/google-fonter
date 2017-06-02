const ipc = require('electron').ipcRenderer;//data to Main process
const btnLocal = document.getElementById('doIt');//the only action
const fontUrl = document.getElementById('fontUrl');//resource
const localPath = document.getElementById('localPath');//local path
const request = require('request-promise');
const requestNative = require('request');
const fs = require('fs');
const path = require('path');
const shell = require('electron').shell


btnLocal.addEventListener('click', (e) => {
    let url = fontUrl.value;
    let localtion = localPath.value;

    //request option, if don't cannot get full html.
    let option = {
        uri: url,
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36',
            'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
        },
        method: 'GET'
    }
    let rst = {};
    request(option)
        .then((htmlStr) => {
            if (!htmlStr) {
                throw new Error('(0)get null front code.');
            }
            //get google fonts resource file
            rst.frontCss = htmlStr;
            //regex woff files
            let woffReg = /https:\/\/.+\.woff2*/gi;
            let regRst = rst.frontCss.match(woffReg);
            if (!(regRst && regRst.length > 0)) {
                throw new Error('(1)no woff file matched.');
            }
            rst.woffs = regRst;


            let downloadWoff = [];

            rst.woffs.forEach((woffItem) => {
                let woffItemInfo = path.parse(woffItem);
                //request(woffItem).pipe(fs.writeFileSync(localtion + woffItemInfo.name + woffItemInfo.ext))
                downloadWoff.push(new Promise((resolve, reject) => {
                    requestNative(woffItem).pipe(fs.createWriteStream(localtion + woffItemInfo.name + woffItemInfo.ext)).on('close', (err) => {
                        if (err) {
                            reject(err);
                        } else {
                            resolve(localtion + woffItemInfo.name + woffItemInfo.ext);
                        }
                    })
                }));
            })
            return Promise.all(downloadWoff);
        })
        .then(woffFilePath => {
            console.log(woffFilePath.toString() + " downloaded.");
            //write main css
            let cssNameReg = /font-family\s*:\s*['"](\w+\s*\w*)['"]/gi;
            let cssName = cssNameReg.exec(rst.frontCss)[1] //| "fontMain";
            cssName = cssName.replace(/\s/g, '') + ".css";
            return new Promise((resolve, reject) => {
                fs.writeFile(localtion + cssName, rst.frontCss, (errMainFile) => {
                    if (errMainFile) {
                        reject(errMainFile);
                    } else {
                        resolve(localtion + cssName);
                    }
                })
            })
        })
        .then(mainFilePath => {
            console.log(mainFilePath.toString() + " created.");
            shell.showItemInFolder(mainFilePath);
        })
        .catch((err) => {
            console.error(err);
        })
})


/* utils partial*/