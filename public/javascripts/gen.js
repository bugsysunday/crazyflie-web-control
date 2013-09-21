start = false;
window.onload = function() {
  socket = io.connect();
  socket.on('connect', function() { // TIP: you can avoid listening on `connect` and listen on events directly too!
    console.log('conn');
  });
  socket.on("telem", displayTelem)

  $(".start").click(function(e) {
    console.log('start')
    socket.emit("click", {
      cmd: "start"
    })
    start = true;
  })
  $(".stop").click(function(e) {
    start = false;
    console.log('stop')
    socket.emit("click", {
      cmd: "stop"
    })
  })
  document.querySelector(".data").textContent = "hi"
  window.onmousemove = handleMouseMove;

  function handleMouseMove(e) {
    if (start === true) {

      // console.log(e.x, e.y)
      document.querySelector(".data").textContent = [(e.x - 200)/10, (e.y- 200)/10].join(", ")
      document.querySelector(".me").style.left = Math.floor(e.x) + "px"
      document.querySelector(".me").style.top = Math.floor(e.y) + "px"
      socket.emit('move_to', {
        roll: (e.x - 200)/10,
        pitch: (e.y - 200)/10
      })
    }
  }

  document.onkeydown = checkKey;

  var thrust_target = 0;

  function checkKey(k) {

    if (k.keyCode === 81) {
      thrust_target += 20
      document.querySelector(".thrust_target").style.height = Math.floor(thrust_target) + "px"
    } else if (k.keyCode === 65) {
      thrust_target -= 20
      if (thrust_target<0)  thrust_target =0
      document.querySelector(".thrust_target").style.height = Math.floor(thrust_target) + "px"
    }

    console.log('set thrust', thrust_target)
    socket.emit('thrust_target', {
      thrust_target: thrust_target
    })
  }
}



function displayTelem(data) {
  if (!data) return;
  // console.log(data)
  var deg = Math.floor(data.yaw)
  var rotate = "rotate(" + deg + "deg)"
  console.log(rotate)
  document.querySelector(".copter").style.webkitTransform = rotate
  document.querySelector(".copter").style.left = (200 + Math.floor(data.roll)) + "px"
  document.querySelector(".copter").style.top = (200 + Math.floor(data.pitch)) + "px"
  document.querySelector(".quad_thrust").style.height = Math.floor(data.thrust/100) + "px"

}