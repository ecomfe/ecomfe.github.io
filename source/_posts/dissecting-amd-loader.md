---
title: 玩转AMD - Loader
date: 2014-12-17
author: errorrik
author_link: http://errorrik.com/
tags:
- AMD
- 模块化
- JavaScript
---



### 不用 RequireJS 的理由

理由很简单，因为太大了。RequireJS 经过语法压缩和 GZip 后，体积超过了 6k。RequireJS 最新版本已经降到了 6.1k，在 2012 年底时候的版本是接近 7k。由于下面的一些期望，让我们觉得这个体积比较大：

- 在移动环境上应用
- 在 baidu 搜索页面上用

既然这个体积比较大，那多少合适呢。当时我们拍了脑袋，一个 Loader，各种流转与依赖处理，两种 require，URL 查询，再加上异步的插件机制，就算看起来比较复杂，GZip 后 3k 应该没问题。开发时间我们规划了一个月，主要还是为编写测试用例留出一些时间。

后来...后来，事情远远超出了想象。我们开发了 `AMD` Loader: [ESL](https://github.com/ecomfe/esl)，包括前前后后的一些改进和 new feature，开发过程持续了一年半多。现在虽然是一个特性稳定版本，但是仍未结束，可预见的未来还有 shim 的支持需要添加。至于体积，我们也没控制住，在每个我们觉得无法或缺的 feature 中，它的体积最终是 3.4k。如果你觉得所有的错误信息你都不需要，那么可以选择 min 版本，体积是 3.1k，超过最初的梦想并不太多。可见男人的承诺多半不靠谱。

<!-- more -->

不过，这是我觉得为数不多对得起自己 **精工** 信念的良心作品。


### 模块初始化时机：`用时定义`

[ESL](https://github.com/ecomfe/esl) 从 1.8 开始，对模块初始化时机的处理策略是 `用时定义`。原因有两个：

1. 能够保证 require 的执行顺序
2. 能够较好处理循环依赖的问题

#### 保证 require 的执行顺序

这点在 **设计思路** 中已经描述过了。这里再赘述下问题解决的过程。其实很简单，没遇到问题的时候觉得一切都好，问题暴露了，经过分析，只能通过 `用时定义` 解决。出现问题的场景大体是这样的：

```javascript
// 主模块定义
define(
    function (require) {
        // 加载框架扩展，在框架基础上做业务扩展
        require('./framework-extend');

        // 使用一些业务模块，进行系统初始化
        var biz = require('./biz');
        biz.init();
    }
);

// framework-extend定义
define(
    function (require) {
        // 框架通过 package 方式引入的，所以是 Top-Level ID require
        var FrameworkClass = require('framework/class');
        
        // 框架提供了扩展接口
        FrameworkClass.extend({});

        // 最后无需返回任何东西
    }
);

// biz定义
define(
    function (require) {
        // 引入框架
        var FrameworkClass = require('framework/class');
        
        var biz = new FrameworkClass();
        return biz;
    }
);
```

由于 biz 模块网络返回在 framework-extend 之前，所以更早进行了初始化，导致问题出现了。

上面这种组织方式其实是基本 OK 的。但是面对出现的问题，我们的解决办法只有两个：

1. biz 模块不止一个，我们不得不在每个 biz 模块里都 require('./framework-extend')。临时先这样解决了问题。
2. 模块初始化时机使用`用时定义`策略。这点后来 ESL 做了一次升级，完成了这个进化。

从这里也能看出来，在 `AMD` 的玩法下，框架对于扩展机制的设计思路应该倾向 **包装** 而不是 **自身扩展**。


#### 解决循环依赖

对于一个比处女更处女的人（这里指星座），站在 Loader 实现的角度，完美兼容任何活的循环依赖是一种情怀，不值钱的情怀。

依赖关系可以想象成数据结构中的 **图**，循环依赖是图中的环。依赖的类型可以认为是边的属性。async require 可以认为是遍历的入口。

这么说比较抽象，还是举个例子好了，有index、b、c三个模块，构成循环依赖，那就有 3 条边。假设其中某两个模块的依赖（3条边中的1条）是 `运行时依赖`，其他依赖是 `装载时依赖`，就有3种可能性：

```
>> 表示 装载时依赖
> 表示 运行时依赖

下面说明不同场景下 require(['index'], callback) 的初始化顺序：


      index --->>--- b --->>--- c
        \                      /
         \                    /
           ---------<--------

场景1下，模块初始化顺序应该是c、b、index


      index --->---- b --->>--- c
        \                      /
         \                    /
           ---------<<--------

场景2下，模块初始化顺序应该是index、c、b


      index --->>--- b --->---- c
        \                      /
         \                    /
           ---------<<--------

场景3下，模块初始化顺序应该是b、index、c

```

看起来，这应该是一个很简单的问题，就算数据结构没学好，也应该很容易解决才对。但是，有一些难题，让我们没法通过传统的方法解决：

1. 模块是经过网络加载的，图的整体结构在一开始并不被知道，随着请求的返回才逐渐清晰。
2. 你无法知道一个依赖是不是 `装载时依赖`。某个依赖可能在某个函数内部 require，但是 factory 运行时会调用到。

问题2是很关键的问题，依赖分析都无法确定一个依赖是不是 `装载时依赖`，那玩个毛啊？好吧，也不是完全无解，既然分析的时候不知道，那就运行试试咯。`用时定义`不就解决了么。这里的逻辑是：假设所有模块已经 standby （即问题1不存在），当我要初始化一个模块，它的 `装载时依赖` 应该能被顺利初始化，否则就是模块编写者的问题。

当然，还有问题1的存在，还有一些浏览器兼容性的问题，还有一个循环依赖真的是死依赖怎么办等等的问题，所以，我们通过一些手段，达到一些前置条件，使这个问题能够顺利解决：

- 对模块的初始化分成4个阶段，分别在每个阶段进行必要的处理：
    - PRE_DEFINED: 调用过define，在内部生成了模块对象存储结构。这个用于解决不同浏览器的兼容问题。
    - ANALYZED: 完成分析，主要是抽取 factory 中的 require，根据 factory 形参确定哪些依赖一定是 `装载时依赖`（这个阶段没确定的不一定不是`装载时依赖`），看哪些依赖的模块还没有，发起请求。
    - PREPARED: 所有依赖模块都已经请求返回，并且经过分析，到达PREPARED。
    - DEFINED: 调用过 factory，完成初始化。
- 保存 async require 的模块，这些模块需要自动初始化。这些是 Loader 在各种时间点，进行模块初始化尝试的入口。
- 对分析阶段确定的 `装载时依赖`，在 factory 调用前，需要完成对它们的初始化。因为会被作为 factory 调用的参数传入。
- 对死循环依赖，做一个打断。这个很简单，如果自己的 factory 正在执行，就不能被再次调用。否则就没完没了了。


讲到这里，其中关键点算是完了，里面还有很多细节，这些就不展开了。总之，[ESL](https://github.com/ecomfe/esl) 解决了循环依赖的问题。我所知的 `AMD` Loader 里，没有一家完全解决了这问题，包括 RequireJS。

在开发过程中，除了使用 [AMD官方提供的测试用例](https://github.com/amdjs/amdjs-tests)，我们还编写了很多[自己的测试用例](https://github.com/ecomfe/esl/tree/master/test)。通过[test页面](https://github.com/ecomfe/esl/blob/master/test/test.html)可以看到，带有 `data-ignore="timestat"` 的测试用例部分是截至 RequireJS 2.1.14 都无法支持的。下面是我们构建的一些依赖用例的场景：

```
      index --->>--- h1 --->>--- h2 --->--- s1 --->>--- h3 
                       \                                /
                        \                              /
                          --------------<<-------------


      index --->>--- a --->>--- b --->>--- c --->>--- d --->>--- e
                      \                     \                   /
                       \                     \                 /
                        \                     ----<<--- f --<--
                         \                             /
                          \                           /
                           ----<<---- g ----- << -----


      index --->>--- b --->>--- c --->>--- g --->>--- h -->--
        \           /          / \                          /
         \         /          /   \                        /
          \        -<<-- d --<     ----<<---- j ---<<--- i
           \              \
            \              \
             -<<-- e --<<---
```

### 错误信息


由于错误的代码或错误的路径配置等原因，在模块加载与初始化阶段可能会发生错误，这不可避免。在[ESL](https://github.com/ecomfe/esl)中，我们认为下面这两种错误是必须要报出来的，否则会给开发和线上环境的问题追查带来极大困扰。

相关的错误处理导致 ESL 体积上有一些膨胀，但这是值得的。同时我们也提供了 min 版本，比 normal 版本减少了 0.3k 的体积，如果对自己非常有信心，或者系统已经测试完备，并且对体积有严苛的要求，可以选用 min 版本。


#### 模块加载失败

```javascript
require(['main'], function (main) {
    main.init();
});
```

模块加载失败是开发过程和线上环境都比较常见的错误。上面的代码，当模块加载失败时，callback 函数不会执行。如果没有相关提示信息，开发者可能会无从下手，很难追查问题。通常导致模块加载失败的原因可能有：

- 请求不到模块或依赖模块
    - ID->URL 过程错误，从而向一个错误的地址发起请求
    - 网络问题导致请求失败
    - 由于误删除或修改，模块定义文件不存在
- 返回的模块定义文件，内容不是期望的模块定义代码或其他问题
- 死循环依赖导致模块无法完成初始化
- factory 执行的过程发生错误

[ESL](https://github.com/ecomfe/esl) 对模块加载失败的报错方式参考的是 RequireJS 的做法：通过 `waitSeconds` 参数配置等待时间，单位是秒。当等待时间超过这个配置时，通过 throw Error的方式，报告相应错误。这个错误不能被 catch，可以在 console 面板中看到错误信息：

```
[MODULE_TIMEOUT]Hang( deaddependencies/a, deaddependencies/b ) Miss( none )
```

可以看到，错误分成两种: 

1. Hang: 模块已经正常请求返回，但是在初始化的过程被卡住了。可能的原因是 factory 执行错误或存在死循环依赖。
2. Miss: 需要模块，但是请求不到。可能是 URL 错误，或者请求没有返回预期的模块定义代码内容。

有了相关信息，就能够通过开发者工具的 network 面板或者追查相应模块定义文件，快速定位错误。这里还有一个技巧，对于 Hang 的错误，从最后一个开始追查，很可能是依赖链最后一个点没有正确初始化，导致整个链无法初始化。


#### 错误地在模块定义中使用了 global require

```javascript
define(
    function () {
        require('./conf');
    }
);
```

这是我们在应用过程中，发现的最难追查的问题，没有之一。这通常是由于疏忽导致的。看看上面的代码，看起来貌似没有问题，但是，factory 的形参少了 require。在运行的时候，整个过程是这样的：

1. Loader 能通过分析 factory 的 body，知道其依赖，并发起请求
2. 其依赖模块请求回来后，能正常分析，到达 PREPARED 状态
3. 由于全局存在 global require，所以没有形参，就会使用 global require，浏览器不会报变量不存在的错误
4. 根据 `AMD` 的规定，sync require 找不到相应模块时，需要抛出错误

这下问题来了: 开发者看到了模块不存在的错误，但是怎么看都是对的，模块定义的请求被正确返回了，返回的模块定义代码也没问题，怎么就找不到呢，你TM是在逗我？

当第二次有人让我帮忙追查这种问题的时候，我觉得这事不能有第三次了。而且就算我凭着经验能很快定位，但是不好意思找我的人，找不到我的人就会陷在这种问题里，可能一整天都无法进展下去。根据常理来说，使用 Relative ID 去调用 global require 肯定是有问题的，所以，在某一次的升级中，加入了相关的校验和错误报告：

```
[REQUIRE_FATAL]Relative ID is not allowed in global require: ./assertrelativeid/local/index
```


### 性能优化

在实测中，[ESL](https://github.com/ecomfe/esl) 性能比 RequireJS 高。但是我们没有分析具体高在什么地方，因为对于 Loader 来说，在多模块的测试环境下，我们难以估计和刨去网络请求的时间。而且对于 RequireJS 这么大的一个 Loader，如果我们性能低过他，那就不要做了。

在开发过程中，我们只是尽可能的做一些我们能想到的优化。在这里，我想说的是两个印象比较深刻的点。一些常识性的点以及随手的优化，比如给 script 标签添加 async 属性，根据状态对是否进行接下来的处理进行预先判断等等，这些点就不细说了。

#### 对配置信息的索引

`AMD` 规定的[配置项](https://github.com/amdjs/amdjs-api/blob/master/CommonConfig.md)还是不少的，在 ID normalize、ID to URL 阶段都可能用到这些配置项。其中，paths 和 map 配置项是 ID prefix 匹配的。当模块数目比较多的时候，频繁的 ID normalize、ID to URL 都可能带来运行的性能开销。

[ESL](https://github.com/ecomfe/esl) 在 require.config 调用的时候，在内部生成一份便于检索的索引结构，能够让 ID normalize、ID to URL 运行性能更高。在高频度的运行中，带来的性能提升就比较可观了。

下面通过 paths 配置项，来说明这个问题。paths 的配置是一个 Object，其中 key 是 ID prefix，value 是对应的查找路径。

```json
{
    'com': 'com-url',
    'one': 'url/one',
    'one/two': 'url/onetwo'
}
```

在 ID to URL 阶段，Loader 需要使用 for in 遍历这个对象。这个遍历过程有一些性能点：

1. 需要遍历每个属性，否则没法确定哪个是最匹配的。比如 one/two/three 应该匹配到 one/two 而不是 one。
2. ID prefix 匹配的过程，不能通过 indexOf。因为 one2 不应该被 one 匹配。
3. for in 本身就要慢一些。

[ESL](https://github.com/ecomfe/esl) 为 paths 在内部生成的索引数据类似下面这样：

```javascript
// 1. 以数组形式索引。
// 2. 用 key 生成 RegExp 对象，用于匹配过程。
// 3. 根据 key 进行了排序，在遍历过程，如果遇上匹配，能直接退出。
[
    {
        k: 'one/two',
        v: 'url/onetwo',
        reg: /^one\/two(\/|$)/
    },
    {
        k: 'one',
        v: 'url/one',
        reg: /^one(\/|$)/
    },
    {
        k: 'com',
        v: 'com-url',
        reg: /^com(\/|$)/
    }
]
```

对于其他配置项，如 maps、packages 等，如果是 Object，ESL 都会在内部生成类似格式的索引数据；对于 ID Prefix 的匹配规则，都会生成用于匹配的 RegExp。这就是我们在配置信息应用上的优化。没什么特别的，常规优化手段。


#### local require 的缓存

这是我们在应用过程中发现并优化的性能问题。我们之前考虑到问题可能出现，但没想到暴露得这么快，优化后效果也比较明显。

我们鼓励在 `AMD` 应用中，对于要使用的依赖模块，即用即 require。所以，类似下面的代码是没问题的，并且我们是鼓励将 factory 中用不到的依赖，尽量降级成 `运行时依赖`。

```javascript
define(
    function (require) {
        return function (source) {
            var result = require('./trim')(source);
            // ...

            return result;
        };
    }
);
```

但是，当访问的频度比较高的时候，问题就会被暴露。印象中我们当时遇到的场景是，n 大约 20000 个图形对象要进行动画，在图形对象的方法中包含了 require 代码，相当于每个 step 调用 n 次 require。这里的瓶颈在于，对 ID 进行了 n 次 normalize。这就很要命了。

解决办法也很简单，就是常规解决方案，在 require 内加一层 cache。效果很明显，腰不疼腿不酸了。

```javascript
if (typeof requireId === 'string') {
    if (!requiredCache[requireId]) {
        requiredCache[requireId] =
            nativeRequire(normalize(requireId, baseId));
    }

    return requiredCache[requireId];
}
```

在这里得到了一些感悟，所有可预见的性能问题都不要忽略，把事情做在前面。根据墨菲定律，可能发生的一定会发生。


### 网络请求上的考虑

#### urlArgs

不同的 WebServer 可能给资源添加不同的缓存策略，所以大多应用在升级的时候都会碰到用户在缓存策略内的访问不是最新的，但是我们期望在升级时用户应该马上体验到最新版本。

浏览器对资源的缓存是以 URL 为单元的。刷新缓存的一个常用方法时，升级时让用户访问不同的资源 URL。通过 **使用内容摘要作为文件名的玩法** 其实就是这样的道理，但是这种玩法是有一定的成本的，并且不是所有的应用都有必要使用这种方法。我们需要一种方法，让用户不更改 baseUrl / paths / packages 配置，又让所有模块的访问地址与之前不同。最简单的方式是引入一个新的配置项。

我们注意到，RequireJS 支持一个 urlArgs 配置项。这个配置是一个 string，所有的模块请求都会在 URL 后面附加这样的一个参数串，令 URL 可以和原先不同，达到刷新缓存的目的。

```javascript
require.config({
    baseUrl: 'src',
    urlArgs: 'v=1.0.0'
});

// 对于模块main，url将是src/main.js?v=1.0.0
```

看起来这不错诶。但是依然存在一个问题：所有模块都会被刷新缓存，即使有的模块在升级过程并没有被修改。

[ESL](https://github.com/ecomfe/esl) 在这个问题上的处理，借（chao）鉴（xi）了 RequireJS，并在此之上做了一些扩充：urlArgs 支持 string | Object。

```javascript
// ESL 支持和 RequireJS 一样的 urlArgs 配置
require.config({
    baseUrl: 'src',
    urlArgs: 'v=1.0.0'
});

// ESL 还支持 Object 作为 urlArgs 配置
// 为了和 AMD 标准配置项保持风格一致，key 是 ID Prefix 的匹配规则
require.config({
    baseUrl: 'src',
    urlArgs: {
        'common': 'v=1.0.1',
        'common/config': 'v=1.0.2',
        'biz': 'v=1.0.2',
        '*': 'v=1.0.0'
    }
});
```

可以看到，如果一个应用是按照一级或二级目录作为模块集划分，并以此为更新单元，urlArgs 能够带来很大的便利。但对于非常精细的缓存更新控制，urlArgs 还是不太好用的，虽然也能做到。

另外，urlArgs 通常会使用版本信息来配置。 版本的控制和管理是一种艺术，管好了可以很清晰，管不好一团糟。这里就不做展开了。


#### noRequests

```javascript
require(['container', 'MyClass'], function (container, MyClass) {
    var myClass = new MyClass();
    container.add(myClass)
});
```

我们可能在页面中会使用上面类似的方式使用模块，在一个 async require 里包含多个模块。在开发时一切都没问题，但是构建过程可能会对模块做一些合并，这种情况下线上环境就会发起一些无用的请求，虽然系统能够正常运行。

通过 **使用内容摘要作为文件名的玩法** 中推荐的方法一，在页面中添加 script 标签去引入合并的文件，不通过 Loader 去请求模块，能够较好规避这个问题。但是有的应用场景中，我们希望相关模块能够缓加载，或者希望由 Loader 负责和控制模块的加载过程。

对于这种应用场景，[ESL](https://github.com/ecomfe/esl) 通过 noRequests 配置项进行支持。noRequests 是一个 Object，其中 key 是 ID Prefix 的匹配串，value 可以是 *、模块 ID、模块 ID组成的数组。下面的例子简单进行了说明

```javascript
require.config({
    noRequests: {
        'noRequests/simple/cat': 'noRequests/simple/index',
        'noRequests/all/cat': '*',
        'noRequests/complex/child': [ 
            'noRequests/complex/index1',
            'noRequests/complex/index2'
        ]
    }
});

// require(['noRequests/simple/cat', 'noRequests/simple/index'])
// 不发起 noRequests/simple/cat 的请求

// noRequests/all/cat 和任何模块在同一个 async require 时，不发起请求
// noRequests/all/cat 只有在单独被 async require 时，才会发起请求

// noRequests/complex/child 下所有模块，在和 noRequests/complex/index1 或 noRequests/complex/index2 同时 async require 时，不发起请求

```


### 配置信息合并

我们预见到，开发者可能会在不同的地方，对 Loader 进行不同的配置。下面是一种场景：

```javascript
require.config({
    baseUrl: src
});

// 一些其他代码

// 然后构建工具生成了 paths 配置
require.config({
    paths: {
        // ......
    }
});
```

如果仅仅是这种场景，那么 Loader 的实现完全不需要做配置信息的合并。但是我们发现还有更复杂的应用场景，一个应用要接合各种不同的团队开发的模块，不同团队的模块的上线是完全独立的，每个团队在应用中有一个地方能添加自己的代码。于是，对于同一个配置项，可能会在多个地方出现。

```javascript
// 在一个应用的不同地方，分布了同一个配置项的多次配置

require.config({
    paths: {
        biz1: 'http://biz1-domain/path'
    }
});

require.config({
    paths: {
        biz2: 'http://biz2-domain/path'
    }
});
```

在上面的场景中，对于 paths 的 biz1 和 biz2 配置，都是不希望丢失的。这要求后执行的 require.config 不能覆盖之前的配置信息，而应该进行合并。

这里的实现并没有什么复杂的，提出这点只是想为 Loader 的选用提个醒，选择 Loader 的时候，需要根据应用场景，考虑 Loader 是否进行了相关支持。


### 最后

作为一个有节操的广告贴，我不希望吹牛一样列举 [ESL](https://github.com/ecomfe/esl) 特性，而想尽可能去讲一些我们在开发过程中特别的思考点、技术点以及遇到的问题，能够给有耐心看广告的读者一些收获。

感谢每一个能耐心看到这的读者。祝你们早日当上CTO，迎娶白富美，登上人生巅峰。






