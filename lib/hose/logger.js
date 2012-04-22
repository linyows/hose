var colors = require('colors'),
    util = require('util');

colors.setTheme({
  silly: 'rainbow',
  input: 'white',
  verbose: 'cyan',
  prompt: 'grey',
  info: 'green',
  data: 'grey',
  help: 'cyan',
  warn: 'yellow',
  debug: 'blue',
  error: 'red'
});

var Logger = module.exports = require('./klass').create();

Logger.include({
  init: function(req, code) {
    if (req) {
      var params = [
        req.headers['x-forwarded-for'] || req.client.remoteAddress,
        new Date().toLocaleString(),
        req.method,
        req.url,
        code,
        req.headers.referer || '-',
        req.headers['user-agent'] || '-'
      ];
      util.log(params.join('\t'));
    }
    return this;

  },
  debug: function(arg) {
    util.log('DEBUG:'.silly);
    util.log(arg);
  },
  info: function(arg) {
    util.log('INFO:'.info);
    util.log(arg);
  },
  warn: function(arg) {
    util.log('WARN:'.warn);
    util.log(arg);
  },
  error: function(arg) {
    util.log('ERROR:'.error);
    util.log(arg);
  },
  note: function(arg) {
    util.log('NOTE:'.input);
    util.log(arg);
  }
});
