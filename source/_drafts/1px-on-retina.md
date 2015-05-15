title: 1px on retina
date: 2015-05-14
author: wxpuker
author_link: http://weibo.com/u/2144043071
tags:
- 1px
- Mobile
---

一直以来我们实现边框的方法都是设置 `border: 1px solid #ccc`，但是在`retina`屏上因为设备像素比的不同，边框在移动设备上的表现也不相同：`1px`可能会被渲染成`1.5px, 2px, 2.5px, 3px....`，在用户体验上略差，所以现在要解决的问题就是在`retina`屏幕实现`1px`边框。

如果你去`google`类似问题，诚然会找到所谓的”答案“，然后很开森的用到项目中了。运气好的话，Yeah成功模拟1px了，运气不好了可能遇到各种奇葩的表现让你抓狂。

这篇文章总结了目前常用的模拟`1px`的方法，并分析各个方法的利弊。

<!-- more -->

### 实现方案 

#### 1、软图片

'软图片'，即通过**CSS渐变**模拟，代码如下：

```
.retina(@top: transparent, @right: transparent, @bottom: transparent, @left: transparent, @w: 1px) {
    @media only screen and (-webkit-min-device-pixel-ratio: 2),
    only screen and (min-device-pixel-ratio: 2) {
        border: none;
        background-image:
            linear-gradient(180deg, @top, @top 50%, transparent 50%),
            linear-gradient(270deg, @right, @right 50%, transparent 50%),
            linear-gradient(0deg, @bottom, @bottom 50%, transparent 50%),
            linear-gradient(90deg, @left, @left 50%, transparent 50%);
        background-size: 100% @w, @w 100%, 100% @w, @w 100%;
        background-repeat: no-repeat;
        background-position: top, right top,  bottom, left top;
    }
}
```

这段代码可能是从网上找到的出现最频繁的代码了，但是这样写是有兼容问题的，

测试小米2自带浏览器、手机百度、百度浏览器都显示不出上边框，如图：

![](/blog/1px-on-retina/img/xiaomi2.png)

测试小米2 chrome浏览器正常，如图：

![](/blog/1px-on-retina/img/xiaomi2-chrome.png)

这种情况我们会考虑是不是没有写浏览器前缀`-webkit-`的原因，好，我们加上：

```
background-image:
     -webkit-linear-gradient(180deg, @top, @top 50%, transparent 50%),
     -webkit-linear-gradient(270deg, @right, @right 50%, transparent 50%),
     -webkit-linear-gradient(0, @bottom, @bottom 50%, transparent 50%),
     -webkit-linear-gradient(90deg, @left, @left 50%, transparent 50%);
```

再次检测小米2自带浏览器、手机百度、百度浏览器、chrome，这一次表现都一致！慢着好像有些不对：

![](/blog/1px-on-retina/img/xiaomi2-bug.png)

怎么会这样呢？？看样子是渐变方向不对，通过调整渐变方向得到结果：加上`-webkit`私有前缀的`0deg`的渐变方向是**从左向右**，而规范定义的`0deg`的渐变方向是**自下而上**。

知道原因了，我们再改改代码吧：

```
background-image:
    -webkit-linear-gradient(270deg, @top, @top 50%, transparent 50%),
    -webkit-linear-gradient(180deg, @right, @right 50%, transparent 50%),
    -webkit-linear-gradient(90deg, @bottom, @bottom 50%, transparent 50%),
    -webkit-linear-gradient(0, @left, @left 50%, transparent 50%);
background-image:
    linear-gradient(180deg, @top, @top 50%, transparent 50%),
    linear-gradient(270deg, @right, @right 50%, transparent 50%),
    linear-gradient(0deg, @bottom, @bottom 50%, transparent 50%),
    linear-gradient(90deg, @left, @left 50%, transparent 50%);
```

Done！

优点：

- 可以实现单个、多个边框，大小、颜色可以配置
- 对比下面介绍的其他方法，这个方法兼容性比较好，实现效果也相对不错

缺点：

