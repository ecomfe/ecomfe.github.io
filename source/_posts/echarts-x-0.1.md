---
title: ECharts-X 发布 0.1
date: 2015-2-4
author: diysimon 
author_link: http://weibo.com/u/1403623137
tags:
- ECharts
- ECharts-X
- 3D
- 数据可视化 
---

ECharts-X 发布啦！3D 的 Glob Visualization，3D 的 markPoint， markLine，艺术的风场洋流可视化，一切都有可能！ECharts the next generation ！好奇的小伙伴们快去官网看看吧！

![ECharts-X](/blog/echarts-x-0.1/banner.jpg)

<!-- more -->

[ECharts](http://echarts.baidu.com/)，缩写来自 Enterprise Charts，开源的商业级数据图表库，来自百度EFE数据可视化团队。相信一直关注大数据，特别是关注数据可视化的朋友对 ECharts 已经并不陌生了，据最近的一份中国 Github 年度报告里的统计显示，ECharts 已经成为了 Github上Star 数最多的中国开源项目，也是Github Explorer Data Visualization 板块上第一个也是目前唯一一个来自中国的开源项目，在这样一个精专的领域内近6000的star已经足以说明这条小鲸鱼的影响力。而且不仅是在国内， ECharts 还受到了国外技术团队，领域专家们的关注，ECharts Datamatic Edition（英文版的百度图说）的出现，twitter、Hacker news、 Medium Daily Digest 等媒体上也越来越多的看到ECharts的影子。
 
2013年6月30日发布1.0以来，1年多时间来 ECharts 已经迭代发布了20多个版本，就在一周前（1月30号）ECharts 发布了最新的2.2.0的同时低调的给大家带来了第一个官方分支版本 ECharts-M ( ECharts Mobile )，这是一个针对移动设备设备的优化版本，大家可以扫描页面下方的二维码在移动设备上体验到这个版本。移动版是大家期待已久的版本，如此低调的发布了这样一个重要的版本多少让人有点好奇，ECharts 团队在酝酿什么？

**ECharts-X Next Generation of ECharts**

这是3D（WebGL）版的 ECharts，这是由 ECharts 团队核心主创 [沈毅](http://weibo.com/pissang) 主导的项目，用 [林峰](http://weibo.com/u/1808084593) 的原话来说“这代表着 ECharts 团队最高的技术水平也代表着 ECharts 的未来，无限的可能。”

据项目负责人沈毅透露，ECharts-X 应该很快就能跟大家见面了，她将会有的一些特性：

- 跟 ECharts 的无缝集成，能够使用 ECharts 里的所有组件，能够跟折柱饼地图等混搭，配置项也是 ECharts 的风格，熟悉的配方熟悉的味道。
- 目前只支持 Globe Visualization，即 map3d，可以使用 ECharts map 中相同的 markPoint（标点）, markLine（标线）, 还有新加的 markBar（标柱）, 这个大家看到应该也不会陌生，three.js 里就有一个很经典的 webgl-globe 项目实现了这个效果。
- 风场，洋流等向量场的可视化，这个借鉴了之前 NASA 非常有名的洋流表层可视化，之前去浙大交流的时候也在陈为老师的实验室看到他们也做类似的可视化工作，ECharts-X 也将具备这样的能力。
 
尽管现在还只是 0.1 版本，可能还有些功能缺失，新加入的图表类型也只有 map3d（地图），也可能会有些不可原谅的bug，但是对于 ECharts-X 的发展我们从没有如此清晰和坚定过，短期的未来就会有scatter3d（散点）、surface3d（曲面图），期待大家的关注。作为 the next generation of ECharts，相信能够为 ECharts 的可视化带来更多的可能性。”  -- by [沈毅](http://weibo.com/pissang)。
 
-------------

无图无真相，大家过过瘾吧：

![MarkPoint 标点，炫光特效](/blog/echarts-x-0.1/mark-point.gif)

![MarkLine 标线，炫光特效](/blog/echarts-x-0.1/mark-line.gif)

![MarkBar 标柱、栅格](/blog/echarts-x-0.1/mark-bar.gif)

![洋流向量场可视化](/blog/echarts-x-0.1/surface.gif)


虽然只是截图跟运行时的效果无法比，但相信已经十分惊艳了。
手机是跑不起X了，不够过瘾的话扫扫看看ECharts-M。

![ECharts-M](/blog/echarts-x-0.1/echarts-m.png)

