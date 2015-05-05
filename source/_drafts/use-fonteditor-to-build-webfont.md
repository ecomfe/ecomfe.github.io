---
title: 使用FontEditor创建web字体图标
date: 2015-05-01
author: mkwiser
author_link: http://www.mkwiser.com/
tags:
- font
- font editor
- webfont
---

关于web字体图标，市面上已经有一些好的在线工具来管理和生成，`iconfont`和`icomoon`都可以将svg图标转换成font图标以便在网页上使用。但是如果你想要更多：ttf、woff、eot、otf统统拿来用，svg、图片统统可导入，图标效果实时可调整，只需要在线动动鼠标，就可以完成呢。
那就需要一个好用的在线font编辑工具，**[FontEditor](http://font.baidu.com/editor/)**，你需要的东西都在这里。

<!-- more -->


### 为什么会出现FontEditor

> Everything Happens for a Reason

FontEditor会出现只是因为我比较懒。如果我想用webfont做图标，又不想了解一大堆专业术语，又不想一次一次的导入和导出，又不想一次一次的调整fontsize以适应图标变化，又踏破铁鞋无觅处，那只能自己整一个了。FontEditor是一款**纯前端**字体编辑和管理软件，支持字体项目管理，支持导入ttf、woff、eot、otf格式字体，支持svg和图片导入，支持生成ttf、woff、eot、svg格式字体，支持批量调整字形和单个字形轮廓编辑，支持实时预览，支持实时同步字体到本地。


### 如何使用svg制作webfont

打开`chrome`浏览器，输入[http://font.baidu.com/](http://font.baidu.com/)，创建名为`fonteditor`（看个人喜好）的项目，开始制作字体。

![](/blog/use-fonteditor-to-build-webfont/img/new.png)

在主菜单点击`导入->导入svg`按钮，打开文件选择框，拖选svg文件将svg图标导入到主面板；点击主面板`设置代码点`按钮，批量设置unicode代码点；点击主菜单`ttf`、`woff`、`zip`按钮，导出ttf、woff或其他格式字体；一个webfont制作完成，so easy。
保存项目，点击`预览`按钮查看图标预览，以及嵌入代码，如果你熟悉这一步，算我没说。

![](/blog/use-fonteditor-to-build-webfont/img/import-svg.png)

其他格式字形的导入，请参考FontEditor帮助文档，simple and stupid。


### 如何调整字形

在主面板工具栏点击`调整位置`和`调整字形`按钮，对图标进行批量调整，也可以选中单个或多个字形进行单独调整。
这里需要普及一下相关知识：
* **左边轴**：字形左边留白
* **右边轴**：字形右边留白，左右留白决定两个字形之间的间距
* **基线**：字体的baseline，对应于css中的`baseline`
* **上下边界**：字体的ascent和descent，对应于css中的`text-top`和`text-bottom`
* **unicode代码点**：Font Engine根据会代码点查找到相应的字形进行渲染，webfont可以使用私有区域 `0xE000`~`0XF8FF` 作为图标的代码点，详情：[unicode](http://en.wikipedia.org/wiki/Unicode)

![](/blog/use-fonteditor-to-build-webfont/img/glyf.png)

### 如何编辑单个字形

对于webfont，使用FontEditor**调整左右边轴为0，缩放字形到上下边界**，即可满足大部分图标制作需求。如果需要精确调整字形，点击主面板字形上面的`铅笔`按钮可打开字形编辑面板，对单个字形进行调整：
拖选需要调整的轮廓，点击工具栏中的相关菜单可以对轮廓进行对齐、翻转、镜像、切割、求交、求并等操作，拖拽轮廓边界控制点调整轮廓大小。
双击单个轮廓进入轮廓点编辑模式，拖拽轮廓点改变字形，右键可增加、删除轮廓点，按`esc`退出轮廓点编辑。
点击工具栏中的`保存`按钮，保存当前轮廓。
按`F2`可以去切换`打开/关闭`字形编辑面板，也可以点击工具栏右侧的`退出`按钮退出字形编辑。

![](/blog/use-fonteditor-to-build-webfont/img/adjust-contours.png)


### 如何同步字体到本地

点击主面板工具栏`同步字体`按钮，设置同步选项。设置接收文件的服务地址，设置字体名称和需要同步的字体类型。在保存项目的时候FontEditor会发送数据到接收地址，然后就需要服务端接收字体数据。
关于如何保存FontEditor发送的字体，查看[PHP版同步示例](https://github.com/ecomfe/fonteditor/blob/master/demo/sync/font.php)。不会php？算我没说。

![](/blog/use-fonteditor-to-build-webfont/img/sync.png)


### 脑补

字体相关的文档和技术非常多，多到让人眼花缭乱无所适从，这里只列举了技术相关的文档，其他请自行补脑。

- [The Font Engine](https://developer.apple.com/fonts/TrueType-Reference-Manual/RM02/Chap2.html) 字体引擎工作原理
- [OpenType specification](http://www.microsoft.com/typography/otspec/) OpenType官方文档
- [WOFF Font](http://www.w3.org/TR/2012/REC-WOFF-20121213/) WOFF字体格式
- [SVG Font](http://www.w3.org/TR/SVG11/fonts.html) SVG字体格式

想贡献代码？移步这里：
<iframe src="https://ghbtns.com/github-btn.html?user=ecomfe&repo=fonteditor&type=fork&count=true" frameborder="0" scrolling="0" width="170px" height="20px"></iframe>
只想点个赞，在这：
<iframe src="https://ghbtns.com/github-btn.html?user=ecomfe&repo=fonteditor&type=star&count=true" frameborder="0" scrolling="0" width="170px" height="20px"></iframe>

### 相关项目

- [fontmin](https://github.com/ecomfe/fontmin) 第一个纯 JS 字体解决方案
- [fonteditor-ttf](https://github.com/kekee000/fonteditor-ttf) FontEditor的nodejs版本基础库
