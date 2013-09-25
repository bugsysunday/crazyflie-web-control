
var tdata = [{
  key: 'test',
  values: []
}]

var main_datas = [{
  stabilizer: {
    roll: 0,
    pitch: 0,
    yaw: 0,
    thrust: 0
  },
  motor: {
    m1: 0,
    m2: 0,
    m3: 0,
    m4: 0
  },
  acc: {
    x: 0,
    y: 0,
    z: 0
  }
}]



for (var i = 0; i < 1000; i++) {
  main_datas.push({
    stabilizer: {
      roll: Math.random(),
      pitch: Math.random(),
      yaw: Math.random(),
      thrust: Math.random()
    },
    motor: {
      m1: Math.random(),
      m2: Math.random(),
      m3: Math.random(),
      m4: Math.random()
    },
    acc: {
      x: Math.random(),
      y: Math.random(),
      z: Math.random()
    }
  })
}


function mapStablizer(data){

}


var final_data = [];
main_datas.forEach(function(dp){
  
  _.each(dp, function(data, category){
    console.log(category, data)

  
  })
})

nv.addGraph(function() {
  var chart = nv.models.lineWithFocusChart();

  // chart.transitionDuration(500);
  chart.xAxis
    .tickFormat(d3.format(',f'));
  chart.x2Axis
    .tickFormat(d3.format(',f'));

  chart.yAxis
    .tickFormat(d3.format(',.2f'));
  chart.y2Axis
    .tickFormat(d3.format(',.2f'));


  // var tdata = testData()
  console.log(tdata)
  d3.select('#chart svg').datum(tdata).call(chart);
  v = 1

  var interval = setInterval(function() {
    v+=.2
    if (tdata[0].values.length > 100) {
      console.log('shifting')
      tdata[0].values.shift()
    }
    tdata[0].values.push({
      series: 0,
      x: Date.now(),
      y: Math.cos(v)
    })
    chart.update()
  }, 300)

  nv.utils.windowResize(chart.update);

  return chart;
});