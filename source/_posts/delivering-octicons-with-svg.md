---
title: 使用 SVG 输出 Octicon
date: 2016-03-02
author: Justineo
author_link: http://weibo.com/u/1143654280
tags:
- CSS
- SVG
- 图标
- 字体
---

原文：[https://github.com/blog/2112-delivering-octicons-with-svg](https://github.com/blog/2112-delivering-octicons-with-svg)

GitHub.com no longer delivers its icons via icon font. Instead, we’ve replaced all the Octicons throughout our codebase with SVG alternatives. While the changes are mostly under-the-hood, you’ll immediately feel the benefits of the SVG icons.

GitHub.com 现在不再使用字体来输出图标了。我们把代码库中所有的 Octicon 替换成了 SVG 版本。虽然这些改动并不那么明显，但你马上就能体会到 SVG 图标的优点。

Octicon comparison

![Octicon 上的对比](https://cloud.githubusercontent.com/assets/1369864/13088505/5c79d3ee-d4a1-11e5-89f4-aeb7c86a0c65.png)

Switching to SVG renders our icons as images instead of text, locking nicely to whole pixel values at any resolution. Compare the zoomed-in icon font version on the left with the crisp SVG version on the right.

切换到 SVG 以后，图标会作为图片渲染而非文字，这使其在任何分辨率下都能很好地在各种像素值下显示。比较一下左侧放大后的字体版本和右侧清晰的 SVG 版本。

## Why SVG?
## 为何使用 SVG？

### Icon font rendering issues
### 图标字体渲染问题

Icon fonts have always been a hack. We originally used a custom font with our icons as unicode symbols. This allowed us to include our icon font in our CSS bundle. Simply adding a class to any element would make our icons appear. We could then change the size and color on the fly using only CSS.
图标字体从来只是一种 hack。我们之前使用一个自定义字体，并将图标作为 Unicode 符号。这样图标字体就可以通过打包后的 CSS 来引入。只要简单地在任意元素上添加一个 class，图标就可以显示出来。然后我们只使用 CSS 就能即时改变图标的尺寸和颜色了。

Unfortunately, even though these icons were vector shapes, they’d often render poorly on 1x displays. In Webkit-based browsers, you’d get blurry icons depending on the browser’s window width. Since our icons were delivered as text, sub-pixel rendering meant to improve text legibility actually made our icons look much worse.
不幸的是，虽然这些图标是矢量图形，但在 1x 显示屏下的渲染效果并不理想。在基于 WebKit 的浏览器下，图标可能会在某些窗口宽度下变得模糊。因为此时图标是作为文本输出的，本来用于提高文本可读性的次像素渲染技术反而使图标看起来糟糕许多。

### Page rendering improvements
### 对页面渲染的改进

Since our SVG is injected directly into the markup (more on why we used this approach in a bit), we no longer see a flash of unstyled content as the icon font is downloaded, cached, and rendered.
因为我们直接将 SVG 注入 HTML（这也是我们选择这种方式更大的原因），所以不再会出现图标字体下载、缓存、渲染过程中出现的样式闪动。

Jank

![页面闪动](https://cloud.githubusercontent.com/assets/1369864/13187194/68fa7d7e-d70f-11e5-85e6-f6c528c436db.gif)

### Accessibility

### 可访问性

As laid out in Death to Icon Fonts, some users override GitHub’s fonts. For dyslexics, certain typefaces can be more readable. To those changing their fonts, our font-based icons were rendered as empty squares. This messed up GitHub’s page layouts and didn’t provide any meaning. SVGs will display regardless of font overrides. For screen readers, SVG provides us the ability to add pronouncable `alt` attributes, or leave them off entirely.

就像在[《图标字体已死》](https://speakerdeck.com/ninjanails/death-to-icon-fonts)一文中所述，有些用户会覆盖掉 GitHub 的字体。对于患有读写障碍的用户，某些特定字体是更加容易阅读的。对于修改字体的用户来说，我们基于字体的图标就被渲染成了空白方框。这搞乱了 GitHub 页面布局，而且也不提供任何信息。而不管字体覆盖与否，SVG 都可以正常显示。对于读屏器用户来说，SVG 能让我们选择是读出 `alt` 属性还是直接完全跳过。

### Properly sized glyphs

### 图形尺寸更合适

For each icon, we currently serve a single glyph at all sizes. Since the loading of our site is dependent on the download of our icon font, we were forced to limited the icon set to just the essential 16px shapes. This led to some concessions on the visuals of each symbol since we’d optimized for the 16px grid. When scaling our icons up in blankslates or marketing pages, we’re still showing the 16px version of the icon. With SVGs, we can easily fork the entire icon set and offer more appropriate glyphs at any size we specify. We could have done this with our icon fonts, but then our users would need to download twice as much data. Possibly more.

我们目前对每个图标在所有尺寸下提供单一的图形。因为站点的加载依赖了图标字体的下载，我们曾被迫把图标集限制在最重要的 16px 尺寸下。这让每个符号在视觉上做出一些让步，因为我们是针对 16px 方格进行优化的。当在新页面或营销页上缩放这些图标时，显示的还是 16px 的版本。而 SVG 可以方便地 fork 全部的图标集，在我们指定的每个尺寸提供更合适的图形。当然对图标字体也可以这么做，但这样用户需要下载两倍的数据量，可能更多。

### Ease of authoring

### 便于创作

Building custom fonts is hard. A few web apps have popped up to solve this pain. Internally, we’d built our own. With SVG, adding a new icon could be as trivial as dragging another SVG file into a directory.
打包自定义字体是复杂的。一些 web 应用因此而生，我们内部也自己搞了一个。而用 SVG 的话，添加一个新图标会变得像把一个 SVG 文件拖入一个目录这样轻而易举。

### We can animate them

### 可添加动画效果

We’re not saying we should, but we could, though SVG animation does have some practical applications—preloader animations, for example.

这并不是说一定要加，而是有了添加动画的可能性。而且 SVG 动画也的确在例如[预加载动画](http://codepen.io/aaronshekey/pen/wMZBgK)等地方有实际应用。

## How

## 如何实现

Our Octicons appear nearly 2500 times throughout GitHub’s codebase. Prior to SVG, Octicons were included as simple spans <span class="octicon octicon-alert"></span>. To switch to SVG, we first added a Rails helper for injecting SVG paths directly into to our markup. Relying on the helper allowed us to test various methods of delivering SVG to our staff before enabling it for the public. Should a better alternative to SVG come along, or if we need to revert back to icon fonts for any reason, we’d only have to change the output of the helper.

Octicon 在整个 GitHub 的代码库中出现了约 2500 次。在用 SVG 之前，我们简单地用 `<span class="octicon octicon-alert"></span>` 这样简单的标签来引入。要切换到 SVG，我们先给添加了一个用来往 HTML 内直接注入 SVG 路径的 Rails helper。我们先用这个 helper 让员工测试了不同的 SVG 输出方式，然后才对外发布。

### Helper usage

### Helper 的用法

Input `<%= octicon(:symbol => "plus") %>`

输入 `<%= octicon(:symbol => "plus") %>`

Output

输出

```
<svg aria-hidden="true" class="octicon octicon-plus" width="12" height="16" role="img" version="1.1" viewBox="0 0 12 16">
    <path d="M12 9H7v5H5V9H0V7h5V2h2v5h5v2z"></path>
</svg>
```

### Our approach

### 我们的方案

You can see we’ve landed on directly injecting the SVGs directly in our page markup. This allows us the flexibility to change the color of the icons with CSS using the fill: declaration on the fly.

可以看见，我们最终上线的方案是往页面 HTML 中直接注入 SVG。这样就可以灵活地实时调整 CSS 的 `fill:` 声明来修改颜色。

Instead of an icon font, we now have a directory of SVG shapes whose paths are directly injected into the markup by our helper based on which symbol we choose. For example, if we want an alert icon, we call the helper <%= octicon(:symbol => "alert") %>. It looks for the icon of the same file name and injects the SVG.

我们现在有一个 SVG 图形的目录而不是一个图标字体，我们通过挑选，将里面这些符号的路径用 helper 直接注入到 HTML 里。比如，通过 `<%= octicon(:symbol => "alert") %>` 来调用 helper 就可以的到一个警告图标。Helper 会查找同名的文件名，并且注入 SVG。

We tried a number of approaches when adding SVG icons to our pages. Given the constraints of GitHub’s production environment, some were dead-ends.

我们尝试过好几种在页面中添加 SVG 图标的方法，其中有些由于受到 GitHub 生产环境的限制而失败了。

External .svg — We first attempted to serve a single external “svgstore”. We’d include individual sprites using the <use> element. With our current cross-domain security policy and asset pipeline, we found it difficult to serve the SVG sprites externally.
SVG background images — This wouldn’t let us color our icons on the fly.
SVGs linked via <img> and the src attribute — This wouldn’t let us color our icons on the fly.
Embedding the entire “svgstore” in every view and using <use> — It just didn’t feel quite right to embed every SVG shape we have on every single page throughout GitHub.com especially if a page didn’t include a single icon.

1. 外部 .svg 文件——最开始我们尝试提供一个单一的外部“SVG 仓库”，然后用 `<use>` 元素来引入 SVG 拼图中的单个图形。在我们当前的跨域安全策略和资源管道条件下，提供在外部提供 SVG 拼图很难做到。
2. SVG 背景——这种方式无法实时调整图标的颜色。
3. 用 `<img>` 与 `src` 属性来引入 SVG——这种方式无法实时调整图标的颜色。
4. 将“SVG 仓库”整个嵌入到每个视图，然后使用 `<use>` ——把每个 SVG 都嵌入到整个 GitHub.com 的每个单页想想就不对，特别是有时候这个页面一个图标都没用到。


### Performance

### 性能

We’ve found there were no adverse effects on pageload or performance when switching to SVG. We’d hoped for a more dramatic drop in rendering times, but often performance has more to do with perception. Since SVG icons are being rendered like images in the page with defined widths and heights, the page doesn’t have nearly as much jank.

在切换到 SVG 以后，我们还没发现[页面加载和性能](https://cloud.githubusercontent.com/assets/54012/13176951/eedb1330-d6e3-11e5-8dfb-99932ff7ee25.png)上有任何不良影响。我们之前曾预计渲染时间会大幅下降，但往往性能和人的感知更相关。由于 SVG 图标被渲染为了指定宽高的图像，页面也不再会像之前那样[闪动](http://jankfree.org/)了。

We were also able to kill a bit of bloat from our CSS bundles since we’re no longer serving the font CSS.

同时由于我们不再输出字体相关的 CSS，我们还能[干掉一些多余的 CSS 代码](https://cloud.githubusercontent.com/assets/54012/13176888/70d42346-d6e3-11e5-88eb-0ca0a393392c.png)。

### Drawbacks & Gotchas

### 缺点和坑

Firefox still has pixel-rounding errors in SVG, though the icon font had the same issue.
You may have to wrap these SVGs with another div if you want to give them a background color.
Since SVG is being delivered as an image, some CSS overrides might need to be considered. If you see anything weird in our layouts, let us know.
Internet Explorer needs defined width and height attributes on the svg element in order for them to be sized correctly.
We were serving both SVG and our icon font during our transition. This would cause IE to crash while we were still applying font-family to each of the SVG icons. This was cleared up as soon as we transitioned fully to SVG.

* Firefox 对 SVG 仍然有像素值计算的问题，虽然图标字体也有相同的问题。
* 如果你需要 SVG 有背景色，你可能需要在外面包一层额外的 div。
* 由于 SVG 是作为图片提供的，某些 CSS 的覆盖问题也需要重新考量。如果你看到我们的页面布局有任何奇怪的地方，请告知。
* IE 浏览器下，需要对 `svg` 元素指定宽高属性，才能正常显示大小。
* 在技术方案升级过程中，我们层同时输出 SVG 和图标字体。在我们仍然为每个 SVG 图标指定 font-family 时会导致 IE 崩溃。在完全转用 SVG 以后，这个问题就解决了。


## TL;DR
## 总结

By switching from icon fonts, we can serve our icons more easily, more quickly, and more accessibly. And they look better. Enjoy.

通过换掉图标字体，我们能更方便、更快速、更有可访问性地提供图标了。而且它们看起来也更棒了。享受吧。
