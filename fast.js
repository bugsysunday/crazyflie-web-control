var Aerogel = require('aerogel');
var driver = new Aerogel.CrazyDriver();
var copter = new Aerogel.Copter(driver);
var tb = require('toobusy')
var _ = require('lodash');
module.exports = lw = require("./telem_logger");

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
    return copter.connect("radio://1/10/250KPS");
  }).then(function() {
    console.log('copter is ready')
    console.log('lag is ', tb.lag())
    pullNext()
    return
  }).fail(function(err) {
    console.log(err);
    copter.shutdown();
  })
    .done();
}

start()
// setImmediate(pullNext)



var control;
var quad_update_interval = 33;
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

var commands = [{
  run: flyTo,
  period: 1000,
  target_values: {
    thrust: 60000
  }
},{
  run: flyTo,
  period: 50,
  target_values: {
    thrust: 45000
  }
},{
  run: flyTo,
  period: 300,
  target_values: {
    yaw:360
  }
},{
  run: flyTo,
  period: 300,
  target_values: {
    yaw:-360
  }
}, {
  run: flyTo,
  period: 2000,
  target_values: {
    thrust: 30000,
    pitch: 0
  }
}];



function pullNext() {
  var current_command = commands.shift()
  if (!current_command) {
    console.log('done flying')
    clearInterval(control)
    copter.driver.setpoint(0, 0, 0, 0)

    setTimeout(process.exit, 1000)
    return copter.shutdown();


  }
  // console.log(current)
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



function startControl() {
  console.log('start control')
  clearInterval(control)
  var control = setInterval(function() {
    var now = Date.now()
    _.each(quad_state, function(state_data, variable) {
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
    if ((quad_state.current_target_time - Date.now()) < quad_update_interval * 2) {
      clearInterval(control)
      setImmediate(pullNext)
    }
    last_update = Date.now();
    // console.log('op took', Date.now() -now )
    // console.log('time till cmd end ', quad_state.current_target_time - Date.now())
    // console.log('new val sent at ' + Date.now(), quad_state.roll.last_setting, quad_state.pitch.last_setting, quad_state.yaw.last_setting, quad_state.thrust.last_setting)
    console.log("\n")
    copter.driver.setpoint(quad_state.roll.last_setting, quad_state.pitch.last_setting, quad_state.yaw.last_setting, quad_state.thrust.last_setting)
    lw.write({
      data_type: "target",
      timestamp: Date.now(),
      values: {
        roll: quad_state.roll.last_setting,
        pitch: quad_state.pitch.last_setting,
        yaw: quad_state.yaw.last_setting,
        thrust: quad_state.thrust.last_setting
      }
    })

  }, quad_update_interval)
}