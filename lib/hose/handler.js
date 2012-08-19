var knox   = require('knox'),
    sign   = require('./sign'),
    parse  = require('./parse'),
    render = require('./render'),
    resize = require('./resize'),
    CONFIG = require('config');

Handler = module.exports = function(req, res){

  var Render = render.inst(req, res);
  var error = function(){ Render.internalServerError(req, res); };
  if ('/favicon.ico' === req.url) { return Render.favicon(); }

  var parsed = parse.url(req.url);
  if (null === parsed) { return Render.notFound(); }

  sign.hmac(parsed.key, function(signature){
    if (parsed.signature !== signature && parsed.signature !== CONFIG.Sign.adminKey) { return Render.forbidden(); }

    var bucket = CONFIG.S3.bucketName ||
      (CONFIG.S3.bucketPrefix ? CONFIG.S3.bucketPrefix : '') +
      parsed.bucket +
      (CONFIG.S3.bucketSuffix ? CONFIG.S3.bucketSuffix : '');

    var s3Req = knox.createClient({
      key: CONFIG.S3.accessKeyId,
      secret: CONFIG.S3.secretKeyId,
      bucket: bucket
    }).get('/' + parsed.path + parsed.extension);

    s3Req.end();

    s3Req.on('response', function(s3Res) {
      switch (s3Res.statusCode) {
        case 200:
          if ('image/jpeg' == s3Res.headers['content-type'] ||
              'image/png' == s3Res.headers['content-type'] ||
              'image/gif' == s3Res.headers['content-type']) {
            if (s3Res.headers.etag == req.headers['if-none-match'] ||
                s3Res.headers['last-modified'] == req.headers['if-modified-since']) {
              Render.notModified(s3Res.headers);
              break;
            }

            var buf = '';
            s3Res.setEncoding('binary');
            s3Res.on('error', error);
            s3Res.on('data', function(chunk) {
              buf += chunk;
            });
            s3Res.on('end', function() {
              var resizeConfig = {
                width: parsed.width,
                height: parsed.height,
                quality: parsed.qualityRate,
                crop: parsed.crop,
                type: parsed.type,
                max: parsed.max
              };
              var Resize = resize.inst(s3Res.headers, resizeConfig, buf, function(headers, stdout){
                Render.ok(headers, stdout);
              }, error);
            });

          } else {
            Render.notFound();
          }
          break;

        case 403:
          Render.forbidden();
          break;

        case 404:
          Render.notFound();
          break;

        default:
          if (s3Res.statusCode >= 500) {
            Render.internalServerError();
          } else {
            Render.notFound();
          }
          break;
      }
    });
  });
};
