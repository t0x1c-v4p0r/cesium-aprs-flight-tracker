// const JsonDB = require('node-json-db').JsonDB;
// const Config = require('node-json-db/dist/lib/JsonDBConfig').Config;

const express = require('express');
const { Server } = require("socket.io");
const app = express();

/*const webpack = require('webpack');
const config = require('../webpack.config.js');
const compiler = webpack(config);*/

var net = require('net');

// var flight_data_db = new JsonDB(new Config("flight_data", true, false, '/'));

var gnuradio_server = net.createServer();
//emitted when server closes ...not emitted until all connections closes.
gnuradio_server.on('close', function () {
  console.log('GNURadio server closed !');
});

// emitted when new client connects
gnuradio_server.on('connection', function (socket) {
  socket.setEncoding("utf8");
  var rport = socket.remotePort;
  var raddr = socket.remoteAddress;
  var rfamily = socket.remoteFamily;

  console.log('REMOTE Socket is listening at port' + rport);
  console.log('REMOTE Socket ip :' + raddr);
  console.log('REMOTE Socket is IP4/IP6 : ' + rfamily);

  console.log('--------------------------------------------')

  socket.on('data', function (new_flight_data) {
    // flight_data_db.push(Date.now().toString(),JSON.parse(new_flight_data),false);
    // flight_data_db.save();
    // TODO: Push data to webclients and database.
    var bread = socket.bytesRead;
    var bwrite = socket.bytesWritten;
    console.log('Bytes read : ' + bread);
    console.log('Bytes written : ' + bwrite);
    console.log('Data sent to server : ' + new_flight_data);

    var is_kernel_buffer_full = socket.write('Data ::' + new_flight_data);
    if (is_kernel_buffer_full) {
      console.log('Data was flushed successfully from kernel buffer i.e written successfully!');
    } else {
      socket.pause();
    }


  });

  socket.on('drain', function () {
    console.log('write buffer is empty now .. u can resume the writable stream');
    socket.resume();
  });

  socket.on('error', function (error) {
    console.log('Error : ' + error);
  });

  socket.on('timeout', function () {
    console.log('Socket timed out !');
    socket.end('Timed out!');
    // can call socket.destroy() here too.
  });

  socket.on('end', function (data) {
    console.log('Socket ended from other end!');
    console.log('End data : ' + data);
  });

  socket.on('close', function (error) {
    var bread = socket.bytesRead;
    var bwrite = socket.bytesWritten;
    console.log('Bytes read : ' + bread);
    console.log('Bytes written : ' + bwrite);
    console.log('Socket closed!');
    if (error) {
      console.log('Socket was closed coz of transmission error');
    }
  });

  setTimeout(function () {
    var isdestroyed = socket.destroyed;
    console.log('Socket destroyed:' + isdestroyed);
    socket.destroy();
  }, 1200000);

}); // end of gnuradio_server on connection

// emits when any error occurs -> calls closed event immediately after this.
gnuradio_server.on('error', function (error) {
  console.log('Error: ' + error);
});

//emits when server is bound with server.listen
gnuradio_server.on('listening', function () {
  console.log('Server is listening!');
});

gnuradio_server.maxConnections = 1;

//static port allocation
gnuradio_server.listen(3000, '127.0.0.1');

var islistening = gnuradio_server.listening;

if (islistening) {
  console.log('Server is listening');
} else {
  console.log('Server is not listening');
}


// Tell express to use the webpack-dev-middleware and use the webpack.config.js
// configuration file as a base.
/*app.use(
  webpackDevMiddleware(compiler)
);*/
app.use(require('morgan')('dev'));
app.use(express.static('dist'))

// Serve the files on port 8000.
let server = app.listen(8000, function () {
  console.log('Cesium flight tracker app listening on port 8000!\n');
});

const io = new Server(server);


io.on('connection', (socket) => {
  console.log('connection')
})

setInterval(() => {
  io.emit('message', 'message')
}, 1000)

