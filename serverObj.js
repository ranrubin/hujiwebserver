var net = require('net');
var parseRequest = require('./parseRequest');
/**
 * a server obj that creates a server and create a request obj from the data
 * the server gets, and callback to the dataCallback function after the request object was made.
 * @param port
 * @param dataCallback
 * @constructor
 */
module.exports.ServerObj = function (port, dataCallback, commands) {
    var emptyLine = /\r?\n\r?\n/;
    // creating the server and dealing with connection.
    var server = net.createServer(function (socket) {
        // close the socket after 25 seconds if it didn't close before.
        socket.setTimeout(25000, function () {
            console.log("The request timed out");
            if (socket.writable) {
                socket.end("HTTP/1.1 408 Request Time-out");
            }
        });
        // the request data that we receive.
        var receivedData = "";
        // request obj.
        var req;
        if (socket.writable) {
            // get c ahunk of data for the request.
            socket.on('data', function (chunk) {
                receivedData += chunk.toString();

                //if we have an empty line we have reached the end or
                // the body part
                if (emptyLine.test(receivedData)) {
                    try {
                        // to ensure that we create the req obj only once.
                        if (!req) {
                            req = new parseRequest.ReqObj(receivedData, commands);
                        }
                        var bodySize = req.get("Content-Length");
                        // means that there is a body to the request.
                        if (typeof bodySize != "undefined") {
                            var index = receivedData.search(emptyLine);
                            receivedData = receivedData.replace(emptyLine, " ");
                            var body = receivedData.substring(index + 1);
                            // we reached to the end of the body.
                            if (body.length >= bodySize) {
                                req.body = body;
                                // calling the callback function with the request obj.
                                dataCallback(socket, req);
                            }
                        }
                        else {
                            // calling the callback function with the request obj.
                            dataCallback(socket, req);
                        }

                    }
                    catch (error) {
                        console.log("Error while building request." + error);
                        if (socket.writable) {
                            socket.end("HTTP/1.1 500 Internal Server Error");
                        }
                    }
                }
            });
        }

    });

    // listen to the server.
    try {
        server.listen(port, function () {
            console.log("Listening to port " + port);
        });
    }
    catch (e)
    {
        console.log("An error occurred while trying to listen to port " +
            this.port.toString() + ". Error: " + e);
    }

    /**
     *the function closes the server.
     */
    this.stop = function () {
        server.close(function () {
            console.log("The server has been closed");
        });
    };
    // the port of the
    this.port = port;
};