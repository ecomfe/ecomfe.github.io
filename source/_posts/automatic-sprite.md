---
title: 一种雪碧图自动化方案的设想
date: 2015-1-4
author: dbear
author_link: http://weibo.com/u/1809099542
tags:
- 图片
- CSS
- 优化
---


制作“雪碧图”一般是前端优化的重要一步，主要作用当然就是减少HTTP请求数。但是由于传统方法的雪碧图制作和维护成本都极高，加之现代浏览器支持的并发数也不断提高，所以很多人开始质疑做这项工作的必要性。但并发支持度变高，并不代表无限支持，网页首屏需要加载十几张图片资源还是很常见，再算上js、css以及一些数据的ajax请求，HTTP数上五十也是轻轻松，于是，用户体验就不那么好了。所以，这个工作不能省，但是开发成本又不得不考虑，于是，"雪碧图自动化"是自然而然就会产生的想法。

先看下雪碧图的发展历史:

<!-- more -->

### 那时，前端没有雪碧图

在不远的从前，雪碧图的概念还不存在，那时候开发者们很开心的从视觉稿中切出一个个的图标素材，

![图标](img/1.png)

然后利用css的background-position把它放置在任何他们想放的地方，以任何方式。


### 雪碧图横空出世

后来，网页被越做越丰富，单页面首屏图片资源加载数就超过了浏览器的允许的最大并发请求数，于是，为了降低请求数，有人开始提出把一些常用图标元素拼到一张图里的想法。

![图标](img/2.png)

但是，拼图不易，用图更难，把那些小图标一个个的手动挪到一张图里，这是个痛苦的过程。后来FE们把这个工作交给了UE同学 —— 好样的。但是，有一个工作还是避免不了，要计算每个图标的坐标位置，然后用到css里，UE同学不是好欺负的。。。


### 简单的自动化出现

由于雪碧图的制作和使用都过于复杂，于是很多自动拼雪碧图的工具开始涌现，比如我用过的一个（飞飞同学推荐的~~） Css Sprite Tools。

这工具功能不算强大，算比较精简的：把需要拼合的图片上传，然后在生成雪碧图的同时，生成一个css文件，里面以图片名作为class，生成每个图片的坐标。

```
.arrow-down-gray{
    background:url(../imgs/allbgs.png) no-repeat 0px 0px;
    height:5px;
    padding-left:11px;
}
.active-arrow-down{
    background:url(../imgs/allbgs.png) no-repeat 0px -5px;
    height:5px;
    padding-left:11px;
}

```

剩下的就是ctrl-c和ctrl-v了。有很长的一段时间我们都是用的这个方式。

### 但是，我们失去了一些东西

对于常规图标，像这样

```
.icon-a {
    width: 28px;
    height:28px;
    background-image: 'xxx';
    background-position: -22px -11px;
}

```

![图标](img/3.png)

元素宽高正好够包裹一个图标的，使用雪碧图没有任何问题。但是很多时候，具有背景的元素宽高并不是正好这样的，比如

![图标](img/4.png)

在非雪碧图年代，我们还可以这样

```
.icon-a {
    width: 100px;
    height: 40px;
    background-image: 'xxx';
    background-position: 5px center;
}

```

但是，在雪碧图年代，这样做的后果就是

![图标](img/5.png)

于是你面临两种选择：

A —— 在做雪碧图的时候预先考虑它未来可能的使用环境，设计出一种布局，来满足那些相对坐标的情形，比如

![图标](img/6.png)

上图的意思是"把4个background-position的东西放在4块灰色区域里"，但前提是横向或纵向的background-position只指定了一个，且没有repeat 。

可见这种方法满足不了所有的情形，而且需要开发者在制作雪碧图时就要思考好太多。而且如果未来需要增加图标，维护成本相当的高。


B —— 放弃使用background-position的相对坐标，多增加一个不留白的元素，专门用来包裹图片素材，然后通过元素的定位属性，来定位图标位置。

这个方法其实相对安全，维护成本也低，即便新增图标，雪碧图也可以使用工具自动生成，无需考虑图标如何布局。

但是，一般在开发一个控件时，比如一个按钮控件，你不能假设使用者就一定会给这个按钮配备一个图标然后多增加一个空元素。那如何在不增加元素的情况下还能保留B方案的优势呢？方法其实很简单：使用伪元素。比如：

