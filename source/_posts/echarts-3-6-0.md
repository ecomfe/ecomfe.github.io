---
date: 2017-05-25
title: ECharts v3.6 发布：自定义系列、极坐标柱状图
tags:
  - ECharts
  - 新版本
  - 数据可视化
author: 宿爽
---


在 ECharts 新发布的 [3.6 版本](https://github.com/ecomfe/echarts/releases/tag/3.6.0)中，新增了 [自定义系列（custom series）](http://echarts.baidu.com/option.html#series-custom)，能让用户定制渲染逻辑，从而在已有坐标系中创造新的图表。此外还有极坐标柱状图、自定义维度映射、dataZoom 等其他一些增强。

<img src="/blog/echarts-3-6-0/banner.png" width="100%" />

<!-- more -->

## 自定义系列

图表的类型多种多样，有些大众有些小众，echarts 难于内置得支持所有类型的图表。所以推出了 [自定义系列（custom series）](http://echarts.baidu.com/option.html#series-custom)。

自定义系列可以自定义系列中的图形元素渲染。从而能扩展出不同的图表。同时，echarts 会统一管理图形的创建删除、动画、与其他组件（如 [dataZoom](http://echarts.baidu.com/option.html#dataZoom)、[visualMap](http://echarts.baidu.com/option.html#visualMap)）的联动，使用户不必纠结这些细节。


**例如，下面的例子使用 custom series 扩展出了 x-range 图：**
<div class="ec-lazy"
  data-thumb="http://echarts.baidu.com/gallery/data/thumb/custom-profile.png"
  data-src="http://echarts.baidu.com/gallery/view.html?c=custom-profile&edit=1&reset=1"
  style="width: 100%; height: 300px"
></div>

可以注意到，里面须用户自定义的渲染逻辑，在 `renderItem` 这个函数中，并不十分复杂。但是得到的功能是比较完备的。

```js
var option = {
    ...,
    series: [{
        type: 'custom',
        renderItem: function (params, api) {
            var categoryIndex = api.value(0);
            var start = api.coord([api.value(1), categoryIndex]);
            var end = api.coord([api.value(2), categoryIndex]);
            var height = api.size([0, 1])[1] * 0.6;

            return {
                type: 'rect',
                shape: echarts.graphic.clipRectByRect({
                    x: start[0],
                    y: start[1] - height / 2,
                    width: end[0] - start[0],
                    height: height
                }, {
                    x: params.coordSys.x,
                    y: params.coordSys.y,
                    width: params.coordSys.width,
                    height: params.coordSys.height
                }),
                style: api.style()
            };
        },
        data: data
    }]
}
```


**下面的两个例子使用 custom series 扩展出了 error-chart 图：**
<div class="ec-lazy"
  data-thumb="http://echarts.baidu.com/gallery/data/thumb/custom-error-bar.png"
  data-src="http://echarts.baidu.com/gallery/view.html?c=custom-error-bar&edit=1&reset=1"
  style="width: 100%; height: 300px"
></div>

<div class="ec-lazy"
  data-thumb="http://echarts.baidu.com/gallery/data/thumb/custom-error-scatter.png"
  data-src="http://echarts.baidu.com/gallery/view.html?c=custom-error-scatter&edit=1&reset=1"
  style="width: 100%; height: 400px"
></div>

**下面是其他一些例子：**

<div class="ec-lazy"
  data-thumb="http://echarts.baidu.com/gallery/data/thumb/custom-bar-trend.png"
  data-src="http://echarts.baidu.com/gallery/view.html?c=custom-bar-trend&edit=1&reset=1"
  style="width: 100%; height: 300px"
></div>

<div class="ec-lazy"
  data-thumb="http://echarts.baidu.com/gallery/data/thumb/custom-profit.png"
  data-src="http://echarts.baidu.com/gallery/view.html?c=custom-profit&edit=1&reset=1"
  style="width: 100%; height: 300px"
></div>

<div class="ec-lazy"
  data-thumb="http://echarts.baidu.com/gallery/data/thumb/custom-hexbin.png"
  data-src="http://echarts.baidu.com/gallery/view.html?c=custom-hexbin&edit=1&reset=1"
  style="width: 100%; height: 500px"
></div>


## 极坐标柱状图

极坐标中的柱状图，可以按径向排布或者切向排布。

<div class="ec-lazy"
  data-thumb="http://echarts.baidu.com/gallery/data/thumb/bar-polar-stack.png"
  data-src="http://echarts.baidu.com/gallery/view.html?c=bar-polar-stack&edit=1&reset=1"
  style="width: 100%; height: 300px"
></div>

<div class="ec-lazy"
  data-thumb="http://echarts.baidu.com/gallery/data/thumb/bar-polar-stack-radial.png"
  data-src="http://echarts.baidu.com/gallery/view.html?c=bar-polar-stack-radial&edit=1&reset=1"
  style="width: 100%; height: 300px"
></div>

使用时，只需要将系列的 `coordinateSystem` 设置为 `'polar'`，将原先笛卡尔坐标系中使用的 `xAxis` 和 `yAxis` 替换成 `radiusAxis` 和 `angleAxis`，就能使用极坐标系的柱状图了。


## 其他

此外，

+ 支持了[encode](http://echarts.baidu.com/option.html#series-scatter.encode) 设定，可以指定 [data](http://echarts.baidu.com/option.html#series-scatter.data) 中哪些维度映射到坐标系中哪个轴，或者哪些维度在 [tooltip](http://echarts.baidu.com/option.html#tooltip) 以及 [label](http://echarts.baidu.com/option.html#series-scatter.label) 中显示。
+ 支持了 [dimensions](http://echarts.baidu.com/option.html#series-scatter.dimensions) 设定，能指定 [data](http://echarts.baidu.com/option.html#series-scatter.data) 中每个维度的名称和类型。名称可以显示在默认 [tooltip](http://echarts.baidu.com/option.html#tooltip) 中。
+ `dataZoom` 组件进行了增强。比如，支持了『按住 `'ctrl'`/`'alt'`/`'shift'` 和滚轮时才能出发缩放平移』功能，避免和页面的滚动冲突（参见 [moveOnMouseMove](http://echarts.baidu.com/option.html#dataZoom-inside.moveOnMouseMove) 和 [zoomOnMouseWheel](http://echarts.baidu.com/option.html#dataZoom-inside.zoomOnMouseWheel)。另外支持了 [minSpan](http://echarts.baidu.com/option.html#dataZoom.minSpan) 和 [maxSpan](http://echarts.baidu.com/option.html#dataZoom.maxSpan) 等细节配置。

更多的升级信息，参见 [changelog](http://echarts.baidu.com/changelog.html)。


<script src="https://apps.bdimg.com/libs/jquery/2.1.4/jquery.min.js"></script>
<script>
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
