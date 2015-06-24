---
title: position:sticky实现iOS6+下的粘性布局
date: 2015-06-24
author: oddjohn
author_link: http://weibo.com/u/1898659961
tags:
- iOS
- Mobile
- fixed
- sticky
---

用户总是希望在窗口明显的地方方便找到自己想要的操作项，例如停留在浏览器窗口顶端的菜单栏，筛选栏等。所以我们会把用户最常用到或者我们希望用户注意到的内容一直展现在窗口的可视区域，让用户能够一眼就看到。这当中常需要用到一种页面滚动然后元素固定在窗口的某个位置的布局方式（下面简称**粘性布局**）。

要实现这种粘性布局，我们常常都是通过js来模拟，实现方案是通过js监听window的`scroll`事件，当需要固定的元素滚动到窗口顶部时，把元素的position属性设置为fixed，否则，取消fixed，简单的js代码如下：

```js
var nav = document.querySelector('.nav');
var navOffsetY = nav.offsetTop;
function onScroll(e) {
    window.scrollY >= navOffsetY ? nav.classList.add('fixed') : nav.classList.remove('fixed'); 
}
window.addEventListener('scroll', onScroll);
```
上面的实现在桌面浏览器的表现还是挺好的，但是在移动端浏览器上粘顶的效果就显得不那么平滑了。

<!-- more -->
特别是在iOS设备上，iOS下的浏览器会在页面滚动的时候，暂停所有js的执行，直到滚动停止才会继续去执行js（注意暂停了所有js的执行，所以考虑用`setTimeout`或`setInterval`也是没有用的）。所以页面滚动时，`scroll`事件在iOS的浏览器下并不会持续被触发，而是在页面滚动停止后，才会去触发一次`scroll`事件。
在Android 2.3及以下的版本的浏览器`scroll`事件的响应也是跟iOS一样。而Android 2.3以上的版本中虽然有部分浏览器能持续的触发`scroll`事件，但由于移动设备上惯性滚动的原因，`scroll`事件的回调函数执行渲染Dom频率还是赶不上滚动的频率，所以即使是在高版本的Android下，滚动快了，还是会看到原来fixed的元素闪跳归位。

下面我们来做一个`scroll`事件的测试：

```js
var count = 0;
var num = document.querySelector('#num');
window.addEventListener('scroll', function () {
    num.innerHTML = ++count;
});
```
下图分别是测试代码在iphone 5s（iOS 7.1.1）和红米 1S（Android 4.3）中的表现：

