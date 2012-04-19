/**
     __
    /  /__     ______     ________  ______
   /  __   \  /  __   \  /  _____/ /  ___  \
  /  /  /  / /  /__/  /  \____  / /  /_____/
 /__/  /__/  \_______/ /_______/  \_______/

 * Realtime resizing image server for AmazonS3 on node.js.
 *
 * @version 0.2.2
 * @copyright 2011 linyows
 * @author linyows <hello@linyo.ws>
 * @license linyows {@link http://linyo.ws/}
 */

/**
 * Module dependencies.
 */
var http  = require('http');
var util   = require('util');
var fs    = require('fs');
var cr    = require('crypto');
var knox  = require('knox');
var im    = require('imagemagick');
var conf  = require('config');
var url   = require('url');

/**
 * Configuration.
 */
var name  = 'hose';
var server = http.createServer(function(req, res) {
  switch (true) {
    case ('/favicon.ico' === req.url):
      handleStatic(req, res, 200, conf.s3.staticFaviconDir + '/favicon.ico', 'binary');
      break;

    case (null === (parsed = parseUrl(req.url))):
      error(req, res, 404);
      break;

    case (!(conf.resize.hashAdminKey === parsed.hash || getSecretHash(parsed) === parsed.hash)):
      error(req, res, 403);
      break;

    default:
      var resizeConfig = {
          width: parsed.width,
          height: parsed.height,
          quality: parsed.qualityRate,
          crop: parsed.crop,
          type: parsed.type,
          max: parsed.max
      };
      var s3Config = {
          key: conf.s3.accessKey,
          secret: conf.s3.secretKey,
          bucket: parsed.bucket + conf.s3.backetSuffix
      };

      var s3Req = knox.createClient(s3Config).get('/' + parsed.path + parsed.extension);

      s3Req.end();

      s3Req.on('response', function(s3Res) {
          handleS3Response(req, res, s3Res, resizeConfig);
      });
      break;
  }
});

/**
 * Listen.
 */
server.listen(conf.server.port, conf.server.host);

/**
 * Handle S3 Response.
 */
function handleS3Response(req, res, s3Res, resizeConfig)
{
  switch (true) {
    case (200 == s3Res.statusCode && 'image/jpeg' == s3Res.headers['content-type']):
    case (200 == s3Res.statusCode && 'image/png' == s3Res.headers['content-type']):
    case (200 == s3Res.statusCode && 'image/gif' == s3Res.headers['content-type']):
      //(new Date(req.headers['if-modified-since']).getTime() < new Date().getTime())
      if (s3Res.headers['etag'] == req.headers['if-none-match'] ||
        s3Res.headers['last-modified'] == req.headers['if-modified-since']) {
        res.writeHead(304, {
          'Server': name,
          'Content-Type': s3Res.headers['content-type'],
          'Date': s3Res.headers['date'],
          'Last-Modified': s3Res.headers['last-modified'],
          'Etag': s3Res.headers['etag'],
          'Connection': 'close'
        });
        res.end();
        log(req, 304);
        break;
      }

      var buf = '';
      s3Res.setEncoding('binary');

      s3Res.on('error', function() {
        error(req, res, 500);
        log(req, 500);
      });

      s3Res.on('data', function(chunk) {
        buf += chunk;
      });

      s3Res.on('end', function() {
        cropResizer(req, res, s3Res, resizeConfig, buf);
      });
      break;

    case (401 == s3Res.statusCode):
    case (403 == s3Res.statusCode):
    case (404 == s3Res.statusCode):
    case (500 == s3Res.statusCode):
    case (503 == s3Res.statusCode):
      error(req, res, s3Res.statusCode);
      log(req, s3Res.statusCode);
      break;

    default:
      error(req, res, 403);
      log(req, 403);
      console.log(s3Res);
      break;
  }
}

/**
 * Croping resize.
 */
function cropResizer(req, res, s3Res, resizeConfig, buf)
{
  var resizeOption = {
    customArgs: ['-define', resizeConfig.type + ':size=' + resizeConfig.width + 'x' + resizeConfig.height],
    srcData: buf,
    quality: resizeConfig.quality,
    width:   resizeConfig.width,
    height:  resizeConfig.height
  };

  if (resizeConfig.crop || resizeConfig.max) {
    im.identify({data: buf}, function(err, meta) {
      if (err) {
        console.log('Caught exception: ' + err);
        error(req, res, 500);
        log(req, 500);

      //meta = { format: 'JPEG', width: 428, height: 640, depth: 8 }
      } else {
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

        resizer(req, res, s3Res, resizeOption);
      }
    });

  } else {
      resizer(req, res, s3Res, resizeOption);
  }
}