- 很明显代码特别长
- 无法实现圆角
- 使用时可能需要配合 `padding`，如设置子元素的背景可能会挡住父元素所设置的1px软图片
- 如果有背景颜色，要写成`background-color`，不然会不小心覆盖掉
- 对于非 `retina` 屏，需要写 `border: 1px solid #f00` 进行适配


#### 2、缩放

'缩放'，即使用`css transform`缩放一半的大小，代码如下：

```
.transform-scale {
    position: relative;
    &:after,
    &:before {
        content: '';
        position: absolute;
        left: 0;
        top: 0;
        height: 1px;
        width: 100%;
        -webkit-transform: scaleY(0.5);
        transform: scaleY(0.5);
        -webkit-transform-origin: 0 0;
        transform-origin: 0 0;
        background: #f00;
    }
    &:after {
        top: auto;
        bottom: 0;
        -webkit-transform-origin: 0 100%;
        transform-origin: 0 100%;
    }
}
```

优点：

- 实现单线条简单
- 大小、颜色可以配置

缺点：

- 无法实现圆角
- 四条边框比较纠结
- 依赖DOM，可能会与已有样式冲突，如常用的`clearfix`


#### 3、阴影

```
.shadow {
    -webkit-box-shadow:0 1px 1px -1px rgba(255, 0, 0, 0.5);
    box-shadow:0 1px 1px -1px rgba(255, 0, 0, 0.5);
}
```

没觉得这个方法好用，模拟的效果差强人意，颜色也不好配置，不推荐

#### 4、0.5px

终于等来了`0.5px`，虽然只有`IOS8+`才支持

```
// IOS8 hairline
.hairline(@color, @style:solid) {
    @media (-webkit-min-device-pixel-ratio: 2) {
        border: 0.5px @style @color;
    }
}
```

优点：

- “原生”，支持圆角~

缺点：

- 目前只有`IOS8+`才支持，在IOS7及其以下、安卓系统都是显示为0px

#### 5、viewport&&rem

[再谈mobile web retina 下 1px 边框解决方案](http://www.ghugo.com/css-retina-hairline/)介绍了`viewport`结合`rem`解决设备像素比的问题，即让我们像以前写1倍像素那样写页面。

如在`devicePixelRatio=2`下设置`<meta>`：

```
<meta name="viewport" content="initial-scale=0.5, maximum-scale=0.5, minimum-scale=0.5, user-scalable=no">
```

再设置`rem`，假设header的高度是30px(设备像素比为1的情况)：

```
html {
    font-size: 20px;
}
header {
    height: 3rem;
}
```

没有具体实践过，不知道有神马坑~

PS：淘宝、美团移动端页面都是采用这个方式实现的

#### 6、border-image

使用的背景图片：

![](/blog/1px-on-retina/img/border-image.png)

代码：

```
.border-image-1px {
    border-width: 1px 0px;
    -webkit-border-image: url(border.png) 2 0 stretch;
    border-image: url(border.png) 2 0 stretch;
}
```

优点：

- 额，，，

缺点：

- 大小、颜色更改不灵活
- 放到PS里面看边框，是有点模糊的(因为带有颜色部分是1px，在retina屏幕上拉伸到2px肯定会有点模糊)

### 总结

1、`0.5px`，相信浏览器肯定是会慢慢支持的；目前而言，如果能用的话，可以hack一下；

2、阴影，`border-image`的方案不建议使用（用了你就知道。。。）

3、背景图片和缩放可以在项目中配合使用，如单个线条使用缩放，四条框用背景图片模拟，额，如果要圆角的话，无能无力了

 
### 其他
 
- [再谈mobile web retina 下 1px 边框解决方案](http://www.ghugo.com/css-retina-hairline/)

- [使用border-image实现类似iOS7的1px底边](https://github.com/maxzhang/maxzhang.github.com/issues/4)

### Demo

[1px Demo - jsbin](http://jsbin.com/witida/1/edit?html,css,output)

![](/blog/1px-on-retina/img/demo.png)
