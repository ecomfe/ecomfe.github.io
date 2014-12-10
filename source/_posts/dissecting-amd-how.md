---
title: 玩转AMD - 应用实践
date: 2014-12-10
author: errorrik
author_link: http://errorrik.com/
tags:
- AMD
- 模块化
- JavaScript
---


在 **设计思路** 篇中，已经对 `AMD` 在设计上的一些考虑做了比较详细的论述。所以这一篇只会提一些建议，引用一些 **设计思路** 篇中的结论，不会再详细描述为什么。

本篇提出的所有建议，都是针对于开发时就使用 `AMD` 的玩法。据我所知，有一些团队在开发时按照 `CommonJS` 的方式编写模块，通过开发时工具监听文件变化实时编译，上线前通过工具构建，`AMD` 纯粹被当作模块包装来用。本篇提出的建议不涵盖这种应用场景。

部分建议有一定的重叠，或者理由是相同的。举一反三能力较强的阅读者可能会觉得我很罗嗦，见谅。

### 开发时

#### 模块声明不要写 ID

将模块 ID 交给应用页面决定，便于重构和模块迁移。模块开发者应该适应这点，从模块定义时就决定模块名称的思路中解放出来。这是使用 `AMD` 的开发者能获得的最大便利。

```javascript
// good
define(
    function (require) {
        var sidebar = require('./common/sidebar');
        function sidebarHideListener(e) {}

        return {
            init: function () {
                sidebar.on('hide', sidebarHideListener)
                sidebar.init();
            }
        };
    }
);

// bad
define(
    'main',
    function (require) {
        var sidebar = require('./common/sidebar');
        function sidebarHideListener(e) {}

        return {
            init: function () {
                sidebar.on('hide', sidebarHideListener)
                sidebar.init();
            }
        };
    }
);
```

#### 模块划分应尽可能细粒度

细粒度划分模块，有助于更精细地进行模块变更、依赖、按需加载和引用等方面的管理，有利于让系统结构更清晰，让设计上的问题提早暴露，也能从一定程度上避免一些看起来也合理的循环依赖。

举个例子：在 namespace 模式下我们可能将一些 util function 通过 method 方式暴露，在 `AMD` 模块划分时，应该拆分成多个模块。

```javascript
// good: 分成多个模块
define(
    function () {
        function comma() {}
        return comma;
    }
);
define(
    function () {
        function pad() {}
        return pad;
    }
);

// bad
define(
    function () {
        return {
            comma: function () {},
            pad: function () {}
        };
    }
);
```


#### 在 factory 中使用 require 引用依赖模块，不要写 dependencies 参数

需要啥就在当前位置 require 一个，然后马上使用是最方便的。当模块文件比较大的时候，我想没有谁会喜欢回到头部在 dependencies 中添加一个依赖，然后在 factory 里添加一个参数。

另外，只使用 dependencies 参数声明依赖的方式，解决不了循环依赖的问题。为了项目中模块定义方式的一致性，也应该统一在 factory 中使用 require 引用依赖模块。

```javascript
// good
define(
    function (require) {
        var sidebar = require('./common/sidebar');
        function sidebarHideListener(e) {}

        return {
            init: function () {
                sidebar.on('hide', sidebarHideListener)
                sidebar.init();
            }
        };
    }
);

// bad
define(
    ['./common/sidebar'],
    function (sidebar) {
        function sidebarHideListener(e) {}

        return {
            init: function () {
                sidebar.on('hide', sidebarHideListener)
                sidebar.init();
            }
        };
    }
);
```

#### 对于要使用的依赖模块，即用即 require

遵守 `即用即 require` 的原则有如下原因：

- require 与使用的距离越远，代码的阅读与维护成本越高。
- 避免无意义的 `装载时依赖`。在 **设计思路** 篇中有提到：对于循环依赖，只要依赖环中任何一条边是`运行时依赖`，这个环理论上就是活的。如果全部边都是`装载时依赖`，这个环就是死的。遵守 `即用即 require` 可以有效避免出现死循环依赖。

