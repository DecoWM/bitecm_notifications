/* jshint esversion:6 */

var express = require('express');
var cors = require('cors');
var app = express();
var path = require('path');
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var port = process.env.PORT || 3000;

var worker = require('./bitecm_worker');

//CORS
var allowedOrigins = [ 'http://localhost:3000', 'http://bitel.com.pe' ];
var corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'), false);
    }
  }
};

app.use(cors(corsOptions));

//FILE ROUTING
app.use(express.static(path.join(__dirname, 'public')));

//ROUTING
app.get('/queue', function (req, res) {
  var payload = {
    orderId: '0001'
  };
  worker.push(payload, function (err) {
    if (err) console.error('Error pushing work into the queue', err.stack);
    console.log('Work pushed into te queue: %o', payload);
    io.emit('new order', { msg: 'Orden registrada'});
  });
  res.status(201).end();
});

app.post('/queue', function (req, res) {
  res.status(201).end();
});




//404
app.use(function(req, res, next) {
  var response = { msg: 'Route not found.' };
  res.status(404).json(response);
});


//ERROR HANDLING
app.use(function(err, req, res, next) {
  console.error(err.stack);
  var response = { msg: 'There was an error.' };
  res.status(500).json(response);
});


//SERVER
server.listen(port, function () {
  console.log('Server listening at port %d', port);
});


//SOCKET
var connectedClients = 0;

io.on('connection', function (socket) {
  var connection = false;

  socket.on('add order', function (data) {
    socket.broadcast.emit('new order', {
      username: socket.username,
      message: data
    });
  });

  //CONNECT
  socket.on('connect', function (client) {
    if (connection) return;

    socket.client = client;
    ++connectedClients;
    connection = true;
    socket.emit('connected', {
      connectedClients: connectedClients
    });

    socket.broadcast.emit('client connected', {
      client: socket.client,
      connectedClients: connectedClients
    });
  });

  //DISCONNECT
  socket.on('disconnect', function () {
    if (connectedClients) {
      --connectedClients;
      socket.broadcast.emit('client disconnected', {
        client: socket.client,
        connectedClients: connectedClients
      });
    }
  });
});
