import express from 'express';
import http from 'http';
import socketIO from 'socket.io';
import path from 'path';
import ejs from 'ejs';

const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
  serveClient: false,
  pingInterval: 10000,
  pingTimeout: 5000,
  cookie: false,
});
app.use(express.urlencoded());
app.use(express.json());
app.set('view engine', 'ejs');
app.engine('ejs', ejs.__express);

var mysql = require('mysql');
var pool = mysql.createPool({
  connectionLimit: 10,
  host: 'localhost',
  user: 'admin',
  password: 'adminpassword',
  database: 'chatchat'
});

pool.getConnection(function (err, connection) {
  if (err) throw err;
  var sql = `CREATE TABLE if not exists users (
    id INT NOT NULL AUTO_INCREMENT,
    name VARCHAR(255),
    primary key (id)
    )`;
  connection.query(sql, function (err, result) {
    if (err) throw err;
    console.log('USER Table created');
  });
  connection.release();
});

app.get('/', function (req, res) {
  res.render('login');
});

app.post('/login', function (req, res) {

  const { body } = req;
  const { username } = body;

  pool.getConnection(function (err, connection) {
    if (err) throw err;
    var sql = `INSERT INTO users (name) VALUES ('${username}')`;
    connection.query(sql, function (err, result) {
      if (err) throw err;
      console.log('user is inserted');
    });
    connection.release();
  });

  res.render('chat', {
    username: username
  });
});

io.on('connection', function (socket) {
  console.log('user connected: ', socket.id);

  socket.on('disconnect', function () {
    console.log('user disconnected: ', socket.id);
  });

  socket.on('join', function (room) {
    socket.join(room);
  });

  socket.on('send broadcast message', function (username, text) {
    var msg = `${username} : ${text}`;
    io.emit('receive message', msg);
  });
  socket.on('send room message', function (username, text, receiver) {
    var msg = `${username} : ${text}`;
    io.to(username).to(receiver).emit('receive room message', msg, room);
  });
});

server.listen(3000, function () {
  console.log('server on!');
});