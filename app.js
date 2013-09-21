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
  console.log('home sent')
});


var gSocket;
io.sockets.on('connection', function(socket) {
  console.log('socke connected')
  socket.on("click", click)
});

function click(data) {
  if (data.cmd === "start") return start()
  if (data.cmd === "stop") return stopCopter()
}

function start() {
  driver.findCopters().then(function(copters) {
    if (copters.length === 0) {
      console.error('No copters found! Is your copter turned on?');
      process.exit(1);
    }
    if (copters.length === 1)
      return copters[0];
    if (optimist.argv.hasOwnProperty('c')) {
      var patt = new RegExp('\/' + channel + '\/');
      for (var i = 0; i < copters.length; i++) {
        if (patt.test(copters[i]))
          return copters[i];
      }
    }
    return copters[0];
  }).then(function(uri) {
    return copter.connect(uri);
  }).then(function() {
    console.log('copter is ready')

    return
  }).fail(function(err) {
    console.log(err);
    copter.shutdown();
  })
    .done();
}
//////

// new