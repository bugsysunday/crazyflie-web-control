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
  window.onmousemove = handleMouseMove;

  function handleMouseMove(e) {
    if (start === true) {

      // console.log(e.x, e.y)
      document.querySelector(".data").textContent = [(e.x - 200) / 10, (e.y - 200) / 10].join(", ")
      document.querySelector(".me").style.left = Math.floor(e.x) + "px"
      document.querySelector(".me").style.top = Math.floor(e.y) + "px"
      socket.emit('move_to', {
        roll: (e.x - 200) / 10,
        pitch: (e.y - 200) / 10
      })
    }
    window.requestAnimFrame = (function() {
      return window.requestAnimationFrame ||
        window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame ||
        function(callback) {
          window.setTimeout(callback, 1000 / 60);
      };
    })();

    // usage:
    // instead of setInterval(render, 16) ....

    (function animloop() {
      requestAnimFrame(animloop);
      animate();
    })();
  }

  document.onkeydown = checkKey;

  var thrust_target = 0;

  function checkKey(k) {

    if (k.keyCode === 81) {
      thrust_target += 20
      document.querySelector(".thrust_target").style.height = Math.floor(thrust_target) + "px"
    } else if (k.keyCode === 65) {
      thrust_target -= 20
      if (thrust_target < 0) thrust_target = 0
      document.querySelector(".thrust_target").style.height = Math.floor(thrust_target) + "px"
    }

    console.log('set thrust', thrust_target)
    socket.emit('thrust_target', {
      thrust_target: thrust_target
    })
  }

  init();
  animate();
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
  document.querySelector(".quad_thrust").style.height = Math.floor(data.thrust / 100) + "px"
}


var camera, scene, renderer;
var geometry, material, mesh;


function init() {


  camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 10000);
  // camera = new THREE.Camera();
  camera.position.x = -200;
  camera.position.y = 100;
  camera.position.z = 100;
  scene = new THREE.Scene();


  // set up coordinates
  coordinates_group = new THREE.Object3D();
  var line_mat = new THREE.LineBasicMaterial({
    color: 0x6699FF,
    linewidth: 2,
    fog: false
  })
  // set up x axis
  var x_axis_geometry = new THREE.Geometry();
  x_axis_geometry.vertices.push(new THREE.Vector3(0, 0, 0));
  x_axis_geometry.vertices.push(new THREE.Vector3(500, 0, 0));
  x_axis = new THREE.Line(x_axis_geometry, line_mat)
  coordinates_group.add(x_axis)
  // set up y axis
  var y_axis_geometry = new THREE.Geometry();
  y_axis_geometry.vertices.push(new THREE.Vector3(0, 0, 0));
  y_axis_geometry.vertices.push(new THREE.Vector3(0, 500, 0));
  y_axis = new THREE.Line(y_axis_geometry, line_mat)
  coordinates_group.add(y_axis)
  // set up z axis
  var z_axis_geometry = new THREE.Geometry();
  z_axis_geometry.vertices.push(new THREE.Vector3(0, 0, 0));
  z_axis_geometry.vertices.push(new THREE.Vector3(0, 0, 500));
  z_axis = new THREE.Line(z_axis_geometry, line_mat)
  coordinates_group.add(z_axis)

  scene.add(coordinates_group)
  // end of axis setup

  // set up quad model / by arm
  quad_group = new THREE.Object3D();
  var front_mat = new THREE.MeshBasicMaterial({
    color: "blue",
    wireframe: false
  });
  var side_mat = new THREE.MeshBasicMaterial({
    color: "black",
    wireframe: false
  });  
  var back_mat = new THREE.MeshBasicMaterial({
    color: "red",
    wireframe: false
  });

  var arm_length = 100;
  var arm_height = 2;
  var arm_width = 10;

  var pi=  Math.PI
  // m1 arm


  m1 = new THREE.CubeGeometry(arm_length, arm_height, arm_width)
  m1.applyMatrix(new THREE.Matrix4().makeTranslation(arm_length / 2, arm_height / 2, 0));


  m1_mesh = new THREE.Mesh(m1, front_mat);
  m1_mesh.rotation.y = 0
  // m2 arm
  m2_mesh = new THREE.Mesh(m1, side_mat);
  m2_mesh.rotation.y = -pi/2
  // m3 arm
  m3_mesh = new THREE.Mesh(m1, back_mat);
  m3_mesh.rotation.y = pi
  // m4 arm
  m4_mesh = new THREE.Mesh(m1, side_mat);
  m4_mesh.rotation.y = pi/2


  var quad_mat = new THREE.MeshBasicMaterial({
    color: "orange",
    wireframe: false
  });
  var v_length = 2;
  var v_height = 10;
  var v_width = 2;
  var offset = v_length/2

  
  v1 = new THREE.CubeGeometry(v_length, v_height, v_width)
  v1.applyMatrix(new THREE.Matrix4().makeTranslation(0, (v_height / 2), 0));
  // m1 motor


  v1_mesh = new THREE.Mesh(v1, quad_mat);
  v1_mesh.position.x = arm_length-offset;
  v1_mesh.position.y = arm_height;

  // m2 motor
  v2_mesh = new THREE.Mesh(v1, quad_mat);
  v2_mesh.position.z = arm_length-offset;
  v2_mesh.position.y = arm_height;
  // m3
  v3_mesh = new THREE.Mesh(v1, quad_mat);
  v3_mesh.position.x = -arm_length+offset;
  v3_mesh.position.y = arm_height;
  // m4
  v4_mesh = new THREE.Mesh(v1, quad_mat);
  v4_mesh.position.z = -arm_length+offset;
  v4_mesh.position.y = arm_height;



  quad_group.add(m1_mesh)
  quad_group.add(v1_mesh)
  quad_group.add(m2_mesh)
  quad_group.add(v2_mesh)
  quad_group.add(m3_mesh)
  quad_group.add(v3_mesh)
  quad_group.add(m4_mesh)
  quad_group.add(v4_mesh)
  quad_group.position.x = 0
  quad_group.position.y = 0
  quad_group.position.z = 0

  scene.add(quad_group);


  camera.lookAt(quad_group.position)
  renderer = new THREE.CanvasRenderer();
  renderer.setSize(window.innerWidth, window.innerHeight);

  document.body.appendChild(renderer.domElement);
}

function animate() {

  // note: three.js includes requestAnimationFrame shim
  requestAnimationFrame(animate);
  // coordinates_group.rotation.y += 0.0001;
  // coordinates_group.rotation.z += 0.0001;
  quad_group.rotation.y += .009;

  renderer.render(scene, camera);

function animate() {

  // note: three.js includes requestAnimationFrame shim
  requestAnimationFrame(animate);
  // coordinates_group.rotation.y += 0.0001;
  // coordinates_group.rotation.z += 0.0001;
  quad_group.rotation.y += .0001;

  renderer.render(scene, camera);

}


// shim layer with setTimeout fallback

// place the rAF *before* the render() to assure as close to
// 60fps with the setTimeout fallback.