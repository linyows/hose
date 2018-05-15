hose
====

[![Greenkeeper badge](https://badges.greenkeeper.io/linyows/hose.svg)](https://greenkeeper.io/)

hose is real-time resizing image server for [Amazon S3](http://aws.amazon.com/s3/).
Inspired by [cookpad's slide](http://www.slideshare.net/mirakui/ss-8150494).

Features
--------

- High performance (scaleable).
- Very easy to use.
- Use multi buckets.
- Smart cache (CDN-cache & 304 browser-cache).

Architecture
------------

A hose

```console
+---------+      +------------+      +------------+      +----+
| Browser | <--> | CloudFront | <--> | EC2 (hose) | <--> | S3 |
+---------+      +------------+      +------------+      +----+
```

hoses

```console
                                                  +------------+
                                                  | EC2 (hose) |
+---------+      +------------+      +-----+      +------------+      +----+
| Browser | <--> | CloudFront | <--> | ELB | <-->                <--> | S3 |
+---------+      +------------+      +-----+      +------------+      +----+
                                                  | EC2 (hose) |
                                                  +------------+
```

Quick start (mac)
-----------------

Install:

    $ brew install node imagemagick
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
Sign:
  secretKey: 'your secret key id'
  adminKey: 'test'
```

Deploy file on "bucketName":

    /baz.jpg

Start server:

    $ ./bin/hose --port 8000

Access:

    http://localhost:8000/baz/300x300cq80/test.jpg
    http://localhost:8000/baz/100x50cq90/test.jpg

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

<del>$ make test</del>

Todo
----

- Test code
- Register npm
- Design of sample html

Author
------

- @linyows

License
-------

[The MIT License](https://raw.github.com/linyows/hose/master/LICENSE)
