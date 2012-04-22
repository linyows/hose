Hose
====

<img src="//github.com/linyows/hose/raw/master/etc/hose.png"/></img>

hose is real-time resizing image server for [Amazon S3](http://aws.amazon.com/s3/) on [node.js](http://nodejs.org).
Inspired by [cookpad's slide](http://www.slideshare.net/mirakui/ss-8150494).

Modules dependency
------------------

 - [knox](https://github.com/LearnBoost/knox) - AmazonS3 client.
 - [imagemagick](https://github.com/rsms/node-imagemagick) - Imagemagick wrapper.
 - [config](https://github.com/lorenwest/node-config) - Runtime configuration for node.js modules.

Uri
---

    http://hose.com/<s3_bucket_name>/<s3_file_path>/<width>x<height>cq<quality>/<hash>.<extention>

&lt;s3_bucket_name&gt;/&lt;s3_file_path&gt;/&lt;width&gt;x&lt;height&gt;cq&lt;quality&gt;/&lt;secret_key&gt; to hash.

    http://hose.com/<s3_bucket_name>/<s3_file_path>/<width>x<height>cq<quality>/<key>.<extention>

If the development environment, then you can use keyword other than hash.

Setting
-------

    $ npm install -g
    $ cp config/default.yaml.example config/default.yaml
    $ vim config/default.yaml

Usage
-----

    $ export NODE_PATH=/usr/local/lib/node_modules:$PATH
    $ export NODE_ENV=production
    $ forever start|stop|restart hose.js

License
-------

[The MIT License](https://raw.github.com/linyows/hose/master/LICENSE)
