---
title: 回归CSS标准之Float
date: 2015-10-16
author: dddbear
tags:
- float
- css标准
---

最近因为遇到一个float相关的bug，又跑去撸了一遍css标准。然后发现，它确实比其他属性复杂好多，既不像inline-block那样单纯的完成并排显示，又不像绝对定位那样彻底的脱离文档流而不影响别的元素。它唯一单纯的就是，真的是唯一可以实现文字环绕显示的属性。

但是唯一单纯的特点却并不是很招人待见，相反，大家更习惯使用float去完成其他的功能，比如横排展示和自适应分栏布局。

很多人这样用着，只是因为一堆现成的文章告诉他们可以这样用，但是到底为什么可以，以及用的时候要注意什么问题却并不是所有人都知道，结果就是，一时的“便利”，为日后的维护埋了一堆的坑。

这篇文章打算通过将目前一些成文的浮动元素的特点与CSS规范中的具体描述对应，来加深大家对float属性原理的理解。并在后面通过一个bug实例，说明使用这个属性时要注意的问题。


## 浮动元素的业界公认特点

float属性被设置为非none的元素：

    1. 元素被视作块级元素，相当于display设置为’block’；
    2. 元素具备包裹性，会根据它所包含的元素实现宽度、高度自适应；
    3. 浮动元素前后的块级兄弟元素忽视浮动元素的而占据它的位置，并且元素会处在浮动元素的下层（并且无法通过z-index属性改变他们的层叠位置），但它的内部文字和其他行内元素都会环绕浮动元素；
    4. 浮动元素前后的行内元素环绕浮动元素排列；
    5. 浮动元素之前的元素如果也是浮动元素，且方向相同，它会紧跟在它们后面；父元素宽度不够，换行展示；
    6. 浮动元素之间的水平间距不会重叠；
    7. 当包含元素中只有浮动元素时，包含元素将会高度塌陷；
    8. 浮动元素的父元素的非浮动兄弟元素，忽视浮动元素存在，覆盖浮动元素；
    9. 浮动元素的父元素的浮动兄弟元素，会跟随浮动元素布局，仿佛处在同一父元素中。

目前实现的很多应用都是直接对应上述特点实现的。但是很多人在看过这些描述以后，并不知道它的结论从何而来，无据可循，怎会安心？为了解决大家的疑虑，下面我会将上面的九条与CSS规范做一一的对应。

## CSS规范映射

### ***第一条和第二条可以总体归结为“浮动对于自身的影响”。***

```
1. 元素被视作块级元素，相当于display设置为’block’；
2. 元素具备包裹性，会根据它所包含的元素实现宽度、高度自适应；
```

标准中有关第一条是有明确指明的：

```
if 'float' has a value other than 'none', the box is floated and 'display' is set according to the table below.
Specified value Computed value
inline-table    table
inline, table-row-group, table-column, table-column-group, table-header-group, table-footer-group, table-row, table-cell, table-caption, inline-block   block
others  same as specified
```
基本上说的就是第一条。

对于第二条，这个标准中也有明确的说明

```
for Floating, non-replaced elements
If 'width' is computed as 'auto', the used value is the "shrink-to-fit" width.
Calculation of the shrink-to-fit width is similar to calculating the width of a table cell using the automatic table layout algorithm. Roughly: calculate the preferred width by formatting the content without breaking lines other than where explicit line breaks occur, and also calculate the preferred minimumwidth, e.g., by trying all possible line breaks. CSS 2.1 does not define the exact algorithm. Thirdly, find the available width: in this case, this is the width of the containing block minus the used values of 'margin-left', 'border-left-width', 'padding-left', 'padding-right', 'border-right-width', 'margin-right', and the widths of any relevant scroll bars.


Then the shrink-to-fit width is: min(max(preferred minimum width, available width), preferred width).
```

其实这段话看的时候挺绕的，主要是几个width的含义不容易理解：

