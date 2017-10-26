
//hujiwebserver.js:

const route = require('route-parser');
var serverObj = require("./serverObj");
var responseHandler = require("./responseHandler");
var parseRequest = require("./parseRequest");


module.exports = {
    // an array that contains objects that contain command and middleware function
    // that represent the connection between them.
    commands:[],
    /**
     * the function insert command and a middleware function to the commands array.
     * @param c the command.
     * @param mw the middleware.
     * @returns {exports}
     */
    use: function(c,mw){
        // if only 1 argument the command is "/".
        if (arguments.length == 1)
        {
            this.commands.push({
                command : "/",
                middleware : c
            });
        }
        else {
            this.commands.push({
                command: c,
                middleware: mw
            });
        }

        return this;
    },
    /**
     * the function start a server object and return the server.
     * @param port the port of the server.
     * @param c a callback function.
     * @returns server.
     */
    start : function(port,c){
        var error;
        var server;
        try {
            server = new serverObj.ServerObj(port, dataCallback, this.commands);
            if (arguments.length > 1) {
                c();
            }
        }

        catch (exception)
        {
            error = exception;
            console.log("Error while opening server. Error: " + error);
            // call the call back function if an error occurred.
            if (arguments.length > 1) {
                c(error);
            }
        }
        return server;
        }
    };

// represent the index of the current command while searching for the matching commands.
var cmdIdx = 0;

/**
 * the function creates the response after the request object was build,
 * and calls the middleware functions..
 * @param socket
 * @param reqObj
 */
function dataCallback(socket, reqObj) {

    // the matching commands to the current path of the request.
    var matchingCommands = reqObj.matchingCommands;
    try {
        // create the response obj.
        var res = new responseHandler.Response(reqObj.version, socket);
    }
    catch (e){
        socket.end("HTTP/1.1 500 Internal Server Error");
        console.log("Error building response. Error: " + e)
    }
    // try to call the middleware function.
    try {
        // close the socket after 10 seconds if it wasn't close before.
        setTimeout(function () {
            if (socket.writable) {
                res.status(404);
                res.send();
                console.log("socket has been closed due to timeout")
            }
        }, 10000);
        if (reqObj.host != "undefined") {
            // if there is no matching commands.
            if (typeof matchingCommands == "undefined" || matchingCommands.length == 0) {
                res.status(404);
                res.send();
                console.log("Unmatched commands")
            }
            // only 1 matching command so only 1 middleware function.
            else if (matchingCommands.length == 1) {
                matchingCommands[0].middleware(reqObj, res)
            }
            else {
                matchingCommands[0].middleware(reqObj, res, callNext)
            }
        }
        else{
            //HTTP 1.1 requests must include the Host: header.
            res.status(400);
            res.send("HTTP 1.1 requests must include the Host: header.");
        }

        /**
         * the function calls the next middleware function.
         */
        function callNext() {
            cmdIdx++;
            if (cmdIdx < matchingCommands.length) {
               matchingCommands[cmdIdx].middleware(reqObj, res, callNext)
            }
        }
    }
    catch (err)
    {
        console.log("Error while operating middleware. Error: " + err);
        if (socket.writable) {
            res.status(400);
            res.send();
        }
    }
}


