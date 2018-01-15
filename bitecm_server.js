/* jshint esversion:6 */

var express = require('express');
var cors = require('cors');
var app = express();
var bodyParser = require('body-parser');
var path = require('path');
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var port = process.env.PORT || 3000;

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
app.post('/api/schedule/check_porting_status', function (req, res) {
  var response;
  var payload = {};

  if (req.body.dni != undefined && req.body.isdn != undefined) {
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

  if ( req.body.product_id != undefined &&
       req.body.category_name != undefined &&
       req.body.brand_name != undefined &&
       req.body.product_model != undefined &&
       req.body.product_priority != undefined &&
       req.body.updated_at != undefined &&
       req.body.publish_at != undefined &&
       req.body.active != undefined
     ) {

    payload = req.body;
    io.emit('order completed', payload);

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