***首选宽度（ preferred width）***：完全不允许折行展示情况下的内容宽度
***最小首选宽度（preferred minimum width）***：所有折行展示可能下的最小内容宽度
***可用宽度（ available width）***：包含块宽度减去margin，padding，border，滚动条宽等所有这些以后的差值

在通常情况下，按照上面的公式，这个自适应宽度（shrink-to-fit width）就是首选宽度，而首选宽度呈现出来的感觉就是“包裹”。

但是，看到这里有没有发现一个问题？就是所谓的首选宽度到底是如何计算的，如果一个浮动元素里包含另外一个浮动元素，它是如何计算的？是否要把子孙浮动元素的宽度考虑进去？标准似乎并没有更多的考虑这种情况。而由于这点”模糊“造成的问题，后面也会提及。

而关于高度

```
'Auto' heights for block formatting context roots

In certain cases (see, e.g., sections 10.6.4 and 10.6.6 above), the height of an element that establishes a block formatting context is computed as follows:

If it only has inline-level children, the height is the distance between the top of the topmost line box and the bottom of the bottommost line box.

If it has block-level children, the height is the distance between the top margin-edge of the topmost block-level child box and the bottom margin-edge of the bottommost block-level child box.
```
这个比width好理解也简单些，就是实在的“包裹”。


### ***第三、四、五、六条可以总体归结为“浮动对于兄弟元素的影响”。***

     3. 浮动元素前后的块级兄弟元素忽视浮动元素的而占据它的位置，并且元素会处在浮动元素的下层（并且无法通过z-index属性改变他们的层叠位置），但它的内部文字和其他行内元素都会环绕浮动元素；
     4. 浮动元素前后的行内元素环绕浮动元素排列；
     5. 浮动元素之前的元素如果也是浮动元素，且方向相同，它会紧跟在它们后面；父元素宽度不够，换行展示；
     6. 浮动元素之间的水平间距不会重叠；


标准里对float的定义是

```
Floats. In the float model, a box is first laid out according to the normal flow, then taken out of the flow and shifted to the left or right as far as possible. Content may flow along the side of a float.
```

上面这句核心思想就是说，***浮动元素最大的特点就是脱离了文档流。***

标准中又对“脱离文档流”的结果做了描述：

```
Since a float is not in the flow, non-positioned block boxes created before and after the float box flow vertically as if the float did not exist. However, the current and subsequent line boxes created next to the float are shortened as necessary to make room for the margin box of the float.
```
我想这句整个证明了第三条和第四条的合法性。浮动元素对于块级兄弟元素以及行内兄弟元素的处理是有区别的。如果兄弟块盒没有生成新的BFC，那它其中的行内盒也会受到浮动元素的影响，为浮动元素让出位置，缩进显示。至于对齐的位置，标准中也有描述：

```
A floated box is shifted to the left or right until its outer edge touches the containing block edge or the outer edge of another float. If there is a line box, the outer top of the floated box is aligned with the top of the current line box.
```

这两条说明，float虽然使元素脱离的文档流，但是它却依然占据着位置，这其实也是影响外部元素宽度计算的一个原因之一，也是它跟绝对定位最大的不同。

至于其中提及的，会放置在块级元素之上，这个也有考据

```
The contents of floats are stacked as if floats generated new stacking contexts, except that any positioned elements and elements that actually create new stacking contexts take part in the float's parent stacking context. A float can overlap other boxes in the normal flow (e.g., when a normal flow box next to a float has negative margins). When this happens, floats are rendered in front of non-positioned in-flow blocks, but behind in-flow inlines.
```

第五条，这个是浮动元素行为九准则中规定的。这里列举一下：

