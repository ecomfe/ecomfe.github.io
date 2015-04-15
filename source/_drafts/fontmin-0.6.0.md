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

[Fontmin](http://ecomfe.github.io/fontmin/) 是一个纯 JavaScript 实现的字体子集化方案。

提供了 `ttf` 子集化，`eot/woff/svg` 格式转换，`css` 生成 等功能，助推 webfont 发展，提升网页文字体验。

<p data-height="350" data-theme-id="0" data-slug-hash="raEXBX" data-default-tab="result" data-user="firede" class='codepen'>See the Pen <a href='http://codepen.io/firede/pen/raEXBX/'>Fontmin Example</a> by Firede (<a href='http://codepen.io/firede'>@firede</a>) on <a href='http://codepen.io'>CodePen</a>.</p>
<script async src="//assets.codepen.io/assets/embed/ei.js"></script>

<!-- more -->

## Why Fontmin 

浏览器的季风已撩拨起 webfont 的热浪，中文字体却依旧寂寞如雪。

与西文字体不同，由于字符集过大，中文字体无法享受 webfont 带来的便利。 

为了让中文字体也乘上这道风，我们需要对其进行 `min`:

- 子集化：提取字体中的部分字型，最小化打包字体
- webfont 格式化：利用 `@font-face`，把自定义字体嵌入到网页中，支持 `ttf`、`woff`、`eot`、`svg` 等格式 

已有工具 [sfnttool.jar](https://code.google.com/p/sfntly/) (Java)，[Fontforge](https://github.com/fontforge/fontforge) (Python)，[Font Optimizer](https://bitbucket.org/philip/font-optimizer/src/) (Perl)，为什么还要造轮子呢?

> Any application that can be written in JavaScript, will eventually be written in JavaScript.
> -- Jeff Atwood

噗，开个玩笑。靠谱的说，是这样的：

- 专注，面向前端工程师，专注字体的 web 应用
- 工程化，自动化开发流程，告别刀耕火种的人肉操作 
- 社区，依靠社区的力量，可以有更多的玩法，如：[edp-build-fontmin](http://efe.baidu.com/blog/chinese-font-build/), [font-spider](https://github.com/aui/font-spider)

以上，[Fontmin](http://ecomfe.github.io/fontmin/) 提供了多种方式，带你玩转字体。

## node 模块 

npm 模块 [fontmin](https://www.npmjs.com/package/fontmin)，基于 [stream](https://nodejs.org/api/stream.html) 处理字体文件，简单高效，方便扩展。可以与 [gulp](https://github.com/gulpjs/gulp) 插件 自由搭配。

```
var Fontmin = require('fontmin');
var rename = require('gulp-rename');

var fontmin = new Fontmin()
    .src('fonts/big.ttf')
    .use(rename('small.ttf'));
```

提供细粒度 [plugins](https://github.com/ecomfe/fontmin#plugins)，你可以自由定制专属的 webfont 压缩方案，比如：把字体转为 base64 嵌入到 css 中：

```
var Fontmin = require('fontmin');

var fontmin = new Fontmin()
    .use(Fontmin.css({
        base64: true		// 开启 base64 嵌入，默认关闭
    }));
```

输出 css：

```
@font-face {
    font-family: "eduSong";
    src: url("eduSong.eot"); /* IE9 */
    src: url("eduSong.eot?#iefix") format("embedded-opentype"), /* IE6-IE8 */
    url(data:application/x-font-ttf;charset=utf-8;base64,AAEAAAAKAIAAAwA....) format("truetype"), /* chrome、firefox、opera、Safari, Android，iOS 4.2+ */
    url("eduSong.svg#eduSong") format("svg"); /* iOS 4.1- */
    font-style: normal;
    font-weight: normal;
}
```

为方便大家使用，提供一个最基本的 webfont 工作流 snippet：

```
var Fontmin = require('fontmin');

var srcPath = 'src/font/*.ttf'; // 字体源文件
var destPath = 'asset/font';    // 输出路径
var text = '我说你是人间的四月天；笑响点亮了四面风；轻灵在春的光艳中交舞着变。';

// 初始化
var fontmin = new Fontmin()
    .src(srcPath)               // 输入配置
    .use(Fontmin.glyph({        // 字型提取插件
        text: text              // 所需文字
    }))
    .use(Fontmin.ttf2eot({      // eot 转换插件
        clone: true             // 保留 ttf
    }))
    .use(Fontmin.ttf2woff({     // woff 转换插件
        clone: true             // 保留 ttf
    }))
    .use(Fontmin.ttf2svg({      // svg 转换插件
        clone: true             // 保留 ttf
    }))
    .use(Fontmin.css())         // css 生成插件
    .dest(destPath);            // 输出配置

// 执行
fontmin.run(function (err, files, stream) {

    if (err) {                  // 异常捕捉
        console.error(err);
    }

    console.log('done');        // 成功
});
```

大家可以这个基础上，自由扩展，玩法多多。

## 命令行

极客范儿? 就是喜欢弹奏键盘这种飘逸的感觉～

全局安装 fontmin 

```
npm install -g fontmin
```

![](/blog/fontmin-0.6.0/img/terminal.png)

## 客户端

懒得写代码? 直接把 `TTF` 拖进来，左侧输入需要文字，右侧实时看效果。点击生成，duang 一下，就搞定了~

![](/blog/fontmin-0.6.0/img/app.png)

可以在 [这里](https://github.com/ecomfe/fontmin-app/releases) 找到最新版本。

## EOF

- 本文封面：[Fontmin Example](http://codepen.io/firede/pen/raEXBX) by [@Firede](http://weibo.com/firede)，[Kinda Realistic Text](http://codepen.io/lbebber/pen/dalKF) by [@lucasbebber](https://twitter.com/lucasbebber)
- 字体支持：[新蒂字体](http://www.sentyfont.com/)，[浙江民间书刻体](http://weibo.com/eonway)，[造字工房](http://www.makefont.com/)，[思源字体](https://github.com/adobe-fonts/source-han-sans)，[台湾教育部標準宋體](http://www.edu.tw/pages/detail.aspx?Node=3691&Page=17009&Index=6)

如果您觉得 Fontmin 还不错，请给个 star 呗 ヾ(◍°∇°◍)ﾉﾞ

<iframe src="https://ghbtns.com/github-btn.html?user=ecomfe&repo=fontmin&type=star&count=true" frameborder="0" scrolling="0" width="170px" height="20px"></iframe>

