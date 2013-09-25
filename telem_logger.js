var fs = require('fs');

var filename = __dirname +"/telem/"+ Date.now() + ".log";
console.log(filename)

function LogWriter() {
  this.write_stream = fs.createWriteStream(filename);
  return this;
}


LogWriter.prototype.write = function(data) {
  // console.log('ill write data', data)
  this.write_stream.write(JSON.stringify(data)+"\n")
  // console.log(data)
}
var lw = new LogWriter()
module.exports = lw