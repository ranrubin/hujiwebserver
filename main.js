/**
 * the main file that creates the server and ready to respond to /www/binary.html
 */

const fs = require('fs');
var myHTTPserver = require('./hujiwebserver');
myHTTPserver.start(8081);

var gambling = {
    "zeros" : 0,
    "ones" : 0
};

myHTTPserver.use("/gamble/0", zeroHandler);
function zeroHandler(req, res, next) {
    res.status(200);
    res.json(gambling);
    gambling.zeros++;
}

myHTTPserver.use("/gamble/1", oneHandler);
function oneHandler(req, res, next) {
    res.status(200);
    res.json(gambling);
    gambling.ones++;
}

myHTTPserver.use("/gamble/reset", resetHandler);
function resetHandler(req, res, next) {
    gambling.zeros = 0;
    gambling.ones = 0;
    res.status(200);
    res.json(gambling);
}

/**
 *
 */



/**
 * Uploading the main page
 */

myHTTPserver.use("/www/:file", generateGame);

function generateGame(req, res, next) {
    var fileTypes =
        {
            html: 'text/html',
            css: 'text/css',
            js: 'text/javascript'
        };

    var fileName = req.params["file"];

    if (fileName === "binary.html" || fileName === "style.css" ||
        fileName === "binaryJs.js") {


        var ending = fileName.substring(fileName.lastIndexOf(".") + 1);
        if (ending != "js" && ending != "html" && ending != "css") {
            res.status(400);
            res.send();
        }
        else {
            var fullPath = process.cwd() + "/www/" + fileName;
            if (!fs.existsSync(fullPath)) {
                res.status(404);
                res.send();
            }
            else {
                fs.readFile(fullPath, function (err, data) {
                    if (err) {
                        res.status(400);
                        res.send();
                    }
                    else {
                        res.status(200);
                        res.set("Content-Type", fileTypes[ending]);
                        res.send(data.toString());
                    }
                })
            }
        }
    }
}

