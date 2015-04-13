---
title: Fontmin 发布 0.6.0
date: 2015-04-14
author: junmer
author_link: http://weibo.com/1957223403
tags:
- font
- tool
- 中文字体
---

Fontmin 是一个纯 JavaScript 实现的字体子集化[^1]方案。
提供了 `ttf 子集化`, `ttf 转 eot`, `ttf 转 woff`, `ttf 转 svg`, `css 生成` 等功能, 便于应用 webfont[^2] 提升网页文字体验

[1]: 提取字体中的部分字型，最小化打包字体
[2]: 利用 CSS3 的 @font-face 属性，把自定义的特殊字体嵌入到网页中

<p data-height="268" data-theme-id="0" data-slug-hash="raEXBX" data-default-tab="result" data-user="firede" class='codepen'>See the Pen <a href='http://codepen.io/firede/pen/raEXBX/'>Fontmin Example</a> by Firede (<a href='http://codepen.io/firede'>@firede</a>) on <a href='http://codepen.io'>CodePen</a>.</p>
<script async src="//assets.codepen.io/assets/embed/ei.js"></script>

前方长文, 客官请先 star 再看呗，反正不花钱 :-)

<iframe src="https://ghbtns.com/github-btn.html?user=ecomfe&repo=fontmin&type=star&count=true" frameborder="0" scrolling="0" width="170px" height="20px"></iframe>

<!-- more -->

## Why Fontmin 

`浏览器`的季风已撩拨起 `webfont` 的热浪, 中文字体却依旧寂寞如雪。
与西文字体不同, 由于字符集过大, 中文字体无法享受 webfont 带来的便利。所以, 为了让中文字体也乘上这道风, 我们需要对其进行子集化 (`min`)。

已有的字体子集化工具有 [sfnttool.jar](https://code.google.com/p/sfntly/)(Java), [Fontforge](https://github.com/fontforge/fontforge)(Python), [Font Optimizer](https://bitbucket.org/philip/font-optimizer/src/)(Perl), 为什么还要造轮子呢?

> Any application that can be written in JavaScript, will eventually be written in JavaScript.
> -- Jeff Atwood

噗, 开个玩笑。靠谱的说，是这样的: 

- 专注, 面向前端工程师, 专注字体的 web 应用
- 工程化, 自动化开发流程, 告别刀耕火种的人肉操作 
- 社区, 依靠社区的力量, 可以有更多的玩法, 如: [font-spider](https://github.com/aui/font-spider)

以上. [Fontmin](http://ecomfe.github.io/fontmin/) 提供了多种方式，带你玩转字体

## node 模块 

npm 模块 [fontmin](https://www.npmjs.com/package/fontmin), 基于 stream 处理字体文件，简单高效，方便扩展。可以与 [gulp](https://github.com/gulpjs/gulp) 插件 自由搭配。

```
var Fontmin = require('fontmin');
var rename = require('gulp-rename');

var fontmin = new Fontmin()
    .src('fonts/big.ttf')
    .use(rename('small.ttf'));
```

提供细粒度 [plugins](https://github.com/ecomfe/fontmin#plugins), 你可以自由定制专属的 webfont 压缩方案，比如: 把字体转为 base64 嵌入到 css 中:

```
var Fontmin = require('fontmin');

var fontmin = new Fontmin()
    .use(Fontmin.css({
        base64: true		// 开启 base64 嵌入, 默认关闭
    }));
```

输出 css :

```
@font-face {
    font-family: "eduSong";
    src: url("eduSong.eot"); /* IE9 */
    src: url("eduSong.eot?#iefix") format("embedded-opentype"), /* IE6-IE8 */
    url(data:application/x-font-ttf;charset=utf-8;base64,AAEAAAAKAIAAAwA....) format("truetype"), /* chrome、firefox、opera、Safari, Android, iOS 4.2+ */
    url("eduSong.svg#eduSong") format("svg"); /* iOS 4.1- */
    font-style: normal;
    font-weight: normal;
}
```

## 命令行

极客范儿? 就是喜欢弹奏键盘这种飘逸的感觉～

全局安装 fontmin 

```
npm install -g fontmin
```

![](/blog/fontmin-0.6.0/img/terminal.png)

## 客户端

懒得写代码? 直接拖进来, duang 一下，就搞定了~

![](/blog/fontmin-0.6.0/img/app.png)

## EOF

感谢