/**
 * Resizing image.
 */
function resizer(req, res, s3Res, resizeOption)
{
  im.resize(resizeOption, function(err, stdout, stderr) {
    if (err) {
      console.log('Caught exception: ' + err);
      error(req, res, 500);
      log(req, 500);

    } else {
      res.writeHead(200, {
        'Server': name,
        'Content-Type': s3Res.headers['content-type'],
        'Date': s3Res.headers['date'],
        'Last-Modified': s3Res.headers['last-modified'],
        'Etag': s3Res.headers['etag'],
        'Accept-Ranges': s3Res.headers['accept-ranges'],
        'Content-Length': stdout.length,
        'Connection': 'close'
      });
      res.write(stdout, 'binary');
      res.end();
      log(req, 200);
    }
  });
}

function parseUrl(str)
{
  /**
   * input: /bucket/file/100x100cq75/802a393d7247aa0caf9056223503bdf611d478ee.jpg
   * path[0] = ''
   * path[1] = 'bucket'
   * path[2] = 'file'
   * path[3] = '100x100cq75'
   * path[4] = '802a393d7247aa0caf9056223503bdf611d478ee.jpg'
  */
  parsed_url = url.parse(str);
  path       =  parsed_url.pathname.split('/');

  params_regexp = /([0-9]{2,3})?(x)?([0-9]{2,3})?(c)?(q([0-9]{2}))?/;
  if (
          !path[1].match(/\w+/)
       || !path[2].match(/[0-9A-z\/_-]+/)
       || !path[3].match(params_regexp)
       || !path[4].match(/[\w]+\.[a-z]+/)
  ) {
    return matches;
  }

  /**
   * Example
   * 0 '100x600cq99',
   * 1 '100',
   * 2 'x',
   * 3 '600',
   * 4 'c',
   * 5 'q99',
   * 6 '99',
   * 7 index: 0,
   * 8 input: '100x600cq99'
  */
  params = path[3].match(params_regexp);

  basename = path[4].match(/([\w]+)(\.[a-z]+)/);

  var parsed = {
    uri: parsed_url.path,
    key: path[1] + '/' + path[2] + '/' + path[3],
    bucket: path[1],
    path: path[2],
    width: (('undefined' === typeof params[1])? '': params[1] - 0),
    height: (('undefined' === typeof params[3])? '': params[3] - 0),
    max: (('undefined' === typeof params[2])? (('undefined' === typeof params[1])? params[3]: params[1]) - 0: false),
    crop: (('undefined' === typeof params[4])? false: true),
    quality: (('string' === typeof params[6])? params[6]: 100),
    qualityRate: (('string' === typeof params[6])? params[6] / 100: 1.0),
    hash: basename[1],
    extension: (('undefined' === typeof basename[2])? '': basename[2]),
    type: getFileType(basename[2])
  };
  return parsed;
}

/**
 * File extension.
 */
function getFileType(extension)
{
  var type = '';
  switch (extension) {
    case '.jpg': type = 'jpeg'; break;
    case '.png': type = 'png'; break;
    case '.gif': type = 'gif'; break;
    default: break;
  }
  return type;
}

/**
 * Hash.
 */
function getSecretHash(parsed)
{
  var string = parsed.key + '/' + conf.resize.hashSuffix;
  return cr.createHash('sha1').update(string).digest('hex');
}

/**
 * Errors.
 */
function error(req, res, resCode)
{
  handleStatic(req, res, resCode, conf.s3.staticErrorDir + '/' + resCode + '.html', 'utf8');
}

/**
 * Display errors.
 */
function handleStatic(req, res, resCode, config, encoding)
{
  if ('string' === typeof config) {
    var config = {
      host: conf.s3.staticHost,
      port: 80,
      path: config
    };
  }

  http.get(config, function(httpRes) {
    var buf = '';
    httpRes.setEncoding(encoding);
    res.writeHead(resCode, httpRes.headers);

    httpRes.on('data', function(chunk) {
        buf += chunk;
    });

    httpRes.on('end', function() {
        res.write(buf, encoding);
        res.end();
    });
    log(req, resCode);

  }).on('error', function(err) {
    console.log('Caught exception: ' + err);
    error(req, res, 500);

  });
}

/**
 * Logger.
 */
function log(req, status)
{
  var params = [
    req.headers['x-forwarded-for'] || req.client.remoteAddress,
    new Date().toLocaleString(),
    req.method,
    req.url,
    status,
    req.headers.referer || '-',
    req.headers['user-agent'] || '-'
  ];
  util.log(params.join('\t'));
}

// Error
//process.on('uncaughtException', function (err) {
    //console.log('Caught exception: ' + err);
    //process.exit(0);
//});
