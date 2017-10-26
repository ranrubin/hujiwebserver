var npCookie = require('cookie');

/**
 * a response object.
 * @param version of the request obj.
 * @param socket - client's socket
 * @constructor
 */
module.exports.Response = function (version, socket) {

    this.socket = socket;
    // list of headers.
    var headers = [];
    //the response status
    var resStatus = 200;
    
    this.status = function (code) {
        if (!isNaN(code)){
        resStatus = Number(code);
        }
        else{
            throw "Status code can only be a number"
        }
        return this;
    };

    this.get = function (field) {
        return headers[field];
    };

    this.cookieVal = "";
    this.cookie = function (name, value) {
        this.cookieVal +=  npCookie.serialize(name, value) + "; ";
    };

    //sends data to client
    this.send = function (body) {

        //if an object was sent
        if (typeof body == 'object' && body != null)
        {
            this.json(body);
        }
        else {
            try {
                var initLine = "HTTP/" + version + " " + resStatus + " " + getCodeMsg(resStatus) + "\r\n";
                var hasCookie = false;
                var headLines = "";
                for (var key in headers) {
                    if (key == "Set-Cookie") {
                        hasCookie = true;
                        headers[key] += this.cookieVal;
                    }
                    headLines += key + ": " + headers[key] + "\r\n";
                }
                if (!hasCookie) {
                    headLines += "Set-Cookie: " + this.cookieVal + "\r\n";
                }

                //if there is no body
                if (typeof body == "undefined") {
                    headLines += "\r\n\r\n";
                    if (socket.writable) {
                        this.socket.end(initLine + headLines);
                    }
                }
                //has a body
                else {
                    if (!headers["Content-Length"]) {
                        this.set("Content-Length", body.length);
                        headLines += "Content-Length: " + body.length.toString() + "\r\n";
                    }
                    if (!headers["Content-Type"]) {
                        this.set("Content-Type", "text/html");
                        headLines += "Content-Type: text/html\r\n";
                    }
                    headLines += "\r\n";
                    if (socket.writable) {
                        this.socket.end(initLine + headLines + body);
                    }
                }
            }
            catch (e)
            {
                console.log("Error while writing to socket");
                if (socket.writable) {
                    this.status(500);
                    socket.end("HTTP/1.1 500 Internal Server Error");
                }
            }
        }

    };

    //handles a JSON incoming data
    this.json = function (body) {
        try{
            var js = JSON.stringify(body);
            this.set("Content-Type", "application/json");
            this.send(js);
        }
        catch (e)
        {
            console.log("Eroor while converting to JSON. Error: " + e);
            if (socket.writable) {
                this.status(400);
                this.send();
            }
        }

    };

    /**
     * the function sets the response’s HTTP header field to value.
     * @param field - The header name
     * @param value - the header's value
     */
    this.set = function (field, value) {
            if (typeof value == "undefined")
            {
                try {
                    for (var key in field) {
                        headers[key] = field[key];
                    }
                }
                catch (e) {
                    throw "Bad input to Set: " +e;
                }
            }
            else {
                headers[field] = value;
            }
    };
};

/**
 * the function gets a code and returns a code message.
 * @param code
 * @returns String message that matches the given code
 */
function getCodeMsg(code) {
    switch (code){
        case 200:
            return "OK";
        case 301:
            return "Moved Permanently";
        case 302:
            return "Moved Temporarily";
        case 303:
            return "See Other";
        case 400:
            return "Bad Request";
        case 404:
                return "Not Found";
        case 500:
            return "Server Error";
        default:
            return "Unmatched Code";
    }
}