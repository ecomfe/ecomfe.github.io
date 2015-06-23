---
title: XHR 和 baidubce-sdk
date: 2015-6-23
author: leeight
author_link: https://github.com/leeight
tags:
- xhr
- baidubce
---


## Content-Type

在开发 [baidubce-sdk](https://www.npmjs.com/package/baidubce-sdk) 的时候，遇到了在不同浏览器（主要是 Firefox 和 Chrome）下调用 `xhr.setRequestHeader` 设置 `Request Header` 之后，内部的处理逻辑有一些细微的差别，导致`baidubce-sdk`无法正常的工作。


```js
var xhr = new XMLHttpRequest();
xhr.setRequestHeader('Content-Type', 'foo/bar');
// 当Method !== 'GET' 的时候
xhr.open('POST', '', true);
xhr.send('');
```

对于上面这段儿代码，因为我们显式的设置了`Content-Type`，所以我们期望的是服务器收到的 `Request Header` 中 `Content-Type` 应该是 `foo/bar`，实际上在 `Firefox` 里面会自动添加 `charset=UTF-8`，也就是服务器得到的信息是 `foo/bar; charset=UTF-8`

<!-- more -->

因为根据 ak 和 sk 计算签名的时候，`Content-Type`作为其中的一个因子参与计算的。Firefox下面的这个问题，导致 client 和 server 计算出来的签名不一致，所以 server 就拒绝了某些请求。

## Content-Length

第二个兼容性的问题是关于`Content-Length`的，因为 `baidubce-sdk` 最初的是为 `Node.js` 开发的，通过 `browserify` 处理之后直接运行在浏览器里面。主要遇到的问题跟前面类似，因为`Content-Length`导致计算签名不一致。

在`Node.js`里面，我们直接使用的`require('http')`模块，可以任意设置`Request Header`里面的字段，但是在[XMLHttpRequest的文档](http://www.w3.org/TR/XMLHttpRequest/#the-setrequestheader%28%29-method)里面，限制了一些可以设置的`Header`。

在`GET`请求里面，`Content-Length`值是`0`，此时 client 是有这个信息的，因此会把`Content-Length`作为计算签名的一个因子，不过因为`xhr`的限制，我们无法设置这个参数，因此 server 收到的 `GET` 请求里面，`Request Header` 里面是没有这个字段的，这也就产生了不一致的问题。

## baidubce-sdk

问题都描述清楚了，对应的解决方案也就有了：

* `Content-Type`：

  1. 在`POST`的时候**给所有浏览器**下面都加上`; charset=UTF-8`这部分信息
  2. 使用 `sendAsBinary` 代替 `send`，不过 `browserify` 生成的代码里面没有调用这个 `API`，需要自己去修改一下才可以。

* `Content-Length` 这个问题会判断一下 `GET` 和 `0` 的情况来决定是否让 `Content-Length` 来参与计算签名

广告贴来了

`baidubce-sdk`封装了[百度开放云](http://bce.baidu.com/)提供的一些基础API，比如云存储(BOS)，音视频转码（Media），欢迎有这方面需求的童鞋试用。

```
npm i baidubce-sdk
```


## 参考

* <https://bugzilla.mozilla.org/show_bug.cgi?id=416178>