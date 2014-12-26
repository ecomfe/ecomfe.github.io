该 repos 是 EFE 技术体系的官网，第一内容主体是 **Blog** 。

EFE技术体系鼓励工程师更多地提交Blog，以推动技术普及、扩大EFE影响力和个人的技术影响力。


### Blog 提交要求

各团队请自行规范具体的提交要求。推荐如下：

- **T6及以上** 工程师，每季度必须至少提交 `1` 篇。
- **T3/4/5** 工程师，鼓励提交，团队负责人可以进行 KPI 激励。


### Blog 内容要求

Blog内容应当与前端技术有所关联，包括但不局限于：

- 前端技术，如CSS、JavaScript、Web性能优化等。
- 与前端有较强关联的后端、运维等技术，如Web Server、Nginx、NodeJS等。
- 与前端有关的脚本技术，如通过Python、Ruby、NodeJS、Java Ant等对前端代码进行构建，使用各种包管理工具等。
- UE、UX相关的内容，如色彩、布局、视觉、首屏、用户体验等。

Blog的内容应该具有 `原创性` 和 `独到性`。 以下类型的内容是较好的：

- 对于一个细节点进行深入探讨，例如《文本居中在各种场合下的方案》、《HTTP缓存解析》等，重点在于深入、详细。
- 对于一个体系型话题的描述，例如《Web性能优化的基本过程和方法》、《前端构建》等，重点在于对一个体系的各方面均有涉及。
- 对项目工作中的（非保密的）经验的分享，如针对某系统的一次代码整顿，发现大家经常会犯的编码、设计错误等。
- 对于某个工具、框架、库的使用，此类应当包含一个实战示例，便于上手，如《使用各MVC框架开发TODO工具》等。
- 对有价值的外文文章的翻译，需保持翻译的质量，并且在文章中附带原文链接。

同时，对于质量不高、话题无关或者其它原因产生的低质量的文章，我们将根据具体情况不予采编或者直接移除，包括但不限于：

- **不得** 直接使用他人的文章，如有发现直接移除。
- **不得** 涉及公司保密信息，尽量不要出现直接的项目代码，如有发现后果自负。
- **不推荐** 搜索引擎、社区中已经广泛存在且有定论的内容，比如《如何使带Alpha通道的PNG32图片在IE6下显示半透明效果》这类的话题。


### 如何提交 Blog

1. fork 当前 repos，切换到 `efe` 分支。
2. 在 `source/_drafts` 目录下创建Blog文件。Blog文件要求如下： [参考示例](source/_drafts/example.md)
    - 文件名使用英文或数字，单词间以 `-` 分隔。文件名应能代表Blog内容
    - 文件名以 `.md` 作为后缀
    - 在文件开头的 Front-matter 部分编写一些信息，必填的有：`author`、`title`、`date`，可选的有 `tag`、`author_link`
    - 文件内容使用 `markdown` 语法。请参考 `source/_drafts/example.md`
    - 文件内容中，摘要部分和其余全文之间，使用独占一行的 `<!-- more -->` 分隔
3. push 到自己的 repos，发起 pull-request。

如果你已经有了自己的独立博客，则可以在提交至仓库的文章中只提供个人博客的对应链接，不需要全文。


#### 资源的存放

请Blog中用到的资源放在`与Blog标题同名`的目录里，推荐按照资源类型管理该目录。下面是目录划分的示例：

```
source/
    _drafts/
        example-blog/
            img/
                demo.jpg
            ppt/
                report.pptx
        example-blog.md
```

在文章中，对上面这种方式管理的资源，引用方式如下：

```markdown
![图片标题](img/demo.png)
[链接文字](ppt/report.pptx)
```

同时，我们推荐使用[OneDrive](http://onedrive.live.com)、[SlideShare](http://slideshare.net)存放PPT资源，使用[GitHub](https://github.com)或[Gist](https://gist.github.com)存放代码片段。


#### 作者信息

在Blog文件开头的Front-matter，通过 `author` 和 `author_link` 可以指定作者的名字和链接。

```
---
title: just example 
date: 2014-11-11
author: errorrik
author_link: http://errorrik.com/
tags:
- example 
- test
---
```

详细请参考示例 [_drafts/example](source/_drafts/example.md)