```
1. The left outer edge of a left-floating box may not be to the left of the left edge of its containing block. An analogous rule holds for right-floating elements.
2. If the current box is left-floating, and there are any left-floating boxes generated by elements earlier in the source document, then for each such earlier box, either the left outer edge of the current box must be to the right of the right outer edge of the earlier box, or its top must be lower than the bottom of the earlier box. Analogous rules hold for right-floating boxes.
3. The right outer edge of a left-floating box may not be to the right of the left outer edge of any right-floating box that is next to it. Analogous rules hold for right-floating elements.
4. A floating box's outer top may not be higher than the top of its containing block. When the float occurs between two collapsing margins, the float is positioned as if it had an otherwise empty anonymous block parent taking part in the flow. The position of such a parent is defined by the rules in the section on margin collapsing.
5.The outer top of a floating box may not be higher than the outer top of any block or floated box generated by an element earlier in the source document.
6. The outer top of an element's floating box may not be higher than the top of any line-box containing a box generated by an element earlier in the source document.
7. A left-floating box that has another left-floating box to its left may not have its right outer edge to the right of its containing block's right edge. (Loosely: a left float may not stick out at the right edge, unless it is already as far to the left as possible.) An analogous rule holds for right-floating elements.
8. A floating box must be placed as high as possible.
9. A left-floating box must be put as far to the left as possible, a right-floating box as far to the right as possible. A higher position is preferred over one that is further to the left/right.
```

九准则其实已经基本上把浮动元素自身的行为方式定义的比较全面了，主要的原则就是：***浮动元素之间不重叠；尽可能像边缘漂浮，但不越界。***


第六条，在CSS标准描述margin的时候有提及

```
Margins between a floated box and any other box do not collapse (not even between a float and its in-flow children).
Margins of elements that establish new block formatting contexts (such as floats and elements with 'overflow' other than 'visible') do not collapse with their in-flow children.
```
因此，也可证明合理。

### ***第七、八、九条可以总体归结为“浮动对于包含元素的影响”。浮动使用时的另一批潜在坑就出现在对几个特点的应用上。***

    7. 当包含元素中只有浮动元素时，包含元素将会高度塌陷；
    8. 浮动元素的父元素的非浮动兄弟元素，忽视浮动元素存在，在浮动元素之下展示；
    9. 浮动元素的父元素的浮动兄弟元素，会跟随浮动元素布局，仿佛处在同一父元素中。

首先，以上三条拥有一个共同的原因：浮动元素脱离文档流。

接着去读一下标准中有关高度计算的描述：

```
For block-level non-replaced elements in normal flow when 'overflow' computes to 'visible'

If 'margin-top', or 'margin-bottom' are 'auto', their used value is 0. If 'height' is 'auto', the height depends on whether the element has any block-level children and whether it has padding or borders
...
Only children in the normal flow are taken into account (i.e., floating boxes and absolutely positioned boxes are ignored, and relatively positioned boxes are considered without their offset). Note that the child box may be an anonymous block box.
```

关键看最后一段，浮动元素的高度会被忽略的，因此一旦包含块中只包含浮动元素，那么包含块就不再有参考的计算高度，自然就塌陷了。当然，如果包含元素里还包含其他元素，那么它的高度会参考非浮动元素按标准中描述的规则计算。

第七条也就成立了。

那么第八条、第九条为什么？看CSS标准中的下面的描述

```
References to other elements in these rules refer only to other elements in the same block formatting context as the float.

```
也就是说，float对同一个BFC内的元素有效。如果父元素没有触发生成新的BFC，那么父元素的兄弟元素都算是跟父元素中的元素处于同一BFC，也就会受浮动的影响，并且行为规则与同处于同一个父元素之中的元素的规则相同：块级元素重叠；行内元素环绕；浮动元素跟随。


正是因为浮动元素的这三条特点，因此，在使用了浮动元素以后，通常都要做“清除浮动“或”闭合浮动“的操作，来避免浮动元素对其他元素的影响。


