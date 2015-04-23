title: 当我们谈论颜色时，我们在谈论什么 - 基础知识篇
date: 2015-4-24
author: Firede
author_link: http://weibo.com/firede
tags:
- color
- 前端设计感
- 用户体验
---

![](/blog/what-we-talk-about-when-we-talk-about-color-basic/cover.png)

谈到 **颜色**，前端工程师首先想起的便是基于 RGB 的 16 进制颜色代码，这也是我们工作中最常用到的 **数值表示** 方式。但是当我们的谈话再深入一些，话题远不止这些：

> 前端：「我在 hackathon 时做了个网站，配色怎么看都丑，你帮我看看？」  
> 设计：「这俩颜色不搭，光晕现象都出来了，还有把这里的饱和度调低一点，亮度调高一点。」  
> 前端：「……」（你™在说什么！）

这时你应该去向设计小伙伴要最熟悉的 16 进制颜色代码了，但被抱怨缺乏 **设计感** 的挫折还是有一点的。

想要和小伙伴愉快的交流下去，我们要了解颜色的「基础知识」，还要对「色彩空间」、「颜色搭配」、「颜色与情感」等各个方面都有些了解。~~作为一个边看书边查百科的伪设计师，~~ 我想通过这个系列与大家一起从 **颜色** 开始，培养点 **设计感**。

本篇我们一起复习一下基础知识。

<!-- more -->

## 原理

