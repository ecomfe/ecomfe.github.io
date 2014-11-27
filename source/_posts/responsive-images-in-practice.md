title: 实战响应式图片
date: 2014-11-11
author: Justineo
author_link: http://weibo.com/u/1143654280
tags:
- HTML
- 响应式
---

原文地址：[http://alistapart.com/article/responsive-images-in-practice](http://alistapart.com/article/responsive-images-in-practice)

作者：[Eric Portis](http://alistapart.com/author/eportis)


> 魔鬼因一切我们享受的东西而惩罚我们。
>
> —阿尔伯特·爱因斯坦

[图片已经占了 Web 内容的 62%](http://httparchive.org/interesting.php#bytesperpage)，而且我们[每天都在制造更多](http://httparchive.org/trends.php?s=All&minlabel=Nov+15+2010&maxlabel=Oct+15+2014#bytesImg&reqImg)。如果所有图片内容都能被好好加以利用那的确很赞。但是对小屏或低分辨率屏来说，[其中大部分数据都被浪费了](http://timkadlec.com/2013/06/why-we-need-responsive-images/)。


为什么？尽管 Web 设计初衷是让[所有人](https://twitter.com/timberners_lee/status/228960085672599552)能通过[任何途径](http://www.w3.org/Consortium/mission#principles)来访问，但直到最近，设备的碎片化才迫使业界全面转向了响应式设计。我们在进行响应式设计时，内容可以优雅且高效地流入任何设备。这说的是除了位图以外的所有内容。位图是固定分辨率的。而且他们的容器——敬爱的 `img` 和它那孤零零的 `src`——没有任何适配能力可言。

设计师们面临这样一个苏菲的选择[^sophie]：让页面在有些情况下变模糊，还是在所有情况下变慢。大多数人倾向于后者，给所有人发送能适配最大、最高分辨率屏幕的图片。浪费啊。

[^sophie]: 《苏菲的选择》讲述了一个二战中的故事。苏菲带着两个年幼的孩子被关进了奥斯维辛集中营，却被告知只能带一个，另一个会被杀死。于是「苏菲的选择」被用来指代两难的境地。

但是！经过三年的辩论，我们有了一些新的标记来解决响应式图片这个问题：

<!-- more -->

* `srcset`
* `sizes`
* `picture`
* 还有我们的老朋友 `source`（借用自 `audio` 和 `video`）

这些新元素和新属性让我们可以编写多个可替换的源图片，然后给每个客户端提供最合适的那个。它们已经进入了官方规范，而且 Chrome 38 已经在九月给出了第一个完整实现。再借助优雅的回退策略和一个用来兼容的 [polyfill](http://scottjehl.github.io/picturefill/)[^polyfill]，我们可以并且应当*立刻*实现响应式图片。那么，走起！

[^polyfill]: polyfill 一词特指为浏览器的新特性提供的向前兼容的程序。

我们先找个已有的网页，然后来把它的图片做成响应式的。我们分三遍做，每遍轮番用上新标记的其中一组：

1. 用 `srcset` 和 `sizes` 来保证图片高效地缩放。
2. 通过 `picture` 和 `source media` 对图片进行艺术指导。
3. 用 `picture` 和 `source type` 给图片提供可替换格式。

在整个过程中，我们将第一时间看到新特性带给我们的巨大性能提升。


## 现有技术

> 我想我不那么在意我老了，相比我又胖又老的话。
>
> —[本杰明·富兰克林](http://thinkexist.com/quotation/i_guess_i_don-t_so_much_mind_being_old-as_i_mind/200747.html)（还是[彼得·加布里埃尔](http://www.tejvan.co.uk/funny/funny_quotes_old_age/view/index.html)来着？）

我们把主角定为[一个关于疯狂拼布的小网页](http://alistapart.com/d/407/demo/status-quo.html)[^quilts]。这是一个简单的响应式页面。这个页面除了主要的内容——巨大的（拼布！）图片——以外没太多别的东西了。我们想既展示每块拼布的整体设计又展示尽可能复杂的细节。那么，我们给每块拼布呈现两幅图片：

[^quilts]: 所谓的疯狂拼布，是指在不规则拼接的蚕丝布或天鹅绒布上，用刺绣、珠子、缎带、蕾丝等进行装饰。

1. 整块拼布，和段落同宽；
2. 一幅充满 100% 视口宽度的细节图。

在*没有*新标记的时候我们是怎样编写图片代码以及设定它们的尺寸的？

首先：整块拼布。要保证图片总是能清晰显示，我们需要知道它们在布局中可能的最大尺寸。下面是相关的 CSS 代码：

```css
* {
    box-sizing: border-box;
}
body {
    font-size: 1.25em;
}
figure {
    padding: 0 1em;
    max-width: 33em;
}
img { 
    display: block;
    width: 100%;
}
```

我们可以用 `figure` 的 `max-width` 减去其 `padding`，然后将 em 单位转换为像素，计算出 `img` 可能的最大显示宽度：

```
  100% <img> width
x ( 33em <figure> max-width
   - 2em <figure> padding )
x 1.25em <body> font-size
x 16px default font-size
= 620px
```

或者我们可以作个弊，把窗口调得足够大，然后偷瞄一眼开发工具：

![Chrome 的开发工具显示元素宽度为 620px。](img/box-model.png)

（我更倾向于这第二种方法。）

无论用哪种方法，我们最终都得到了整块拼布的 `img` 最大显示宽度为 620px。我们将以两倍大小渲染我们的源图片来适应双倍屏：1240 像素宽。

但是怎么处理我们的细节图片呢？它们要放大充满整个视口的宽度，而视口尺寸没有固定的上限。那我们就选[一个大大的、感觉标标准准的尺寸](http://en.wikipedia.org/wiki/1080p)来渲染，比如说最大 1920 像素宽，就它了。

当我们按这些尺寸渲染图片时，[使用既有方式实现的这个网页](http://alistapart.com/d/407/demo/status-quo.html)重达 3.5MB。其中除了 5.7kB 以外全是图片。不用想也知道，其中很多的图片数据在发送到小屏、低分辨率屏设备时将成为无谓的开销。但有多少呢？让我们开工吧。


## 第一遍：用 `srcset` 和 `sizes` 缩放图片

> Teatherball with a tennis ball for his shoelaces
>
> Naturally adapt to have more than two faces
>
>—[Kool AD, Dum Diary](http://rapgenius.com/Kool-ad-dum-diary-lyrics#note-2535201)[^koolad]

[^koolad]: Kool AD 是美国的一位音乐人，引用部分是歌词，就不进行翻译了（Rap 也不是很好翻译）。

我们要解决的第一个问题：调整图片使其可以在不同的视口宽度和屏幕分辨率下高效地缩放。我们要提供*多个分辨率*的图片，这样就可以有选择性地给巨大的或是高分辨率屏幕发送巨大的源图片，同时把小一些的内容发给其他人。怎么做到呢？用 `srcset`。

下面是我们的整屏宽细节图之一：

```html
<img
    src="quilt_2-detail.jpg"
    alt="Detail of the above quilt, highlighting the embroidery and exotic stitchwork." />
```

`quilt_2-detail.jpg` 宽度为 1920 像素。再为它附带渲染两个小一点的版本，像这样写：

```html
<img
    srcset="quilt_2/detail/large.jpg  1920w, 
            quilt_2/detail/medium.jpg  960w,
            quilt_2/detail/small.jpg   480w"
    src="quilt_2/detail/medium.jpg"
    alt="Detail of the above quilt, highlighting the embroidery and exotic stitchwork.">
```

首先需要注意这个 `img` 仍然有一个 `src`，用来在不支持新语法的浏览器中进行加载。

对更强大一些的客户端，我们加了一些新东西：一个 `srcset` 属性，它包含一个用逗号分隔的资源 URL 列表。在每个 URL 后面我们加了一个“宽度描述符”，来指定每个图片的像素宽度。你的图片是 1024 x 768 的？那就在 `srcset` 中对应的 URL 最后加一个 `1024w`。支持 `srcset` 的浏览器用这些像素宽度以及其它对当前浏览环境的一切感知来从这个集合种选择一个源图片进行加载。

怎么选择呢？这是我最爱 `srcset` 的一点了：不知道！我们*无从*知晓。选择逻辑是故意没有指定的。

这第一个解决响应式图片问题的方案试图给作者*更多*的控制权。这样*我们*就掌管了全局，构建覆盖所有情况的媒体查询（media query）——为每一种可能的屏幕大小及分辨率的组合制定应急计划，分别给出定制的源图片。

`srcset` 解放了我们。合适粒度的控制在我们需要时（等下会说）仍然可用，但是大多数情况下我们最好还是把关键问题移交给浏览器来做决定。浏览器对一个用户的屏幕、视口、网络连接和偏好设置都非常了解。通过出让控制权——描述图片而非为无数个目标指定特定的源图片——就能让浏览器充分利用它已知的那些信息。我们则从少得多的代码中获得了更好的功能（还是对未来友好的！）。

然而，这里有一个坑：选择适当的源图片需要知道图片的布局尺寸。但是我们无法让浏览器等到页面的 HTML、CSS 和 JavaScript 全部加载且解析完毕以后再进行选择。所以我们得用另一个新属性来给浏览器提供一个预估的图片显示宽度：`sizes`。

我是如何把这个麻烦的真相隐藏到现在的？原因是我们示例页中的细节图是个特例。它们占据整个视口的宽度——`100vw`——恰好是 `sizes` 的默认值。但是我们的整块拼布图片，却要匹配段落宽度，并且往往要窄得多。我们理应用 `sizes` 来告诉浏览器它们究竟会有多宽。

`sizes` 属性接受 [CSS 长度值](http://www.w3.org/TR/css3-values/#lengths)。所以：

```html
sizes="100px"
```

告诉浏览器：这张图片将以 `100px` 的固定宽度显示。轻松！

我们的例子更复杂一些。尽管拼布的 `img` 简单地用规则 `width: 100%` 设置了样式，但包含它们的 `figure` 元素有一个 `33em` 的 `max-width`。

幸运的是，`sizes` 可以让我们做两件事：

1. 用一个以逗号分隔的列表提供多个长度；
2. 为长度附加媒体条件。

像这样：

```html
sizes="(min-width: 33em) 33em, 100vw"
```

这是在说：视口宽超过 `33em` 吗？那这张图将会是 `33em` 宽。否则它会是 `100vw` 宽。

这和我们需要的很接近了，但还是不够。em 单位的相对性让我们的例子变得有些微妙。我们页面的 body 有一个 `1.25em` 的 `font-size`，所以我们的 `figure` 元素的 CSS 上下文中，“1em”将会是 1.25 x 浏览器默认字号。但在媒体条件（也就是在 `sizes`）中，一个 em 永远等于默认字号。因此还要乘以 1.25 后得到：1.25 x 33 = 41.25。

```html
sizes="(min-width: 41.25em) 41.25em,
       100vw"
```

这就比较好地得到了拼布的宽度，坦白说，也已经足够好了。对于 `sizes` 来说这已经是一个绝对可接受的对 `img` 布局宽度的粗略估算；而且用少许的精确度换来可读性及可维护性上的大幅提升，也往往是正确的选择。话虽如此，还是让我们继续，把图片两边的内边距的 em 数考虑进去，使我们的示例更准确：2 边 x 1.25 媒体条件 em 值 = 需要考虑的 2.5em 内边距。

```html
<img 
    srcset="quilt_3/large.jpg  1240w, 
            quilt_3/medium.jpg  620w,
            quilt_3/small.jpg   310w"
    sizes="(min-width: 41.25em) 38.75em,
           calc(100vw - 2.5em)"
    src="quilt_3/medium.jpg"
    alt="A crazy quilt whose irregular fabric scraps are fit into a lattice of diamonds." />
```

来看看我们到现在都做了些什么。我们使用 `srcset` 给浏览器提供了大、中、小版本的图片并用 `w` 描述符给出了他们的像素宽度。我们通过 `sizes` 告诉了浏览器它们实际会占多大地方。

如果这是个更简单的例子，我们可以给浏览器一个单一的 CSS 长度值比如 `sizes="100px"` 或是 `sizes="50vw"`。但是我们没这么幸运。我们得给浏览器*两个* CSS 长度，同时声明第一个长度只会在满足某个媒体条件时生效。

幸好，这些工作都不是徒劳的。通过使用 `srcset` 和 `sizes`，我们给了浏览器选择源图片所需要的一切信息。一旦浏览器获知源图片的像素宽度和 `img` 的布局宽度，它就会计算源图片相对布局宽度的比例。不妨假设 `sizes` 返回值为 620px。一个 `620w` 的源图片会是 `img` 像素值的一倍。一个 `1240w` 的源图片则会是两倍。`310w`？0.5 倍。浏览器算清楚比例，然后选择一个合适的源图片。

值得注意的是，规范允许你直接提供比例数，对没有给出描述符的则默认分配 `1x`。你可以这么书写：

```html
<img src="standard.jpg" srcset="retina.jpg 2x, super-retina.jpg 3x" />
```

这是一个精巧的提供高 DPI 图像的方法。但是！它只对固定宽度图片有效。在我们的疯狂拼布页面中，所有图片都是流式的，所以我们后面不会再提到 `x` 描述符了。


## 来测一下

既然我们[用 `srcset` 和 `sizes` 重写了我们的疯狂拼布页面](http://alistapart.com/d/407/demo/first-pass.html)，那么我们在性能上得到了什么？

我们页面的数据量现在根据浏览器条件而（华丽丽地！）不同了。它是变化的，所以我们无法用一个单一的数字来呈现。我在 Chrome 中反复重新加载页面，然后根据不同视口宽度范围的不同数据量画了一个图：

![一幅页面数据量和窗口宽度关系的图表。顶部有一条平线，而下方有一条阶梯式的曲线。](img/first-pass.svg)
 
顶部那条平的灰色线条代表了采用既有技术的数据量 3.5MB。粗的（1x 屏幕）和细的（2x）绿线代表我们采用 `srcset` 和 `sized` 后的页面在每 320px 到 1280px 之间每个视口宽度下的数据量。
 
在 320px 宽的 2x 屏上，我们把数据量削减了*三分之二*——之前页面总共有 3.5MB；而现在只需要发送 1.1MB 就行了。在 320px 宽的 1x 屏上，我们的页面只有原来的*不到十分之一*：306kB。

从那里开始，随着我们加载更大源图片来适配更大视口，字节数呈现出阶梯式的上升。在 2x 设备上在大约 350px 视口宽度处有一个显著跃升，然后在 480px 后回到我们使用既有技术手段时的数据量。在 1x 屏幕上，节约量非常显著；960px 之前都可以节省 70%–80% 的原始数据量。之后我们跳升到一个仍然能比初始情况小约 40% 的页面。

这些削减——40%、70%、90%——足够让小伙伴们都惊呆了。我们为每台配备视网膜屏的 iPhone 在加载时砍掉了近 *2.5MB* 数据量。用毫秒数来衡量一下或是乘上千次 PV，你就会了解这么大费周章是为了什么了。


## 第二遍：`picture` 和艺术指导

> 懒汉用 `srcset`，疯子™用 `picture`
>
> —[Mat Marquis](http://ircbot.responsiveimages.org/bot/log/respimg/2014-06-24#T78853)
{: title="“Squishy 喝多了肯定会发神经的。” —巴特·辛普森"}

那么，对于仅仅是需要缩放的图片，我们在 `srcset` 中列出源图片及其像素宽度，用 `sizes` 来让浏览器知晓 `img` 会以什么宽度显示，同时释放我们那[愚蠢的控制欲](http://alistapart.com/article/dao#section2)。但是！有的时候我们会希望通过除了缩放之外的方式来进行图片的自适应。这个时候，我们就需要夺回一些我们选择源图片的控制权。开始说 `picture`。

我们的细节图有一个很宽的纵横比：16:9。在大屏幕上他们看起来很棒，但在手机上就显得太小了。上面需要展现的缝合与刺绣太小了，以至于无法看清。

如果我们可以在手机上“放大”，展现一个更贴近、更高的裁切图，那就好了。

![一段动画演示，展现了细节图在窄屏上变得多小，而在呈现另一种裁切方式时能得到多少更丰富的细节。](img/art-direction.gif)

这类工作——剪裁图片*内容*来适应特定环境——被称为“[艺术指导](http://usecases.responsiveimages.org/#art-direction)”。任何时候我们裁切或是修改图片来适应一个断点（而非简单地缩放整个东西），都是一种艺术指导。

如果我们在一个 `srcset` 中引入一个裁切版本，我们无法分辨他们何时应该被选用而何时不该选。而用了 `picture` 和 `source media`，我们就能明确表达出我们的意图：只在视口宽度超过 36em 时加载宽的矩形版本。在比这个小的视口中，总是加载正方形版本。

```html
<picture>
    <!-- 16:9 crop -->
    <source
        media="(min-width: 36em)"
        srcset="quilt_2/detail/large.jpg  1920w,
                quilt_2/detail/medium.jpg  960w,
                quilt_2/detail/small.jpg   480w" />
    <!-- square crop -->
    <source
        srcset="quilt_2/square/large.jpg  822w,
                quilt_2/square/medium.jpg 640w,
                quilt_2/square/small.jpg  320w" />
    <img
        src="quilt_2/detail/medium.jpg"
        alt="Detail of the above quilt, highlighting the embroidery and exotic stitchwork." />
</picture>
```

一个 `picture` 元素包含任意个数的 `source` 元素和一个 `img`。浏览器遍历 `picture` 的 `source`，直到找到一个属性满足当前环境的 `media`。它将匹配的 `source` 的 `srcset` 传给 `img`，即那个仍然是我们在页面上“看见”的元素。

下面是一个简单一些的例子：

```html
<picture>
    <source media="(orientation: landscape)" srcset="landscape.jpg" />
    <img src="portrait.jpg" alt="A rad wolf." />
</picture>
```

在横屏的视口中，`img` 将使用 `landscape.jpg`。当我们在竖屏（或者浏览器不支持 `picture` 时），`img` 什么都没变，于是加载 `portrait.jpg`。

如果你习惯了 `audio` 和 `video`，那可能对这种行为会有一些诧异。和这两个元素不同的是，`picture` 是一个不可见的包装：一个给 `img` 提供 `srcset` 的神奇的 `span`。

换句话说：`img` 不是一种回退策略。我们把它包裹在一个 `picture` 内，从而对它进行*渐进增强*。

事实上，这意味着我们想在渲染出来的图像上应用的任何样式都需要设在 `img` 上，*而非* `picture`。`picture { width: 100% }` 不会有任何效果。`picture > img { width: 100% }` 才是你想要的。

[这是我们的疯狂拼布页面在完整运用了这种模式之后的样子](http://alistapart.com/d/407/demo/second-pass.html)。记住，我们采用 `picture` 的目标是给小屏用户提供更多（且更*有用*）的像素，现在再来看看性能如何：

![另一幅展示页面数据量和窗口宽度关系的图表。](img/second-pass.svg)
 
还可以嘛！我们为 1x 屏幕发送了更多字节的数据。但是由于一些[和源图片尺寸有关](http://blog.cloudfour.com/how-do-you-pick-responsive-images-breakpoints/)的复杂原因，我们实际上还扩大了 2x 屏节省数据量的范围。在我们第一遍的方法中到 2x 屏的 480px 宽处就不再有节省了，但在第二遍之后，则延续到了 700px 处。

我们的页面现在小一些的设备上加载更快了，*同时*看上去也更好了。而且我们还没弄完呢。


## 第三遍：用 `source type` 指定多种格式

Web 的 25 年历史都由两种位图格式统治：JPEG 和 GIF。PNG 经过[痛苦](http://alistapart.com/article/pngopacity)的十年时间才加入了这个高端俱乐部。像 [WebP](http://en.wikipedia.org/wiki/WebP) 和 [JPEG XR](http://en.wikipedia.org/wiki/JPEG_XR) 这样的新格式正在外面敲着门，给开发者们许诺更高的压缩率，并且提供诸如 alpha 通道和无损模式等等有用的特性。但由于 `img` 那个孤单的 `src`，采纳过程一直都很缓慢——开发者们需要一个格式得到广泛支持后才能用它们进行部署。现在不同了。`picture` 通过使用和 `audio` 及 `video` 相同的 `source type` 的方式，让提供多个格式变得简单：

```html
<picture>
    <source type="image/svg+xml" srcset="logo.svg" />
    <img src="logo.png" alt="RadWolf, Inc." />
</picture>
```

如果浏览器支持某个 `source` 的 `type` 就会把那个 `source` 的 `srcset` 提供给 `img`。

上面是个好理解的例子，但是当我们把 `source type` 切换再加到我们已有的疯狂拼布的页面上时，比如要加上 WebP 支持，事情就变得麻烦（而且重复）了：

```html
<picture>
    <!-- 16:9 crop -->
    <source
        type="image/webp"
        media="(min-width: 36em)"
        srcset="quilt_2/detail/large.webp  1920w,
                quilt_2/detail/medium.webp  960w,
                quilt_2/detail/small.webp   480w" />
    <source
        media="(min-width: 36em)"
        srcset="quilt_2/detail/large.jpg  1920w,
                quilt_2/detail/medium.jpg  960w,
                quilt_2/detail/small.jpg   480w" />
    <!-- square crop -->
    <source
        type="image/webp"
        srcset="quilt_2/square/large.webp   822w,
                quilt_2/square/medium.webp  640w,
                quilt_2/square/small.webp   320w" />
    <source
        srcset="quilt_2/square/large.jpg   822w,
                quilt_2/square/medium.jpg  640w,
                quilt_2/square/small.jpg   320w" />
    <img
        src="quilt_2/detail/medium.jpg"
        alt="Detail of the above quilt, highlighting the embroidery and exotic stitchwork." />
</picture>
```

这对于仅仅一个图片来说，代码太多了。而且我们现在要处理很多文件：12 个！*每个图片*总共有三种分辨率、两种格式、两种裁切版本。我们在性能和功能上的一切收益都是以前期的复杂工作和日后的可维护性作为代价的。

[自动化是你的好伙伴](http://blog.cloudfour.com/8-guidelines-and-1-rule-for-responsive-)；当你的页面引入了大量代码块来指向同一个图片的各种替换版本时，你得做好这点，避免手工编写所有东西。

同样也要懂得适可而止。我把规范中的所有工具都用到了我们的例子中。这怎么看都*不够*谨慎。单独应用这些新特性中的任何一个都可以获得巨大的收益，你应该先认真审视这些特性堆叠起来以后带来的复杂度，再伸[爪](http://saveforwebclaws.tumblr.com/)扑上去做这些杂七杂八的工作。

虽然话是这么说，[还是让我们看一下 WebP 能为我们的拼布做些什么](http://alistapart.com/d/407/demo/third-pass.html)。

![第三幅展示页面数据量和窗口宽度关系的图表。](img/third-pass.svg)

在我们目前的成果上再节省出 25%–30% 数据量——且不仅在低端，而是覆盖全部情况——绝对不可忽视。我在这里用的方法也不是很严谨；你那边的 WebP 性能可能有所不同。我想说的是：相比现有的 JPEG/GIF/PNG，带来显著收益的新格式已经来了，而且还会有更多。`picture` 和 `source type` 降低了门槛，为以后持久的图片格式上的创新铺平了道路。
 

## [`size` the day (享受现在)](http://meninblazers.wikispaces.com/Size+The+Day)[^sizetheday]

[^sizetheday]: 「size the day」是著名足球教练博拉·米卢蒂诺维奇曾经的一个口误，他本想说的是「seize the day」（拉丁文说法 carpe diem，就是享受现在的意思）。这里原文是开了个小玩笑，正好对上文中所讲的 `sizes` 标签，意思是应当现在就开始享受新特性带来的便利。

> 原木雕后才成器；
> [...]
> 良匠不留未雕之木。
> 是谓要妙。
> —[道德经 第 27 章](http://www.chinapage.com/gnl.html#27)[^taoteching]
{: title="是谓代大匠斫，希有不伤其手者矣。—道德经 第 74 章"}

[^taoteching]: 原文引用的《道德经》是英文的批注版本，原版中没有前两句话，在这里只是将批注版本直译了一下。（另外，对比南怀瑾的《老子他说》来看，此批注版本的理解也有待商榷。）作者想表达的应该是我们应该尽快物尽其用，把新特性应用到实际开发中去。

多年来，我们都知道是图片在拖累着响应式的页面。那些巨大的、为巨屏特别设计的、而且被我们发送给*每个用户*的图片。我们也早就知道怎么来解决这个问题：给每个客户端发送不同的源图片。新的标记帮助我们做的就是这些事情。`srcset` 让我们给浏览器提供图片的多个版本，然后在 `sizes` 的帮助下来从中选择最合适的源图片来加载。`picture` 和 `source` 让我们实施进一步的控制，来保证根据媒体查询或者文件格式支持情况来选择特定的源图片。

总体上，这些新特性让我们能够编写有适应性、灵活性并且*响应式*的图片。它们让我们可以根据每个用户的设备发送定制的源图片，使得性能得到巨大的提高。再装备上[一个超赞的 polyfill](http://scottjehl.github.io/picturefill/)，着眼未来，开发者们应该*立刻*开始使用这些标记！
