var http   = require('http'),
    handler = require('./handler');

var Server = module.exports = require('./klass').create();

Server.include({
  init: function(){
    this.httpServer = http.createServer(function(req, res){
      return (new handler(req, res));
    });
  },
  listen: function(port, host){
    port = port || process.env.PORT || 8080;
    host = host || process.env.HOST || 'localhost';
    this.httpServer.listen(parseInt(port, 10), host);
  }
});
