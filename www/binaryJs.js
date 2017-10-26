
var xmlHttp;
var pressed;
var buttonsWasPressed = false;


document.getElementById('oneButton').onclick = function () {
    pressed = 1;
    createXmlHttpRequestObject('/gamble/1', "POST");
};

document.getElementById('zeroButton').onclick = function () {
    pressed = 0;
    createXmlHttpRequestObject('/gamble/0', "POST");
};

document.getElementById('resetBut').onclick = function () {
    pressed = 2;
    createXmlHttpRequestObject('/gamble/reset', "DELETE");
};

/**
 * creating a XMLhttpRequest and calling to the function that handles the respons
 * @param url - the command we use to handle
 * @param method - the correct method
 * @returns {boolean} -
 */
function createXmlHttpRequestObject(url, method){
    if (window.ActiveXObject){
        try{
            xmlHttp = new ActiveXObject("Microsoft.XMLHTTP");
        }
        catch (e){
            xmlHttp = false;
        }
    }
    else{
        try{
            xmlHttp = new XMLHttpRequest();
        }
        catch (e){
            xmlHttp = false;
        }
    }
    if (!xmlHttp){
        alert("Error creating the xmlHttp object");
        return false;
    }
    xmlHttp.open(method, url, true);
    xmlHttp.onreadystatechange = handleServerResponse;
    xmlHttp.send(null);
}

/**
 * handles the server response
 */
function handleServerResponse() {
    if (xmlHttp.readyState === XMLHttpRequest.DONE){
        if (xmlHttp.status == 200){
            var textResponse = xmlHttp.responseText;
            displayResult(handleResponse(textResponse));

        }
        else{
            alert("Something went wrong!")
        }
    }
}

/**
 * creating the object out of the response
 * @param res - response as a string
 * @returns {{zeros: number, ones: number}}
 */
function handleResponse(res) {

    return {
        "zeros" : Number(res.substring(res.indexOf(":") + 1, res.indexOf(","))),
        "ones" : Number(res.substring(res.lastIndexOf(":") + 1, res.indexOf("}")))
    }

}

/**
 * displaying the result to screen and making the buttons disappear
 * @param response
 */
function displayResult(response) {
    if(!buttonsWasPressed){
        document.getElementById('buttonsDiv').removeChild(document.getElementById('oneButton'));
        document.getElementById('buttonsDiv').removeChild(document.getElementById('zeroButton'));
        buttonsWasPressed = true;
    }
    if(pressed == 1 || pressed == 0){
        var chosenLess;
        var resultText;
        if(response.zeros < response.ones)chosenLess = 0;
        else if(response.zeros > response.ones)chosenLess = 1;
        else chosenLess = 2;
        if(chosenLess == 2){
            resultText = "A TIE";
        }
        else if(chosenLess == pressed){
            resultText = "YOU WON";
        }
        else{
            resultText = "YOU LOOSE";
        }
        var textForNode1 = "THE RESULT WAS:" + resultText + ".\n";
        var text1 = document.createTextNode(textForNode1);
        var textForNode2 = "ONES:" + response.ones.toString() +
            ", ZERO:" + response.zeros.toString();
        var text2 = document.createTextNode(textForNode2);
        document.getElementById('buttonsDiv').appendChild(text1);
        document.getElementById('buttonsDiv').appendChild(text2);
    }


}