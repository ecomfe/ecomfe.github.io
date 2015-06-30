---
title: HTML代码风格检查工具对比
date: 2015-06-30
author: nighca
author_link: http://nighca.me/
tags:
- HTML 
- lint
- Node.js
---

作为一个前端，不可避免同时与三个语言打交道：JS、CSS 和 HTML。而HTML，超文本标记语言，可能是其中可编程性最弱的，一直以来得到的关注都较少。另外源于浏览器对HTML逆天的容错支持，一份几乎错误百出的文档也可以在浏览器里边表现得中规中矩。这样的背景下，绝大部分被产出的HTML代码都存在着各种各样的小问题，比如缺少必要的元信息（meta），比如混乱的class、id或属性的取值格式；这些或影响页面在不同浏览器下的表现，或增大了页面的开发、维护成本。

因此，选用一个合适的HTML代码风格检查工具对HTML代码进行质量控制会是一个很有意义的事情。本文选择了AriaLinter，htmllint，HTMLHint及htmlcs这四个目前最活跃的相关项目进行对比。除此之外还存在如tidy，W3C/Mozilla HTML validator等工具，但它们专注于HTML规范，几乎不涉及代码风格上的检查，这里就不做涉及。

对比角度将主要包括以下几个方面：

* 使用及配置
* 规则实现及自定义
* 性能
* 亮点

为了后续说明的便利，这里先对语法风格的规则进行简单的分类，第一类包括`attr-value-double-quotes`（使用双引号包围属性值）, `max-length`（限制单行最大长度）, `tag-pair`（要求需要显式闭合的标签显式闭合）等；第二类包括`script-in-tail`（Javascript内容要求在页面最后嵌入）, `title-required`（要求title标签）, `id-class-ad-disabled`（不允许在id或class的值中出现ad_, ad-,  _ad, -ad等）等。这两类规则有很明显的区别，第一类偏重于代码格式（遵循与否都不影响最终语义），这里叫它格式规则；对应地，第二类偏重语义，即最终document的表现，这里叫它语义规则。一般情况下，前者更适合在语法分析阶段做，而后者更适合在分析完后基于分析结果（AST/document）进行。

### [AriaLinter](https://github.com/globant-ui/arialinter)

AriaLinter是一个基于规则（Rule based），面向HTML document的检查工具。它支持作为一个Grunt任务（最推荐的形式）、Nodejs模块或命令行工具使用。

作为一个Grunt任务或Nodejs模块被调用时，支持传入规则配置。但不支持配置文件或行内配置，及作为单独命令行工具使用时是不可配置的。

AriaLinter强调了它是“for HTML documents”，即偏语义规则的检查，做法是基于jsdom获取页面执行的结果document，接着检查其内容、结构。事实上，AriaLinter几乎没有实现任何格式规则。另外，也不支持自定义规则。

AriaLinter性能会是个问题，毕竟只是为了得到document结构的话，jsdom太重了。

AriaLinter的亮点之一是贴心地支持了template参数，当开启时部分规则不做检查。事实上这意义不大，尤其在模板语法会对HTML语法造成破坏时。

### [htmllint](https://github.com/htmllint/htmllint)

htmllint是一个2014年开始的项目，它将自己定位为一个“html5 linter and validator”，它提供了较全面的rule，实现方式也很特别。有不少的人参与了开发，文档也很齐全，奇怪的是它受到的关注度很低。

htmllint支持作为Grunt任务或Nodejs模块的使用形式。可传入规则配置。不支持配置文件，支持行内注释配置。

htmllint较好地同时支持了格式规则及语义规则。做法是将两类规则分两步做：

1. 对代码进行进行逐行lint
2. 对代码parse完成后，针对AST逐节点lint

同时也支持自定义规则。

最后在性能上，使用htmlparser2解析代码，性能较好；另外逐节点lint的方式避免了重复遍历，也有一定性能上的收益。

### [HTMLHint](https://github.com/yaniswang/HTMLHint)

HTMLHint是国人出品的HTML代码检查工具，定位是“A Static Code Analysis Tool for HTML”。

使用方式包括在Browser引入，作为Nodejs模块，及命令行工具。支持传入配置或指定配置文件。

与AriaLinter相反，HTMLHint仅在对代码进行parse的过程中进行检查。这样带来的好处是性能上的，避免了对AST/document的操作；当然这也带来局限性：规则偏格式规则。虽然HTMLHint也提供一些语义规则，但其实现建立在对parse时事件的监听上，显得吃力且不自然。

另外，HTMLHint支持自定义rule，当然，自定义rule也受到上述限制，仅能接触到parser而非AST/doument。

另一个HTMLHint设计的不合理之处在于其规则只能支持开启/关闭的配置，无法做更具体的配置。

性能应该是能提供语义规则的工具里最好的。仅有一遍parse过程，无AST/Document的遍历/查找过程。

### [htmlcs](https://github.com/ecomfe/htmlcs)

htmlcs是百度EFE出品的的HTML代码风格检查工具，项目始于2014年底，应百度内部全面推行代码规范检查的需求而生。

htmlcs支持以Nodejs模块，或命令行工具的形式使用，在grunt/gulp中使用时需要手动包装。作为模块调用时，可传入自定义配置对象；作为命令行工具使用时，支持配置文件。另外也支持代码行内配置。

htmlcs提供了较丰富的规则实现，包括格式规则及语义规则，也支持添加自定义规则。在实现时针对性分为parse时规则（类HTMLHint实现方式）及面向document的规则（类AriaLinter的规则行为），前者监听parser事件，后者直接读取document结构。特别地，这里的document结构被进行了包装，依据[DOM规范](http://www.w3.org/TR/dom/)实现了大部分的属性及读操作方法。因此自定义的规则可以以操作DOM的形式操作document，实现自然、便利。

另外htmlcs支持传入额外linter对HTML中内嵌的JS及CSS内容进行检查。

对于可自动修正的规则，htmlcs提供了format方法。自定义规则同样可以自定义对应的format行为。页面内嵌的JS及CSS内容也可以通过传入对应的formatt方法进行格式化。

htmlcs的性能不是优势，处于可接受的程度。HTML代码的parse基于htmlparser2，但对结果对象有一个封装的过程；另外规则的实现方式（查找/遍历的频次）也在一定程度上影响最终表现。

### 总结

AriaLinter短板明显，除非只关注语义规则，否则大部分情况下都不能满足需求。htmllint能满足基本需求，但优点不明显。如果对性能较为敏感，推荐HTMLHint。而htmlcs在扩展性、自定义能力上表现突出，覆盖的规则可能也是目前最全的，从个人角度看是大部分情况下的推荐选择。
