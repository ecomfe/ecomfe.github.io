---
title: 雪碧图在缩放场景下的特殊处理
date: 2016-6-4
author: curarchy
author_link: http://weibo.com/curarchy
tags:
- 图片
- css
---

回想n年前刚写前端的时候，在处理一个'鼠标hover切换背景图会闪'的问题时，将两张背景图合成一张图片，顺利解决问题。这应该是我第一次用到雪碧图的情况。

![雪碧图作为背景在切换时不会有因为需要等待下载而产生的闪现](img/1.png)

如今，打开一个站点，呈现铺天盖地的图片资源的页面随处可见。而多数站点更会用一套包含几十个风格统一的图标的图标库，加之移动端的占比与日俱增，雪碧图这项技术被运用的就越来越普遍。


## 最简单，最实用的使用方法

得益于伪元素的功劳，在不破坏页面结构，不增加多余标签的情况下，通过::after创建一个你所需要图标大小的伪元素，并将所需要的图标通过background-position定位到指定的空间，对应的图标变顺利地呈现出来。

```
.message:after {
    background: url(../img/sprite.png) scroll 0px -86px no-repeat transparent;
    content: '';
    text-indent: -9999px;
    overflow: hidden;
    position: absolute;
    top: 0;
    left: 50%;
    margin-left: -10px;
    width: 20px;
    height: 22px;
}

```
![通过伪元素实现的图标](img/2.png)

## 一些问题

看上去貌似是一个完美的解决方案，然而真的是这样么？我们来看一个例子：

![一个界面](img/3.png)

目前有这么一个简单的页面（无视它的设计合理性吧），拿到手后撸起袖子就写。切图切着切着貌似哪里不对。。。恩！三个铃铛不是同一个图片大小不同而已么？明显有优化的余地啊！只要切一个图来个调整下尺寸不就解决了么~~


恩恩恩。在普通的页面中，来个backgroud-size妥妥地解决。

```
.message {
    background: url(../img/message.png) no-repeat;
}

.large {
    background-size: 64px 64px;
}

.normal {
    background-size: 32px 32px;
}

.small {
    background-size: 16px 16px;
}
```

当我们按部就班地把属性设置到雪碧图上时，可以发现，呈现出的效果完全不是之前设想的那样。尺寸、定位完全不对。哪里出了问题了呢？原理很简单。background-size并不感知icon的存在，我们想只针对icon进行配置，而这个属性其实是作用于整个雪碧图上的。


## 随之而来的解决方案

回想整个渲染执行的流程：

1. background-size 作用于整个雪碧图，对其尺寸缩放。
2. background-position 定位。

那么要得到正确的效果的话，以放大两倍为例，需要做到：

1. 将伪元素的尺寸扩大2倍

    ```
    .message:after {
        width: originWidth * 2;
        height: originHeight * 2;
    }
    ```
2. 将整个雪碧图的尺寸扩大2倍

    ```
    .message:after {
        background-size: originSpriteWidth * 2, originspriteHeight * 2;
    }
    ```

3. 将坐标偏移量相应扩大2倍

    ```
    .message:after {
        background-position: originBackgroundPositionX * 2, originBackgroundPositionY * 2;
    }
    ```
![图片](img/4.png)

综上，如果想在雪碧图内实现缩放逻辑，必须通过

- 雪碧图长宽
- 该图标原始长宽
- 该图标在雪碧图中的偏移量

总共6个变量去实现。用动态样式语言的话，或许可以得到这么一个通用函数：

```
// 雪碧图icon
// img: 图片路径
// spriteWidth: 合成的雪碧图的宽度
// spriteHeight: 合成的雪碧图的长度
// originWidth: 使用图片的原始宽度
// originHeight: 使用图片的原始长度
// width: 需要呈现的宽度
// height: 需要呈现的长度
// offsetX: 雪碧图中的x轴偏移位置
// offsetY: 雪碧图中的y轴偏移位置
// horizontal: 水平定位
// hDuration: 水平定位偏移
// vertical: 垂直定位
// vDuration: 垂直定位偏移
// relativePos: 相对定位
.pseudo-icon-sprite (@img,
    @spriteWidth, @spriteHeight,
    @originWidth, @originHeight,
    @width, @height,
    @offsetX, @offsetY,
    @horizontal:left, @hDuration:0,
    @vertical:center, @vDuration:0,
    @relativePos:relative) {
    ...
}
```
以上，我们完成了把雪碧图中的图标缩放后呈现在页面上的这一目标。

怎么样，看到这个解决方案，有没有一种把代码删光，把大中小三个图标都塞进雪碧图的冲动？

## 冷静一下，再想想方案

不就是缩放么？background-size会扯出这么多问题，不是还有个transform么？会出现同样的问题么？
那么要得到正确的效果的话，以放大两倍为例，需要做到：
恩？好像就加一行代码？

```
.message:after {
    ...
    transform: scale(2);
}
```
好吧，就是这样。两者区别也很简单，因为一个作用在元素上，一个作用在雪碧图上，所以后者会带出n多副作用。

那么如果需要缩放到固定尺寸时，还需要知晓原始尺寸，通过计算得到一个缩放系数，这样才能最终达到所需的效果。

## 最后的总结
回顾一下，一个简单的缩放需求，出现了三种解决方案：

1. 最无脑的全部放进雪碧图中
2. 最冗长的修改background-size
3. 以及最简短的transform变形

一般情况下，还是无视第二种方案吧。那么在1和3两者中间，则各有取舍。现在回想整个寻求解决方案的过程，个人还是比较倾向方案1的，毕竟，几乎没有什么出错的可能。而且都是同一张雪碧图，并没有更多的请求数，只是多了点图片大小而已。


###相关参考资料

[一种雪碧图自动化方案的设想](http://efe.baidu.com/blog/automatic-sprite/)


[MDN:background-size](https://developer.mozilla.org/zh-CN/docs/Web/CSS/background-size)
