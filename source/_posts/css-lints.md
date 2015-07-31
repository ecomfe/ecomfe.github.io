---
title: CSS 代码静态质量检查
date: 2015-07-02
author: ielgnaw
author_link: http://weibo.com/justjava
tags:
- Lint
- Hint
- Check
- CSS
- NodeJS
---

关于代码静态质量检查，在大佛的上一篇文章 《[JavaScript 代码静态质量检查](http://efe.baidu.com/blog/js-lints/)》中已经说得很明白了，虽然主要讲的是 JavaScript 方面，但代码静态质量检查的本质是不变的，今天我们来介绍一下 CSS 方面的静态质量检查。

CSS 中也有一些 Lint 工具，例如 [CSSLint](https://github.com/CSSLint/csslint)，[PrettyCSS](https://github.com/fidian/PrettyCSS)，[recess](https://github.com/twitter/recess)，[CKStyle](https://github.com/wangjeaf/ckstyle-node)，[stylelint](https://github.com/stylelint/stylelint)，当然还有百度 EFE 出品的 CSS 代码风格检查工具 [CSSHint](https://github.com/ecomfe/node-csshint)。本文将从功能、性能、适用范围、规则实现、个性化几个方面对这几个 Lint 工具进行对比。

<!-- more -->


### [CSSLint](http://csslint.net)

`CSSLint` 和它底层所使用的解析器 [`parserlib`](https://github.com/CSSLint/parser-lib) 都是 [Nicholas C. Zakas](http://www.nczonline.net/) 的作品（当然，[`ESLint`](https://github.com/eslint/eslint) 也是他的作品）。它适用于浏览器以及 CLI 环境，在浏览器端和 CLI 环境中分别是两套代码，这么做的原因是它的底层库 `parserlib` 在浏览器和 CLI 环境分别是两套。

功能上，`CSSLint` 提供了对 CSS 的解析、检查等功能。在规则实现方面，无法通过 JSON 配置来管理，默认的规则全部在 `src/rules/` 目录中，要添加自定义规则，必须通过全局的 **CSSLint.addRule** 方法来实现。

实现上，`CSSLint` 主要是利用事件监听，在底层 parse CSS 过程中触发事件，例如 **startstylesheet**、**endstylesheet**、**charset**、**import**、**namespace**、**startmedia**、**endmedia**、**startpage**、**endpage**、**startrul** 和 **endrule** 等，事件回调中会返回当前 AST 的信息，开发者根据这些信息来进行规则检测。

性能上，如果不添加自定义的规则，性能还是不错的，但是一旦添加自定义规则，性能就会打些折扣。这是底层解析器 `parserlib` 的原因，`parserlib` 功能比较单一，而且返回的 AST 上信息不是很丰富，也不支持插件机制，因此要实现一些自定义的规则，基本只能靠正则匹配来实现。

`CSSLint` 开发时间比较早，同时也因为大神的影响力，因此现在周边配套非常丰富，支持各种编辑器例如：`Textmate`, `Sublime Text`, `Atom`, `Vim`, `Emacs` 等等。


### [PrettyCSS](https://github.com/fidian/PrettyCSS)

`PrettyCSS` 是一个比较出色的 Lint 工具，但它并不算是一个纯粹的 Linter，更应该把它称作一个 Parser，这也是它出色的原因。在 Parser 里面实现的 Linter 以及 Pretty，这样可以最大程度的保证 Linter 的精确度。它适用于浏览器端、作为 Node.js 模块以及 CLI 工具。

实现上来说，在 Parser 中集成 Linter 即在 Parse 阶段就把 Linter 的规则给检测了，因此性能较好。当然缺点也比较明显，就是无法自定义规则。

如果 `PrettyCSS` 未来能够提供插件机制，允许自定义规则，会更有吸引力。


### [recess](http://twitter.github.com/recess)

Twitter 出品的 CSS 代码质量检查工具，可以作为 Node.js 模块和 CLI 工具来使用，不知道是什么原因，master 分支已经两年没有维护了，v2.0.0 分支也有将近半年没有更新了。

比较有特点的是，`recess` 没有用任何 CSS 解析器，而是直接用 Less 解析器来做的，因此也就默认了一个编译 Less 的功能，但其他方面的功能就比较弱了，可能是时间比较早的原因吧。所有默认规则都在 **lib/lint/** 目录下，没有插件机制，无法扩展。

实现上，结合 Less parse 出来的 AST 进行规则分析检查，性能上表现一般，因为 Less parse 后还会有 **toCSS** 这么一步，本质上就会比纯 CSS 解析器要多一个步骤。在规则的实现程度上也比较一般，只实现了**八**个规则，这可能也是因为底层是 Less 解析器的原因。

就目前来看，v2.0.0 相对于 master 来说并没有改动太多，整体结构没有变化，底层还是使用 Less 解析器，区别仅仅是增加了一个 **data-uri** 的规则以及修改了一些 codestyle。


### [CKStyle](http://ckstyle.github.io)

`CKStyle` 是国产的 CSS 代码检查工具，定位是`一脉相承的 CSS 检查、美化、修复、压缩工具`。适用范围包括在浏览器端使用、作为 Node.js 模块以及 CLI 工具。这个工具最开始是 [python 版本](https://github.com/wangjeaf/CSSCheckStyle)的，大约一年前改成 Node.js 版本了。这个版本和之前的 python 版本比较起来，增加了一些默认的规则实现以及提供了浏览器端的支持。

`CKStyle` 在功能上还是比较丰富的，它提供了对 CSS 的解析、检查、fix 和压缩。但是它同样无法通过配置文件来管理规则，默认的规则全部在 **ckstyle/plugins/** 目录中，要添加自定义规则，只能在全局 `global` 上挂载一个 `RuleChecker` 的子类。

实现上，`CKStyle` 直接解析 CSS 文件，然后结合返回的 AST 对象做一些规则的检测。性能比较不错，这是因为底层 CSS 解析器是自己根据默认的规则来定制的，很少有正则上的一些匹配。这就好像是坑是自己挖的，那么自己总能想到一个简单快速的方法把坑填满一样。

`CKStyle` 整体规模上看起来比较大，但是不知道什么原因，并没有在社区流行。亮点是功能很丰富，检查、美化、修复和压缩全都有，甚至提供了一个服务 `CKService`，帮助检查网站的 CSS。


### [stylelint](https://github.com/stylelint/stylelint)

`stylelint` 本质上和下面将要介绍的 `CSSHint` 是一样的，都是基于 `postcss` 解析器实现的，除了规则实现的数量不一样，最大的区别就是 `stylelint` 是用 ES6 写的。所以这里就不介绍了，直接看下面的 `CSSHint` 了。


### [CSSHint](https://github.com/ecomfe/node-csshint)

`CSSHint` 是百度 EFE 出品的 CSS 代码风格检查工具，在 2014 年底应公司内部全面推行代码规范检查的需求而产生的。目前 `CSSHint` 支持 Node.js 模块以及 CLI 方式使用，提供对 CSS 的解析和检查等功能，通过 JSON 文件来管理规则的配置。

在项目刚开始设计阶段，我们曾考虑使用大神的 `CSSLint`，但在经过调研后发现，`CSSLint` 在针对我们自己的[规范](https://github.com/ecomfe/spec/blob/master/css-style-guide.md)做规则检测的时候，发现一些问题：首先 `CSSLint` 默认实现的规则里面并不能完全覆盖我们自己的[规范](https://github.com/ecomfe/spec/blob/master/css-style-guide.md)，其次，在单条规则上，对规则匹配度也不够，最后，基于 `CSSLint` 来写插件不太方便。因此，我们决定基于 `CSSLint` 解析器 `parserlib` 重新实现一套 CSS 代码检查工具。这就是 **0.1.0** 版本之前的 `CSSHint`，经过一段时间的使用我们发现这个解析器返回的 AST 上信息太少，而且针对解析器来写插件也不方便。因此在 **0.1.0** 版本的重构中，我们把底层解析器换成了 [`postcss`](https://github.com/postcss/postcss)(`postcss` 和 `parserlib` 相比，最大的优点是优秀的插件机制，而且 AST 上的信息也更完整），同时改变了实现的方式，在性能和功能上较 **0.1.0** 之前版本有较大的提升。

得益于 `postcss` 优秀的插件机制，`CSSHint` 提供了较为丰富的规则实现，每个规则实际上就是一个 `postcss` 的插件，扩展新规则比较方便，只需注册到 **postcss.plugin** 上即可。

在实现上，也是直接解析 CSS 文件，然后在每个插件里面调用 **node.eachRule** 或者 **rule.eachDecl** 来实现对选择器或者属性的遍历，回调函数中返回的是 AST，然后根据这些信息做规则的检测。同时针对我们的需求，`CSSHint` 提供了行内注释的方式来动态的配置规则。

`CSSHint` 目前还不支持浏览器端使用，相对于 `CKStyle` 的大而全，`CSSHint` 更加专注于 Lint 本身。覆盖更多的规则（包括 [CSSLint的规则](https://github.com/CSSLint/csslint/wiki/Rules)）、提供更易用扩展方式、提供更加灵活的行内注释指令匹配方式（开启、关闭、嵌套）等功能才是 `CSSHint` 的专注方向。


### 总结

`CSSLint` 中规中矩，各个方面比较均衡，如果你是大神**Nicholas C. Zakas**的粉丝，那么 `CSSLint` 是你的必选项。

`PrettyCSS` 性能比较好，如果 `PrettyCSS` 默认实现的规则可以满足你并且你不会有自定义规则的需求的话，那么 `PrettyCSS` 就是你的不二之选。

`recess` 虽然师出名门，但是维护跟不上，在功能上已经不能满足如今的需求了，只能当做代码学习来使用了。

`CKStyle` 功能丰富，但是精细程度不是太高，如果你要求不太高，对功能的丰富程度更加在意，那么推荐使用 `CKStyle`，而且是国人出品，中文文档，看起来也比较方便。

`stylelint` 本质上和 `CSSHint` 一样，可以作为一个 ES6 的学习项目。

`CSSHint` 已经发布了 `0.2.0` 版本，在扩展性、规则的自定义上表现不错，同时，除了满足我们自己的[规范](https://github.com/ecomfe/spec/blob/master/css-style-guide.md)，还覆盖了 `CSSLint` 的规则。目前来看，`CSSHint` 是覆盖规则最全的一个 CSS 代码风格检查工具了，而且扩展起来也比较方便，另外，行内注释指令的功能在其他 Lint 工具上也是没有的，个人来看，未来的潜力比较大。
