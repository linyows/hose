var crypto = require('crypto'),
    CONFIG = require('config').Sign;

Sign = module.exports = {};

Sign.hmac = function(string, callback){
  var key = CONFIG.secretKey;
  callback(crypto.createHmac('sha256', key).update(string).digest('hex'));
};