```javascript
// good
define(
    function (require) {
        return function (callback) {
            var requester = require('requester');
            requester.send(url, method, callback);
        };
    }
);

// bad
define(
    function (require) {
        var requester = require('requester');
        return function (callback) {
            requester.send(url, method, callback);
        };
    }
);
```

#### 对于 package 依赖，require 使用 Top-Level ID；对于相同功能模块群组下的依赖，require 使用 Relative ID

这条的理由与 **模块声明不要写 ID** 相同，都是为了获得 `AMD` 提供的模块灵活性。

```javascript
// good
define(
    function (require) {
        var _ = require('underscore');
        var conf = require('./conf');

        return {}
    }
);

// bad
define(
    function (require) {
        var _ = require('underscore');
        var conf = require('conf');

        return {}
    }
);
```

**相同功能模块群组** 的界定需要开发者自己分辨，这取决于你对未来变更可能性的判断。

下面的目录结构划分中，假设加载器的 baseUrl 指向 src 目录，你可以认为 src 下是一个 **相同功能模块群组**；你也可以认为 common 是一个 **相同功能模块群组**，biz1 是一个 **相同功能模块群组**。如果是后者，biz1 中模块对 common 中模块的 require，可以使用 Relative ID，也可以使用 Top-Level ID。

但是无论如何，common 或 biz1 中模块的相互依赖，应该使用 Relative ID。

```
project/
    |- src/
        |- common/
            |- conf.js
            |- sidebar.js
        |- biz1/
            |- list.js
            |- edit.js
            |- add.js
        |- main.js
    |- dep/
        |- underscore/
    |- index.html
```

#### 模块的资源引用，在 factory 头部声明

有时候，一些模块需要依赖一些资源，常见一个业务模块需要依赖相应的模板和 CSS 资源。这些资源需要被加载，但是在模块内部代码中并不一定会使用它们。把这类资源的声明写在模块定义的开始部分，会更清晰。

另外，为了便于重构和模块迁移，对于资源的引用，resource ID 也应该使用 Relative ID 的形式。

```javascript
define(
    function (require) {
        require('css!./list.css');
        require('tpl!./list.tpl.html');

        var Action = require('er/Action');
        var listAction = new Action({});

        return listAction;
    }
);
```

#### 不要使用 paths

在 **设计思路** 篇中有说到，默认情况下 paths 是相对 baseUrl 的，配置了 paths 时不同 ID 的模块可能对应到同一个 define 文件。在一个系统里，同一个文件对应到多个模块，这种二义很容易导致难以理解的，并且会留下坑。

```javascript
// bad
require.config({
    baseUrl: 'src',
    paths: {
        'conf': 'common/conf'
    }
});
```

那 paths 在什么地方用到呢？在 **打包构建** 章节会有一些说明。

#### 使用第三方库，通过 package 引入

通常，在项目里会用到一些第三方库，除非你所有东西都自己实现。就算所有东西都自己实现，基础的业务无关部分，也应该作为独立的 package。

一个建议是，在项目开始就应该规划良好的项目目录结构，在这个时候确定 package 的存放位置。一个项目的源代码应该放在一个独立目录下（比如叫做 src），这里面的所有文件都是和项目业务相关的代码。存放第三方库 package 的目录应该和项目源代码目录分开。

```
project/
    |- src/
        |- common/
            |- conf.js
            |- sidebar.js
        |- biz1/
            |- list.js
            |- edit.js
            |- add.js
        |- main.js
    |- dep/
        |- underscore/
    |- index.html
```

如果有可能，定义一种 package 目录组织的规范，自己开发的 package 都按照这个方式组织，用到的第三方库也按照这种方式做一个包装，便于通过工具进行 package 的管理（导入、删除、package间依赖管理等）。

