var im     = require('imagemagick'),
    render = require('./render');

var Resize = module.exports = require('./klass').create();

Resize.include({
  init: function(headers, resizeConfig, buf, callback, errorCallback){
    this.callback = callback;
    this.errorCallback = errorCallback;
    this.headers = headers;
    var Render = this.Render = render.inst();
    var resizeOption = this.resizeOption = {
      customArgs: ['-define', resizeConfig.type + ':size=' + resizeConfig.width + 'x' + resizeConfig.height],
      srcData: buf,
      quality: resizeConfig.quality,
      width:   resizeConfig.width,
      height:  resizeConfig.height
    };
    var self = this;

    if (!resizeConfig.crop && !resizeConfig.max) {
      self.start();
      return;
    }

    im.identify({data: buf}, function(err, meta) {
      if (err) { return errorCallback(); }

      if (resizeConfig.crop) {
        var dSrc = meta.width / meta.height;
        var dDst = resizeConfig.width / resizeConfig.height;
        resizeOption.customArgs = [
          '-define', resizeConfig.type + ':size=' + resizeConfig.width + 'x' + resizeConfig.height,
          '-resize', ((dSrc < dDst)? resizeConfig.width + 'x': 'x' + resizeConfig.height),
          '-gravity', 'Center',
          '-crop', resizeConfig.width + 'x' + resizeConfig.height + '+0+0',
          '+repage'
        ];

      } else if (resizeConfig.max) {
        if (meta.width > meta.height) {
          resizeOption.width = resizeConfig.max;
          resizeOption.height = '';
        } else {
          resizeOption.width = '';
          resizeOption.height = resizeConfig.max;
        }
      }

      self.start();
    });

  },
  start: function(){
    var Render = this.Render;
    var headers = this.headers;
    var fn = this.callback;
    im.resize(this.resizeOption, function(err, stdout, stderr) {
      if (err) { return this.errorCallback(); }
      fn(headers, stdout);
    });

  }
});
