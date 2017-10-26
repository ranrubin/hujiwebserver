var url = require("url");
Route = require('route-parser');
var npCookie = require('cookie');
var myHTTPserver = require('./hujiwebserver');

// a list of matching commands that match to the path.
// var matchingCommands = [];
//
// module.exports.MatchCommands = matchingCommands;

/**
 * the request object.
 * @param rawString the http request without the body.
 * @param commands list of commands.
 * @constructor
 */
module.exports.ReqObj = function (rawString, commands) {
    this.matchingCommands = [];
    this.body = null;
    // lines list of the http request.
    var lines = rawString.split(/\r?\n/);
    // list of the parts of the initial line.
    var initialLine = lines[0].split(" ");

    // check if the method is a supported method.
    if (initialLine[0] == 'GET' || initialLine[0] == 'POST' ||initialLine[0] == 'PUT' ||
        initialLine[0] == 'DELETE' || initialLine[0] == 'OPTIONS' || initialLine[0] == 'TRACE HTTP' ) {
        this.method = initialLine[0];
    }
    else {
        throw "Unsupported Method"
    }


    // the protocol of the request.
    this.protocol = initialLine[2].split("/")[0];
    // the version of the request.
    this.version = initialLine[2].split("/")[1];
    // the url of the request.
    var reqUrl = initialLine[1];
    // a url obj that created from the url string.
    var urlObj = url.parse(reqUrl, true);
    // the path of the url.
    this.path = urlObj.pathname;
    // the query of the url.
    this.query = urlObj.query;
    //the headers of the request that created by the calling function.
    var headers = buildHeaders(lines);
    // the host header value.
    if (typeof  headers["host"] == "undefined") {
        this.host = "undefined";
    }
    else{
        this.host = headers["host"].split(":")[0];

    }

    /**
     * the function returns the value of a given header.
     * @param header
     * @returns {*}
     */
    this.get = function (header) {
        return headers[header.toLowerCase()];
    };

    // creating a cookie obj if there is a header of cookie.
    if (typeof this.get("Cookie") != "undefined")
    {
        this.cookies = npCookie.parse(this.get("Cookie"));
    }
    // list of params.
    this.params = {};
    var splitCommand, splitPath = this.path.split("/");

    if (typeof commands != "undefined") {
        // run over the commands array and search for matching commands.
        for (var i = 0; i < commands.length; i++) {
            // split the cur command.
            splitCommand = commands[i].command.split("/");
            if (commands[i].command == "/")
            {
                splitCommand = [""];
            }

            var match = true;
            // run over the command and check if it fix to the path.
            for (var j = 0; j < splitCommand.length; j++) {
                if (splitCommand[j].indexOf(":") == 0) {
                    continue;
                }
                // there is no matching.
                if (splitCommand[j] != splitPath[j]) {
                    match = false;
                    break;
                }
            }
            if (match) {
                var tempPath = "";
                for (var k = 0; k < splitCommand.length; k++) {
                    tempPath += "/" + splitPath[k];
                }

                if (tempPath.indexOf("//") == 0)
                {
                    tempPath = tempPath.substring(1);
                }
                // create the matching between the key in the command to the value in the path.
                var route = new Route(commands[i].command);
                var tempParm = route.match(tempPath);
                for (var key in tempParm) {
                    this.params[key] = tempParm[key];
                }
                // add the command to the matching commands list.
                this.matchingCommands.push(commands[i]);
            }
        }
    }


    /**
     * the function returns the value of the given key.
     * first by looking at params list, and than looking at query list.
     * @param key
     * @param defaultValue - the function returns it if we didn't find the key.
     * @returns {*}
     */
    this.param = function (key, defaultValue) {
        if (typeof this.params[key] != "undefined"){
            return this.params[key];
        }
        if (typeof this.query[key] != "undefined"){
            return this.query[key];
        }
        return defaultValue;
    };

    /**
     * the function returns if the content type is matching to the given type.
     * @param type
     * @returns {boolean}
     */
    this.is = function (type) {
        var contentType = this.get("Content-Type");
        if (typeof contentType == "undefined")
        {return false;}
        return contentType.indexOf(type) > -1;
    }


};

/**
 * the function build the headers.
 * @param lines - lines of the http request.
 * @returns {Array}
 */
function buildHeaders(lines) {
    var heads = {};
    var key,value;
    // running over the lines from line 2.
    for (var i = 1; i < lines.length; i++){
        // we got to the end of the headers.
        if (lines[i] == ""){
            break
        }
        // split the line by ":" to get the header key and value.
        key = lines[i].substring(0, lines[i].indexOf(":")).trim().toLowerCase();
        value = lines[i].substring(lines[i].indexOf(":") + 1).trim();
        heads[key] = value;
    }
    return heads;
}
