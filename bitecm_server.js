/* jshint esversion:6 */

var express = require('express');
var cors = require('cors');
var app = express();
var bodyParser = require('body-parser');
var path = require('path');
var fs = require('fs');
var https = require('https');

var privateKey  = fs.readFileSync('/u01/app/notific/ssl/bitel.com.pe.key', 'utf8');
var certificate = fs.readFileSync('/u01/app/notific/ssl/bitel.com.pe.crt', 'utf8');
const credentials = {key: privateKey, cert: certificate};
var server = https.createServer(credentials, app);

var io = require('socket.io')(server);
var port = process.env.PORT || 8000;

var worker = require('./bitecm_worker');

//CORS
var allowedOrigins = [ ];
var corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (!allowedOrigins.length || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'), false);
    }
  }
};

app.use(cors(corsOptions));

//BODY PARSING
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));


//FILE ROUTING
app.use(express.static(path.join(__dirname, 'public')));

//ROUTING
app.post('/api/schedule/check_porting_status/:order_id', function (req, res) {
  var response;
  var payload = {};
  if (req.body.dni != undefined && req.body.isdn != undefined) {
    payload.order_id = req.params.order_id;
    payload.dni = req.body.dni;
    payload.isdn = req.body.isdn;
    worker.push(payload, function (err) {
      if (err) console.error('Error pushing work into the queue', err.stack);
      else console.log('Work pushed into te queue: %o', payload);
    });
    response = { status: true };
  } else {
    response = { status: false };
  }
  res.json(response);
});

app.post('/api/notify/order_complete', function (req, res) {
  var response;
  var payload = {};
  if (req.body.order_id != undefined) {
    payload = req.body;
    io.emit('order completed', payload);
    response = { status: true };
  } else {
    response = { status: false };
  }
  res.json(response);
});

app.post('/api/schedule/test/:param', function (req, res) {
  var response;
  var payload = {};
  if (req.body.dni != undefined && req.body.isdn != undefined) {
    payload.order_id = req.params.param;
    payload.dni = req.body.dni;
    payload.isdn = req.body.isdn;
    worker.push(payload, function (err) {
      if (err) console.error('Error pushing work into the queue', err.stack);
      else console.log('Work pushed into te queue: %o', payload);
    });
    response = { status: true };
  } else {
    response = { status: false };
  }
  res.json(response);
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

worker.on('error', function (err) {
  console.error(err.stack);
});


//SERVER
server.listen(port, "0.0.0.0", function () {
  console.log('Server listening at port %d', port);
});


//SOCKET
var connectedClients = 0;

io.on('connection', function (socket) {
  var connection = false;

  socket.on('add order', function (data) {
    socket.broadcast.emit('new order', {
      username: socket.client.username,
      message: data
    });
  });

  //CONNECT
  socket.on('connect_host', function (client) {
    socket.client.username = client;
    ++connectedClients;
    connection = true;
    socket.emit('connected', {
      client: socket.client.username,
      connectedClients: connectedClients
    });

    socket.broadcast.emit('client connected', {
      client: socket.client.username,
      connectedClients: connectedClients
    });
  });

  //DISCONNECT
  socket.on('disconnect_host', function () {
    if (connectedClients) {
      --connectedClients;
      socket.broadcast.emit('client disconnected', {
        client: socket.client.username,
        connectedClients: connectedClients
      });
    }
  });
});
