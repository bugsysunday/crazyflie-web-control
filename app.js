var Aerogel = require('./index');

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
app.get('/', function(req, res) {
  res.render('home')
});


var gSocket;
io.sockets.on('connection', function(socket) {
  console.log('conn')
  socket.on("click", click)
  socket.on("move_to", setPos)
  socket.on("thrust_target", setThrust)
  gSocket = socket
});

function setPos(data) {
  if (copter_state.ready) {
    copter_state.roll_target = data.roll
    copter_state.pitch_target = data.pitch
  }
}

function click(data) {
  if (data.cmd === "start") return start()
  if (data.cmd === "stop") return stopCopter()
}


var throttle = 0;

function setThrust(data) {
  console.log('thrust')
  copter_state.thrust_target = data.thrust_target * 100
}



var copter_state = {
  roll_target: 0,
  pitch_target: 0,
  yaw_target: 0,
  thrust_target: 0
}:


// setInterval(function() {
//  // console.log(copter_state)
// }, 1000)

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
      copter_state.ready = true;
      console.log('Using copter at', uri);
      return copter.connect(uri);
    }).then(function() {
      flyAround()
      return
    }).fail(function(err) {
      console.log(err);
      copter.shutdown();
    })
      .done();
  }


  function flyAround() {
    copter_state.ready = true;
    console.log('copter is ready')
    orig = Date.now()
    quad_synch = setInterval(function() {
      copter.driver.setpoint(copter_state.roll_target, -copter_state.pitch_target, copter_state.yaw_target, copter_state.thrust_target)
    }, 1000)
  }



  function stopCopter() {
    copter.driver.setpoint(0, 0, 0, 0)
    copter.shutdown()
    console.log('copter shutdown')
    clearInterval(quad_synch)
  }

setInterval(function() {
  if (gSocket) gSocket.emit("telem", copter.telemetry.stabilizer)
  console.log(copter.telemetry.stabilizer)
}, 200)