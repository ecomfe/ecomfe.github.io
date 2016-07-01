---
title: ECharts 3.2.0 变动介绍
date: 2016-07-01
author: pissang
author_link: https://github.com/pissang
tags:
- ECharts
- 数据可视化
---


在 6 月 30 这个 ECharts 三周年之际我们发布了 3.2.0，这个版本是 ECharts 进入 3 之后最大的一次升级，新增的特性中有些是大家反复提了好久的，有些是我们自己想了很久的，有些我们在实现后光看看效果都觉得非常激动，有些可能看不出来区别但是我们也在底层做了很多工作。

希望这个开发了长达一个多月时间的新版本不会让大家失望。

## 新版本都有哪些东西？

在功能方面，这个版本新增了 brush（刷选），markArea，单轴等组件，除此之外对已有的图表组件，比如折线图，线图，dataZoom，坐标轴等做了或多或少的增强和优化，当然还有一些 bug 的修复。

这个版本在底层的性能上也做了很多的优化工作，首先直观的用数据来说大部分场景底层重绘的效率是原先的 2x~3x。其次是引入了渐进式渲染和单独的高亮层防止图形很多的时候交互和重绘带来很严重的阻塞。

同时我们官网还新增了一款 [主题编辑器](http://echarts.baidu.com/theme-builder.html) 方便大家编辑自己的主题

下面会一一介绍这些新特性。**多图流量党慎入！** 完整无图的 changelog 见 [这里](http://echarts.baidu.com/changelog.html)

<!-- more -->

## 新增 brush 组件

首先是这次新增的最重要的交互组件，刷选 brush，先看下面几个 Brushing and Linking 的效果 gif：

**[散点矩阵与平行坐标轴的联动](http://echarts.baidu.com/gallery/editor.html?c=scatter-matrix)**

![](/blog/echarts-3.2.0/img/brush-parallel-sm.gif)

**[K 线图与柱状图的联动](http://echarts.baidu.com/gallery/editor.html?c=candlestick-brush)**

![](/blog/echarts-3.2.0/img/brush-candlestick-sm.gif)

**[平行坐标与地图的联动](http://echarts.baidu.com/gallery/editor.html?c=map-parallel-prices)**

![](/blog/echarts-3.2.0/img/brush-map-sm.gif)

brush 组件可以通过矩形选择框快速的进行框选，也可以更细致的使用多边形选择工具，在散点矩阵中，每个切面的散点图形都会联动选中高亮，不同图表间，例如平行坐标与散点矩阵，只要用的是同一组数据，也可以实现联动的选中高亮。

有了这个组件后你可以使用多种姿势选中你想要的数据子集，ECharts 会联动高亮，抛出的事件中也包含了所有你选中的数据索引列表，你可以根据这份数据列表进行下一步的操作。

比如要求个和：

```js
var data = [...];

myChart.on('brushselected', function (params) {
	// 分别求出每个系列选中数据的和。
	var seriesSum = params.batch[0].map(function (seriesSelected) {
		return seriesSelected.dataIndex.reduce(function (sum, dataIndex) {
			return sum + data[dataIndex].value;
		}, 0);
	});
});
```

brush 组件的配置跟其它组件类似。

```js
option = {
	brush: {
		// 配置联动，'all' 表示所有系列都会联动
		brushLink: 'all',
		// 选中的视觉编码设置，支持的编码方式可以参考 visualMap
		inBrush: {
			// 选中图形不透明
			opacity: 1
		},
		// 非选中的视觉编码设置
		outOfBrush: {
			// 没选中的图形置灰, 不透明度调低
			color: '#ddd',
			opacity: 0.5
		}
	}
}
```

上面示例代码可以看到 brush 组件对于图形样式的调整也是跟 visualMap 一样通过编码视觉通道实现的。编码的顺序为 legend -> visualMap -> brush，后面的组件都是在前面的基础上二次加工，比如 legend 给不同系列分配了不同的色系，然后 visualMap 组件又在 legend 分配的色系基础上根据数据的大小给每个数据有调整了不同的灰度，最后 brush 组件在 visualMap 编码好的颜色基础上调整透明度，将所有选中的图形调整为不透明，将所有非选中的图形不透明度调低。



## 新增 markArea 组件

之前版本已经有了 markPoint 和 markLine 用来标记点数据和线数据，有时候我们也会需要标记一个范围的数据，比如标出一个区间投放了广告，某个时间段是高峰时间段等等。

因此我们这次也新增了用于标记范围的 markArea。跟 markPoint 和 markLine 用法类似，只是在数据结构上稍有不同。

下面是如何通过 markArea 标记处高峰时间段的示例代码

```js
markArea: {
    data: [
        [{
            name: '早高峰',
            xAxis: '07:30'
        }, {
            xAxis: '10:00'
        }],
        [{
            name: '晚高峰',
            xAxis: '17:30'
        }, {
            xAxis: '21:15'
        }]
    ]
}
```

![](/blog/echarts-3.2.0/img/mark-area.png)

或者也可以通过 `'min'`, `'max'` 等特殊值方便的标记处数据的区间范围

```js
markArea: {
    silent: true,
    data: [[{
        name: '分布区间',
        xAxis: 'min',
        yAxis: 'min'
    }, {
        xAxis: 'max',
        yAxis: 'max'
    }]]
}
```

如下面的男女分布图用 markArea 分别标出了男性女性的分布区间。

![](/blog/echarts-3.2.0/img/mark-area2.png)

关于这个例子还有两个小改动这里提一下：

第一个是新版本开始 markPoint, markLine, markArea 中数据的每个维度（例如 `xAxis`, `yAxis`）都支持 `'min'`, `'max'`, `'average'` 特殊的统计值。

第二个是新版本样式设置，主要是 `itemStyle` 中的样式，都开始支持 `borderType` 的设置，`borderType` 可以是 `'solid'`, `'dashed'`, `'dotted'`，通过设置该属性可以像上图一样绘制出虚线的边框。


## 更丰富的折线图

#### 首先是折线图现在可以显示成阶梯线图的形式了。如下示例图

![](/blog/echarts-3.2.0/img/step-line.png)

这个需求之前提的确实挺多，我们这次在折线图中新增了一个 [step](http://echarts.baidu.com/option#series-line.step) 配置项，这个配置项可以是 `'start'` `'middle'` `'end`，分别是在当前点，当前点与下个点的中点，下个点处拐弯。上面图中可以看出不同配置的效果区别。


#### 其次是折线图现在能够更好地跟 visualMap 组件结合。

之前版本的折线图在使用 [visualMap](http://echarts.baidu.com/option.html#visualMap) 组件的时候，编码的颜色只会被作用到拐点图形上，折线和面积区域还是默认的颜色，这个版本中我们做了下优化，使得 [visualMap](http://echarts.baidu.com/option.html#visualMap) 组件编码的颜色也能作用到折线和面积区域上，这么通过文字说可能看不出有什么用，下面是一个 2015 年北京 AQI 的折线图。我们用 visualMap 组件把不同区间段的 AQI 编码成了不同的颜色。

**[2015 年北京 AQI](http://echarts.baidu.com/gallery/editor.html?c=line-aqi)**\

![](/blog/echarts-3.2.0/img/line-visual-sm.gif)

这个例子中可以看到配合 [分段型的 visualMap](http://echarts.baidu.com/option.html#visualMap-piecewise) 我们可以把折线图的不同区间段显示成不同的颜色，这个可能在之前版本需要通过像 [“echarts3的折线图怎么分段显示不同的颜色”
](https://segmentfault.com/a/1190000005648860) 这篇文章中提到的比较 trick 的手段才能实现。这个版本中可以非常方便的实现了，而且在 visualMap 组件上我们还能进行交互式的选中高亮某个区间，其它的都置灰等操作。

配置的示例代码

```js
option = {
	...
	// visualMap 组件配置
	visualMap: {
		// 配置不同区间
		pieces: [{
			// 小于等于 60 分的显示为 红色
			// 在之前版本中是通过 min，max 的方式配置，无法表示开区间与闭区间
			// 新版本改为通过 gt, gte, lt, lte 分别配置大于，大于等于，小于，小于等于
			lte: 0,
			color: 'red'
		}, {
			// 大于 60 分的显示为蓝色
			gt: 0,
			color: 'blue'
		}]
	},
	...
	series: [{
		// 折线图系列不需要额外的配置
		type: 'lines',
		data: [...]
	}]
}
```

当然配合 [连续型的 visualMap](http://echarts.baidu.com/option.html#visualMap-continuous) 也是没问题的。

![](/blog/echarts-3.2.0/img/line-visual-continous.png)


## 更强大的线数据可视化
之前版本的[线图](http://echarts.baidu.com/option.html#series-lines)只支持起点到终点的线数据，对于一条线中有很多点的轨迹数据，比如公交路线，地铁路线，步行路线的轨迹，只能用多组起点到终点的数据去模拟，这种方式性能很差，而且一条路线每一段之间的连接效果差强人意。

所以 3.2.0 中新增加了 [polyline](http://echarts.baidu.com/option.html#series-lines.polyline) 属性用来支持多个点的轨迹绘制，并且对数据格式做了一定的调整，因为原先的数据格式并不方便每个数据项指定多个轨迹点。

```js
series: {
	type: 'lines',
	polyline: true,
	data: [{
		// 轨迹的坐标点配置
		coords: [[lng, lat], [lng, lat]...]
	} ... ]
}
```

下面这张图就是在百度地图上用启用了 [polyline](http://echarts.baidu.com/option.html#series-lines.polyline) 属性的线图绘制的北京公交路线图，图中有 1543 条公交路线。每条路线都有几十到上百不等的轨迹点。

**[北京公交路线图](http://echarts.baidu.com/gallery/editor.html?c=lines-bmap-bus)**

![](/blog/echarts-3.2.0/img/lines-bmap-bus.png)

[polyline](http://echarts.baidu.com/option.html#series-lines.polyline) 的线图也支持轨迹特效的绘制，而且新版本特效配置项新增了一项 [effect.constantSpeed](http://echarts.baidu.com/gallery/editor.html?c=series-lines.effect.constantSpeed) 保证在不同长度的路线中特效点的速度都是相同的。

下面是上图的公交路线加上轨迹特效后的效果。

**[北京公交路线图特效](http://echarts.baidu.com/gallery/editor.html?c=lines-bmap-effect)**

![](/blog/echarts-3.2.0/img/lines-effect-sm.gif)


## 更加个性化的 dataZoom
在 ECharts 样式的配置上，我们一直秉持的原则是默认样式尽量简洁通用，在常见场景下使用不会觉得违和，但是支持丰富的自定义设置可以更好的适应不同的场景。

数据区域缩放组件 dataZoom 也是，新版本我们增加了更丰富的自定义手柄样式和数据预览的样式配置。能配置成什么样子呢？可以直接看下图：

![](/blog/echarts-3.2.0/img/data-zoom-custom.png)

图中的 dataZoom 有自定义的手柄形状，手柄颜色，手柄阴影，数据预览也设置了不同的描边和填充颜色。

上图的配置项：

```js
// 手柄的形状
handleIcon: 'M10.7,11.9v-1.3H9.3v1.3c-4.9,0.3-8.8,4.4-8.8,9.4c0,5,3.9,9.1,8.8,9.4v1.3h1.3v-1.3c4.9-0.3,8.8-4.4,8.8-9.4C19.5,16.3,15.6,12.2,10.7,11.9z M13.3,24.4H6.7V23h6.6V24.4z M13.3,19.6H6.7v-1.4h6.6V19.6z',
// 手柄大小，相对于组件高度的百分比
handleSize: '80%',
// 数据预览的样式设置
dataBackground: {
  areaStyle: {
      color: '#8392A5'
  },
  lineStyle: {
      opacity: 0.8,
      color: '#8392A5'
  }
},
// 手柄的样式设置
handleStyle: {
  color: '#fff',
  shadowBlur: 3,
  shadowColor: 'rgba(0, 0, 0, 0.6)',
  shadowOffsetX: 2,
  shadowOffsetY: 2
}
```

除了样式没我们对工具栏中的 dataZoom 也做了优化，之前版本工具栏中的 dataZoom 只支持二维的选择，导致很多人困惑为什么折线图用完 dataZoom 很多点都不见了，原因就是因为在 Y 轴上数据也被 dataZoom 过滤了。

现在我们可以将工具栏中的 dataZoom 配置成单轴的选择：

```js
toolbox: {
	feature: {
		dataZoom: {
			// 不选择 Y 轴
			yAxisIndex: 'none'
		}
	}
}
```

效果如下：

![](/blog/echarts-3.2.0/img/datazoom-sm.gif)

## 坐标轴动画
动画一直是我们着重优化，并且引以为豪的一点，ECharts 的图表中有丰富的初始动画，表示数据变化的过渡动画以及突出数据的特效动画。

新版本我们对坐标轴也新增了过渡动画的效果。从下面两个动图可以看出来坐标轴的过渡动画使得数据区间的变化不会那么生硬，能够更好得表现数据的变化。

**图例选择**

![](/blog/echarts-3.2.0/img/axis-transition-sm.gif)

**动态数据**

![](/blog/echarts-3.2.0/img/axis-transition-dynamic-sm.gif)

## 更丰富的绘制效果

#### Pattern 和 Gradient

我们优化了 ZRender 中对于渐变 Gradient 和纹理 Pattern 的支持，因此 ECharts 中也可以更好的支持渐变和纹理作为填充样式。下面两个分别是在背景和图形填充上使用径向渐变和纹理的例子。

![](/blog/echarts-3.2.0/img/radial-gradient.png)
![](/blog/echarts-3.2.0/img/pie-pattern.png)

渐变和纹理的配置都是在之前填充颜色的配置上做了扩展。比如纯色样式的配置是：

```js
itemStyle: {
	normal: {
		color: 'red'
	}
}
```

配置渐变和纹理则是：

```js
itemStyle: {
	normal: {
		// 线性渐变，前四个参数分别是 x0, y0, x2, y2, 范围从 0 - 1
		// 相当于在图形包围盒中的百分比，如果最后一个参数传 true，则该四个值是绝对的像素位置
		color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{
			offset: 0, color: 'red'
		}, {
			offset: 1, color: 'blue'
		}], false),
		// 纹理填充
		color: new echarts.graphic.Pattern(imageDom, 'repeat')
	}
}
```

也支持使用一个普通对象去描述渐变和纹理

```js
// 线性渐变
color: {
	type: 'linear',
	global: false,
	x: 0,
	y: 0,
	x2: 1,
	y2: 0,
	colorStops: [{
		offset: 0, color: 'red'
	}, {
		offset: 1, color: 'blue'
	}]
}
// 纹理填充
color: {
	image: imageDom,
	repeat: 'repeat'
}
```

#### 混合模式

这个版本还新增入了绘制的混合模式的配置，不同的混合模式决定了 Canvas 绘制中像素颜色的叠加方式（对 Canvas 混合模式的方式感兴趣的话可以进一步看文章 [Using blend modes in HTML Canvas](http://blogs.adobe.com/webplatform/2014/02/24/using-blend-modes-in-html-canvas/) 和 [MDN](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/globalCompositeOperation) ）

不同混合模式的设置非常简单：

```js
series: [{
	...,
	// 设置为叠加的混合模式
	blendMode: 'lighter'
}],
// 也可以全局设置，source-over 是默认的混合模式
blendMode: 'source-over'
```

下图分别是使用默认`'source-over'`混合模式和叠加`'lighter'`混合模式绘制的 65k 条飞机航线的可视化图。

![](/blog/echarts-3.2.0/img/blend-mode-normal.png)
![](/blog/echarts-3.2.0/img/blend-mode-lighter.png)
**[示例地址](http://echarts.baidu.com/gallery/editor.html?c=lines-airline)**

相较而言可以看到下面混合模式为 `'lighter'` 的视觉冲击力更强，因为数据集中的区域会叠加成亮度很高的颜色（尽管最亮也只能是白色，但是因为旁边颜色的对比，所以这里普通的白色也会让人觉得亮度更高）。


## 更好的绘图性能

底层的性能优化也是这次版本升级非常重要的一点，因为这个改动无法用效果图表达，所以就多写点文字了。

首先概括下新版本性能优化的作用

> 新版本的性能优化能够使得 echarts 在相同的绘制帧率下同屏展现更多的图形，更多的数据，而且对于上万级别的大量图形，可以开启一些特殊的配置使得用户在不损失太多的展现效果下能够流畅的交互。

这次性能的优化可以分为无损和有损。无损的优化不会影响展现效果，而有损的优化对于展现效果会有轻微的损失，但是能换取用户交互的流畅性。

##### 首先是无损的优化，无损的优化主要集中在 ZRender 的绘图性能优化上。下面是两个主要优化的点

1. canvas 状态切换的减少。之前版本为了开发的便捷，每绘制一个图形都会 save 保存当前的 context，然后设置该图形的样式后绘制，最后 restore 恢复初始绘图前的 context，但是 canvas 的状态设置有一定开销，因为需要判断属性值是否合法，特别是`fillStyle`，`strokeStyle` 等颜色的设置，底层还需要解析颜色字符串，同样的，context 的保存和恢复也是不少开销。

	因此我们尝试去掉了每次绘制图形 context 的保存和恢复，然后绘制当前图形的时候，跟前一个绘制的图形对比样式的区别，只设置有变化的样式状态，因为 ECharts 中大部分图形都是相同的颜色和样式，所以可以减少不少状态的设置。这个优化后给大部分场景带来了 2x + 的性能提升。但是也会带来一些坑，比如如果 canvas 状态设置的值是非法的话，canvas 会选择属性值保持不变，这样会导致上一个图形的样式状态会泄露到当前图形，而不是像原先那样属性值会保持默认的值。因此需要额外的判断下属性是否合法。

2. 图形绘制的排序优化。ZRender 的图形有表示前后顺序的 z 属性，因此绘制之前会先根据 z 排序，保证绘制是从后往前的，而不会有错误的叠加关系，正常情况下这个排序逻辑非常简单。

	```js
	list.sort(function (a, b) { a.z - b.z });
	```

	但是这样简单处理比较坑的是 V8 的 in-place 快排是不稳定的，也就是 z 值相同的图形在排完序后顺序会被打乱，导致不能完全按照添加的顺序绘制。所以我们又额外加了个属性用来表示图形添加的顺序，比较的时候再多做这个判断保证排完序后的顺序，之前一直都是这么处理的，直到最近发现这个多加的判断会使比较函数永远不会返回 0（相等），而这会导致 V8 的排序开销会大几倍到十几倍不等，我们在对上万的图形更新做 profile 时也发现排序的开销一直是最高的。因此我们尝试把内置的排序方法替换成了稳定的 [timsort](https://en.wikipedia.org/wiki/Timsort)，因为 ZRender 的图形大部分是有序的，而 timsort 对有序数组排序的速度也要快很多。换成 timsort 后再 profile 排序的开销就降到几乎可以忽略了。

在上面两个优化后 http://echarts.baidu.com/gallery/editor.html?c=doc-example/bar-large 示例 2 个系列，每个系列 2k 的数据（也就是总共 4k+ 的图形）的初始动画从原先卡顿的 10 fps 提升到了流畅的 30 fps，而且这些 ZRender 的优化都对展示效果和上层 echarts 的开发没有什么影响和副作用。


##### 然后是一些有损的优化

1. 特殊的 hover 层。实际上在 ECharts 2 中对于 hover 图形的高亮就是强制把图形放到一个单独的 hover 层中，这样在鼠标 hover 高亮不用刷新整个图层而导致卡顿，但是这种方式因为高亮状态的图形实际上是直接叠加绘制在没有高亮状态的图形上的，所以也有不少的弊端，比如高亮的样式有透明度，高亮的图形形状不能完全覆盖普通状态的图形形状等等情况下都会导致显示不正确，而且大部分场景（1k 不到的图形）下 ECharts 都能做到流畅（30fps+）的高亮重绘，并没有太大使用这个优化的必要。

	所以从 ECharts 3 开始默认去掉了这个优化，3.2.0 开始支持选择性开启。可以通过配置 `hoverLayerThreshold` 属性值，当屏幕中图形数量大于这个值时开启单独的 hover 层，这样只有在有需要的时候通过选择牺牲部分显示效果保证交互的流畅性。

2. 渐进式渲染 Progressive Rendering。通俗点说就是把一大波图形分到不同帧中渲染，从而保证不会因为每一帧太多渲染的图形而导致交互阻塞。新版本中可以通过配置 [progressive](http://echarts.baidu.com/option.html#progressive) 和 [progressiveThreshold](http://echarts.baidu.com/option.html#progressiveThreshold) 启用渐进式渲染。


下面的动图演示的就是有 20k+ 图形的热力图在开启这两个优化后的效果，图中鼠标 hover 高亮，visualMap 组件的联动高亮都很流畅（gif 看起来比实际卡顿一点，右上角一直保持着比较高的帧率）。

<a href="http://echarts.baidu.com/gallery/editor.html?c=heatmap-large"><img src="/blog/echarts-3.2.0/img/performance-sm.gif" alt=""></a>

图表的初始动画也是渐进式渲染的效果。下面是更多渐进式渲染的效果图

<a href="http://echarts.baidu.com/gallery/editor.html?c=parallel-nutrients"><img src="/blog/echarts-3.2.0/img/progressive-sm.gif" alt=""></a>

![](/blog/echarts-3.2.0/img/large-lines-sm.gif)


## 主题编辑器

最后要提一下的是，ECharts 的工具链中又新增了主题编辑器。看下图

![](/blog/echarts-3.2.0/img/theme-builder.png)

这个编辑器除了方便我们的设计师配置主题外，希望也能让大家能够便捷地定制自己的主题。[戳这体验](http://echarts.baidu.com/theme-builder/)