![iOS 7.1.1](http://bcscdn.baidu.com/weigou-baidu-com/efe-blog-1434293785019/ios-scroll-test.gif)    ![Android 4.3](http://bcscdn.baidu.com/weigou-baidu-com/efe-blog-1434293785019/android-scroll-test.gif)

正因为iOS的浏览器这样的特性，导致元素要在滚动停止后才被设置为fixed或取消fixed，特别是取消fixed的延迟，元素在页面滚动停止后突然跳回原来的位置，这体验实在是太差了！价值一个肾的水果机，体验可不能这么不流畅啊！总得想点办法优化一下。

尝试监听body的`touchmove`事件，但还是由于惯性滚动的原因，并不能解决闪跳的问题。`iscroll`有个试验版本`iscroll-probe.js`能实时响应`touchmove`模拟的滚动事件，可是对整页使用iscroll，还要做这么耗cpu性能的事情，想想都可怕。但我还是试验了一下，效果也并不好。

## 使用position:sticky
position:sticky是属于[W3C Editor’s Draft](http://dev.w3.org/csswg/css-position-3/#sticky-pos)中的一个属性，目前仍是一个试验性的属性，并不是W3C推荐的标准。它之所以会出现，也是因为监听`scroll`事件来实现粘性布局使浏览器进入慢滚动的模式，这与浏览器想要通过硬件加速来提升滚动的体验是相悖的。大家可以从[这里](https://lists.w3.org/Archives/Public/www-style/2012Jun/0627.html)看到该属性的由来。

position:sticky的表现上像是position:fixed和position:relative的结合体，设置了position:sticky的元素，特征如下：

* 元素不会脱离文档流，并保留元素在文档流中占位的大小
* 元素在容器中被滚动超过指定的偏移值时，元素在容器内固定在指定位置
* 元素固定的相对偏移是相对于离它最近的具有滚动框的祖先元素，如果祖先元素都不可以滚动，那么是相对于viewport来计算元素的偏移量


这个有趣的属性，在各个浏览器的兼容性如何呢？看看[caniuse](http://caniuse.com/#search=sticky)给出的position:sticky在各浏览器的兼容性：
![](/blog/position-sticky/img/sticky-caniuse.jpg)


上图中可看到，红了一片，大部分的浏览器并不支持该属性。可惜的是，Android下的自带浏览器居然全部都不支持该属性，还好在iOS的浏览器中，从iOS6+开始支持该CSS属性，这让我们感到一丝欣慰。

抱着能做好一点，就努力做好一点的态度，还是应该让大部分的iOS用户体验到平滑的感觉的，所以上面的实现粘性布局的代码可以这样改一下：
```css
.sticky {
    position: -webkit-sticky;
    position: sticky;
    top: 0;
}
.fixed {
    position: fixed;
    top: 0;
}

```
```js
// 检测iOS版本大于等于6
function gtIOS6() {
    var userAgent = window.navigator.userAgent;
    var ios = userAgent.match(/(iPad|iPhone|iPod)\s+OS\s([\d_\.]+)/);
    return ios && ios[2] && (parseInt(ios[2].replace(/_/g, '.'), 10) >= 6);
}
var nav = document.querySelector('.nav');
if (gtIOS6()) {
    // 大于等于iOS6版本使用sticky
    nav.classList.add('sticky');
} else {
    var navOffsetY = nav.offsetTop;
    function onScroll(e) {
        window.scrollY >= navOffsetY ? nav.classList.add('fixed') : nav.classList.remove('fixed'); 
    }
    window.addEventListener('scroll', onScroll);
}
```
如上，对于iOS6+我们毫不犹豫的使用position:sticky属性，其实直接判断浏览器是否支持该属性，而不仅限于iOS，因为上面caniuse中提到Firefox for Android也是支持改属性的，所以我们还可以去检测浏览器是否支持sticky属性，从而决定是使用js监听事件去实现还是通过原生CSS去实现，检测代码如下：
```js
// 判断是否支持sticky属性
function isSupportSticky() {
    var prefixTestList = ['', '-webkit-', '-ms-', '-moz-', '-o-'];
    var stickyText = '';
    for (var i = 0; i < prefixTestList.length; i++ ) {
        stickyText += 'position:' + prefixTestList[i] + 'sticky;';
    }
    // 创建一个dom来检查
    var div = document.createElement('div');
    var body = document.body;
    div.style.cssText = 'display:none;' + stickyText;
    body.appendChild(div);
    var isSupport = /sticky/i.test(window.getComputedStyle(div).position);
    body.removeChild(div);
    div = null;
    return isSupport;
}
```
在PC的浏览器测试sticky属性：

* Firefox 26+: 需要在`about:config`中把`layout.css.sticky.enabled`设置为“true”，FireFox 32+ 直接支持。FireFox只支持不带前缀的sticky属性（如：position:sticky）
* Safari 6.1+: 支持使用-webkit前缀的sticky属性(如：position: -webkit-sticky)
* Chrome 23~36: 需要在`chrome://flags`将`启用实验性网络平台功能`启用；Chrome 37+ 不支持该属性，chrome团队暂时将它移除，具体见[Issue](https://code.google.com/p/chromium/issues/detail?id=231752#c28)（需要梯子）
* IE: 不支持。

欢迎用手机扫码或者用支持sticky属性的浏览器查看上面的栗子

![](/blog/position-sticky/img/qrcode.jpg) or [demo](http://bcscdn.baidu.com/weigou-baidu-com/personal-test-1433858742567/sticky.html)


## position:sticky的生效条件

首先，设置了postion:sticky的元素要生效必须要至少设置`top`，`bottom`，`left`，`right`中的一个，而且`top`和`bottom`同时设置时，`top`生效的优先级高，`left`和`right`同时设置时，`left`生效的优先级高；其次，sticky元素生效与否有两个临界条件：


1. 一个是元素自身在文档流中的位置

以`top:10px`为例，当页面滚动到sticky在文档流中位置元素离viewport顶端的距离<=10px时，sticky元素就开始固定了，当sticky元素在文档流中位置离viewport顶端的距离>10px时，元素就不再固定。

2. 另一个是该元素的父容器的边缘

这种情况还是要用例子来说明（请在FireFox或者Safari查看下面给出的例子）：
{% raw %}
<p data-height="268" data-theme-id="15807" data-slug-hash="JdNqqR" data-default-tab="result" data-user="oddjohn" class='codepen'>See the Pen <a href='http://codepen.io/oddjohn/pen/JdNqqR/'>JdNqqR</a> by john chen (<a href='http://codepen.io/oddjohn'>@oddjohn</a>) on <a href='http://codepen.io'>CodePen</a>.</p>
<script async src="//assets.codepen.io/assets/embed/ei.js"></script>
{% endraw %}

从上面例子可以看到，当sticky元素碰到父容器的底部时，就会跟随父元素一起滚动了。
所以如果你单纯给sticky元素加一个父容器，但是却不能使父容器的高度大于sticky元素的高度，这样并不会看到元素固定的效果的，因为一开始sticky元素就到达了父元素的边缘，它会跟着父元素滚动。

另外，一旦离sticky元素最近的祖先元素的`overflow`属性不是默认的`visible`，那么sticky元素固定的位置将是相对于该祖先元素，所以当改变sticky元素的父容器的`overflow`默认值时，sticky元素的固定的位置就是相对于它父容器。如设置属性`overflow:hidden`的父容器，父容器根本就不能滚动，所以sticky元素也不会有滚动然后固定的情况。

还有些童鞋抱怨sticky的`bottom`和`right`值设了怎么不能生效呢，那是因为你的元素所处的位置还没满足sticky生效的条件。再看下面的例子：
{% raw %}
<p data-height="268" data-theme-id="15807" data-slug-hash="OVgJZG" data-default-tab="result" data-user="oddjohn" class='codepen'>See the Pen <a href='http://codepen.io/oddjohn/pen/OVgJZG/'>OVgJZG</a> by john chen (<a href='http://codepen.io/oddjohn'>@oddjohn</a>) on <a href='http://codepen.io'>CodePen</a>.</p>
{% endraw %}
明显看出，只要sticky元素在文档流中的的位置超出了容器的可视区域，sticky就开始生效！

## position:sticky与input
既然sticky拥有像fixed相似的功能，那么能否用它来替代fixed，从而解决iOS下的fixed + input的bug呢？很遗憾，经测试sticky + input在iOS下的表现跟fixed + input的bug差不多。至于怎么解决这个bug，请移步到[Web移动端Fixed布局的解决方案](http://efe.baidu.com/blog/mobile-fixed-layout/)。

sticky+input的表现如下图：

![](/blog/position-sticky/img/input-normal.jpg)  ![](/blog/position-sticky/img/input-bottom.jpg)


## 使用CSS实现粘性布局的局限
由于是用CSS实现的粘性布局，所以并不能让我们知道元素在什么时候stuck了，什么时候回到文档流中位置了，如果我们希望在元素置顶时改变元素的样式或者置顶的过程加上一些炫酷的动画，这就无能为力了。

## Polyfill
关于position:sticky的ployfill还是有挺多的，如下面这些：

* [fixed-sticky](https://github.com/filamentgroup/fixed-sticky)

* [stickyfill](https://github.com/wilddeer/stickyfill)

* [position--sticky-](https://github.com/matthewp/position--sticky-)

## 相关文章
* [CSS Positioned Layout Module Level 3](http://dev.w3.org/csswg/css-position-3/#sticky-pos)

* [Stick your landings! position: sticky lands in WebKit](http://updates.html5rocks.com/2012/08/Stick-your-landings-position-sticky-lands-in-WebKit)（需要梯子）

* [CSS “position: sticky” – Introduction and Polyfills](http://www.sitepoint.com/css-position-sticky-introduction-polyfills/)
