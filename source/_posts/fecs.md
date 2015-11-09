---
title: 前端代码风格检查套件 FECS
date: 2015-11-9
author: 我佛山人
author_link: http://weibo.com/wfsr
tags:
- Lint
- Hint
- check
- format
- fix
- beautify
- JavaScript
- CSS
- HTML
- Less
- ESNext
---

> All code in any code-base should look like a single person typed it, no matter how many people contributed. — idiomatic.js


[![fecs](/blog/fecs/logo.png)](http://fecs.baidu.com/)

[fecs](http://fecs.baidu.com/) 是以百度前端代码规范为目标的前端代码风格套件，套件包括 [htmlcs](http://github.com/ecomfe/htmlcs)、[csshint](http://github.com/ecomfe/node-csshint)、[lesslint](http://github.com/ecomfe/node-lesslint) 和 [jformatter](http://github.com/ecomfe/jformatter)，此外还有社区的相关开源模块 ~~cssbeautify~~、csscomb、fixmyjs 和 esformatter：


|| HTML | CSS | Less | JavaScript |
| ---  | --- | ----- | ---- | ---- |
| **Linter** |`htmlcs`|`csshint`|`lesslint`|eslint+|
| **Fixer** |`htmlcs`|~~cssbeautify~~ csscomb|~~cssbeautify~~ csscomb|fixmyjs `jformatter` esformatter|

显而易见，`fecs` 不仅能检查 HTML/CSS/LESS/JavaScript 代码的规范问题，而且还能修复代码的规范问题。


### 代码检查

![fecs-check](/blog/fecs/check.png)

代码的检查，目前主要是以百度前端代码规范（[JS](https://github.com/ecomfe/spec/blob/master/javascript-style-guide.md)/[CSS](https://github.com/ecomfe/spec/blob/master/css-style-guide.md)/[HTML](https://github.com/ecomfe/spec/blob/master/html-style-guide.md)） 的检查为首要目标，同时根据 [EFE](http://efe.baidu.com/) 的技术规划，为 [Less 代码规范](https://github.com/ecomfe/spec/blob/master/less-code-style.md) 的检查带来了 lesslint。

<!-- more -->

#### JavaScript

相对于前端的其他语言，JS 的 linter 选择众多，然而我们最终选择了 eslint，同时针对我们的代码规范作了新的规则实现或调整（[FECS 自有规则](https://github.com/ecomfe/fecs/wiki/FECSRules)）。至于选择 eslint 的原因， 见《[JavaScript 代码静态质量检查](http://efe.baidu.com/blog/js-lints/)》。


#### CSS

CSS 的 linter 相对于 JS 的则要少得多，基本上是 csslint 一枝独秀，也因此造成了 csslint 更新慢，扩展性差的现状，于是有了我们自己的 csshint，目标是比 csslint 更好用的 CSS linter。有关 CSS linter 的对比，参考 《[CSS 代码静态质量检查](http://efe.baidu.com/blog/css-lints/)》。


#### Less

[Less](http://lesscss.org/) 2009 年才发布，而且最终会编译为 CSS，因此针对 Less 的 linter 是少之又少，只有一个 基于 csslint 的 grunt-lesslint，因此我们需要 lesslint。由于 Less parser 生成的 AST 信息太少，不利于 linter 的检查，我们正在开发用于 lesslint 的 Less parser。


#### HTML

虽然 HTML 语言历史悠久，但是 Node.js 下的 linter 极少。相对而言，阿里同学的 [htmlhint](http://htmlhint.com/) 已经是其中比较好用的。只可惜无法覆盖我们的 HTML 规范，甚至有的规则实现与我们的规范背道而驰。我们用完全不同的思路实现了 htmlcs。htmlcs 创造性地在同一个规则下，实现 lint 和 format，这点 eslint 在 [1.4.0](http://eslint.org/blog/2015/09/eslint-v1.4.0-released/) 版本之后才实现。在 lint 方面，htmlcs 既支持在 parse 期订阅事件实现语法及风格方面的规则，也支持构建虚拟 DOM 树的检查，因此 linter 的规则非常易于实现，内置的规则实现已经非常丰富。未来还有复杂的标签嵌套检查规则实现。对现有 HTML linter 的现状感兴趣的话，可以阅读 《[HTML代码风格检查工具对比](http://efe.baidu.com/blog/comparison-of-html-linting-tool/)》。


### 代码修复

![fecs-format](/blog/fecs/format.png)

代码修复方面，常见的各种 beautify 工具，主要负责格式化，目前所做的修复工作都比较有限，也正因为如此，未来代码修复可做的事情非常多。

#### JavaScript

从图中很明显的看到，为了修复 JS 代码，fecs 使用了 fixmyjs、jformatter 和 esformatter 三个的模块。其中 fixmyjs 源于 jshint 团队，除了少数几个固定的修复，主要是针对 jshint 的检查结果作修复，但实现的规则并不多，所以我们需要 jformatter。而 esformatter 是名副其实的只做格式化。另外，`eslint` 在 [1.4.0](http://eslint.org/blog/2015/09/eslint-v1.4.0-released/) 版本之后开始支持 `--fix` 参数，借鉴 fixmyjs 针对检查的结果作修复，只是直到最新的 **1.8.0** 版本，能修复的点仍然很少。


#### CSS/LESS

由于 CSS 的 语言特性，CSS 的代码修复基本上只需要做 beautify，除了 cssbeautify 之外还有 cssfmt 与 perfectionist，其中 cssbeautify 功能比较简单，而 cssfmt 和 perfectionist 都基于 postcss，同质化较严重。而 csscomb 相对来说是功能比较强大，目前由于属性定义间换行的功能没有实现，所以 fecs 引入较小的 cssbeautify 来解决。不过刚发现 csscomb 有 `space-between-declarations` 的实现，只要配置为 `\n` 即可实现不同属性定义的换行，因此下个版本中将移除对 cssbeautify 的依赖。


#### HTML

htmlcs 实现了完整的 beautify 功能，同时针对某些规则作了修复，比如添加 doctype、页面编码和标题，移除冗余的 style 和 script 标签的 type，布尔值属性的处理等等。另外值得一提的是，对于 style 和 script 标签的代码，fecs 也能轻松处理。


### 其他

#### 文件流转

借鉴 gulp，通过 vinyl-fs 读取文件流，glob pattern 通过子命令的参数指定：

> $ fecs path/to/dir path/to/file pattern

当然也可以直接在 `.fecsrc` 或 `package.json` 中配置 **files** 节点，然后直接使用：

> $ fecs


#### 配置文件

配置文件的支持来自 [manis](http://github.com/ecomfe/manis)，支持使用 `.fecsrc` 或 `package.json`，但以第一个找到的为准。下面以 `.fecsrc` 为例：

```json
{
    "files": [],

    "eslint": {...},

    "csshint": {...},

    "htmlcs": {...},

    "csscomb": {...}
    ...
}
```

**files** 数组配置的是 fecs 要检查的文件 pattern，在当前目录下执行 `fecs` 命令不指定路径或文件时使用。其他节点是针对相应模块的配置。当使用 `package.json` 配置时，需将以上内容置于 **fecs** 节点。


#### 错误报告

错误报告默认为英文格式，由各 linter 直接提供。fecs 根据百度前端代码规范，作了一次影射转换，通过指定 reporter 为 baidu 可以看到中文的报告输出效果，对于某些比较抽象的描述，会同时在括号内提供英文原文补充说明。


#### 结果格式

各编辑器、IDE 对 linter 结果的格式，事实上的标准是 CheckStyle，为方便第三方工具，我们还另外提供有 XML、HTML 和 JSON 格式的检查结果。


#### 相关插件

 + [VIM](https://github.com/hushicai/fecs.vim)
 + [WebStorm](https://github.com/leeight/Baidu-FE-Code-Style#webstorm)
 + [Eclipse](https://github.com/ecomfe/fecs-eclipse)
 + Sublime Text 2/3 [Baidu FE Code Style](https://github.com/leeight/Baidu-FE-Code-Style) [Sublime Helper](https://github.com/baidu-lbs-opn-fe/Sublime-fecsHelper)
 + [Visual Studio Code](https://github.com/21paradox/fecs-visual-studio-code)
 + [Atom](https://github.com/8427003/atom-fecs)
 + [Grunt](https://github.com/ecomfe/fecs-grunt)
 + [Gulp](https://github.com/ecomfe/fecs-gulp)
 + [Git Hook](https://github.com/cxtom/fecs-git-hooks)
 + [Kudo](https://github.com/ecomfe/kudo)


#### 相关链接

+ [FECS 官网](http://fecs.baidu.com/)
+ [FECS WIKI](http://github.com/ecomfe/fecs/wiki)
+ [FECS 源码](http://github.com/ecomfe/fecs)

#### 相关文章

+ [JavaScript 代码静态质量检查](http://efe.baidu.com/blog/js-lints/)
+ [CSS 代码静态质量检查](http://efe.baidu.com/blog/css-lints/)
+ [HTML代码风格检查工具对比](http://efe.baidu.com/blog/comparison-of-html-linting-tool/)
