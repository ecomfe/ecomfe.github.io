---
title: 聊聊前端排序的那些事
date: 2016-06-06
author: shenbin
author_link: https://github.com/bobshen
tags:
- algorithm
- ECMAScript
- browser
---

## 前言

貌似前端[[1]](#注1)圈一直以来流传着一种误解：前端用不到算法知识。[[2]](#注2)

长久以来，我也曾受这种说法的影响。直到前阵子遇到一个产品需求，回过头来看，发现事实并非如此。

<!-- more -->

## 前端排序

### 前端排序的场景

前端将排序条件作为请求参数传递给后端，后端将排序结果作为请求响应返回前端，这是一种常见设计。但是对于有些产品则不是那么适用。

试想一个场景：你在使用美食类APP时，是否会经常切换排序方式，一会儿按照价格排序，一会儿按照评分排序。

实际生产中，受限于服务器成本等因素，当单次数据查询成为整体性能瓶颈时，也会考虑通过将排序在前端完成的方式来优化性能。

### 排序算法

感觉这个没什么介绍的必要，作为计算机科学的一种基础算法，描述就直接照搬[Wikipedia](https://zh.wikipedia.org/wiki/%E6%8E%92%E5%BA%8F%E7%AE%97%E6%B3%95)。

这里存在这一段内容纯粹是为了承(cou)上(man)启(zi)下(shu)。

### JavaScript的排序

既然说到前端排序，自然首先会想到JavaScript的原生接口 `Array.prototype.sort`。

这个接口自**ECMAScript 1st Edition**起就存在。让我们看看最新的规范中关于它的描述是什么样的。

#### Array.prototype.sort规范

`Array.prototype.sort(compareFn)`

> The elements of this array are sorted. The sort is not necessarily stable (that is, elements that compare equal do not necessarily remain in their original order). If comparefn is not undefined, it should be a function that accepts two arguments x and y and returns a negative value if x < y, zero if x = y, or a positive value if x > y.

显然，规范并没有限定sort内部实现的排序算法是什么。甚至接口的实现都不需要是**稳定排序**的。这一点很关键，接下来会多次涉及。

在这样的背景下，前端排序这件事其实取决于各家浏览器的具体实现。那么，当今主流的浏览器关于排序是怎么实现的呢？接下来，我们分别简单对比一下`Chrome`、`Firefox`和`Microsoft Edge`。

#### Chrome中的实现

Chrome的JavaScript引擎是**v8**。由于它是开源的，所以可以直接看[源代码](https://github.com/v8/v8/blob/master/src/js/array.js#L755)。

整个 `array.js` 都是用**JavaScript**语言实现的。排序方法部分很明显比曾经看到过的快速排序要复杂得多，但显然核心算法还是**快速排序**。算法复杂的原因在于v8出于性能考虑进行了很多优化。(接下来会展开说)

#### Firefox中的实现

暂时无法确定Firefox的JavaScript引擎即将使用的数组排序算法会是什么。[[3]](#注3)

按照现有的信息，SpiderMoney内部实现了**归并排序**。

#### Microsoft Edge中的实现

Microsoft Edge的JavaScript引擎**Chakra**的核心部分代码已经于2016年初在Github开源。

通过看[源代码](https://github.com/Microsoft/ChakraCore/blob/master/lib/Common/DataStructures/quicksort.h)可以发现，Chakra的数组排序算法实现的也是**快速排序**。而且相比较于v8，它就只是实现了纯粹的快速排序，完全没有v8中的那些性能优化的踪影。

### JavaScript数组排序的问题

众所周知，**快速排序**是一种**不稳定**的排序算法，而**归并排序**是一种**稳定**的排序算法。由于不同引擎在算法选择上的差异，导致前端依赖 `Array.prototype.sort` 接口实现的JavaScript代码，在浏览器中实际执行的排序效果是不一致的。

排序稳定性的差异需要有特定的场景触发才会存在问题；在很多情况下，不稳定的排序也不会造成影响。

假如实际项目开发中，对于数组的排序没有稳定性的需求，那么其实看到这里为止即可，浏览器之间的实现差异不那么重要。

但是若项目要求排序必须是稳定的，那么这些差异的存在将无法满足需求。我们需要为此进行一些额外的工作。

举个例子：

    某市的机动车牌照拍卖系统，最终中标的规则为：

        1. 按价格进行倒排序；
        2. 相同价格则按照竞标顺位（即价格提交时间）进行正排序。

    排序若是在前端进行，那么采用快速排序的浏览器中显示的中标者很可能是不符合预期的

## 探究差异的背后

寻找解决办法之前，我们有必要先探究一下出现问题的原因。

### Chrome为什么采用快速排序

其实这个情况从一开始便存在。

Chrome测试版于[2008年9月2日发布](https://zh.wikipedia.org/wiki/Google_Chrome#.E7.99.BC.E5.B8.83)，然而发布后不久，就有开发者向Chromium开发组提交[#90 Bug](https://bugs.chromium.org/p/v8/issues/detail?id=90)反馈v8的数组排序实现不是稳定排序的。

这个Bug ISSUE讨论的时间跨度很大。一直到2015年11月10日，仍然有开发者对v8的数组排序实现问题提出评论。

同时我们还注意到，该ISSUE曾经已被关闭。但是于2013年6月被开发组成员重新打开，作为**ECMAScript Next**规范讨论的参考。

而[es-discuss](https://mail.mozilla.org/pipermail/es-discuss/2013-June/031276.html)的最后结论是这样的

> It does not change. Stable is a subset of unstable. And vice versa,
every unstable algorithm returns a stable result for some inputs.
Mark's point is that requiring "always unstable" has no meaning, no
matter what language you chose.
>
> /Andreas

正如本文前段所引用的已定稿**ECMAScript 2015**规范中的描述。

#### 时代特点

IMHO，Chrome发布之初即被报告出这个问题可能是有其特殊的时代特点。

上文已经说到，Chrome第一版是**2008年9月**发布的。根据[statcounter](http://gs.statcounter.com/#browser-ww-monthly-200809-200809-bar)的统计数据，那个时期市场占有率最高的两款浏览器分别是 **IE**(那时候只有**IE6**和**IE7**)和**Firefox**，市场占有率分别达到了**67.16%**和**25.77%**。也就是说，两个浏览器加起来的市场占有率超过了**90%**。

而根据另一份[浏览器排序算法稳定性的统计](http://ofb.net/~sethml/is-sort-stable.html)数据显示，这两款超过了**90%**市场占有率的浏览器都采用了稳定的数组排序。所以Chrome发布之初被开发者质疑也是合情合理的。

#### 符合规范

从[Bug ISSUE](https://bugs.chromium.org/p/v8/issues/detail?id=90)讨论的过程中，可以大概理解开发组成员对于引擎实现采用快速排序的一些考量。

其中一点，他们认为引擎必须遵守**ECMAScript**规范。由于规范不要求稳定排序的描述，故他们认为v8的实现是完全符合规范的。

#### 性能考虑

另外，他们认为v8设计的一个重要考量在于引擎的性能。

**快速排序**相比较于**归并排序**，在整体性能上表现更好：

- 更高的计算效率。快速排序在实际计算机执行环境中比同等时间复杂度的其他排序算法更快（不命中最差组合的情况下）
- 更低的空间成本。前者仅有 **O(㏒n)** 的空间复杂度，相比较后者 **O(n)** 的空间复杂度在运行时的内存消耗更少

##### v8在数组排序算法中的性能优化

既然说v8非常看中引擎的性能，那么在数组排序中它做了哪些事呢？

通过阅读源代码，还是粗浅地学习了一些皮毛。

> 混合插入排序

快速排序是分治的思想，将大数组分解，逐层往下递归。但是若递归深度太大，为了维持递归调用栈的内存资源消耗也会很大。优化不好甚至可能造成栈溢出。

目前v8的实现是设定一个阈值，对最下层的10个及以下长度的小数组使用**插入排序**。

根据代码注释以及**Wikipedia**中的描述，虽然插入排序的平均时间复杂度为 **O(n²)** 差于快速排序的 **O(n㏒n)**。但是在运行环境，小数组使用插入排序的效率反而比快速排序会更高，这里不再展开。

v8代码示例

```javascript
var QuickSort = function QuickSort(a, from, to) {
    ......
    while (true) {
        // Insertion sort is faster for short arrays.
        if (to - from <= 10) {
            InsertionSort(a, from, to);
            return;
        }
        ......
    }
    ......
};
```

> 三数取中

正如已知的，快速排序的阿克琉斯之踵在于，最差数组组合情况下会算法退化。

快速排序的算法核心在于选择一个基准**(pivot)**，将经过比较交换的数组按基准分解为两个数区进行后续递归。试想如果对一个已经有序的数组，每次选择基准元素时总是选择第一个或者最后一个元素，那么每次都会有一个数区是空的，递归的层数将达到 **n**，最后导致算法的时间复杂度退化为 **O(n²)**。因此**pivot**的选择非常重要。

v8采用的是**三数取中(median-of-three)**的优化：除了头尾两个元素再额外选择一个元素参与基准元素的竞争。

第三个元素的选取策略大致为：

1. 当数组长度小于等于1000时，选择折半位置的元素作为目标元素。
2. 当数组长度超过1000时，每隔200-215个*(非固定，跟着数组长度而变化)*左右选择一个元素来先确定一批候选元素。接着在这批候选元素中进行一次排序，将所得的中位值作为目标元素

最后取三个元素的中位值作为**pivot**。

v8代码示例

```javascript
var GetThirdIndex = function(a, from, to) {
    var t_array = new InternalArray();
    // Use both 'from' and 'to' to determine the pivot candidates.
    var increment = 200 + ((to - from) & 15);
    var j = 0;
    from += 1;
    to -= 1;
    for (var i = from; i < to; i += increment) {
        t_array[j] = [i, a[i]];
        j++;
    }
    t_array.sort(function(a, b) {
        return comparefn(a[1], b[1]);
    });
    var third_index = t_array[t_array.length >> 1][0];
    return third_index;
};

var QuickSort = function QuickSort(a, from, to) {
    ......
    while (true) {
        ......
        if (to - from > 1000) {
            third_index = GetThirdIndex(a, from, to);
        } else {
            third_index = from + ((to - from) >> 1);
        }
    }
    ......
};
```

> 原地排序

在温习快速排序算法时，我在网上看到了很多用JavaScript实现的例子。

但是发现一大部分的代码实现如下所示

```javascript
var quickSort = function(arr) {
　　if (arr.length <= 1) { return arr; }
　　var pivotIndex = Math.floor(arr.length / 2);
　　var pivot = arr.splice(pivotIndex, 1)[0];
　　var left = [];
　　var right = [];
　　for (var i = 0; i < arr.length; i++){
　　　　if (arr[i] < pivot) {
　　　　　　left.push(arr[i]);
　　　　} else {
　　　　　　right.push(arr[i]);
　　　　}
　　}
　　return quickSort(left).concat([pivot], quickSort(right));
};
```

以上代码的主要问题在于：利用 `left` 和 `right` 两个数区存储递归的子数组，因此它需要 **O(n)** 的额外存储空间。这与理论上的平均空间复杂度 **O(㏒n)** 相比差距较大。

额外的空间开销，同样会影响实际运行时的整体速度。这也是快速排序在实际运行时的表现可以超过同等时间复杂度级别的其他排序算法的其中一个原因。所以一般来说，性能较好的快速排序会采用**原地(in-place)排序**的方式。

v8源代码中的实现是对原数组进行元素交换。

### Firefox为什么采用归并排序

它的背后也是有故事的。

Firefox其实在一开始发布的时候对于数组排序的实现并不是采用稳定的排序算法，这块有据可考。

Firefox(Firebird)最初版本实现的数组排序算法是**堆排序**，这也是一种不稳定的排序算法。因此，后来有人对此提交了一个[Bug](https://bugzilla.mozilla.org/show_bug.cgi?id=224128)。

Mozilla开发组内部针对这个问题进行了一系列[讨论](https://bugzilla.mozilla.org/show_bug.cgi?id=224128#c2)。

从讨论的过程我们能够得出几点

1. 同时期 Mozilla的竞争对手是**IE6**，从上文的统计数据可知IE6是稳定排序的
2. JavaScript之父*Brendan Eich*觉得**Stability is good**
3. Firefox在采用**堆排序**之前采用的是**快速排序**

基于开发组成员倾向于实现稳定的排序算法为主要前提，**Firefox3**将**归并排序**作为了数组排序的新实现。

## 解决排序稳定性的差异

以上说了这么多，主要是为了讲述各个浏览器对于排序实现的差异，以及解释为什么存在这些差异的一些比较表层的原因。

但是读到这里，读者可能还是会有疑问：如果我的项目就是需要依赖稳定排序，那该怎么办呢？

### 解决方案

其实解决这个问题的思路比较简单。

浏览器出于不同考虑选择不同排序算法。可能某些偏向于追求极致的性能，某些偏向于提供良好的开发体验，但是有规律可循。

从目前已知的情况来看，所有主流浏览器（包括IE6，7，8）对于数组排序算法的实现基本可以枚举：

1. 归并排序 / Timsort
2. 快速排序

所以，我们将快速排序经过定制改造，变成稳定排序的是不是就可以了？

一般来说，针对对象数组使用不稳定排序会影响结果。而其他类型数组本身使用稳定排序或不稳定排序的结果是相等的。因此方案大致如下：

    将待排序数组进行预处理，为每个待排序的对象增加自然序属性，不与对象的其他属性冲突即可。
    自定义排序比较方法compareFn，总是将自然序作为前置判断相等时的第二判断维度。

面对归并排序这类实现时由于算法本身就是稳定的，额外增加的自然序比较并不会改变排序结果，所以方案兼容性比较好。

但是涉及修改待排序数组，而且需要开辟额外空间用于存储自然序属性，可想而知v8这类引擎应该不会采用类似手段。不过作为开发者自行定制的排序方案是可行的。

### 方案代码示例

```javascript
'use strict';

const INDEX = Symbol('index');

function getComparer(compare) {
    return function (left, right) {
        let result = compare(left, right);

        return result === 0 ? left[INDEX] - right[INDEX] : result;
    };
}

function sort(array, compare) {
    array = array.map(
        (item, index) => {
            if (typeof item === 'object') {
                item[INDEX] = index;
            }

            return item;
        }
    );

    return array.sort(getComparer(compare));
}
```

以上只是一个简单的满足稳定排序的算法改造示例。

之所以说简单，是因为实际生产环境中作为数组输入的数据结构冗杂，需要根据实际情况判断是否需要进行更多样的排序前类型检测。

## 后言

必须看到，这几年越来越多的项目正在往富客户端应用方向转变，前端在项目中的占比变大。随着未来浏览器计算能力的进一步提升，它允许进行一些更复杂的计算。伴随职责的变更，前端的形态也可能会发生一些重大变化。

行走江湖，总要有一技傍身。

## 标注

1. 前端现在已经是一个比较宽泛的概念。本文中的前端主要指的是以浏览器作为载体，以**JavaScript**作为编程语言的环境
2. 本文无意于涉及算法整体，谨以常见的排序算法作为切入点
3. 在确认Firefox数组排序实现的算法时，搜到了SpiderMoney的一篇[排序相关的Bug](https://bugzilla.mozilla.org/show_bug.cgi?id=715181)。大致意思是讨论过程中有人建议用极端情况下性能更好的**Timsort算法**替换**归并排序**，但是Mozilla的工程师表示由于Timsort算法存在**License**授权问题，没办法在Mozilla的软件中直接使用算法，等待对方的后续回复

## 参考文档

- [https://zh.wikipedia.org/wiki/排序算法](https://zh.wikipedia.org/wiki/%E6%8E%92%E5%BA%8F%E7%AE%97%E6%B3%95)
- [https://zh.wikipedia.org/wiki/Google_Chrome#.E7.99.BC.E5.B8.83](https://zh.wikipedia.org/wiki/Google_Chrome#.E7.99.BC.E5.B8.83)
- [https://github.com/v8/v8/blob/master/src/js/array.js](https://github.com/v8/v8/blob/master/src/js/array.js#L755)
- [https://bugs.chromium.org/p/v8/issues/detail?id=90](https://bugs.chromium.org/p/v8/issues/detail?id=90)
- [https://bugzilla.mozilla.org/show_bug.cgi?id=224128](https://bugzilla.mozilla.org/show_bug.cgi?id=224128)
- [https://bugzilla.mozilla.org/show_bug.cgi?id=715181](https://bugzilla.mozilla.org/show_bug.cgi?id=715181)
- [https://mail.mozilla.org/pipermail/es-discuss/2013-June/031276.html](https://mail.mozilla.org/pipermail/es-discuss/2013-June/031276.html)
- [https://github.com/Microsoft/ChakraCore/blob/master/lib/Common/DataStructures/quicksort.h](https://github.com/Microsoft/ChakraCore/blob/master/lib/Common/DataStructures/quicksort.h)
- [http://gs.statcounter.com/#browser-ww-monthly-200809-200809-bar](http://gs.statcounter.com/#browser-ww-monthly-200809-200809-bar)
- [http://ofb.net/~sethml/is-sort-stable.html](http://ofb.net/~sethml/is-sort-stable.html)
