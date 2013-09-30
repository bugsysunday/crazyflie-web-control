var Aerogel = require('aerogel');
var driver = new Aerogel.CrazyDriver();
var copter = new Aerogel.Copter(driver);


var express = require('express')
var app = express();
var server = require('http').createServer(app)
var io = require('socket.io').listen(server, {
  log: false
});

app.set('views', __dirname + '/views')
app.set('view engine', 'jade')
app.use(express.static(__dirname + '/public'))
server.listen(3000);
console.log('app listeneing')

app.get('/', function(req, res) {
  res.render('home')
  start()
});
app.get('/graph', function(req, res) {
  res.render('graph')
});


var gSocket;
io.sockets.on('connection', function(socket) {
  console.log('socke connected')
  // socket.on("click", click)
  gSocket = socket
});


function start() {
  driver.findCopters().then(function(copters) {
    return copters[0];
  }).then(function(uri) {
    return copter.connect(uri);
  }).then(function() {
    console.log('copter is ready')
    sendLogs();
    return
  }).fail(function(err) {
    console.log(err);
    copter.shutdown();
  })
    .done();
}

function sendLogs() {
  setInterval(function() {
    if (gSocket) {
      gSocket.emit("telem", copter.telemetry)
    }
    console.log(copter.telemetry)

  }, 100)
}