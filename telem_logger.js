var fs = require('fs');

var filename = __dirname +"/telem/"+ Date.now() + ".log";


function LogWriter() {
  return this;
}


LogWriter.prototype.write = function(data) {
	if (this.write_stream === undefined) {
		console.log(filename)
		this.write_stream = fs.createWriteStream(filename);
	} 
  // console.log('ill write data', data)
  this.write_stream.write(JSON.stringify(data)+"\n")
  // console.log(data)
}
var lw = new LogWriter()
module.exports = lw