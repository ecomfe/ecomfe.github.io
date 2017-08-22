---
date: 2017-08-22
title: ECharts v3.7 发布：富文本标签、可滚动图例
tags:
  - ECharts
  - 新版本
  - 数据可视化
author: 宿爽
---


在 ECharts 新发布的 [3.7 版本](https://github.com/ecomfe/echarts/releases/tag/3.7.0) 中，广泛地增加了标签的表现力。可以支持定制文本块的样式，也支持对文本片段应用特定的样式，如设置颜色、大小、背景、图片、对齐方式等，从而可以做出丰富的效果。另外增加了可滚动的图例，从而对图例过多显示不下的问题，提供了一种解决方案。

<img src="/blog/echarts-3-7-0/banner.png" width="100%" />


<!-- more -->

---

## 富文本标签

原先 echarts 中的文本标签，只能对整块统一进行样式设置，并且仅仅支持颜色和字体的设置，从而导致不易于制作表达能力更强的文字描述信息。

echarts v3.7 以后，支持了富文本标签，能够：

+ 能够定制文本块整体的样式（如背景、边框、阴影等）、位置、旋转等。
+ 能够对文本块中个别片段定义样式（如颜色、字体、高宽、背景、阴影等）、对齐方式等。
+ 能够在文本中使用图片做小图标或者背景。
+ 特定组合以上的规则，可以做出简单表格、分割线等效果。


例如：

<div class="ec-lazy"
  data-thumb="http://echarts.baidu.com/gallery/data/thumb/pie-rich-text.png"
  data-src="http://echarts.baidu.com/gallery/view.html?c=pie-rich-text&edit=1&reset=1"
  style="width: 100%; height: 400px"
></div>

<div class="ec-lazy"
  data-thumb="http://echarts.baidu.com/gallery/data/thumb/treemap-obama.png"
  data-src="http://echarts.baidu.com/gallery/view.html?c=treemap-obama&edit=1&reset=1"
  style="width: 100%; height: 550px"
></div>

<div class="ec-lazy"
  data-thumb="http://echarts.baidu.com/gallery/data/thumb/bar-rich-text.png"
  data-src="http://echarts.baidu.com/gallery/view.html?c=bar-rich-text&edit=1&reset=1"
  style="width: 100%; height: 400px"
></div>

<br>

其他一些例子：

[Map Labels](http://echarts.baidu.com/gallery/view.html?c=map-labels&edit=1&reset=1),
[Pie Labels](http://echarts.baidu.com/gallery/view.html?c=pie-nest&edit=1&reset=1),
[Gauge](http://echarts.baidu.com/gallery/view.html?c=gauge-car&edit=1&reset=1).


<br>

为了支持这些样式设置，echarts 提供了丰富的文本配置属性，包括：

+ 字体基本样式设置：`fontStyle`, `fontWeight`, `fontSize`, `fontFamily`。
+ 文字颜色：`color`。
+ 文字描边：`textBorderColor`, `textBorderWidth`。
+ 文字阴影：`textShadowColor`, `textShadowBlur`, `textShadowOffsetX`, `textShadowOffsetY`。
+ 文本块或文本片段大小：`lineHeight`, `width`, `height`, `padding`。
+ 文本块或文本片段的对齐：`align`, `verticalAlign`。
+ 文本块或文本片段的边框、背景（颜色或图片）：`backgroundColor`, `borderColor`, `borderWidth`, `borderRadius`。
+ 文本块或文本片段的阴影：`shadowColor`, `shadowBlur`, `shadowOffsetX`, `shadowOffsetY`。
+ 文本块的位置和旋转：`position`，`distance`, `rotate`。


详情参见教程：[富文本标签](http://echarts.baidu.com/tutorial.html#%E5%AF%8C%E6%96%87%E6%9C%AC%E6%A0%87%E7%AD%BE)


---


## 可滚动图例

有不少人会遇到这种问题：图例项数过多，导致覆盖住下面的图，或者甚至超出可视区域，难看而不可接受。之前遇到这种问题时，会建议大家自己使用 HTML 来实现外置的图例，调用 echarts 提供的图例相关 API 完成和 echarts 交互。但是，自己实现，毕竟有开发量，所以，终于在这个版本中，给出了一种能翻页图例控件，为这类问题提供了一种可选择的解决方案。

水平的图例：
<div class="ec-lazy"
  data-thumb="http://echarts.baidu.com/gallery/data/thumb/radar2.png"
  data-src="http://echarts.baidu.com/gallery/view.html?c=radar2&edit=1&reset=1"
  style="width: 100%; height: 400px"
></div>

垂直的图例：
<div class="ec-lazy"
  data-thumb="http://echarts.baidu.com/gallery/data/thumb/pie-legend.png"
  data-src="http://echarts.baidu.com/gallery/view.html?c=pie-legend&edit=1&reset=1"
  style="width: 100%; height: 400px"
></div>

具体设置，可参见：[legend.type](http://echarts.baidu.com/option.html#legend.type)。



---

## 标签文本配置的扁平化

在 echarts 中有众多的 `textStyle` 设置，例如 [series-bar.label.normal.textStyle](http://echarts.baidu.com/option.html#series-bar.label.normal.textStyle)、[xAxis.axisLabel.textStyle](http://echarts.baidu.com/option.html#xAxis.axisLabel.textStyle) 等等。这些 `textStyle` 有些层级过深和语法冗余，导致不方便，所以进行了扁平化，去掉了他们的 `textStyle` 这个层级。

也就是说，从前是这种写法：`label.normal.textStyle.fontSize`、`axisLabel.textStyle.fontSize`。

`v3.7` 之后，推荐这种写法 `label.normal.fontSize`、`axisLabel.fontSize`。

当然，之前的写法仍然被兼容。

有这些地方进被扁平化了：

<ul>
  <li>axisPointer<del>.textStyle.xxx => axisPointer.xxx</li>
  <li>xAxis.axisLabel<del>.textStyle</del>.xxx => xAxis.axisLabel.xxx</li>
  <li>yAxis.axisLabel<del>.textStyle</del>.xxx => yAxis.axisLabel.xxx</li>
  <li>radar.axisLabel<del>.textStyle</del>.xxx => radar.axisLabel.xxx</li>
  <li>singleAxis.axisLabel<del>.textStyle</del>.xxx => singleAxis.axisLabel.xxx</li>
  <li>radiusAxis.axisLabel<del>.textStyle</del>.xxx => radiusAxis.axisLabel.xxx</li>
  <li>angleAxis.axisLabel<del>.textStyle</del>.xxx => angleAxis.axisLabel.xxx</li>
  <li>parallel.parallelAxisDefault.axisLabel<del>.textStyle</del>.xxx => parallel.parallelAxisDefault.xxx</li>
  <li>parallelAxis.axisLabel<del>.textStyle</del>.xxx => parallelAxis.axisLabel.xxx</li>
  <li>series.label[normal|emphasis]<del>.textStyle</del>.xxx => series.label[normal|emphasis].xxx</li>
  <li>series.data.label[normal|emphasis]<del>.textStyle</del>.xxx => series.data.label[normal|emphasis].xxx</li>
  <li>series-gauge.axisLabel<del>.textStyle</del>.xxx => series-gauge.axisLabel.xxx</li>
  <li>series-gauge.title<del>.textStyle</del>.xxx => series-gauge.title.xxx</li>
  <li>series-gauge.detail<del>.textStyle</del>.xxx => series-gauge.detail.xxx</li>
  <li>series-treemap.upperLabel[normal|emphasis]<del>.textStyle</del>.xxx => series-treemap.upperLabel[normal|emphasis].xxx</li>
  <li>calendar.dayLabel<del>.textStyle</del>.xxx => calendar.dayLabel.xxx</li>
  <li>series-graph.edgeLabel[normal|emphasis]<del>.textStyle</del>.xxx => series-graph.edgeLabel[normal|emphasis].xxx</li>
  <li>calendar.dayLabel<del>.textStyle</del>.xxx => calendar.dayLabel.xxx</li>
  <li>calendar.monthLabel<del>.textStyle</del>.xxx => calendar.monthLabel.xxx</li>
  <li>calendar.yearLabel<del>.textStyle</del>.xxx => calendar.yearLabel.xxx</li>
  <li>markPoint.label[normal|emphasis]<del>.textStyle</del>.xxx => markPoint.label[normal|emphasis].xxx</li>
  <li>markPoint.data.label[normal|emphasis]<del>.textStyle</del>.xxx => markPoint.data.label[normal|emphasis].xxx</li>
  <li>markLine.label[normal|emphasis]<del>.textStyle</del>.xxx => markLine.label[normal|emphasis].xxx</li>
  <li>markLine.data.label[normal|emphasis]<del>.textStyle</del>.xxx => markLine.data.label[normal|emphasis].xxx</li>
  <li>markArea.label[normal|emphasis]<del>.textStyle</del>.xxx => markArea.label[normal|emphasis].xxx</li>
  <li>markArea.data.label[normal|emphasis]<del>.textStyle</del>.xxx => markArea.data.label[normal|emphasis].xxx</li>
  <li>tooltip.axisPointer.crossStyle<del>.textStyle</del>.xxx => tooltip.axisPointer.crossStyle.xxx</li>
  <li>axisPointer.label<del>.textStyle</del>.xxx => axisPointer.label.xxx</li>
  <li>timeline.label<del>.textStyle</del>.xxx => timeline.label.xxx</li>
  <li>radar.name<del>.textStyle</del>.xxx => radar.name.xxx</li>
</ul>


---

此外，还有一些其他的细节增强和 BUG FIX，例如：

+ [+] 对于时间坐标轴（即 [axis.type](http://echarts.baidu.com/option.html#xAxis.type) 为 `'time'`）支持了 [minInterval](http://echarts.baidu.com/option.html#xAxis.minInterval)。对于时间坐标轴和数值坐标轴（即 [axis.type](http://echarts.baidu.com/option.html#xAxis.type) 为 `'value'`）支持了 [maxInterval](http://echarts.baidu.com/option.html#xAxis.maxInterval)，从而能控制缩放（如 dataZoom）时刻度的最大最小范围。

+ [+] 支持了 [xAxis.axisLine.onZeroAxisIndex](http://echarts.baidu.com/option.html#xAxis.axisLine.onZeroAxisIndex)，从而能在多轴并且需要轴 `onZero` 的场景下，灵活设置轴互相的对应关系。参见 [#5069](https://github.com/ecomfe/echarts/issues/5069)。

+ [+] 支持了 `自定义系列(custom series)` 不使用 [坐标系](http://echarts.baidu.com/option.html#series-custom.coordinateSystems)。

+ [+] 支持了柱状图标签的旋转。参见 [rotate](http://echarts.baidu.com/option.html#series-bar.label.normal.rotate)、[align](http://echarts.baidu.com/option.html#series-bar.label.normal.align)、[verticalAlign](http://echarts.baidu.com/option.html#series-bar.label.normal.verticalAlign)。参见 [#5309](https://github.com/ecomfe/echarts/issues/5309)。

+ [+] 支持了 [radar.indicator.color](http://echarts.baidu.com/option.html#radar.indicator.color)，从而雷达每个标签能设置不同颜色。参见 [#6128](https://github.com/ecomfe/echarts/issues/6128)。

+ [+] 支持了 [dataZoom.rangeMode](http://echarts.baidu.com/option.html#dataZoom.rangeMode)，从而能在数据更新时固定缩放区域。参见 [#6128](https://github.com/ecomfe/echarts/issues/6040)。

+ [+] 支持了 [action.legend.legendToggleSelect](http://echarts.baidu.com/api.html#action.legend.legendToggleSelect), [action.legend.legendSelect](http://echarts.baidu.com/api.html#action.legend.legendSelect), [action.legend.legendUnSelect](http://echarts.baidu.com/api.html#action.legend.legendUnSelect) 中使用 `dataIndex`。参见 [#4242](https://github.com/ecomfe/echarts/issues/4242)。

+ [+] 支持了 [map.label.formatter](http://echarts.baidu.com/option.html#series-map.label.formatter)，从而方便于在地图系列中使用富文本标签。参见：[地图标签](http://echarts.baidu.com/demo.html#map-labels)。



更多的升级信息，参见 [changelog](http://echarts.baidu.com/changelog.html)。



<script src="http://apps.bdimg.com/libs/jquery/2.1.4/jquery.min.js"></script>
<script type="text/javascript">
(function () {

    if (typeof jQuery === 'undefined') {
        return;
    }

    var $ = jQuery;
    var env = window['MD_ENV'];
    var $ = jQuery;
    var useThumb = env && (env.os.phone || env.os.tablet);

    var blockList = $('.ec-lazy');
    var $win = $(window);

    blockList.each(function (index, block) {
        block = $(block);
        var src = block.attr('data-src');
        block.attr('data-src', src);
    });

    // Lazy load.
    $win.on('scroll', showBlock);

    $(showBlock);

    function initThumb(block, $block, blockThumb, blockSrc) {
        $block.css('lineHeight', $block.height() + 'px');
        block.innerHTML = [
            '<img style="width:100%;height:auto;margin:0;padding:0;vertical-align:middle;" src="', blockThumb, '"/>',
            // for vertial middle
            '<div style="vertical-align: middle; height: 100%; width: 0"></div>',
            '<div style="cursor:pointer;thumb-btn;position:absolute;bottom:10px;width:100%;height:22px;line-height:22px;text-align:center;">',
                '<em style="font-style:normal;border-radius:3px;padding:3px 5px;margin:3px 5px;color:white;background:#337ab7;font-size:12px;line-height:1.5;">点击图片加载真实图表</em>',
            '</div>',
            '<div class="ec-lazy-block-mask" style="cursor:pointer;position:absolute;left:0;top:0;width:100%;height:100%;margin:0;"></div>'
        ].join('');
        $block.find('.ec-lazy-block-mask').on('click', function () {
            initIFrame(block, $block, blockThumb, blockSrc);
        });
    }

    function initIFrame(block, $block, blockThumb, blockSrc) {
        block.innerHTML = [
            '<iframe style="overflow:hidden;width:100%;height:100%;margin:0;padding:0;" src="' , blockSrc, '">',
            'frameborder="no" border="0" marginwidth="0" marginheight="0"',
            'scrolling="no" hspace="0" vspace="0"></iframe>'
        ].join('');
    }

    function showBlock() {
        blockList.each(function (idx, block) {
            var $block = $(block);

            var blockSrc = $block.attr('data-src');
            var blockThumb = $block.attr('data-thumb');

            if (!blockSrc) {
                return;
            }

            $block.css({
                position: 'relative',
                overflow: 'hidden',
                textAlign: 'center',
                padding: 0
            });

            var winScrollTop = $win.scrollTop();
            var blockTop = block.offsetTop;

            var winHeight = $win.height();
            var winBottom = winScrollTop + winHeight;
            var blockBottom = blockTop + $block.height();

            if (winBottom >= blockTop && winBottom <= (blockBottom + winHeight)) {
                $block.attr('data-src', '');
                (useThumb && blockThumb)
                    ? initThumb(block, $block, blockThumb, blockSrc)
                    : initIFrame(block, $block, blockThumb, blockSrc);
            }
        });
    }
})();
</script>
