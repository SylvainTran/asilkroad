let app = require('express')();
let http = require('http').createServer(app);

// Check out what req and res are in docs.
// we're essentially creating a route here with the character '/' to point from the root
// of the app.
// Then we use res.send('html element here') to send an html element from the server to the client
// This is called "serving"
// app.get('/', (req, res) => {
//   res.send('<h1>Hello world</h1>');
// });
// The http server will listen to the app on port 3000.
http.listen(3000, () => {
  console.log('listening on *:3000');
});

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});