我们在中学的 **物理** 课上学过，颜色本质上是特定范围的 [电磁波](http://zh.wikipedia.org/wiki/电磁波)（如下图[^spectrum]）。

[^spectrum]: 可见光谱在电磁波中的范围，原作者：[Philip Ronan](http://en.wikipedia.org/wiki/File:EM_spectrum.svg)

![我们看到的色彩，是电磁波谱的一小部分](/blog/what-we-talk-about-when-we-talk-about-color-basic/spectrum.png)

但从 **生理** 来看，人们能看到颜色，是因为人类每只眼球视网膜大约有 600-700 万的 [视锥细胞](http://en.wikipedia.org/wiki/Cone_cell)，他们是处理可见光谱颜色的 **感光器**[^rod-cell]。
人类的视锥细胞有三种，分别是 **短波（S 或蓝色）视锥细胞**、**中波（M 或绿色）视锥细胞**、**长波（L 或红色）视锥细胞**；这些视锥细胞响应的组合，让我们能够分辨出大约一千万种颜色。

[^rod-cell]: 视细胞中还有一种 [视杆细胞](http://en.wikipedia.org/wiki/Rod_cell)，他们在黑暗条件下比较敏感，但几乎不参与对颜色的处理。

## 无障碍

我们能够看到色彩，是我们的 _身体硬件_ 附带了相应功能的 _传感器_。其他生物与我们的 _硬件构造_ 不同，看到的世界也是不同的，比如：大多数哺乳动物只有两种感光器，许多鸟类与有袋动物有四种感光器。

人类对颜色的感受也存在 **较大** 的 **个体差异**，根据网上的公开数据，色盲和色弱在人群中占有很大比率：

> 红绿色盲人口占全球男性人口约 8%，女性人口约 0.5%，他们能看到多种颜色，但是会混淆识别某些颜色，尤其是红色与绿色。
> 另外全球约6%人口为三色视觉(色弱)，约 2% 人口为二色视觉(色盲)，极少数为单色视觉(全色盲)。
>
> --维基百科[^colorblind]

[^colorblind]: 来自维基百科「色盲」词条：<http://zh.wikipedia.org/wiki/色盲>

![红、绿、蓝、黑 在人们眼中的样子](/blog/what-we-talk-about-when-we-talk-about-color-basic/colorblind.png)

所以我们在做 **无障碍** 产品的时候请将 **色彩** 的 **可用性** 也纳入考虑范围（比如数据可视化的色彩搭配）。  
这里推荐一个叫做 [Colorblinding](https://chrome.google.com/webstore/detail/colorblinding/dgbgleaofjainknadoffbjkclicbbgaa) 的 Chrome 插件，你可以看看自己的作品，在 **8%+ 的用户** 眼中是什么样子的。

## 原色

我们知道，**原色** 是指不能透过其他颜色的混合调配而得出的 **基本色**。  
**原色** 是个生物学的概念，所以我们看到 **三原色** 与我们三种类型的视锥细胞是基本吻合的。  

有的同学会有疑惑，我小学美术老师教的三原色是 **红**、**黄**、**蓝** 又是怎么回事儿呢？  
这得从 **反射色** 与 **透过色** 之间，不同的混色原理说起。

---

以 **反射光源** 或 **颜料着色** 时使用的色彩，属于 **消减型** 的原色系统。

我们身边的物体大多数都无法自行发光，必须借助光源的 **反射** 才能被看见。
当光源照射物体时，对物体而言，可分为被吸收的波长与反射的波长，反射后的波长即是我们所看到的颜色。

CMYK（印刷四分色模式）是彩色印刷时采用的一种套色模式，它利用色料的 **减色混合法** 原理，加上黑色油墨[^cmyk-black]，共计四种颜色叠加，形成所谓 **全彩印刷**。
四种标准颜色是 **青色（Cyan）**、**品红色（Magenta）**、**黄色（Yellow）** 和 **黑色（blacK）**。

[^cmyk-black]: 理论上只用上述三种颜色能够混合成黑色，但实际印刷时三种颜色的相加只能形成一种深灰色或深褐色。

![消减型原色系统](/blog/what-we-talk-about-when-we-talk-about-color-basic/subtractive-primaries.png)

对前端来说，我们的主要产出是用各种屏幕来展示的，CYMK 和我们关系不大，就不展开了。

---

以 **光源投射** 时使用的色彩，属于 **叠加型** 的原色系统。

此系统中包含了 **红**、**绿**、**蓝** 三种原色，使用这三种原色可以产生其他颜色，例如红色与绿色混合可以产生黄色或橙色，绿色与蓝色混合可以产生青色，蓝色与红色混合可以产生紫色或品红色。
当这三种原色以等比例叠加在一起时，会变成灰色；若将此三原色的强度均调至最大并且等量重叠时，则会呈现白色。这套原色系统常被称为「RGB 色彩空间」。[^primary-color]

[^primary-color]: 来自维基百科「原色」词条：<http://zh.wikipedia.org/wiki/原色>

![叠加型原色系统](/blog/what-we-talk-about-when-we-talk-about-color-basic/additive-primaries.png)

电视、显示器、手机屏幕都是基于 **RGB 色彩模型** 来运转的，所以我们用 `RGB` 来表述颜色是最贴近硬件的方式。

很显然，作为前端的你已经非常熟悉 RGB 了。  
你经常通过调整 `#RRGGBB` 中代表 红、绿、蓝 的值，调整设计细节；  
你看到一个颜色的 HEX 代码就能够想象出它偏向哪种色彩，颜色是深是浅。  
所以我也没必要再啰嗦一遍，耽误你们的时间。

## 这些我都知道了，然后呢？

用 **RGB 色彩空间** 调整颜色是让你 **像显示器一样思考**，或者 **不思考** 直接拿来用。

但我们设计时需要的是符合 **语义** 的、像人类一样思考的 **色彩空间**，比如：

* 孟塞尔色彩空间 (HVC)：拥有一百多年历史，至今仍被广泛使用的系统
* HSB (HSV)：各种图形应用程序中最常用的色彩空间
* HSL：从 [CSS Color Module Level 3](http://www.w3.org/TR/css3-color/#hsl-color) 起支持的色彩空间
* HWB：在 [CSS Color Module Level 4](http://dev.w3.org/csswg/css-color/#the-hwb-notation) 中将要支持的色彩空间
* HuSL 与 HuSLp：改进了 HSL 的缺陷，用户友好的色彩空间

上面这些内容我会在 ~~作者不忙的时候再写~~ 的本系列下一篇「色彩空间」中向大家介绍，本篇就到这里 ~~，因为听说博客太长没人看~~。

最后，推荐一下 [Justineo](http://weibo.com/justineo) 同学写的颜色操作库 [Kolor](http://justineo.github.io/kolor/)，据说读懂源码看 **下一篇** 就会很轻松，路过就顺手给个 **star** 呗：

<iframe src="https://ghbtns.com/github-btn.html?user=Justineo&repo=kolor&type=star&count=true" frameborder="0" scrolling="0" width="170px" height="20px"></iframe>

## 书目

以下是本系列博客的主要参考的书目，以及我根据 **主观印象** 给的评分，供参考。

* [黑客与设计：剖析设计之美的秘密](http://dwz.cn/hacker-design)，评分：★★★★★，作者：[美] David Kadavy，ISBN：9787115345370
* [色彩设计的原理](http://dwz.cn/color-design)，评分：★★★★★，作者：[日] 伊达千代，ISBN：9787508629902
* [色彩构成](http://dwz.cn/interaction-of-color)，评分：★★★★☆，作者：[美] Josef Albers，ISBN：9787562463450
* [配色设计原理](http://dwz.cn/color-schemes)，评分：★★★☆☆，作者：[日] 奥博斯科编辑部，ISBN：9787500690351
