/**
     __
    /  /__     ______     ________  ______
   /  __   \  /  __   \  /  _____/ /  ___  \
  /  /  /  / /  /__/  /  \____  / /  /_____/
 /__/  /__/  \_______/ /_______/  \_______/

 * Realtime resizing image server for AmazonS3 on node.js.
 *
 * @version 0.2.1
 * @copyright 2011 linyows
 * @author linyows <hello@linyo.ws>
 * @license linyows {@link http://linyo.ws/}
 */

/**
 * Module dependencies.
 */
var http  = require('http');
var sys   = require('sys');
var fs    = require('fs');
var cr    = require('crypto');
var knox  = require('knox');
var im    = require('imagemagick');
var conf  = require('config');

var name  = 'hose';
//var env = process.env.NODE_ENV || 'development';

function run()
{
    http.createServer(handleRequest).listen(conf.server.port, conf.server.host);
}

var handleRequest = function(req, res) {
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
                type: parsed.type
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
};

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
                var resizeOption = {
                    customArgs: ['-define', resizeConfig.type + ':size=' + resizeConfig.width + 'x' + resizeConfig.height],
                    srcData: buf,
                    quality: resizeConfig.quality,
                    width:   resizeConfig.width,
                    height:  resizeConfig.height
                };

                if (resizeConfig.crop) {
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
                            }

                            resizer(req, res, s3Res, resizeOption, parsed.crop);
                        }
                    });

                } else {
                    resizer(req, res, s3Res, resizeOption, parsed.crop);
                }
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

function resizer(req, res, s3Res, resizeOption, crop)
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

/**
 * parse example
 * 0 '/statics/1/100x100cq75/802a393d7247aa0caf9056223503bdf611d478ee.jpg',
 * 1 'statics/1/100x100cq75',
 * 2 'statics',
 * 3 '1',
 * 4 '100',
 * 5 '100',
 * 6 'c', or undefined
 * 7 'q75',
 * 8 '75',
 * 9 '802a393d7247aa0caf9056223503bdf611d478ee',
 * 10 '.jpg',
 * 11 '?0123456',
 * 12 index: 0,
 * 13 input: '/statics/1/100x100cq75/802a393d7247aa0caf9056223503bdf611d478ee.jpg'
 */
function parseUrl(url)
{
    var matches = url.match(/^\/((\w+)\/([0-9A-z\/_-]+)\/([0-9]{2,3})x([0-9]{2,3})(c)?(q([0-9]{2}))?)\/([\w]+)(\.[a-z]+)?(\?[A-z0-9]*)?$/);
    if (!matches) { return matches; }
    var parsed = {
        uri: matches[0],
        key: matches[1],
        bucket: matches[2],
        path: matches[3],
        width: matches[4] - 0,
        height: matches[5] - 0,
        crop: (('undefined' === typeof matches[6])? false: true),
        quality: (('string' === typeof matches[8])? matches[8]: 100),
        qualityRate: (('string' === typeof matches[8])? matches[8] / 100: 1.0),
        hash: matches[9],
        extension: (('undefined' === typeof matches[10])? '': matches[10]),
        type: getFileType(matches[10])
    };
    return parsed;
}

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

function getSecretHash(parsed)
{
    var string = parsed.key + '/' + conf.resize.hashSuffix;
    return cr.createHash('sha1').update(string).digest('hex');
}

function error(req, res, resCode)
{
    handleStatic(req, res, resCode, conf.s3.staticErrorDir + '/' + resCode + '.html', 'utf8');
}

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
    sys.puts(params.join('\t'));
}

run();

// Error
//process.on('uncaughtException', function (err) {
    //console.log('Caught exception: ' + err);
    //process.exit(0);
//});