到这里，浮动元素的九个特点基本上都在标准中找到了对应，但是我说的是基本，上面提及的有一个问题我们还没有完美解决，就是浮动元素的auto宽度计算规则。我们这里先举一个实际的例子来解答这个疑惑。

## 一个栗子

先看一下代码：

<css>

```
.ui-label {
    display: inline;
}

.form-section {
    width: 700px;
    margin: 0 0 60px;
    min-width: 960px;
    margin-left: 168px;
    margin-top: 60px;
}

.form-field-required {
    font-size: 14px;
    margin: 30px 0;
}

.form-field-required:before,
.form-field-required:after {
    display: table;
    content: '';
}

.form-field-required:after {
    clear: both;
}

.form-field-label {
    float: left;
    zoom: 1;
    width: 104px;
    line-height: 30px;
    text-align: left;
    vertical-align: top;
}

.form-field-value {
    line-height: 30px;
    padding-left: 12px;
    float: left;
}

.form-field-value-required-star {
    float: left;
    color: red;
    width: 12px;
    text-align: left;
}

.ui-textbox {
    position: relative;
    display: inline-block;
}

.ui-textbox input {
    color: #333333;
    background: #ffffff;
    border: 1px solid #dddddd;
    width: 240px;
    height: 24px;
    line-height: 24px;
    vertical-align: middle;
    box-sizing: content-box;
}
```

<html>

```
<section class="form-section">
    <div class="form-field-required">
        <esui-label class="form-field-label ui-label" title="">姓名：</esui-label>
        <div class="form-field-value">
            <div class="form-field-value-required-star">*</div>
            <div id="name" class="ui-textbox">
                <input type="text" title="金额" style="width: 191px;" />
            </div>
        </div>
    </div>
</section>

```

这段代码算是使用float实现元素横排展示的一个比较复杂的例子（我并没有说这个实现方案是推荐的，后面我会解释为什么其实不推荐）。也最大程度的利用float的特点，并且能够解答我上面提出的那个疑惑。为了清楚的说明，我们可以从裸样式入手，一步一步随着样式的增加，跟踪展示效果：


第一步：去掉所有结构相关的代码（为了清晰展示结构，加上背景样式），展示是这样的：

![第一步](/blog/float/img/1.png "第一步")



’form-field-label‘原来的display属性是inline，因此虽然设定了宽高，却并没有作用；'form-field-value'是块级盒，包括里面的'星号'、'输入框'、'文字描述'也都是，因此垂直展示。

第二步，为’form-field-label‘和'form-field-value'增加float属性，展示效果如下：

![第二步](/blog/float/img/2.png "第二步")


这个效果的出现，利用了上述浮动特点的第一条、第二条、第五条和第七条。而关于'包裹性'也有了最简单情况的示例展示：即容器的长方框恰好包住无折行条件下的容器内的元素。


第三步，为'form-field-value'中的'form-field-value-required-star'增加float属性，此时展示效果如下：

![第三步](/blog/float/img/3.png "第三步")


这个效果的出现，利用了上述浮动特点的第一条、第二条、第三条和第四条。
着重需要关注的，一个是兄弟元素'ui-textbox'在占据了星号位置的同时，'ui-textbox'中的行内元素input缩进环绕星号展示，也就是第四条的完美体现；另一个则是星号浮动属性的设置对于父元素宽度计算的影响。***我们发现，虽然input行内元素缩进展示，但是父元素的宽度却并没有因此而随之增加，也就是，它的宽度仍然是未缩进前包含块的“首选宽度”，即input宽；但是如果把星号的宽度提高到超过input宽，那么你会发现，包含块的宽度变成了星号的宽度。***这就解答了我之前的问题：如果一个浮动元素里包含另外一个浮动元素，它的auto宽度计算是会考虑进来浮动元素的，计算规则是包含块去掉所有后代浮动元素后的“首选宽度”与所有后代浮动元素宽度和的最大值。


第四步，为'ui-textbox'设置display属性值为'inline-block'，此时展示效果如下：

