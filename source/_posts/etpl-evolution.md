---
title: ETpl的演进
date: 2015-3-16
author: errorrik
author_link: http://errorrik.com/
tags:
- 模板引擎
- ETpl 
- JavaScript
---

![](/blog/etpl-evolution/eng.png)

如果有人看过我写的《AMD系列三部曲 [一](/blog/dissecting-amd-what/) [二](/blog/dissecting-amd-how/) [三](/blog/dissecting-amd-loader/)》，就会知道我是个唐僧。这次，唐僧想说说[ETpl](http://ecomfe.github.io/etpl/)。

[ETpl](http://ecomfe.github.io/etpl/)是一个JavaScript的模板引擎。JavaScript最广泛被应用于浏览器端，通常JavaScript模板引擎的作用就是生成HTML串。[ETpl](http://ecomfe.github.io/etpl/)当前的版本是3.0，也就是说，算上最初设计时，它经历了3次技术上比较大的选型。

今天，[ETpl](http://ecomfe.github.io/etpl/)号称是一个`强复用`、`灵活`、`高性能`的JavaScript模板引擎，有很多[别人有或者别人没有的功能](http://ecomfe.github.io/etpl/feature.html)，这些都是what。而我一直认为why比what更重要，了解背后的原因、了解思考的过程比知道是什么有更大的收获，所以这次想要啰嗦的，是[ETpl](http://ecomfe.github.io/etpl/)在走到今天的过程中，那些what背后的why。如果你能忍受我的八婆把它看完，应该多少能有点收获，越到后面技术点越多噢。


<iframe src="https://ghbtns.com/github-btn.html?user=ecomfe&repo=etpl&type=star&count=true" frameborder="0" scrolling="0" width="170" height="20"></iframe>

因为本篇比较长，开始先求个star支持下呗，反正不花钱

<!-- more -->

## 1.0时，我们做了这些事情

[ETpl](http://ecomfe.github.io/etpl/)是没有独立的1.0版本的。在2010年初，我们为一个SPA应用做重构的时候，开发了[ER - Enterprise RIA](https://github.com/ecomfe/er)框架的1.0版本，当时ER框架自带了一个模板引擎，这就是[ETpl](http://ecomfe.github.io/etpl/)的1.0。当时的想法很简单，我们要解决下面这些最基本的问题：

1. 在JavaScript里面写HTML片段的字符串是不人道的，应该写到另外的文件中
1. 有的HTML片段是需要被复用的
1. 同样的数据在一个片段中可能会重复出现多次

### Command语法

我们认为，最基本的单元应该是一个模板片段。我们需要设计一种语法，来描述这样的片段。

1. 大多数时候我们的模板片段会是HTML，我们不希望放弃Editor本身提供的HTML语法高亮、自动补全等功能，所以我们可以通过特殊格式的HTML注释来描述模板片段
1. 开发时我们可能每一个文件是一个模板片段，构建时为了优化HTTP请求，这些文件需要合并，我们期望合并可以是简单的，直接合并文件内容就行。所以模板片段需要有开始和结束，我们认为标签式是比较好的方式
1. 合并后模板片段需要能够被分别辨认，而且模板片段需要能被复用，所以模板片段需要被命名
1. 最后面临的是命名问题：哪个单词用来描述一个基本的模板片段单元比较合适呢？选来选去，我们选了`target`

基于以上，[ETpl](http://ecomfe.github.io/etpl/)的语法风格在2010年初被最初固定下来了（在很久以后的2013年，我们才让它可定制化）。

```
[target]
start tag: <!-- target: target-name -->
end tag: <!-- /target -->
```

然后我们开始设计如何描述复用。自然而然的，把`target`换成`import`就行了。在设计的过程中，我们受到一些HTML的启发：input、img之类的标签是可以不用自闭合的，不是每个标签都需要闭合，我们不是写XML。所以，import没有闭合。

```
[import]
tag: <!-- import: target-name -->
```


![](/blog/etpl-evolution/import.png)

基于以上，一个模板可以这么写：

```html
<!-- target: header -->
    <header>...</header>
<!-- /target -->

<!-- target: biz1 -->
    <!-- import: header -->
    <div class="content">...</div>
<!-- /target -->
```

举一反三的，还是受到HTML的启发：li、td、body等标签是不需要写闭合的，parser能够自动在合适的位置认为标签已经结束。比如遇到li的start，就知道上一个li应该结束了。所以我们决定支持target自动闭合，让模板编写者少写一点东西。

```html
<!-- target: header -->
<header>...</header>

<!-- target: biz1 -->
<!-- import: header -->
<div class="content">...</div>
```

到这里，从`target`和`import`可以看出来，[ETpl](http://ecomfe.github.io/etpl/)的语法格式已经被固定下来了：

1. 起始由`command-name`和`command-value`组成，`:`分隔
2. 闭合由`/command-name`组成

罗马不是一天建成的。基于最早的语法形式，我们不断的通过命令扩展功能，加入了if、for，这都是比较常规的事情了。


### 变量替换

变量替换是模板引擎的基本功能。从下面的例子可以看出，我们使用的变量替换语法比较大众化：

```html
Hello ${name}!
```

[ETpl](http://ecomfe.github.io/etpl/)的主要使用场景是HTML生成。在HTML中常用两种转义方式：

1. HTML转义，要显示变量值可能是原始的来源于用户输入的串，不转义有危险
1. URL转义，变量值可能用于图片的src或者a的href

我们通过filter的方式，使变量替换过程的中间能够加入一些处理。

```html
Hello ${name|html}!
```

大多数变量替换后的内容会用于直接视图显示，所以我们在不写filter的时候，默认使用html filter进行处理。但是还有一些场景我们是期望输出原始值的，我们引入了一个raw filter用于支持这种情况。这样，我们内置了3个filter，这点一直到现在都没变：

1. html (default)
1. url
1. raw

另外，通过etpl.addFilter(name, filter)方法也可以自己添加filter。

```javascript
etpl.addFilter('test', function (source) {
    return source + '!';
});
```

### 母版

在SPA应用开发的过程中，我们发现在一个应用里，页面类型的种类很可能是固定的几种，基本所有页面都是在相同的页面框架下，不同部分的内容有一定的区分，所以我们立即就加入了母版的功能(有的模板引擎叫做模板继承，其实是一回事)。


![](/blog/etpl-evolution/master.png)

母版功能的语法，参考的是Asp.net，使用了`master`、`contentplaceholder`、`content`，下面这个例子应该容易理解：


```html
<!-- target: biz(master = frame) -->
<!-- content:header -->header<!-- /content -->
<!-- content:body -->body<!-- /content -->
<!-- content:footer -->footer<!-- /content -->

<!-- master: frame -->
<header><!-- contentplaceholder: header --></header>
<div><!-- contentplaceholder: body --></div>
<footer><!-- contentplaceholder: footer --></footer>
```

母版功能再配合import使用，使开发过程中的重复代码量减少很多，特别是对于SPA类型的应用。母版功能是好的，但是，这样的写法真的不友好。我们直到3.0时，才重新改进了它。

### Data Getter

根据数据名称生成数据的功能，我们在最早的时候就支持了。可以看看[这个例子](http://ecomfe.github.io/etpl/example.html#data-getter)。

这个功能有什么用呢？看起来是没啥用的，但是它提供了数据的动态性，让数据可以在render的过程决定：

1. 数据来源于多对象，有优先级。这种场景其实可以通过merge解决，但for in可能更耗时。
1. 没有数据时需要自动生成一个，然后写入缓存。

这个动态的功能在后来我们做模板编译的时候，成为一个性能瓶颈点，但我们巧妙的解决了。

### 1.0时代的总结

如果你用过[ETpl](http://ecomfe.github.io/etpl/)，你会发现它很多东西是最初就有的，一直到现在都没怎么变。这代表最初的设计有很多是现在还适用的，令人高兴。但是有的东西已经发生了变化（比如母版），我们后面会反思这点。

我们就这样走过了两年多。在这两年里，周围的很多商业系统都采用了SPA的模式，也一直是使用这个ER里自带的模板引擎生成HTML，然后通过UI组件二次进行富交互的行为管理。在这两年里，前端模板开始像雨后春笋一样冒出来，但是我们一直没有跟进，一直在停留。直到......


## 2.0时，我们做了这些事情

在2012年的时候，我们的很多SPA应用面临同样的问题：由于业务量的爆炸，一次性把所有JS都压缩到一个文件的构建方案已经不能满足需求。各个产品线都各自设计了按需加载的方案，有还算靠谱的或者不靠谱的。在这样的背景下，我们决定开始强制使用AMD。这不单能从根本上解决这个问题，还能获得一些模块组织、依赖管理、包管理方面的好处。这是一个艰难的决定，这意味着我们原有的很多libraries和frameworks都需要AMD化，包括[ER框架](https://github.com/ecomfe/er)。当时ER框架里不单自带了模板引擎，还自带了[ESUI](https://github.com/ecomfe/esui)控件库。我们决定按照[规范](https://github.com/ecomfe/spec)把他们分离出来，作为独立的package提供。这也符合前端发展的趋势。

既然要独立提供，就来一次进化吧。这一次，ETpl的升级吸收了很多意见，增加了很多实用的功能，体积也控制住了：

### 模板编译

JavaScript模板引擎所谓的模板编译，指的不是编译成机器码，而是解析模板语法，转换成JavaScript代码，再经过new Function，变成可以在当前环境下执行的function。至于这个过程中有什么编译，render过程有什么JIT，由当前运行的JS引擎决定，不是这里关心的内容了。

在2012年，模板编译已经快成为标配了，几乎所有流行的模板引擎都是编译的。显然模板编译能让性能更高，特别是使用一个模板多次render的场景。我们以前没这么做，是因为在现有应用中没有遇到性能瓶颈，而有其他很多事情让我们无暇顾及他。但是当我们决定要去做一个大升级的时候，这无论如何都是不应该缺席的。

```javascript
// 没有模板编译
var result = etpl.render(source, data);

// 有模板编译
var render = etpl.compile(source);
var result = render(data);
```

由于ETpl的灵活性（功能强大的filter、data getter功能等），这些东西都会使性能变差。我们期望坚持我们的特点，在此之上做到相对较高的性能。所以，我们采用了一些方法优化我们的编译产物。下面列举一些我还记得的：


一个是根据不同平台生成不同的代码。这个优化主要是因为鸡国用户的老操作系统老浏览器比例还很大。据我所知[artTemplate](https://github.com/aui/artTemplate)是最早采用这种优化方法的。

```javascript
var RENDER_STRING_DECLATION = 'var r="";';
var RENDER_STRING_ADD_START = 'r+=';
var RENDER_STRING_ADD_END = ';';
var RENDER_STRING_RETURN = 'return r;';

if ( typeof navigator != 'undefined' 
    && /msie\s*([0-9]+)/i.test( navigator.userAgent )
    && RegExp.$1 - 0 < 8
) {
    RENDER_STRING_DECLATION = 'var r=[],ri=0;';
    RENDER_STRING_ADD_START = 'r[ri++]=';
    RENDER_STRING_RETURN = 'return r.join("");';
}
```

还有数据访问。由于下面的理由，我们不能把`${team.name}`直接编译成`data.team.name`，我们只能编译成`getVariable('team.name')`:

1. data支持getter方法
1. null和undefined的处理
1. 防止中间变量（for、var）更改数据

但是在render运行时切分`team.name`是非常耗时的事情，所以后来我们编译成了`getVariable('team.name', ['team', 'name'])`，将这部分的工作放到了编译时。

然后，然后我就不记得了，总之还做过一些。好吧，忘了就忘了，重要的是，我们在支持这么多动态特性下，与性能著称的模板引擎们相比运行时间相比几乎是差不多的（感兴趣的可以自己运行[性能测试用例](http://ecomfe.github.io/etpl/performance/render-time.html)，IE6下请自觉减少运行的数量级）。我们曾经在一个性能要求非常严苛的NodeJS项目中应用，原先用的mustache性能满足不了需求，后来换了etpl，性能测试就通过了。由于项目涉及保密，就不说了。

性能与功能的取舍总是需要平衡的，我们找到了自己的点：强复用、灵活、高性能的JavaScript模板引擎。

p.s. 我记得前段时间，某模板引擎跳出来说自己性能最高，还给出了测试用例。[10同学](http://weibo.com/u/1143654280)跑了一下，发现ETpl和mustache差不多。我们觉得不应该啊，再一看测试用例，是1000次编译*10000次运行。妈蛋测试不能这样做啊，1000次编译你还要编译干嘛？而且就算要做，也是两个测试用例，编译性能是一个测试用例，运行性能是一个测试用例啊。真能混淆视听。


### 移动可用

由于模板编译已经把性能考虑掉了，这里主要考虑的是体积的大小。移动方向负责人[Firede](http://weibo.com/u/1653095744)给的指标是，ETpl语法压缩+GZip后不能超过4k。

关键是ETpl的特点是复用能力和灵活性啊，有这么多功能就有这么多代码，我们总不能砍功能最后变成再做一个doT或者artTemplate出来吧那就没必要再写了啊，妈蛋只能进行体积优化了啊。我知道的另外一个复用功能比较强大的模板引擎[nunjucks](http://mozilla.github.io/nunjucks/)语法压缩+GZip后是19k。

我专门抽了将近一周时间一点一点砍体积。说实话这是个体力活，是个精细化的活。优化过程中还经常会出现觉得这么做体积能减小一点，做了以后发现和预想的不一样，增加了几个字节，只好撤销，重新读代码去寻找优化点。优化进行了4天后（达到小于4k后，已经和自己较劲上了，根本就停不下来啊），体积是3.7k，感觉已经接近x尽人亡了。好多点都已经不记得了，就说两个记得的比较大的点吧。

把相似的代码尽量放到一起。下面的代码可以看出来，`Command.prototype.open = function (context) {`相同片段的代码都放的比较近，更利于GZip。同样的，很多Constructor中代码比较接近，所以作为Constructor的function都放到了一起声明。可读性党在这里会不会跳出来？

```javascript
UseCommand.prototype.open = function (context) {
    context.stack.top().addChild(this);
};

BlockCommand.prototype.open = function (context) {
    Command.prototype.open.call(this, context);
    (context.imp || context.target).blocks[this.name] = this;
};

ElifCommand.prototype.open = function (context) {
    var elseCommand = new ElseCommand();
    elseCommand.open(context);

    var ifCommand = autoCloseCommand(context, IfCommand);
    ifCommand.addChild(this);
    context.stack.push(this);
};
```

再看看下面inherits的实现，简化了不少。注释已经写的很清楚了。可维护性党在这里会不会跳出来？

```javascript
function inherits(subClass, superClass) {
    var F = new Function();
    F.prototype = superClass.prototype;
    subClass.prototype = new F();
    subClass.prototype.constructor = subClass;
    // 由于引擎内部的使用场景都是inherits后，逐个编写子类的prototype方法
    // 所以，不考虑将原有子类prototype缓存再逐个拷贝回去
}
```

### 支持不写target

不是所有模板片段都需要被复用，他们可以作为单独的模板片段，编译一次，多次使用。这在很多小的字符串片段的生成中还是比较常见的。所以有的模板就不需要被命名。

```javascript
var helloRender = etpl.compile('Hello ${name}');
helloRender({
    name: 'ETpl'
});
```

这里支持的技术方法很简单：

1. 原来每个target都是具名的，这点内部实现还是不变。当遇到模板源码的起始不是target的时候，就自动创建一个target，并自动生成一个不重复的名字。
1. compile方法返回第一个target的编译结果。


### 通过配置项定义语法风格

最初我们的初衷是期望在写模板的时候，不要丢失Editor对HTML的一些语法高亮、自动补全等功能的支持，所以模板语法是写在HTML注释里的。后来我们发现不少人不喜欢这种风格：

1. 习惯了其他的风格，比如`<%`和`%>`
1. HTML注释要输入的开始和结束很长啊，分别是4个字符和3个字符

所以我们决定支持一些配置项，让用户可以自己定制语法风格。最开始支持的是`commandOpen`和`commandClose`。再后来，我们又发现由于mustache的流行，很多人习惯 **\{\{name\}\}** 的变量替换风格。所以我们又支持了`variableOpen`和`variableClose`。

于是，如果你有如下的配置：

```html
etpl.config({
    commandOpen: '<%',
    commandClose: '%>',
    variableOpen: '\{\{',
    variableClose: '\}\}'
})
```

你的模板可能会是这样：

```html
<% target: header %>
<header>...</header>

<% target: biz1 %>
<% import: header %>
<div class="content">Hello {{name}}!</div>
```

### 多引擎实例

随着业务规模的爆炸，一个应用开发人数增多，以及开发过程管理不够科学，有的团队遇到了模板片段命名上出现冲突的问题。简单的一个例子，两个功能都有列表页，大家都为模板片段起名叫list，就会冲突。

对业务功能进行统一管理，并制定合理的规范，在执行上有效监督，是能避免这个问题的。但是不一定每个团队都能做到这一点，而且既然发现问题，在技术手段上能解决，我们就解决。

解决的方法很简单，就是etpl支持多引擎实例，不同引擎实例之间完全隔离，就可以拥有相同名称不同内容的模板，甚至不同引擎可以各自定义自己的模板语法格式。

```html
var engine = new etpl.Engine({
    commandOpen: '<%',
    commandClose: '%>',
    variableOpen: '\{\{',
    variableClose: '\}\}'
})
var render = engine.compile('Hello {{name}}!');
render({name: 'myName'});
```

`etpl`这个变量本身是默认一开始就初始化好的一个引擎实例。

### 在模板里定义数据

我们对提供模板中声明数据的能力一直持谨慎的态度，但后来我们决定支持它。

1. 有的东西在写模板时也可以被抽取成为数据，在内容串中多次用到
1. 一些特性、行为选择可以抽取作为数据配置项

```html
<!-- var: name = 'etpl' -->

Hello ${name}!
<!-- if: score > 90 -->
${name} is clever!
<!-- /if -->
```


### 动态调用



原先我们通过`import`可以实现复用，其效果相当于把目标模板片段的源码嵌入相应位置。但是请看下面的例子：

```html
<!-- target: grade -->
<h3>class1</h3>
<!-- var: members = class1.members -->
<!-- import: members -->

<h3>class2</h3>
<!-- var: members = class2.members -->
<!-- import: members -->

<!-- target: members -->
<ul>
    <!-- for: ${members} as ${member} -->
    <li>${member.name}</li>
    <!-- /for -->
</ul>
```

members模板片段提供了把一群人打印出来的能力，但是这群人的数据名称被固定了，必须是members。在我们只能使用`import`时，一般同学会写两遍，很聪明的同学会想到上面这样的方法来复用，真是难为了。

所以，我们在2.0通过`use`支持了动态调用的特性，其效果相当于JavaScript中的函数调用。调用传入数据的方式是名称对应，不是顺序对应，因为模板片段声明时只会声明名称，不会声明其用到的数据。模板引擎能这么玩还是不多见的，所以说复用和灵活是[ETpl](http://ecomfe.github.io/etpl/)最大特点。

![](/blog/etpl-evolution/use.png)

```html
<!-- target: grade -->
<h3>class1</h3>
<!-- use: members(members=class1.members) -->

<h3>class2</h3>
<!-- use: members(members=class2.members) -->

<!-- target: members -->
<ul>
    <!-- for: ${members} as ${member} -->
    <li>${member.name}</li>
    <!-- /for -->
</ul>
```


### filter支持参数

在1.0时代，filter是一个非常简单的功能。在2.0中，我们对它专门进行了设计，增加了很多特性。


#### 对参数的支持

我们希望filter在运行时能够根据一些参数，进行不同行为的处理。比如下面的应用场景，支持参数是非常有用的：

```
${birthday | dateFormat('yyyy-MM-dd')}
```

在addFilter时，我们有两种方案可以选择：

```javascript
// 1，参数紧跟在filter函数的source参数后
etpl.addFilter('dateFormat', function (source, format) {
    // ......
});

// 2，闭包根据
etpl.addFilter('dateFormat', function (source) {
    return function (format) {
        // ......
    };
});
```

方案2的优势是，如果后续filter还有什么扩展，能够更方便。最后，由于性能和filter开发的易理解上的考虑，我们最终选择了方案1。

#### 对管道的支持


```
${content | cut(200) | highlight(${keyword})}
```

我们发现，在一些场景下，一个完成独立功能的filter不足以完成一些需求，这个时候，我们可能需要add一个新的filter，其功能是另外两个filter的组合。这事情是多此一举的。我们从shell的管道得到启发，我们让filter功能也支持了管道。

换一个简单的例子：`${team.name | slice(1, 3) | html}`，下面是其模板编译的结果说明：

```javascript
filters.html(
    filters.slice(
        toString(
            getVariable(
                ‘team.name’,
                [‘team’,’name’]
            )
        ),
        1,
        3
    )
)
```

从上面的模板编译结果说明，我们发现在getVariable和filters.slice之间，有一个toString，为什么呢？


#### 参数类型的考虑

在仔细设计filter功能的时候，我们对参数类型的问题，进行了一次深入的讨论。包括后来，很多使用者也问过我们为什么是这样。我们通过下面的应用场景对这个问题进行说明：

```javascript
{
    name: 'erik'
    birthday: new Date(2007, 6, 11),
    sex: 1
}
```

```html
${name | html} was born in ${birthday | dateFormat('yyyy-MM-dd')}.
```

filter应该接受数据的原始类型，还是字符串呢？

接受原始类型，dateFormat会比较容易处理。但是存在如下问题：

1. 管道的输入和输出应该保持一致性，否则容易导致混乱
2. 每个filter开发都需要做类型判断和转换。比如cut filter的功能是字符串截断，它需要内部将输入转换成字符串，因为输入可能是数字，不转换就会报错。

我们认为：

1. 默认情况下，在变量替换中，将默认一开始就把数据转换成字符串。filter的返回也应该是字符串。从而保证filter管道的数据类型一致性。
2. 我们也应该提供一种途径，方便一些特殊的filter进行处理，使其内部不需要进行字符串到所需数据类型的反序列化。我们选择的方式是`${*variable | filter}`：当variable使用`*`前缀时，ETpl默认不将variable转换成字符串，直接将原始数据传递给filter进行处理。这时filter中的处理过程是干净的，模板编写者需要知道filter是怎么干的，从而决定是否给filter原始数据。


所以，上面的模板例子，正确形式应该是这样：

```html
${name | html} was born in ${*birthday | dateFormat('yyyy-MM-dd')}.
```


约定输入必须是字符串，我们也才能顺利实现后面的 **处理模板内容块** 功能。


#### 处理模板内容块

filter的功能能够对目标内容进行一些处理，但是变量替换中的filter只能处理数据中的内容，我们可能需要对一些模板里的内容，使用filter进行处理。我们通过一个叫做filter的命令，实现了这样的功能。下面的代码是我们对于需求的最初设想：

```html
<!-- filter: markdown -->
## markdown document

This is the content, also I can use `${variables}`
<!-- /filter -->
```

我们很兴奋的支持了这个功能，但是迄今为止还没在应用中用到。


### 母版的母版

在1.0时代，我们支持了母版功能，但是只有target可以指定master。遇到下面这样的场景，就得写多个母版，每个母版里还有很多重复的内容。


所以在2.0里，我们支持了这样的功能，母版也能指定母版：

```html
<!-- master: up-down -->
<header>
    <!-- contentplaceholder: header -->header<!-- /contentplaceholder -->
</header>
<div>
    <!-- contentplaceholder: body -->body<!-- /contentplaceholder -->
</div>

<!-- master: up-left-right(master = up-down) -->
<!-- content: header -->my header<!-- /content -->
<!-- content: body -->
    <aside><!-- contentplaceholder: body-side --></aside>
    <main><!-- contentplaceholder: body-main -->child body<!-- /contentplaceholder --></main>
<!-- /content -->

<!-- target: biz(master = up-left-right) -->
<!-- content: body-side -->biz aside<!-- /content -->
<!-- content: body-main -->biz main<!-- /content -->
```


### 2.0时代的总结

由于ETpl独立化的契机，我们精心设计了2.0，加入了很多我们认为应该支持的功能。在这个过程中我们依然是谨慎的，我们没有忘记“复用、灵活”的初衷，并且努力实现“高性能，小体积”。从1.0到2.0，我们完成了 **还算好用** 到 **敢见人** 的转变。


## 3.0时，我们做了这些事情

在2.0中，我们已经做了一些比较完善的工作。但是在设计2.0的时候，我们期望尽量能够平滑的升级。我们增加特性，也要保证在现有系统中存在的模板能够正常的运行。但是不可否认，从1.0沿袭下来的2.0在母版功能的语法上存在不好用的地方，可以改进。

1. master和target为什么非要区分？master也是模板片段，直接用来渲染按道理应该是可以的。
1. contentplaceholder是什么东西？谁能记住这个不止一个单词的货色妈蛋？

我们一直有所感觉，但没有着手去做这个事情。因为我们知道这是一个breaking change，在一个已经被广泛应用的东西上做breaking change是需要谨慎、需要足够充足的理由的，但我们一直没找到，直到......

### 引用代入

直到[灰大](http://otakustay.com/)提出了[issue31](https://github.com/ecomfe/etpl/issues/31)!

这是个令人振奋的功能，迄今为止我没有见过市面上哪个模板引擎提供了这样的功能。我把它叫做[引用代入](http://ecomfe.github.io/etpl/feature.html#import-block)，意思是：在我`import`一个模板片段的时候，我能够对它中间的部分内容进行复写。

![](/blog/etpl-evolution/import-rewrite.png)

```html
<!-- target: header -->
<header><!-- block: header -->default header<!-- /block --></header>

<!-- target: main -->
<div><!-- block: main -->default list<!-- /block --></div>

<!-- target: footer -->
<footer><!-- block: footer -->default footer<!-- /block --></footer>

<!-- target: biz -->
<!-- import: header -->
<!-- import: main -->
    <!-- block: main -->specical list<!-- /block -->
<!-- /import -->
```

这能够有效避免在大应用中的母版爆炸问题，有效减少代码量！具体他是什么，能做什么，上面的issue里写得很清楚了，感兴趣的人去看看吧，相信大家会有收获。

这个feature给了我们给ETpl升级一位版本号的理由，因为它太令人振奋了。当然迄今为止用到这个feature的人并不多，因为大家还没明白它的好处，但我强烈建议大家去看看上面的issue！！！这里也有一个[引用代入的例子](http://ecomfe.github.io/etpl/example.html#import-block)。


### 对母版功能的语法重设计

我承认标题吹牛逼了，我们其实没有重设计。流行的模板引擎早已经有成熟的语法了，我们就是改成那样而已。这事情的意义是：梗终于被拔掉了。

方案是：我们砍掉了`master`、`content`、`contentplaceholder`，引入了`block`。

![](/blog/etpl-evolution/newmaster.png)

回顾上面多重母版的例子：

```html
<!-- master: up-down -->
<header>
    <!-- contentplaceholder: header -->header<!-- /contentplaceholder -->
</header>
<div>
    <!-- contentplaceholder: body -->body<!-- /contentplaceholder -->
</div>

<!-- master: up-left-right(master = up-down) -->
<!-- content: header -->my header<!-- /content -->
<!-- content: body -->
    <aside><!-- contentplaceholder: body-side --></aside>
    <main><!-- contentplaceholder: body-main -->child body<!-- /contentplaceholder --></main>
<!-- /content -->

<!-- target: biz(master = up-left-right) -->
<!-- content: body-side -->biz aside<!-- /content -->
<!-- content: body-main -->biz main<!-- /content -->
```

在3.0时代就变成了这样：

```html
<!-- target: up-down -->
<header><!-- block: header -->header<!-- /block --></header>
<div><!-- block: body -->body<!-- /block --></div>

<!-- target: up-left-right(master = up-down) -->
<!-- block: header -->my header<!-- /block -->
<!-- block: body -->
    <aside><!-- block: body-side --></aside>
    <main><!-- block: body-main -->child body<!-- /block --></main>
<!-- /block -->

<!-- target: biz(master = up-left-right) -->
<!-- block: body-side -->biz aside<!-- /block -->
<!-- block: body-main -->biz main<!-- /block -->
```

爽很多，有木有？但是毕竟是breaking change，很多ETpl2语法编写的模板迁移成本会很高。所以我们还提供了[etpl2to3](https://github.com/ecomfe/etpl2to3)的工具帮助老的产品线自动转换，基本迁移就可以无缝了。


### 支持完全自定义模板语法

我们之前通过 `commandOpen` / `commandClose` / `variableOpen` / `variableClose` 配置项支持用户对部分语法部分进行定制，但是`var: a = 1`中间的冒号算怎么回事，怎么觉得这么别扭呢？

所以，我们增加了一个参数：`commandSyntax`，让用户能够对命令的语法规则进行定制。看看[这个例子](http://ecomfe.github.io/etpl/example.html#custom)，经过定制后，ETpl语法和nunjucks是一样的。

```
<% target myTpl %>
<% import header %>
<div class="main">Hello {{name}}!</div>
<% import footer %>

<% target header %>
<header>Header Content</header>

<% target footer %>
<footer>Footer Content</footer>
```

`commandSyntax`类型是一个正则，默认值是`^\s*(\/)?([a-z]+)\s*(?::([\s\S]*))?$`，第一个match是结束标记，第二个match是command name，第三个match是command value。使用符合规则的正则就能很方便的定制ETpl的语法咯。

在2.0的时候我们也隐约感觉应该开放这样的定制点，但时间总是有限的，我们还在做其他的事情。当我们决定升级3.0的时候，我们就会把之前觉得不太紧急的升级点，仔细考虑，一并做掉。所以自定义模板语法的支持，在3.0才算是真正完全实现。


## 最后

跌跌撞撞的，[ETpl](http://ecomfe.github.io/etpl/)存在到现在也有4年多了。中间的升级一直断断续续，我们走的不快，但是还算稳。在这个过程中，对于lib类型的产品，我们有一些感想：

1. 很多基因在最开始的时候就已经被决定了。我们一开始最关注提供中大型应用中的模板复用性和灵活性，到最后这也是我们最厉害的地方。
1. 定位很重要，定位一定是一个取舍。讲性能我们比不过[artTemplate](https://github.com/aui/artTemplate)，讲体积我们比不过[doT](http://olado.github.io/doT/)，我们有我们的特点和生存空间。
1. 结合应用实际很重要。我们的功能点有很多是来源于应用后的反馈。绝对不能只高屋建瓴的空想。
1. 用户量越多，包袱越大。就像我们没法随意更改其语法。所以每个设计点都应该谨慎决策。
1. 用户通常只能看到你的第一价值观。就像我们提供了语法定制的功能，但是绝大多数用户是不会用的，他们会根据是否喜欢你提供的默认语法形式，决定用不用你。

我们仍有没做的功能，比如预编译。原因如下：

1. 预编译后的代码大多数时候比模板本身要大，可见预编译对浏览器端应用是没有价值的。
1. 对于NodeJS应用，服务启动时编译一次的成本并不高。
1. filter功能对于预编译是一个障碍，我们无法平滑的完成预编译的过程，filter可能是一个位于复杂环境的function。

所以，我们还未决定是否进行预编译的支持。当然，主要是因为我们现在还没有时间仔细的审视这个问题并给出方案。在未来的某个时候，我们将会考虑。


如果你觉得本篇blog有点收获，求个star支持下呗，反正不花钱

<iframe src="https://ghbtns.com/github-btn.html?user=ecomfe&repo=etpl&type=star&count=true" frameborder="0" scrolling="0" width="170" height="20"></iframe>





