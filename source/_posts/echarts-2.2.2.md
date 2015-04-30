---
title: ECharts 发布 2.2.2
date: 2015-4-30
author: diysimon 
author_link: http://weibo.com/u/1403623137
tags:
- ECharts
- 数据可视化
---

在五一劳动节的前一天，ECharts发布了一个非常2的版本，2.2.2。在本版本中，我们一共做了以下重大升级：

* 新增韦恩图(venn)及Treemap
* 发布 ECharts 在线构建工具
* 新增对数轴

并且修复了一些反馈较多、优先级较高的问题：

* 增加了大规模折线图添加数据抽希策略配置。[解决原有抽希策略导致的数据精度缺失问题](https://github.com/ecomfe/echarts/issues/1370)
* symbolSize 支持通过数组分别设置宽高
* 修复 [mac safari饼图性能问题](https://github.com/ecomfe/echarts/issues/1308)
* 支持 z, zlevel 的配置

<!-- more -->

## 韦恩图

韦恩图（维恩图），也叫文氏图，用于显示元素集合重叠区域的图示。诞生于1880年，韦恩（Venn）在《论命题和推理的图表化和机械化表现》一文中首次采用固定位置的交叉环形式用封闭曲线（内部区域）表示集合及其关系的图形。

![韦恩图](/blog/echarts-2.2.2/venn.jpg)

可以通过访问ECharts官网的[示例](http://echarts.baidu.com/doc/example/venn.html)了解如何使用ECharts制作韦恩图

## Treemap

这是一个中文名很长的图表类型，比如叫做：矩形式树状结构绘图法，或矩形式树状结构图绘制法，或者树状结构矩形图绘制法，或者甚至称为树状结构映射。其实指的是一种利用嵌套式矩形来显示树状结构数据的方法。

![Treemap](/blog/echarts-2.2.2/treemap.jpg)

可以通过访问ECharts官网的[示例](http://echarts.baidu.com/doc/example/treemap.html)了解如何使用ECharts制作Treemap。

## ECharts在线发布工具

我们提供了最新的ECharts在线发布工具，方便用户可以自由的选择，仅仅打包你在项目中使用到的图表及组件代码。减少整体需要加载的ECharts文件大小，提高您产品的网络加载速度及用户体验。

入口最ECharts官网主导航的下载栏目中，或者直接访问 [http://ecomfe.github.io/echarts-builder-web/](http://ecomfe.github.io/echarts-builder-web/)

![发布工具](/blog/echarts-2.2.2/pub.jpg)

