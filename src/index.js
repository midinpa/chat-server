import express from 'express';
import http from 'http';
import socketIO from 'socket.io';
import path from 'path';

const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
  serveClient: false,
  pingInterval: 10000,
  pingTimeout: 5000,
  cookie: false,
});

app.get('/', function (req, res) {
  res.sendFile(path.resolve(__dirname, '../client.html'));
});
app.use(express.static('node_modules'));

var count = 1;
io.on('connection', function (socket) {
  console.log('user connected: ', socket.id);
  var name = "user" + count++;
  io.to(socket.id).emit('change name', name);

  socket.on('disconnect', function () {
    console.log('user disconnected: ', socket.id);
  });

  socket.on('send message', function (name, text) {
    var msg = name + ' : ' + text;
    console.log(msg);
    io.emit('receive message', msg);
  });
});

server.listen(3000, function () {
  console.log('server on!');
});