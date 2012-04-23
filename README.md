Hose
====

<img src="//github.com/linyows/hose/raw/master/etc/hose.png"/></img>

hose is real-time resizing image server for [Amazon S3](http://aws.amazon.com/s3/) on [node.js](http://nodejs.org).
Inspired by [cookpad's slide](http://www.slideshare.net/mirakui/ss-8150494).

Features
--------

- High performance (scaleable).
- Very easy to use.
- Use multi buckets.

Quick start (mac)
-----------------

Install:

    $ brew install imagemagick
    $ git clone git://github.com/linyows/hose.git
    $ cd hose
    $ npm install

Setting:

    $ cp config/default.yaml.example config/default.yaml
    $ vim config/default.yaml
```yaml
S3:
  accessKeyId: 'your access key id'
  secretKeyId: 'your secret key id'
  bucketName: 'your bucket name'
  staticHost: 'foobar.s3.amazonaws.com'
Sign:
  secretKey: 'your secret key id'
  adminKey: 'test'
```

Deploy file on "bucketName":

    /baz.jpg

Deploy files on "staticHost":

    /favicon.ico
    /403.html
    /404.html
    /500.html

Start server:

    $ ./bin/hose --port 8000

Access:

    http://localhost:8000/baz/300x300cq80/test.jpg


Url
---
    
Example

    http://foobar.com/myBucket/(category/subcategory/date/fileName)/100x100cq75/802a393d7247aa0caf9056223503bdf611d478ee.jpg

Section

    http://yourdomain.com/bucketName/(filePath without extension)/resizeParams/signature.ext


Specifying the bucket
---------------------

In the **url**

    http://yourdomain.com/"bucketName"/(filePath without extension)/resizeParams/signature.ext

`$ vim config/default.yaml`

```yaml
S3:
  bucketName: ''
  bucketPrefix: 'myBucket-'
  bucketSuffix: ''
```

In the **yaml-file**

    http://yourdomain.com/(filePath without extension)/resizeParams/signature.ext
    
`$ vim config/default.yaml`

```yaml
S3:
  bucketName: 'myBucket-assets'
  bucketPrefix: ''
  bucketSuffix: ''
```

Running Tests
-------------

    $ make test

License
-------

[The MIT License](https://raw.github.com/linyows/hose/master/LICENSE)
