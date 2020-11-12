let express = require('express');
const host = "http://localhost:";
const portNumber = 4200;
let app = express();

// Sockets
let httpServer = require('http').createServer(app);
let io = require('socket.io').listen(httpServer);

io.on("connection", function(socket) {
    console.log("New silkroadian on the map.");
});

httpServer.listen(portNumber, function() {
    console.log("Listening to port: " + portNumber);
});

// Express example
// app.listen(portNumber, function() {
//     console.log("Server is running on port "+ portNumber);
// });

app.get('/', requestHandler);
function requestHandler(request,response){
    // send a default response to the client...
    response.send("HELLO WORLD");
    console.log(request.url);
}
app.get('/silkroad', requestHandlerTest);

function requestHandlerTest(request, response){
    response.sendFile(__dirname + '/public/Silkroad.html');
    console.log(request.url);    
}

app.get('/merchantUnion',requestHandlerMerchantUnion);
 
function requestHandlerMerchantUnion(req, res) {
    console.log(req.url);
    console.log(req.query);
    res.sendFile(__dirname + '/public/MerchantUnion.html');
}

// Must be called only after the get middlewares
app.use(express.static(__dirname + '/public'));
// app.use(express.static(__dirname + '/node_modules'));