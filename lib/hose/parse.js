var url = require('url'),
    CONFIG = require('config');

Parse = module.exports = function(str){
  this.str = str;
  return this;
};

Parse.url = function(str){
  return new Parse(str)._url();
};

Parse.prototype._url = function(){
  parsed = url.parse(this.str);

  /**
   * section: /bucketName/(filePath without extension)/resizeParams/signature.ext
   * example: /myBucket/(category/subcategory/date/fileName)/100x100cq75/802a393d7247aa0caf9056223503bdf611d478ee.jpg
   */
  var r = {
    bucket: '([A-z0-9.-]+)',
    filePath: '([A-z0-9/_-]+)',
    resizeParams: '([0-9]{2,3})?(x)?([0-9]{2,3})?(c)?(q([0-9]{2}|100))?',
    signature: (CONFIG.Sign.adminKey !== '' ? '([a-f0-9]{64}|' + CONFIG.Sign.adminKey + ')' : '([a-f0-9]{64})'),
    extension: '(.jpg|.png|.gif)'
  };
  var patern = '^/((' + r.bucket + '/)?' +  r.filePath + '/' + r.resizeParams + ')/' + r.signature + r.extension + '$';
  var regexp = new RegExp(patern, 'i');
  var matches = regexp.exec(parsed.pathname);
  if (!matches) { return null; }

  return {
    uri: matches[0],
    key: matches[1],
    bucket: CONFIG.S3.bucketName === '' ? matches[3] : '',
    path: CONFIG.S3.bucketName === '' ? matches[4] : ('undefined' === typeof matches[2] ? matches[4] : matches[2] + matches[4]),
    width: 'undefined' === typeof matches[5] ? '' : matches[5] - 0,
    height: 'undefined' === typeof matches[7] ? '' : matches[7] - 0,
    max: 'undefined' === typeof matches[6] ? ('undefined' === typeof matches[5] ? matches[7] : matches[5]) - 0 : false,
    crop: 'undefined' === typeof matches[8] ? false : true,
    quality: 'string' === typeof matches[10] ? matches[10] : 100,
    qualityRate: 'string' === typeof matches[10] ? matches[10] / 100 : 1.0,
    signature: matches[11],
    extension: 'undefined' === typeof matches[12] ? '' : matches[12],
    type: this._toFileType(matches[12])
  };
};

Parse.prototype._toFileType = function(extension){
  var type = '';
  switch (extension) {
    case '.jpg': type = 'jpeg'; break;
    case '.png': type = 'png'; break;
    case '.gif': type = 'gif'; break;
    default: break;
  }
  return type;
};
