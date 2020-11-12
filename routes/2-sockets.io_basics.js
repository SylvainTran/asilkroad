const express = require('express');
// We require path to use it to join urls
const path = require('path');
// We call express and assign it to app
let app = express();
// We define a static folder that will be served (public) assets that won't require to change (e.g., css, js, images)
app.use('/public', express.static(path.join(__dirname, "../public")));
// Create the HTTP server with the express app
let http = require('http').createServer(app);
// sockets.io returns a function to which we pass http to
let io = require('socket.io').listen(http);

//console.log(io);

// Serve index from public views using an absolute path with the path
//(req, res) => {
//    res.sendFile("Lobby.html", { root: path.join(__dirname, '../public/') });
//});

let getHandler = function(req,res) {
    res.sendFile("Lobby.html", { root: path.join(__dirname, '../public/') });
    console.log(" req: " + req + req.url);
}
app.get('/', getHandler); 

// on connection event handler, receive a socket as arg
let connectionEvent = function(socket) {
    console.log('user connected');
    // Attach a listener to that socket client, so when a connected socket emits a chat message event, they the server will emit the event + the msg
    socket.on('chat message', function(msg) {
        console.log('a user sent a message');
        io.emit("chat message", msg);
    });
}

// from server side... (look at terminal, not console in browser) we can listen to connections attached to io
io.on('connection', connectionEvent);

// Listen on port 3000 for socket events
http.listen(3000, () => {
    console.log('listening on *:3000');
});