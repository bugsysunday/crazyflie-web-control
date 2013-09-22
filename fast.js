var Aerogel = require('aerogel');
var driver = new Aerogel.CrazyDriver();
var copter = new Aerogel.Copter(driver);
var tb = require('toobusy')
var optimist = require('optimist')


  function start() {
    driver.findCopters().then(function(copters) {
      // console.log(copters)
      // if (copters.length === 0) {
      //   console.error('No copters found! Is your copter turned on?');
      //   // process.exit(1);
      // }
      // if (copters.length === 1)
      //   return copters[0];
      // if (optimist.argv.hasOwnProperty('c')) {
      //   var patt = new RegExp('\/' + channel + '\/');
      //   for (var i = 0; i < copters.length; i++) {
      //     if (patt.test(copters[i]))
      //       console.log("a copter", copters[i])
      //       return copters[i];
      //   }
      // }
      return "radio://1/1/250KPS";
    }).then(function(uri) {
      console.log('uri 0------------->', uri)
      return copter.connect("radio://1/1/250KPS");
    }).then(function() {
      console.log('copter is ready')
      console.log('lag is ', tb.lag())
      pullNext()
      startControl()
      return
    }).fail(function(err) {
      console.log(err);
      copter.shutdown();
    })
      .done();
  }

start()

var quad_state = {
  target_throttle: 0,
  last_set_throttle: 0,
  target_throttle_time: 0
};

var commands = [{
  action: flyTo,
  period: 2000,
  target_throttle: 45000
}, {
  action: flyTo,
  period: 200,
  target_throttle: 37000
}, {
  action: flyTo,
  period: 3000,
  target_throttle: 37000
}, {
  action: flyTo,
  period: 2000,
  target_throttle:10000
}]


  function pullNext() {
    var current = commands.shift()
    if (!current) process.exit();

    current.action(current.period, current.target_throttle)
  }

  function flyTo(ms, throttle) {
    console.log('fly!!!!!!!!!!!!!!!!!!!!!!!!!!!!')
    quad_state.target_throttle = throttle;
    quad_state.target_throttle_time = Date.now() + ms;
  }

  function land(ms) {
    console.log('land!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!')
    quad_state.target_throttle = 10000;
    quad_state.target_throttle_time = Date.now() + ms;
    startControl()
  }


  function hover() {
    flyTo(1, 35000, callback)
  }

var control;
var send_every = 50;
var last_update;

function startControl() {
  console.log('start control')
  clearInterval(control)
  var control = setInterval(function() {
    var now = Date.now()
    var time_to_target = quad_state.target_throttle_time - now;

    if (time_to_target > 0) {
      if (time_to_target < send_every) { // last step here
        console.log('less than 100 ms', time_to_target)
        quad_state.last_set_throttle = quad_state.target_throttle
        copter.driver.setpoint(0, 0, 0, quad_state.last_set_throttle)
        console.log('set to ', quad_state.last_set_throttle)
        pullNext()
      } else {
        console.log('time to target', time_to_target)
        var step = (quad_state.target_throttle - quad_state.last_set_throttle) / time_to_target; // throt per minute
        if (last_update) {
          var ms_since_last = now - last_update
        } else {
          var ms_since_last = send_every;
        }
        var set_value = Math.floor(ms_since_last * step)
        copter.driver.setpoint(0, 0, 0, quad_state.last_set_throttle)
        last_update = now
        quad_state.last_set_throttle += set_value
      }

      // console.log('loop took', Date.now() - now)
      // console.log('step was', step)
      console.log('new val', quad_state)
    }

  }, send_every)
}