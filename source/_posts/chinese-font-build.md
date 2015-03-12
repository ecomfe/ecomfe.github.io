---
title: 中文字体 webfont 自动化构建 
date: 2015-03-12
author: junmer
author_link: http://weibo.com/1957223403
tags:
- font
- tool
- 中文字体
---


![](/blog/chinese-font-build/img/history.gif)

关于字体，长久以来，前端工程师们 进行了各种探索：`图片`，`siFR`，`Cufon`，`@font-face` ...

`@font-face` 似乎是个不错的方案，[Adobe TypeKit](https://typekit.com/fonts) , [Google Fonts](http://www.google.com/fonts/) 都在使用这个方案。但是，中文字体 因为字符集巨大，浏览器、操作系统国情 等原因，发展受到了很大限制。所以，时至今日，大多数网站的中文字体还是上图片。图片字体的悲伤：SEO 不友好，不具备的可编辑性，不支持 [Accessibility](http://en.wikipedia.org/wiki/Accessibility) 原则 ... 差评！

随着 `PC` 的更新换代，操作系统的升级，移动设备的崛起，`@font-face` 兼容性已经不足为患。`ttf`, `svg`, `eot`, `woff` 总有一款适合您。那么剩下的主要问题就是中文字符集过大了。

以上，我们的解决方案就是：基于 [edp](https://github.com/ecomfe/edp) 和 [fontmin](https://github.com/ecomfe/fontmin)，按需提取字型，多格式转换，自动化构建字体。

<!-- more -->

### 首先，你要有个 `edp`

```
$ npm install -g edp
```

### 示例 

```
$ git clone https://github.com/junmer/edp-build-fontmin-demo    # 下载 示例项目
$ cd edp-build-fontmin-demo                                     # 进入 示例项目 路径
$ npm install edp-build-fontmin                                 # 安装 edp-build-fontmin 依赖
$ edp build -f                                                  # 开始构建
```


### 配置

```
var FontProcessor = require('edp-build-fontmin');
var fontProcessor = new FontProcessor({
    files: [ '*.ttf' ],                     // 字体文件
    entryFiles: [ '*.html' ],               // 引用字体的网页，用来扫描所需字型
    text: '他夏了夏天',                       // 人肉配置所需字型
    chineseOnly: true,                      // 只取中文字型，忽略 数字、英文、标点
});
```


### 效果

```
$ edp ws start
```

打开 `http://127.0.0.1:8848/` 和 `http://127.0.0.1:8848/output/` 对比效果

构建前:

![](/blog/chinese-font-build/img/before.png)

构建后:

![](/blog/chinese-font-build/img/after.png)

字体文件 `5.1 MB` -> `29.1 KB`, 效果 萌萌哒  (￣y▽￣)~*


### 相关项目

- [edp](https://github.com/ecomfe/edp) 一个基于 Node.JS 与 NPM 的企业级前端应用的开发平台
- [fontmin](https://github.com/ecomfe/fontmin) 第一个纯 JS 字体解决方案
- [edp-build-fontmin](https://github.com/ecomfe/edp-build-fontmin) edp fontmin 插件
- [fonteditor](http://font.baidu.com/editor/) 在线字体编辑器


### 致敬

- 题图：[汉字书体年表](http://blog.typeland.com/articles/169) by [typeland](http://blog.typeland.com/)
- 示例字体：[新蒂下午茶体](http://font.sentywed.com/index_htm_files/SentyTEA-Platinum.ttf) 非商业免费授权，商业授权请联系 [新蒂字体](http://font.sentywed.com/)
- 示例文字：[他夏了夏天](http://music.baidu.com/song/218698/07053564a0854da1aa8) by 苏打绿
