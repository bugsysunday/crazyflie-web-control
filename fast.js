var Aerogel = require('aerogel');
var driver = new Aerogel.CrazyDriver();
var copter = new Aerogel.Copter(driver);
var tb = require('toobusy')
var _ = require('lodash');
module.exports = lw = require("./telem_logger");


copter.handleStabilizerTelemetry = function(data) {
  handleTelem('stablizer', data)
};

copter.handleMotorTelemetry = function(data) {
  handleTelem('motor', data)
};

copter.handleAccTelemetry = function(data) {
  handleTelem('acc', data)
};

copter.handleGyroTelemetry = function(data) {
  handleTelem('gyro', data)
};

function start() {
  driver.findCopters().then(function(copters) {
    console.log(copters)
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
    return "radio://1/10/250KPS";
  }).then(function(uri) {
    console.log('uri 0------------->', uri)
    return copter.connect("radio://1/10/250KPS");
  }).then(function() {
    console.log('copter is ready')
    console.log('lag is ', tb.lag())
    return pullNext()
  }).fail(function(err) {
    console.log(err);
    copter.shutdown();
  }).done();
}

start()



var control;
var quad_update_interval = 20;
var last_update;

var quad_state = {
  current_target_time: 0,
  pitch: {
    target_value: 0,
    last_setting: 0,
    target_time: 0
  },
  roll: {
    target_value: 0,
    last_setting: 0,
    target_time: 0
  },
  yaw: {
    target_value: 0,
    last_setting: 0,
    target_time: 0
  },
  thrust: {
    target_value: 0,
    last_setting: 0,
    target_time: 0
  }
};




var loop_angle = 30;
var transition_time = 500;
var commands = [{
  run: flyTo,
  period: 50,
  target_values: {
    thrust: 60000
  }
},{
  run: flyTo,
  period: 400,
  target_values: {
    thrust: 60000,
    pitch:30
  }
}, {
  run: flyTo,
  period: 50,
  target_values: {
    thrust: 60000,
    pitch:360,
    yaw:0
  }
},{
  run: flyTo,
  period: 200,
  target_values: {
    thrust: 40000,
    pitch:360
  }
}, {
  run: flyTo,
  period: 50,
  target_values: {
    thrust: 40000,
    pitch:0
  }
}, {
  run: flyTo,
  period: 300,
  target_values: {
    thrust: 60000,
    pitch:0
  }
}, {
  run: flyTo,
  period: 50,
  target_values: {
    thrust: 40000,
    pitch:0
  }
}, {
  run: flyTo,
  period: 2000,
  target_values: {
    thrust: 15000

  }
}];

process.on('SIGINT', shutDown);
var shutdown;
function shutDown(){
    if (shutdown === true) return;
    shutdown = true;
    console.log('SHUT DOWN!!!')
    clearInterval(control)
    copter.setpoint(0, 0, 0, 0)
    setTimeout(process.exit, 1000)
    // return copter.shutdown();
}

function pullNext() {
  var current_command = commands.shift()
  if (!current_command) {
    return shutDown()
  }
  current_command.run(current_command.period, current_command.target_values)
  if (!control) startControl()
  if (!last_update) last_update = Date.now();

}

function flyTo(ms, target_values) {
  console.log('fly!!!!!!!!!!!!!!!!!!!!!!!!!!!!')
  var now = Date.now();
  _.each(target_values, function(target_value, variable) {
    quad_state[variable].target_value = target_value;
    quad_state[variable].target_time = now + ms;
  });
  // console.log(quad_state)
}




  function handleTelem(type, data) {
    lw.write({data_type:type, timestamp: Date.now(), values:data})
    // console.log(tb.lag())
    // console.log('got new tele mat ', Date.now())
    // switch (type) {
    //   case "stablizer":
    //     console.log(type, data)
    //     break;
    //   case "gyro":
    //     console.log(type, data)
    //     break;
    //   case "acc":
    //     // console.log(type, data)
    //     var total_accel = Math.sqrt(Math.pow(data.x, 2)+ Math.pow(data.y, 2)+Math.pow(data.z, 2))
    //     console.log('total accel is ', total_accel)
    //     if (loops > 5) {
    //        quad_state.thrust.last_setting = 0
    //       return sendCopterCommand()
    //     }
    //     if (total_accel > 1.5) {

    //       quad_state.pc_control = true;
    //       quad_state.thrust.last_setting = 0
    //       sendCopterCommand()
    //     } else if (total_accel < 1) {
    //       loops++
    //       quad_state.pc_control = true;
    //       quad_state.thrust.last_setting = 60000
    //       sendCopterCommand()
    //     }

    //     break;

    //   default:
    //     console.log(type, data)
    // }
  }

  function sendCopterCommand() {
    copter.setpoint(quad_state.roll.last_setting, quad_state.pitch.last_setting, quad_state.yaw.last_setting, quad_state.thrust.last_setting)
    var right_now = Date.now()
    // console.log(tb.lag())
    lw.write({
      offset:right_now -start,
      data_type: "target",
      timestamp:right_now ,
      values: {
        roll: quad_state.roll.last_setting,
        pitch: quad_state.pitch.last_setting,
        yaw: quad_state.yaw.last_setting,
        thrust: quad_state.thrust.last_setting
      }
    })
    start = right_now;
  }

  function startControl() {
    console.log('start control')
    clearInterval(control)
    start = Date.now();
    var control = setInterval(function() {
      if (shutdown === true) return;
      var now = Date.now()
      _.each(quad_state, function(state_data, variable) {
        if (quad_state.pc_control === true) return clearInterval(control);
        if (variable === "current_target_time") return;
        // console.log('on state and var', state_data, variable)
        if (quad_state.current_target_time < state_data.target_time) quad_state.current_target_time = state_data.target_time
        var time_to_this_target = state_data.target_time - now;
        if (time_to_this_target < 0) { // skip this setting
          // console.log("Skipping old command with delay " + time_to_this_target, state_data)
          return;
        } else if (time_to_this_target <= quad_update_interval) { // last setting
          console.log('last setting')
          state_data.last_setting = state_data.target_value

        } else {
          // console.log('state data', state_data)
          // console.log('calc items', state_data.target_value - state_data.last_setting, time_to_this_target)
          var step_per_ms = (state_data.target_value - state_data.last_setting) / time_to_this_target;
          // console.log('calc step is ', step_per_ms)
          var next_value = Math.floor(step_per_ms * (Date.now() - last_update))
          state_data.last_setting += next_value
          // if (next_value > 0 && next_value > state_data.target_value) state_data.last_setting = state_data.target_value
          // if (next_value < 0 && next_value < state_data.target_value) state_data.last_setting = state_data.target_value
        }
      })
      if ((quad_state.current_target_time - Date.now()) < quad_update_interval) {
        // console.log('were late, i clear interval')
        clearInterval(control)
        setImmediate(pullNext)
      }
      last_update = Date.now();
      // console.log('op took', Date.now() -now )
      // console.log('time till cmd end ', quad_state.current_target_time - Date.now())
      // console.log('new val sent at ' + Date.now(), quad_state.roll.last_setting, quad_state.pitch.last_setting, quad_state.yaw.last_setting, quad_state.thrust.last_setting)
      sendCopterCommand()


    }, quad_update_interval)
  }