![第四步](/blog/float/img/4.png "第四步")

为什么包含块的宽度突然可以足够星号和输入框同时并排了？原因是inline-block的设置改变了原本块级元素的行为，CSS标准里有如下描述：

```
This value causes an element to generate an inline-level block container. The inside of an inline-block is formatted as a block box, and the element itself is formatted as an atomic inline-level box.
```

所以此时，'ui-textbox'就是作为一个行内元素整体缩进展示，而不是像前面的，本身并没有缩进，只是内部的input缩进。那么此时包含块去掉所有后代浮动元素后的“首选宽度”就是’缩进距离‘与'ui-textbox'宽度的和。所以就足够星号和输入框并排展示了。

但是你觉着这样就没问题了？我们来改变一下源码：

1. 去掉ui-textbox的静态class赋值
2. 使用js动态分配class：


```
    var nameInput = document.getElementById('name');
    setTimeout(
        function () {
            nameInput.setAttribute('class', 'ui-textbox');
        },
        0
    );

```

再运行一下，发现了什么：在几乎所有的浏览器（包括IE）效果都没有变化，但是在Chrome下却坑了，效果是酱紫滴：


包含块的宽度又不够并排了，变成了输入框的宽度。DOM样式和结构不可能变化，但是有了这样的区别，是为什么？我们看到上面代码里最诡异的也就是延迟class的赋值，从结果看，在Chrome下，这个延迟赋值显然没有生效，也就是并没有触发包含块宽度的重计算。再深层的原因还没有研究，因为Safari下也有同样的问题，所以我只当它是Webkit的bug：浮动元素中后代元素，动态设置display为inline-block，改变元素的盒属性，外部浮动元素无法感知。

那么怎么办？放弃Chrome？显然不行。。。使用其他方式，在设置完display以后强制触发宽度变化？目前还没有找到哪个属性可以，甚至设置为float，也都无效。

其实根本也不必费力寻找方式去触发宽度变化，我举这个例子，想表达的是，使用float实现并排展示，并在其中掺杂inline-block实现并排并不是明智之举，在未来会大大增加理解和维护的难度。

那么，在实际开发中，到底是用float实现并排更推荐一些还是inline-block更推荐一些，关于这个的讨论，网上也都不少。我个人的观点，两者各有利弊：

float实现：

    好处：
        1. 天然的可以顶部上边框对齐，无需做位置微调
        2. 浮动元素之间没有空白间距

    坏处：
        1. 浮动元素对元素本身，以及它的父元素，兄弟元素带来的影响非常大，使用浮动后要认真处理好‘浮动清除’等事宜
        2. 当需要引用外部创建的控件，无法有效控制DOM结构和创建时机时，容易产生不可预知的bug

inline-block：

    好处： 简单、单纯，不会对其他元素造成影响

    坏处：
        1. 对齐是个问题，理想情况下，通过设置vertical-align为相同值即可对齐，但复杂的结构下，比如引入了外部控件，控件中有自己的vertical-align定位时，需要考虑的比较多
        2. inline-block包含html空白节点，如果html中一系列元素每个元素之间都换行了，当你对这些元素设置inline-block时，这些元素之间就会出现空白
        3. 低版本IE浏览器不支持（这个其实可以忽略了。。。）


## 结语

float是个复杂的属性，彻底了解它甚至需要将CSS中所有与视觉格式化模型（Visual formatting model）相关的知识都撸一遍。这篇文章只是简单的带大家了解下标准里是如何描述我们平时熟悉的那些浮动元素特点的，让大家用的时候，有疑问也有据可循。由于篇幅有限，仍然有很多更细节的内容没有解释清楚，感兴趣的各位可以自行前往[W3C CSS2.1](http://www.w3.org/TR/CSS2/)了解，主要内容在第九、十两章中。

PS：马来西亚的沙巴超美的，快来快来！

