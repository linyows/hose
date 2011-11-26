# hose

<img src="//github.com/linyows/hose/raw/master/etc/hose.png"/></img>

hose is real-time resizing image server for [AmazonS3](http://aws.amazon.com/s3/) on [node.js](http://nodejs.org).
Inspired by [cookpad's slide](http://www.slideshare.net/mirakui/ss-8150494).

## Modules dependency

 - [knox](https://github.com/LearnBoost/knox) - AmazonS3 client.
 - [imagemagick](https://github.com/rsms/node-imagemagick) - Imagemagick wrapper.
 - [config](https://github.com/lorenwest/node-config) - Runtime configuration for node.js modules.
 - [forever](https://github.com/nodejitsu/forever) - A simple CLI tool for ensuring that a given script runs continuously.

## Uri

    http://hose.com/<s3_bucket_name>/<s3_file_path>/<width>x<height>cq<quality>/<hash>.<extention>

&lt;s3_bucket_name&gt;/&lt;s3_file_path&gt;/&lt;width&gt;x&lt;height&gt;cq&lt;quality&gt;/&lt;secret_key&gt; to hash.

    http://hose.com/<s3_bucket_name>/<s3_file_path>/<width>x<height>cq<quality>/<key>.<extention>

If the development environment, then you can use keyword other than hash.

## Setting

    $ npm install -g
    $ cp config/default.yaml.example config/default.yaml
    $ vim config/default.yaml

## Usage

    $ export NODE_PATH=/usr/local/lib/node_modules:$PATH
    $ export NODE_ENV=production
    $ forever start|stop|restart hose.js

## License

The MIT License

Copyright (c) 2011 by linyows &lt;linyows@gmail.com&gt;

Permission is hereby granted, freef charge, to any personbtaining a copyf this software and associated documentation files (the 'Software'),
to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense,
and/or sell copiesf the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copiesr substantial portionsf the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE,
ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
