# hose

<img src="http://dl.dropbox.com/u/71722/hose.png" />

hose is real-time resizing image server for [AmazonS3](http://aws.amazon.com/s3/) on [node.js](http://nodejs.org).
Inspired by [cookpad's slide](http://www.slideshare.net/mirakui/ss-8150494).

## Modules dependency

    $ sh setup.sh

 - [knox](https://github.com/LearnBoost/knox) - AmazonS3 client.
 - [imagemagick](https://github.com/rsms/node-imagemagick) - Imagemagick wrapper.
 - [node-config](https://github.com/ArtS/node-config) - Lightweight configuration engine.
 - [forever](https://github.com/indexzero/forever) - A simple CLI tool for ensuring that a given script runs continuously.

## Uri

    http://hose.com/<s3_bucket_name>/<s3_file_path>/<width>x<height>q<quality>/<hash>.<extention>

If the development environment, then you can use keyword other than hash.

    http://hose.com/<s3_bucket_name>/<s3_file_path>/<width>x<height>q<quality>/<key>.<extention>

## Setting

    $ cp conf/common.js.example conf/common.js
    $ vim conf/common.js

## Usage

    $ export NODE_ENV=production
    $ forever start|stop|restart hose.js

## License

The MIT License

Copyright (c) 2011 by linyows
