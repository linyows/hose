/**
     __
    /  /__     ______     ________  ______
   /  __   \  /  __   \  /  _____/ /  ___  \
  /  /  /  / /  /__/  /  \____  / /  /_____/
 /__/  /__/  \_______/ /_______/  \_______/

 * Realtime resizing image server for AmazonS3 on node.js.
 *
 * @version 0.1.1
 * @copyright 2006-2011 linyows
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
var env = process.env.NODE_ENV || 'development';

function run()
{
    http.createServer(handleRequest).listen(conf.server.port, conf.server.host);
}

/**
 * parsed sample
 * ['/statics/1/100x100q75/aaa.jpg', 'statics', '1', '100', '100', 'q75', '75', 'aaa', '.jpg', index: 0, input: '/statics/1/100x100q75/aaa.jpg' ]
 */
var handleRequest = function(req, res) {
    switch (true) {
        case ('/favicon.ico' === req.url):
            handleStatic(req, res, 200, conf.s3.staticFaviconDir + '/favicon.ico', 'binary');
            break;

        case (null === (parsed = parseUrl(req.url))):
            error(req, res, 404);
            break;

        case (!(conf.resize.hashAdminKey === parsed[7] || getSecretHash(parsed) === parsed[7])):
            error(req, res, 403);
            break;

        default:
            // todo:
            // validator@http://stackoverflow.com/questions/4088723/validation-library-for-node-js
            var bucket = parsed[1];
            var resorce = '/' + parsed[2] + parsed[8];
            var resizeConfig = {
                width: parsed[3] - 0,
                height: parsed[4] - 0,
                quality: (('string' === typeof parsed[6])? parsed[6] * 0.01: 0.9)
            };
            var s3Config = {
                key: conf.s3.accessKey,
                secret: conf.s3.secretKey,
                bucket: bucket + conf.s3.backetSuffix
            };

            var s3Req = knox.createClient(s3Config).get(resorce);

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
                    srcData: buf,
                    quality: resizeConfig.quality,
                    width:   resizeConfig.width,
                    height:  resizeConfig.height
                };
                resizer(req, res, s3Res, resizeOption);
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
                //'Transfer-Encoding': 'chunked',
                //'Connection': 'keep-alive'
                'Connection': 'close'
            });
            res.write(stdout, 'binary');
            res.end();
            log(req, 200);
        }
    });
}

function parseUrl(url)
{
    return url.match(/^\/(\w+)\/([0-9A-z\/_-]+)\/([0-9]{2,3})x([0-9]{2,3})(q([0-9]{2}))?\/(\w+)(\.[a-z]+)$/);
}

function getSecretHash(parsed)
{
    var string = parsed[1] + parsed[2] + parsed[3] + parsed[4] + parsed[6] + conf.resize.hashSuffix;
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
