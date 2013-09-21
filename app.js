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


  // flyUp(5000)
});

var quad_stats = {
  actual_throttle: 0,
  set_throttle: 0,
  target_throttle: 0,
  actual_pitch: 0,
  set_pitch: 0,
  target_pitch: 0
};


function flyUp(ms) {
  var start = Date.now();
  quad_stats.target_throttle = 30000;
  var step = (quad_stats.target_throttle - quad_stats.set_throttle) / ms;
  var set_val = 0;
  doThisFor(function() {
    var diff = Date.now() - start
    set_val = quad_stats.set_throttle + step * diff
    console.log('value value at time', set_val, diff)
    copter.driver.setpoint(0, 0, 0, Math.floor(set_val))
  }, ms, function() {
    quad_stats.set_throttle = quad_stats.target_throttle;
    console.log('Done Flying up at ', Date.now() - start)
    land(500)

  })
}

function land(ms) {
  var start = Date.now();
  quad_stats.target_throttle = 0;
  var set_val = 0;
  doThisFor(function() {
    set_val = (quad_stats.target_throttle - quad_stats.set_throttle) / 2

    if (set_val > 0) {
      console.log('value value at time', set_val, Date.now() - start)
      copter.driver.setpoint(0, 0, 0, Math.floor(set_val))
      quad_stats.set_throttle = Math.floor(set_val)
    }


  }, ms, function() {
    quad_stats.set_throttle = quad_stats.target_throttle;
    console.log('Done Flying up at ', Date.now() - start)
  })
}

function pitchRight(ms) {
  var start = Date.now();
  quad_stats.target_pitch = 45;
  var step = (quad_stats.target_pitch - quad_stats.set_pitch) / ms;
  var set_val = 0;
  doThisFor(function() {
    set_val = quad_stats.set_pitch + step * (Date.now() - start)
    console.log('value value at time', set_val, Date.now() - start)
    copter.driver.setpoint(0, Math.floor(set_val), 0, quad_stats.set_throttle)
  }, ms, function() {
    quad_stats.set_pitch = quad_stats.target_pitch;
    pitchLeft(1000)
    console.log('Done Flying up at ', Date.now() - start)
  })
}

function pitchLeft(ms) {
  var start = Date.now();
  quad_stats.target_pitch = -45;
  var step = (quad_stats.target_pitch - quad_stats.set_pitch) / ms;
  var set_val = 0;
  doThisFor(function() {
    set_val = quad_stats.set_pitch + step * (Date.now() - start)
    console.log('value value at time', set_val, Date.now() - start)
    copter.driver.setpoint(0, Math.floor(set_val), 0, quad_stats.set_throttle)
  }, ms, function() {
    quad_stats.set_pitch = quad_stats.target_pitch;
    land(500)
    console.log('Done Flying up at ', Date.now() - start)
  })
}

function hover(time) {
  doThisFor(hover_state, 500, function() {
    land(500)
    console.log('done hovering at ', Date.now())
  })
}

function hover_state() {
  return copter.driver.setpoint(0, 0, 0, 40000)
}

function doThisFor(cb, ms, done) {
  var start = Date.now();
  var my_interval = setInterval(cb, 200)
  setTimeout(function() {
    clearInterval(my_interval)
    done();
    console.log("completion lag of ", (Date.now() - start) - ms)
  }, ms + 10)
}



// function land() {
//   var interval()
// }

var gSocket;
io.sockets.on('connection', function(socket) {
  console.log('socke connected')
  socket.on("click", click)
  gSocket = socket
});

function click(data) {
  if (data.cmd === "start") return start()
  if (data.cmd === "stop") return stopCopter()
}
start()

function start() {
  driver.findCopters().then(function(copters) {
    if (copters.length === 0) {
      console.error('No copters found! Is your copter turned on?');
      // process.exit(1);
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
    sendLogs();
    return
  }).fail(function(err) {
    console.log(err);
    copter.shutdown();
  })
    .done();
}
//////

// new

var tb = require('toobusy')

  function sendLogs() {
    setInterval(function() {
      if (gSocket) {
        gSocket.emit("telem", copter.telemetry)
      }
      // console.log(copter.telemetry)
      console.log('node lag is ', tb.lag())
      console.log('node lag is ',copter.telemetry.acc)

    }, 200)
  }