```
说明： 源代码不按照 CommonJS 建议放在 lib 目录的原因是，node package 是放在 lib 目录的，frontend package 应该有所区分。

package/
    |- src/
    |- doc/
    |- test/
    |- package.json
```

广告时间来了：

EFE 技术团队在决定使用 `AMD` 后，就马上规范了 [项目目录结构](https://github.com/ecomfe/spec/blob/master/directory.md) 和 [package结构](https://github.com/ecomfe/spec/blob/master/package.md)。这是我们认为比较合理的方式。我们使用了很多业内的标准和工具（CommonJS Package / Semver 等），在此之上做一些前端应用的细化，具有通用性，并不专门为我们的项目特点定制，执行的过程中也一直比较顺利。我们后来基于此也搭建了内部的 npm 作为 package 发布平台，开发的 [EDP](https://github.com/ecomfe/edp) 也包含了项目中使用和管理 package 功能。希望能给开发者，特别是所在团队还没有做相应工作的开发者，一些参考和启发。

#### 业务重复的功能集合，趁早抽取 package

这和尽早重构是一个道理。那么，什么样的东西需要被抽取成 package 呢？

- 如果项目业务无关的基础库或框架是自己开发的，那一开始就应该作为 package 存在。
- 业务公共代码一般是不需要抽取成 package 的。
- 一些业务公共模块集，如果预期会被其他项目用到，就应该抽取成 package。举个例子，正在开发的项目是面向 PC 的，项目中有个数据访问层，如果之后还要做 Mobile 的版本，这个数据访问层就应该抽象成 package。

#### package 内部模块之间的项目依赖，require 使用 Relative ID

package 内部模块之间的依赖通过 Relative ID require，能够保证 package 内部封装的整体性。在 `AMD` 环境下，package 使用者可能会需要多版本并存，或者在项目中根据自己的喜好对引入的 package 命名（比如 xxui，使用者可能会期望在项目里使用时，package 名称就叫做 ui）。

```javascript
// good
define(
    function (require) {
        var util = require('./util');
        var Control = require('./Control');

        function Button(options) {}
        util.inherits(Button, Control);

        return Button;
    }
);

// bad
define(
    function (require) {
        var util = require('esui/util');
        var Control = require('esui/Control');

        function Button(options) {}
        util.inherits(Button, Control);

        return Button;
    }
);
```

#### package 内部模块对主模块的依赖，不使用 require('.')

package 开发者会指定一个主模块，通常主模块就叫做 main。package 内其他模块对它的依赖可以使用 require('.') 和 require('./main') 两种方式。

但是，我们无法排除 package 的使用者在配置 package 的时候，认为把另外一个模块作为主模块更方便，从而进行了非主流的配置。

```javascript
// 非主流 package 配置
require.config({
    baseUrl: 'src',
    packages: [
        {
            name: 'esui',
            location: '../dep/esui',
            main: 'notmain'
        }
    ]
});
```

使用 require('./main') 就能规避这个问题。所以，不要使用 require('.')。

#### 可以对环境和模块进行区分，不需要太强迫症

有的第三方库，本身更适合作为环境引入，基本上项目所有模块开发时候都会以这些库的存在为前提。这样的东西就更适合作为环境引入，**不一定** 非要把它当作模块，在每个模块中 require 它。

典型的例子有 es5-shim / jquery 等。

直接作为环境引入的方法是，在页面中，在引入 Loader 的 script 前引入。

```html
<script src="es5-shim.js"></script>
<script src="amd-loader.js"></script>
```

### 打包构建

#### 构建工具

[r.js](http://requirejs.org/docs/optimization.html) 是 RequireJS 附带的 optimize 工具，比较成熟，打包构建 `AMD` 模块的构建产物优秀。

Grunt 和 Gulp 下的一些 `AMD` 构建插件，有的用了 r.js，有的是自己写的，构建产物的质量参差不齐，选用之前可以看看。我觉得以下几点可以判断构建产物是否优秀：

1. ID 被固化
2. factory 中 require 的依赖被提取填充到 dependencies
3. Relative ID 的 require，不需要在构建阶段 normalize
4. factory 没有进行任何修改，包括参数和函数体
5. 对 package 的主模块进行了处理

我们团队开发的 [EDP](https://github.com/ecomfe/edp) 中，`AMD` 模块构建就是自己写的。如果想自己实现 `AMD` 模块的构建，上面的几点和 EDP 都有一定的参考价值。

但是，在我所知道的 `AMD` 构建工具中，都需要通过配置，手工指定哪些模块需要合并，合并的时候 exclude 哪些模块，include 哪些模块。还没有一个工具能够很好的分析系统，自动进行比较优化的构建。我们在这方面有一些积累，但是实践的效果尚不明确，所以就不说了。

即使在构建阶段，把所有的模块定义都合并到主模块的文件中，构建方案还是需要将散模块单独构建生成单独的文件。在多页面对模块交叉引用，或按需加载时，会比较有帮助。

#### CDN

因为性能的考虑，线上环境静态资源通过 CDN 分发是一种常用做法。此时，静态资源和页面处于不同的域名下，线上环境的 Loader 配置需要通过 paths，让 Loader 能够正确加载静态资源。

```javascript
require.config({
    baseUrl: 'src',
    paths: {
        'biz1': 'http://static-domain/project/biz1',
        'biz2': 'http://static-domain/project/biz2'
    }
});
```

如果所有的模块都整体通过 CDN 分发，可以直接指定 baseUrl。

```javascript
require.config({
    baseUrl: 'http://static-domain/project'
});
```

开发环境和线上环境的配置信息差异，根据 DRY 原则，这个工作一定要用工具在构建过程自动完成。


#### 使用内容摘要作为文件名的玩法

在构建过程，使用文件内容的摘要作为文件名，是一种常用的优化手段。这种方式能够在 HTTP 层面设置强 cache，让用户能够最大程度缓存，减少网络传输的流量和时间。

但是在 `AMD` 中，模块 ID 与路径应该是一个对应关系。怎么破？这里提供两种玩法：

第一种方式：将打包后的模块定义合并文件，直接在页面上通过 script 标签引入。

```html
<script src="amd-loader.js"></script>
<script src="combined-md5.js"></script>
<script>
require(['main'], function (main) {
    main.init();
});
</script>
```

第二种方式：通过 paths 配置映射。

```html
<script src="amd-loader.js"></script>
<script>
require.config({
    paths: {
        'main': 'main-file-md5',
        ......
    }
});
require(['main'], function (main) {
    main.init();
});
</script>
```

在一个 Web 应用，特别是规模较大的 Web 应用中，为了性能最优化的考虑，可能会两种方式结合着玩：

- 系统一开始进入就需要的模块，通过第一种方式载入；需要按需加载的模块，通过第二种方式配置
- 模块定义合并文件可以根据变更频度打包成多个，充分利用缓存和浏览器的并行下载
- paths 配置项是 id prefix 匹配的，工具处理时注意模块文件同名目录下文件的路径处理
- 需要按需加载的模块数量通常不小，根据 DRY 原则，线上环境 paths 配置一定要用工具在构建过程自动完成


### 本篇结束

`AMD` 有很多特性，有的是为开发时设计的，有的是为线上环境设计的。理解其设计思路，选择合适的开发方式，和构建方式，整个过程才能不别扭，更顺畅。

用一句话来总结，就是 **要按常理出牌**。

本来 **Dissecting AMD** 应该到此结束了，但是 Loader 的选择也是一件很重要的事情。保守地选择 RequireJS，在绝大多数情况下是没问题的，但是不代表它没有缺陷。而且，RequireJS 的体积确实不小。所以我们开发了一个 `AMD` Loader：[ESL](https://github.com/ecomfe/esl)。下一篇，我打算围绕 ESL，对 Loader 的细节做一些阐述。这不单是广告，内容一定是技术有料的。




