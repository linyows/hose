var http = require('http'),
    util = require('util'),
    logger = require('./logger'),
    CONFIG = require('config');

var Render = module.exports = require('./klass').create();

Render.include({
  init: function(req, res) {
    this.staticServer = {
      host: CONFIG.S3.staticHost,
      port: CONFIG.S3.staticPort || 80,
      path: CONFIG.S3.staticRoot || '/'
    };
    this.encoding = CONFIG.S3.staticEncoding || 'utf-8';
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
  _static: function(path, options) {
    var self = this;
    var staticServer = this.staticServer;
    staticServer.path = staticServer.path.replace(/\/$/, '') + path;

    if (options) {
      var code = (options.code) ? options.code : 500;
      var encoding = (options.encoding) ? options.encoding : this.encoding;
    }

    http.get(staticServer, function(res) {
      var buf = '';
      res.setEncoding(this.encoding);
      self.res.writeHead(code, res.headers);

      res.on('data', function(chunk) {
        buf += chunk;
      });

      res.on('end', function() {
        self.res.write(buf, this.encoding);
        self.res.end();
        var Logger = logger.inst(self.req, code);
      });

    }).on('error', function(err) {
      self.fatalError();
      util.error(err);
    });
  }
});
