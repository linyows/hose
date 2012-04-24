var http   = require('http'),
    fs     = require('fs'),
    util   = require('util'),
    logger = require('./logger'),
    CONFIG = require('config');

var Render = module.exports = require('./klass').create();

Render.include({
  init: function(req, res) {
    this.staticServer = {
      host: CONFIG.Static.host,
      port: CONFIG.Static.port || 80,
      path: CONFIG.Static.root || '/'
    };
    this.encoding = CONFIG.Static.encoding || 'utf-8';
    this.serverName = CONFIG.Server.name || '';
    this.req = req;
    this.res = res;

  },
  ok: function(headers, stdout){
    this.res.writeHead(200, {
      'Content-Type': headers['content-type'],
      'Last-Modified': headers['last-modified'],
      'Accept-Ranges': headers['accept-ranges'],
      'Content-Length': stdout.length,
      'Server': this.serverName,
      'Date': headers.date,
      'Etag': headers.etag,
      'Connection': 'close'
    });
    this.res.write(stdout, 'binary');
    this.res.end();
    var Logger = logger.inst(this.req, 200);

  },
  notModified: function(headers){
    this.res.writeHead(304, {
      'Content-Type': headers['content-type'],
      'Last-Modified': headers['last-modified'],
      'Date': headers.date,
      'Etag': headers.etag,
      'Server': this.serverName,
      'Connection': 'close'
    });
    this.res.end();
    var Logger = logger.inst(this.req, 304);

  },
  fatalError: function(){
    var body = '500 Internal Server Error';
    this.res.writeHead(500, {
      'Content-Length': body.length,
      'Content-Type': 'text/plain'
    });
    this.res.end();
    var Logger = logger.inst(this.req, 500);

  },
  favicon: function(){
    this._static('/favicon.ico', { code: 200, encoding: 'binary' });

  },
  notFound: function(){
    this._static('/404.html', { code: 404 });

  },
  forbidden: function(){
    this._static('/403.html', { code: 403 });

  },
  internalServerError: function(){
    this._static('/500.html', { code: 500 });

  },
  _static: function(path, options){
    if (options) {
      this.code = (options.code) ? options.code : 500;
      this.encoding = (options.encoding) ? options.encoding : this.encoding;
    }
    if (this.staticServer.host === '') {
      this._local(path);
    } else {
      this._remote(path);
    }

  },
  _local: function(path){
    var self = this;
    fs.readFile(__dirname + '/../../public' + path, function (err, buf) {
      if (err) {
        console.log(err);
        self.fatalError();
        util.error(err);

      } else {
        self.res.write(buf, self.encoding);
        self.res.end();
        var Logger = logger.inst(self.req, self.code);
      }
    });

  },
  _remote: function(path) {
    var self = this;
    var staticServer = self.staticServer;
    staticServer.path = staticServer.path.replace(/\/$/, '') + path;

    http.get(staticServer, function(res) {
      var buf = '';
      res.setEncoding(self.encoding);
      self.res.writeHead(self.code, res.headers);

      res.on('data', function(chunk) {
        buf += chunk;
      });

      res.on('end', function() {
        self.res.write(buf, self.encoding);
        self.res.end();
        var Logger = logger.inst(self.req, self.code);
      });

    }).on('error', function(err) {
      self.fatalError();
      util.error(err);
    });
  }
});
