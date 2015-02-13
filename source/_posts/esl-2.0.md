---
title: ESL 发布 2.0
date: 2015-2-6
author: errorrik
author_link: http://errorrik.com/
tags:
- AMD
- 模块化
- JavaScript
- ESL
---

[ESL](https://github.com/ecomfe/esl) 是一个`浏览器端`、`符合AMD`的标准加载器，适合用于现代Web浏览器端应用的入口与模块管理。

通过`右键另存`的方式可以下载ESL:

- [压缩代码 (Compressed)](http://s1.bdstatic.com/r/www/cache/ecom/esl/2-0-4/esl.js)
- [源码 (Source)](http://s1.bdstatic.com/r/www/cache/ecom/esl/2-0-4/esl.source.js)

今天，ESL release 了 2.0.4。到这里本应该完了，不过好像内容少了点。为了凑数，还是多扯几句吧：

<!-- more -->

### 为什么使用ESL而不用RequireJS

很官方的答案是，ESL比RequireJS：

- 体积更小 (Smaller) 
- 性能更高 (Higher performance)
- 更健壮 (More Robustness)
- 不支持在`非浏览器端`使用 (Browser only)
- 依赖模块`用时定义` (Lazy define)

作为ESL的主要开发者，我个人的答案是：

1. 上面的吹牛都不是吹牛，都是真的。
2. 蚊子再小也是肉，有更小性能更高的干嘛不用？
3. 反正换个Loader没成本的咯，就改个script的src，分分钟的事。不行再换回来也是分分钟的事。只有选Framework选对象这种事情，选错了替换成本才会比较高。

诚信是做人之本，欺瞒消费者是令人痛恨的行为。所以在这里要说一下：RequireJS提供了一些非AMD标准的功能，比如`data-main`、比如可以直接require一个url。ESL是不支持的。如果你用到这些功能，并且觉得这些功能很有用的话，还是不要换了。


### 2.x和1.x相比是breaking change吗

有的ESL 1.x的使用者，一看到第一位版本号加了，是不敢升级的。在common sense里，第一位版本号的增加代表的是breaking change。但是，ESL本身是个AMD Loader啊，breaking change难道就不是AMD了么？显然ESL不敢这么玩。

真实情况是这样的：我们完成了对`shim`的支持。ESL已经做到AMD特征完备了。这也算是个里程碑吧。所以，这一次我们跳到了2.x。


### 为什么发布2.0是2.0.4而不是2.0.0

大约1个月前，我们就已经release 2.0.0。虽然有完善的测试用例做支撑，但我们觉得，万事无绝对。所以我们在一些Baidu的产品线中先使用验证，这些产品线的业务场景都比较复杂。验证过程中还真发现一个在包含resource的复杂场景下和加载过程有关的bug: [issue35](https://github.com/ecomfe/esl/issues/35)

现在我们觉得，应该比较稳定了，所以在blog上发出来，给出一个交代。

但是，下面这个理由应该更可信一点：快过年了，大家都歇了，没人写blog，只能发这种东西来凑数了。


### 下载下来用？还是直接使用ESL提供的CDN？

先看看ESL提供的CDN引用地址：

```html
<!-- compressed -->
<script src="http://s1.bdstatic.com/r/www/cache/ecom/esl/2-0-4/esl.js"></script>

<!-- source -->
<script src="http://s1.bdstatic.com/r/www/cache/ecom/esl/2-0-4/esl.source.js"></script>
```

一看这个URL就很山寨，有没有？有没有？？？？为了让大家放心使用，在这里偷偷爆尿下，我们很多在Baidu搜索结果页面上的资源就是用的这个CDN，稳定性很高。

当然，下载使用还是CDN使用本来就是开发者的偏好，大家自己决定。这里只是想提一句，我们提供的CDN引用是稳定有诚意的，不是坑爹的。


### 最后

如果你开发中还是各种手工引入JS，那么，建议你使用AMD的方式开发。我们不能总是活在原始社会。

如果你已经在用SeaJS，在已有项目中也没必要换到AMD来，虽然AMD应用面更广泛一些。

如果你想更深入了解AMD，可以看看我之前写的几篇写到吐血、写到今年都不想再写了的blog。内容比较长，很能考验读者的耐心。其中，第三篇的一些内容，已经过时了：

- [玩转AMD系列 - 设计思路篇](http://efe.baidu.com/blog/dissecting-amd-what/)
- [玩转AMD系列 - 应用实践篇](http://efe.baidu.com/blog/dissecting-amd-how/)
- [玩转AMD系列 - Loader篇](http://efe.baidu.com/blog/dissecting-amd-loader/)

如果你觉得我们还算有诚意，给个star支持下呗，反正不花钱。

<iframe src="https://ghbtns.com/github-btn.html?user=ecomfe&repo=esl&type=star&count=true" frameborder="0" scrolling="0" width="170px" height="20px"></iframe>














