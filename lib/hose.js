/**
     __
    /  /__     ______     ________  ______
   /  __   \  /  __   \  /  _____/ /  ___  \
  /  /  /  / /  /__/  /  \____  / /  /_____/
 /__/  /__/  \_______/ /_______/  \_______/

 Realtime resizing image server for Amazon S3.
 */

var Server = require("./hose/server"),
    colors = require('colors');

console.log('     __'.green);
console.log('    /  /__     ______     ________  ______'.green);
console.log('   /  __   \\  /  __   \\  /  _____/ /  ___  \\'.green);
console.log('  /  /  /  / /  /__/  /  \\____  / /  /_____/'.green);
console.log(' /__/  /__/  \\_______/ /_______/  \\_______/'.green);
console.log(' ');
console.log(' Realtime resizing image server for Amazon S3.'.grey);
console.log(' ');
console.log(' This is Open Source Software available under the MIT License.'.grey);
console.log(' 2012 © linyows. All Rights Reserved.'.grey);
console.log(' ');

module.exports.listen = function(port, host){
  var server = Server.inst();
  server.listen(port, host);
};