![图标](img/7.png)

使用伪元素方法

```
.button {
    text-align: center;
    cursor: pointer;
    padding: 0 15px;
    background: #12bdce;
    border: 1px solid #12bdce;
    color: #ffffff;
}

.button:after {
    background: url(../img/sprite.png) scroll -20px 20px no-repeat transparent;
    content: '';
    text-indent: -9999px;
    overflow: hidden;
    position: absolute;
    top: 50%;
    margin-top: -5.5px;
    left: 15px;
    width: 11px;
    height: 11px;
}

```

上面这个方法似乎解决了雪碧图元素固定布局的问题，但是，你不要写这么多的代码，而且还放弃了那些好用的“相对坐标”。两个你都想要，怎么破？


### 动态样式语言拯救你

这里不想多讲LESS，SASS是怎么回事，如果你知道，那很好；如果你不知道，那就只当它是一种能把你的css写的更像编程语言的东西吧。用上面的需求为例，你希望能够使用background的那些相对定位的属性。那么，下面这段代码，不知道是否可以满足你的需求

```
.button {
    text-decoration: none;
    padding-left: 40px;
    height: 33px;
    line-height: 34px;
    font-size: 15px;
    font-weight: bold;
    .pseudo-icon(url(../img/sprite.png), -20px, -20px, 11px, 11px, left, 15px, center);
}

```

你之前看到的那堆after的代码都没有了，然后又看到了熟悉的 left center这种相对定位坐标。 其实跟之前的相比，这段代码只多做了一件事：创建了一个mixin —— pseudo-icon，这个方法把刚才那些伪元素的方法都封装了起来，只暴露出跟background差不多的参数变量，使使用者“看起来”在用原来的background写背景。

于是现在，你可以随意摆放你的图标了。但是，这样就够了么？这个方法似乎只是完善了功能，并没有降低未来增加图标所带来的维护成本呢？


### 最后的自动化

设想一种情景，你在一开始开发的时候根本不用理会图标会不会被合并到雪碧图里，只当它会一直独立存在，并且就那样的使用。之后在代码build时，你的这个图标会被自动的解析出来，并且合并到雪碧图中，它的相应坐标也会被同步更新，一切都自动化完成，无需任何人工干预，这样是不是很好？

于是，为了做到这点，我们需要对上面的mixin参数做些修改，比如


```
.button {
    text-decoration: none;
    padding-left: 40px;
    height: 33px;
    line-height: 34px;
    font-size: 15px;
    font-weight: bold;
    .pseudo-icon(url(../img/add-button-icon.png), 11px, 11px, left, 15px, center);
}

```

这里，第一个参数变成了一个独立图标元素的路径，因为是使用伪元素的全包裹方式，所以也无需定义background-position的值，默认就是 0 0。

接下来便如我们所设想的那样，当所有less被解析完成并整合到一个main.css中后，自动化工具将main.css中的所有图片路径解析出来，并根据路径将图片合并到一张图中，同时将原css中的背景数据更新，然后发布。


## edp雪碧图自动化构想

目前来讲，在构建时做雪碧图自动化的其实不少，比如基于Grunt的grunt-sprite，基于SASS的Compass，但是就我目前了解的（不排除了解的不够深的情况），他们的方式都无法覆盖全面，他们都只是对简单规范的background-position做解析，然后替换，因为没有使用伪元素，而放弃了一些灵活的布局特性。
而目前edp在雪碧图自动化方面还没有做任何的工作，所以我的设想是，在edp中也引入雪碧图自动化插件，这个插件将结合伪元素图标思想与现行的雪碧图自动生成方法为一体，完整实现雪碧图自动化。

## 遇到了阻碍

其实自动化的想法已经在脑力沉淀很久了，但直到现在也没有实现，有一个很重要的原因是各种图形处理相关的依赖包一直无法安装成功。所以，如果有哪位仁兄在Windows系统，或者任何什么其他系统上安装成功了spritesmith这东西—— 如果还用过，那就更好了。请私我，我会亲自求教～





相关参考资料

[使用sass和compass自动生成雪碧图](http://thesassway.com/intermediate/spriting-with-sass-and-compass)


[基于Grunt的自动化雪碧图方案](http://himeters.com/grunt-sprite)
