---
title: 玩转AMD - 设计思路
date: 2014-12-03
author: errorrik
author_link: http://errorrik.com/
tags:
- AMD
- 模块化
- JavaScript
---



[AMD](https://github.com/amdjs/amdjs-api) 的全称是 Asynchronous Module Definition。顾名思义，这是一种定义模块的方式，并且是异步的。在其 [Spec](https://github.com/amdjs/amdjs-api/blob/master/AMD.md) 的第一段描述中，就强调了特别适合浏览器环境。

> The Asynchronous Module Definition (AMD) API specifies a mechanism for defining modules such that the module and its dependencies can be asynchronously loaded. This is particularly well suited for the browser environment where synchronous loading of modules incurs performance, usability, debugging, and cross-domain access problems.

我觉得，`AMD` 适合浏览器环境开发的主要特性有下面几点：

<!-- more -->

- 开发时不需要页面上写一大堆 script 引用，一个 require 初始化模块就搞定。不需要每增加一个文件，就需要到 HTML 或者其他地方添加一个 script 标签或文件声明。
- 开发时不需要依赖额外的环境，如果不是联调或数据模拟，我甚至不需要启动 WebServer ，直接 file:// 都能跑。想想如果你开发时写的是 CommonJS 形式的模块，你就需要依赖一个进行特殊处理的 WebServer，或者是一个编译工具。随着系统规模增加，编译工具还需要监听文件修改，进行增量编译。
- 方便打包构建，打包构建应该便于进行模块的合并，并且在绝大多数场景不需要对页面进行修改。
- 能够通过多种构建方案产生多种打包组合，方便从系统加载过程与缓存进行性能优化。特别是规模较大的应用，哪些东西首次加载、哪些东西缓加载、哪些东西需要被拼合、哪些东西经常变更等等，在构建的时候都会被考虑，对系统性能都可能有较大的影响。

`AMD` 要求保留两个全局变量(这句话不严谨)。

- `define` - 模块定义的入口
- `require` - 用于加载模块

应该可以很容易看出来，`AMD` 和 [CMD](https://github.com/cmdjs/specification/blob/master/draft/module.md) 是不兼容的，不能在一个页面共存。

不是所有的 define 都是 `AMD`。那么，怎么知道页面中的 define 是不是 `AMD` 的呢？可以判断 [define.amd](https://github.com/amdjs/amdjs-api/blob/master/AMD.md#defineamd-property-) 是否存在。


### 使用 define 定义模块

早先的时候，很多项目和团队都是采用类似 namespace 的模式在写 JavaScript：

```javascript
lib.string.trim = function (source) {
};
```

这种模式存在一些弊端。首先， `lib` 和 `lib.string` 必须存在并且是 Object 啊，要不运行就报错了。然后，`lib.string.trim` 可能会被覆盖，并且很难追查。我们曾经遇到过这样的例子：

```javascript
// 最开始的人是这么实现的
lib.string.trim = function (source) {
    return source.replace(/(^[\s\t\xa0\u3000]+|[\s\t\xa0\u3000]+$)/g, '');
};

// 后来某个人不知道怎么想的。可能是有需要，也没看原来有没有，就在某个很隐蔽的地方这么写
lib.string.trim = function (source) {
    return source.replace(/(^[\s\t\xa0]+|[\s\t\xa0]+$)/g, '');
};

// QA测出来全角空格trim不掉了，可是怎么看代码都是对的
// 从这可以得出一个经典结论：不怕神一样的对手，就怕猪一样的队友
```

后来，大家开始使用一些包装。基本上很多公司都有自己的包装方法，很多库或者框架也有自己的包装方法。大多是 namespace style 的 id，使用 factory 的返回值作为模块（那时候还不叫模块），不过多少还会有些细微的区别。

```javascript
defineNamespace('lib.string.trim', function () {
    return function (source) {
    };
});
```

各搞各的多乱啊，还好后来有了 `AMD`，大家都按这个玩，一个 define 解决问题。这样跳槽的时候技术成本就能小一些。上面只是简单大致回顾下，也懒的去挖坟和考证，下面看看 `AMD` 的 define：

```
define(id?, dependencies?, factory);

id - string
dependencies - Array
factory - Function | Object
```

从 define 的签名可以看到，id 和 dependencies 是可选的。扩展一下，define 总共有下面 4 种形式：

```
define(factory);
define(id, factory);
define(dependencies, factory);
define(id, dependencies, factory);
```

这 4 种形式里，不同的形式适合不同的场合使用，有的形式基本不可能被用到，只是由于参数设计的形式，出现了这种组合形式。在后面会给出一些说明和建议。

### 模块 ID 的形式

模块 ID 可能会被用在 define 和 require 时。它是一个 string literal。在 `AMD` 里，对 ID 形式的要求和 `CommonJS` 是一样的。我列一些关键点（不全）：

- `/` 分隔 terms
- term 是 驼峰形式的 `identifier`，或者 `.` ，或者 `..`
- 不包含文件的扩展名，比如 `.js`
- `.` 或 `..` 开头的叫做 `Relative`， 否则叫做 `Top-Level`

这一看不就是路径嘛。这种 ID 的设计实在是太方便了。AMD Loader 会根据模块 ID 去加载对应的模块声明文件，既直观又能保证正确性。以前写 namespace 模式的时候，我们必须在项目里规范 “文件声明的namespace和文件存放路径必须严格对应” 这种看似常识的条目，但不经意间总有人break。

写惯了 namespace 模式的人，可能需要适应一下这种 path style 的 ID 形式。

define 时只允许使用 Top-Level ID，这点应该很好理解。使用 local require 时可以使用 Relative ID，这是 `AMD` 中一个很重要的特点。

既然 ID 是 path style，并且 require 时能够通过路径对应，开发的时候写 define 干嘛还多此一举写 ID 呢？所以 define 中 ID 是可以省略的嘛，而且开发时能不写就不写比较好。不是因为懒，为了方便模块迁移。后面会详细说说这点。

我有一点不太理解，为什么 term 要求是驼峰形式的 identifier。如果有人知道，麻烦[告诉我](mailto:errorrik@gmail.com)。


### factory

`AMD` 规定，factory 可以是 Function 或 Object。如果 factory 是 Function，Loader 将在合适的时候执行 factory，并且把返回值作为模块对象。

define(function () {
    return {
        color: 'red'
    };
});

factory 是 Function 的方式非 `AMD` 独创和独有，主要好处我觉得有：

1. 获得一个模块独立的环境，模块需要用到但是不想向外暴露的东西可以封到里面。
2. 模块初始化过程可以很方便的定义。
3. 模块初始化的时机可以被控制。

作为 `CommonJS` 的 Transport，factory 中也可以通过 exports 和 module.exports 暴露对象，前提是 dependencies 显式或隐式(使用默认值)包含 exports 和 module，以及 factory 形参也需要声明它们。

```javascript
define(function (require, exports, module) {
    module.exports = {
        color: 'red'
    };
});

// or

define(function (require, exports) {
    exports.color = 'red';
});
```

后面我们会对模块初始化时机进行分析。


### 模块的依赖声明

因为 JavaScript 的动态性，我们以前一直有这样的困扰：没有办法通过工具分析系统的模块组成与依赖关系。

```javascript
// 这种依赖基本是不好分析的。你想case by case，还是构建运行时？
var oper = lib.hasClass(element, 'xxx') ? 'removeClass' : 'addClass';
lib[oper](element, 'xxx');
```

在 `AMD` 中，模块是必须声明自己的依赖的，否则 Loader 没有办法把依赖的模块加载回来。这就给了我们通过工具分析模块的可能，我们就能在此之上做更多的工作：分析系统的设计是否合理、自动生成线上构建优化方案等。`AMD` 提供了两种依赖声明的形式：

#### 方式一： 通过 define 的 dependencies 参数声明依赖

define 的 dependencies 参数，默认值是 ['require', 'exports', 'module']。一看就知道这是为了作为 `CommonJS` Transport 而存在的设计。虽然自立门户了，但是做人不能忘本。

require / exports / module 这三个模块名称是被保留的，也就是说，你自己的模块 ID 不能用这三个名字。具体这三个东西代表什么，可以参考 [CommonJS Modules/1.1.1 Module Context](http://wiki.commonjs.org/wiki/Modules/1.1.1#Module_Context)。

dependencies 声明的依赖模块，会在 factory 调用时作为参数传递，顺序一致。第一反应这是合理的，我依赖的东西 ready 了我才有办法 ready 咯。但这里没这么简单，后面在 *模块初始化时机* 里再讲。

```javascript
define(
    ['conf', 'ui']
    function (conf, ui) {
        function init() {
            ui.conf(conf);
            ui.init();
        }

        return init;
    }
);
```

#### 方式二： 在 factory 中通过 require 声明依赖

这种声明依赖的方式更直观更符合编程的习惯，我写着写着，想依赖啥就在当前位置 require 一个，然后马上使用。

由于 dependencies 参数默认值是 ['require', 'exports', 'module']，所以 dependencies 不需要声明了。factory 的形参为啥只写 require 呢？ exports 和 module 用不到还写个毛啊。

```javascript
define(
    function (require) {
        function init() {
            var ui = require('ui');
            ui.conf(require('conf'));
            ui.init();
        }

        return init;
    }
);
```

require(string) 形式的 require 是 sync require，并且调用参数必须是字符串字面量。[require spec](https://github.com/amdjs/amdjs-api/blob/master/require.md#requirestring-)页面有详细的说明，Loader 可以通过正则分析 factory function 的 toString 结果，抽取出依赖的模块，并加载和初始化它们。通过正则分析的原因是，对于一个浏览器端运行的 Loader，内置 AST 分析的功能，其大小和分析效率一定是不可接受的。


#### 两种依赖声明方式的一些分析

可以看到，`方式一`更像是在头部声明依赖，代码中使用；`方式二`是使用时声明。采用`方式二`写代码基本上和写 Node.JS 差不多，确实写起来更爽，特别是模块文件超过一屏的时候。想想当你要增加一个依赖的时候，你需要回到头部在 dependencies 中添加一个依赖，然后在 factory 里添加一个参数，会不会觉得很累？

但是`方式二`性能比较差。正则分析总需要消耗时间，特别是大规模应用，源代码体积非常大的时候。`AMD` 设计的时候早就考虑到这个问题了。在 [Simplified CommonJS wrapping](https://github.com/amdjs/amdjs-api/blob/master/AMD.md#simplified-commonjs-wrapping-) 章节，做了如下说明：

> If the dependencies argument is present, the module loader SHOULD NOT scan for dependencies within the factory function.

性能问题解决了。看到这里，应该很容易知道 `AMD` 的一些开发实践应该怎么做了：开发时按`方式二`写，上线前通过工具打包成`方式一`。再展开下一章就没法写了，所以具体的玩法还是在 **应用实践** 章节再展开吧。


### 模块初始化时机

大多数情况下，使用 `AMD` 时会选择 Function 作为 factory，模块以执行 factory 进行初始化。下面我们通过两个问题，分析模块初始化时机。

#### 依赖的种类

第一个问题来了，挖掘机...哦不对，问题是：是不是模块需要在依赖都初始化完后再进行初始化呢？


```javascript
define('a', function (require) {
    var b = require('b');
    b.init();

    return {
        foo: function () {
        }
    };
});


define('b', function (require) {
    var a = require('a');

    return {
        init: function () {},
        foo: function () {
            a.foo();
        }
    };
});
```

上面的例子可以很容易看出来，是跑不过去的，就算跑过了结果也是不符合预期的。因为 a 在模块初始化时需要用到 b。b 在模块初始化时也需要依赖 a，虽然不是马上用到，但是此时如果 a 没有存在，后面的 foo 方法在被调用的时候就不符合预期。

这是一种循环依赖的场景。不是所有的循环依赖都是不合理的，这里也不打算对什么场景的循环依赖合理什么场景不合理做更多探讨。

上面的例子中万幸的是，b 其实在模块初始化时并不需要 a 已经初始化完成。所以我们可以改造一下代码：

```javascript
define('a', function (require) {
    var b = require('b');
    b.init();

    return {
        foo: function () {
        }
    };
});


define('b', function (require) {
    return {
        init: function () {},
        foo: function () {
            require('a').foo();
        }
    };
});
```

这样两个模块理论上完全可以正常初始化和正常工作了。借用金大为同学07年的时候和我解释 JSI 时讲到的依赖划分定义，这里也做一些划分，以便于后面能更简洁地进行描述。

- `装载时依赖` - 模块在初始化过程就需要用到的依赖模块，我们认为这种依赖是`装载时依赖`。a 对 b 的依赖就是`装载时依赖`。
- `运行时依赖`- 模块在初始化过程不需要用到，但是在后续的运行过程中需要用到的依赖模块，我们认为这种依赖是`运行时依赖`。b 对 a 的依赖就是`运行时依赖`。


回到问题1: 是不是模块需要在依赖都初始化完后再进行初始化呢？答案显然是否定的。更进一步的思考，我们可以得出一个似乎正确的描述：模块需要在其`装载时依赖`都初始化完后再进行初始化。

题外话，对于循环依赖，只要依赖环中任何一条边是`运行时依赖`，这个环理论上就是活的。如果全部边都是`装载时依赖`，这个环就是死的。RequireJS 的网站上也有说到[解决循环依赖的方法](http://requirejs.org/docs/api.html#circular)。

之前有说到，依赖声明有两种方式。对于 dependencies 参数中声明的依赖，怎么算呢？下面是之前的例子另外一种可能的形式，纯为了说明问题构建：

```javascript
define('a', ['require', 'b'], function (require, b) {
    b.init();

    return {
        foo: function () {
        }
    };
});


define('b', ['require', 'a'], function (require) {
    return {
        init: function () {},
        foo: function () {
            require('a').foo();
        }
    };
});
```

`AMD` 的设计是需要考虑 Loader 实现的可行性的。虽然 a 出现在了 b 的 dependencies 声明里，但是 a 是 b 的`运行时依赖`。这个怎么判断呢？只能通过 factory 的 length 和 dependencies 来判断。如果 dependencies 里声明，并且 factory 的形参里包含了，则一定是`装载时依赖`。如果 factory 的形参里未包含，则说明这个依赖有可能是`运行时依赖`。

我之前是这么觉得的，再后来，我发现 `AMD` 的 spec 里加了这么一段，验证了我的想法。

> The dependencies argument is optional. If omitted, it should default to ["require", "exports", "module"]. However, if the factory function's arity (length property) is less than 3, then the loader may choose to only call the factory with the number of arguments corresponding to the function's arity or length.

上面例子中 b 模块的形式，我觉得重点在于：

- 如果 dependencies 是开发时手工维护的，那添加 dependencies 时，一定会为 factory 加上形参。
- 如果开发时在 factory 中使用 require，dependencies 是通过构建工具生成的，那 factory 形参和内部代码不会也不应该被改变。在 factory 内部依然存在对该依赖模块的 require 代码。那么即使这个依赖模块是`装载时依赖`，在这个 require 中对这个依赖模块进行初始化并返回，也来得及。这就解决了 dependencies 包含但形参未包含的`装载时依赖`的初始化问题。

上面`AMD` 的 spec 里的那个 3，我个人觉得可能是因为对两种不同开发模式场景的简单划分条件，虽然不够严谨，但简单易用，能覆盖所有非脑残的应用场景。更严谨的条件应该是 “dependencies 只由 require / exports / module 中的一个或多个组成”。


#### 何时初始化

挖掘机又来了：模块是不是能初始化的时候就马上进行初始化最好？

```javascript
define('main', function (require) {
    require('uiPlugin');
    var view1 = require('view1');
    var view2 = require('view2');

    return {
        refresh: function () {
            view1.refresh();
            view2.refresh();
        }
    };
});

define('ui', function () {
    function UI(options) {
    }
    
    UI.plugin = function () {};
    return UI;
});

define('uiPlugin', function (require) {
    var UI = require('ui');
    UI.plugin({});
});

define('view1', function (require) {
    var UI = require('ui');
    var myUI = new UI();
    return {
        refresh: function () {}
    }
});

define('view2', function (require) {
    var UI = require('ui');
    var myUI = new UI();
    return {
        refresh: function () {}
    }
});
```

这个例子稍微有些复杂。首先，因为请求返回的顺序是不确定的，所以对于 main 模块来说，view1 和 view2 可能在 uiPlugin 之前返回。假设此时 ui 已经返回，那 view1 和 view2 完全具备了初始化的条件。如果这时候马上对它们进行初始化，那可能获得不期望的视图呈现，因为 uiPlugin 还没准备好，ui 还没有完成插件扩展。

回到问题2: 模块是不是能初始化的时候就马上进行初始化最好？答案也是否定的。上面的例子，你可以说 view1 和 view2 都写上对 uiPlugin 的依赖就解决问题了，而且也应该写。但是我们想要说明问题的重点在于：由于请求返回顺序的不确定性，能初始化时马上进行初始化的方式，没法保证模块初始化的顺序和代码里依赖声明顺序是一致的。

延伸一下，`CMD` 声称自己是 **用时定义** 的，这点比 `AMD` 更优秀。曾经有不少人把我当成元芳，问我怎么看这事。下面随便扯扯。

在 `AMD` spec 里，对指定 dependencies 的场景，有[相应描述](https://github.com/amdjs/amdjs-api/blob/master/AMD.md#dependencies-)：

> The dependencies must be resolved prior to the execution of the module factory function, and the resolved values should be passed as arguments to the factory function with argument positions corresponding to indexes in the dependencies array.


> The dependencies argument is optional. If omitted, it should default to ["require", "exports", "module"]. However, if the factory function's arity (length property) is less than 3, then the loader may choose to only call the factory with the number of arguments corresponding to the function's arity or length.

这段之前有引用过一部分并进行说明了，这里再啰嗦下凑字数。我是这么理解的，对于 factory 中的形式参数，Loader 应该对 dependencies 里的声明模块，先执行 factory 初始化好，然后按顺序传递给 factory。但是，当 factory 的形式参数数目少于3时，Loader 可以根据参数数量的前几个 dependencies 模块，去 call factory。也就是说，dependencies 数组里，后面一些模块的初始化时机，是可以`自由把握`的；在call factory的时候，dependencies 数组中位于形式参数 length 后面 index 的模块，`不一定`要初始化完毕。

然后是 `AMD` [对 define 中的同步 require 的描述](https://github.com/amdjs/amdjs-api/blob/master/require.md#requirestring-)：

> Dependencies can be found in an AMD module when this form of define() is used:

```javascript
    define(function (require) {
        var a = require('a');
    });
```

> The define factory function can be parsed for require('') calls (for instance by using a language parser or using Function.prototype.toString() and regexps) to find dependencies, load and execute the dependencies, then run the code above. In that manner, the require('a') call can return the module value.

这里只说了 Loader 可以去 parse 出 require 的模块，去加载它，然后执行依赖模块，然后`run the code above`。这样 require('a') 就能返回相应模块。我理解这里的意思是，在 require('a') 执行前，需要完成 a 模块的载入和初始化执行，但并没有说必须在 factory 执行前就要完成 a 模块的载入和初始化执行。否则这里的描述就应该是 `then call the factory`，而不是 `then run the code above`。

而且，就算不看 `AMD` spec，只看 Loader，它也是有循环依赖的处理机制的。循环依赖出现的情况，是没法保证 factory 运行的时候，dependencies 全部加载完毕的。

综上，`AMD` 对于:

1. factory 内部 require 的依赖模块
2. 在 dependencies 中声明但是在 factory 形参列表之外的依赖模块

这两种形式声明的依赖，并 **没有明确规定执行 factory 初始化的时机**。只不过 `AMD` 玩家通常用 RequireJS，它对于不形成环的依赖模块，都会在自己初始化前先初始化依赖模块，大家就以为 `AMD` 是这样。最新的 RequireJS 是怎样的策略，我也没测了。

`CMD` 的 **用时定义**，确实能让依赖模块初始化的顺序和代码里依赖声明顺序一致。这点的明确是一个进步。近一年来 `AMD` spec 做了很多补充说明和规定完善，希望什么时候能完善这个部分。

### Require

通常一个应用会有入口模块或系统初始化模块，页面脚本在合适的时机(DOMReady是常用的时机)需要使用这个模块进行应用的初始化。Require 作为使用模块的唯一函数，是使用了 `AMD` 应用的脚本入口。

```javascript
require(['main'], function (main) {
    main.init();
});
```

#### require 的形式

require有两种形式，或者说有两种调用方式：

1. 异步 require - require({Array}ids, {Function}callback)
2. 同步 require - require({string}id)

`异步 require` 中， ids 与 callback 的关系类似于 define 中 dependencies 与 factory 的关系。Loader 会负责加载 ids 中的模块，初始化完成，然后调用 callback。调用时传入的参数根据 ids 中声明的模块顺序。

`同步 require` 用于返回一个现有的模块，如果模块不存在，不允许去请求模块，必须抛出一个错误。

#### require 的类型

require有两种类型：

1. 全局 require
2. 局部 require

这个应该不难理解。你在页面中直接使用的 require 是一个全局函数。这就是`全局 require`。一些 Loader 的`全局 require`不叫做 require，比如 curl。

在模块的 define 中，通常用到的是`局部 require`，除非你忘记在 factory 的形参中写 require。

`全局 require`和`局部 require`的区别在于，`局部 require`拥有当前所属模块的一些信息，运行的行为受到当前所属模块的影响。所以`局部 require`可以接受 Relative ID。

```javascript
define('foo/a', function (require) {
    var b = require('./b');
    b.init();

    return {
        foo: function () {
        }
    };
});


define('foo/b', function (require) {
    return {
        init: function () {},
        foo: function () {
            require('./a').foo();
        }
    };
});
```

### 模块查找

```javascript
require(['main'], function (main) {
    main.init();
});
```

用之前这个简单的例子，页面上有这么一段脚本，Loader 需要去请求并初始化 main 模块，在 main 模块初始化完成后，调用 callback 函数。要请求 main 模块，Loader 需要知道它的 URL。

Loader 会提供一个配置方法，通常是 **require.config**。开发者需要通过这个方法对应用进行配置，Loader 根据这些配置去计算模块的 URL。

Loader 会用到进行模块查找的配置项有：

- [baseUrl](https://github.com/amdjs/amdjs-api/blob/master/CommonConfig.md#baseurl-)
- [paths](https://github.com/amdjs/amdjs-api/blob/master/CommonConfig.md#paths-)
- [packages](https://github.com/amdjs/amdjs-api/blob/master/CommonConfig.md#packages-)

```javascript
require.config({
    baseUrl: 'src'
});
```

通常情况下，模块会根据 ID 到 baseUrl 下寻找。如果模块不在正常的位置，开发者需要配置 paths。如果是 Package，需要配置 packages。后面会讲到 Package。

继续上面的例子。假设 main 模块中声明依赖 ./conf，Loader 需要加载其依赖并完成初始化。但是 ./conf 是一个 Relative ID，Loader 需要将其转换成 Top-Level ID: conf。这个过程我们叫做 normalize。在 normalize 后，Loader 会用 Top-Level ID: conf，根据配置，计算出其地址，然后发起请求。

在 `AMD` 中，由于 ID 是 path style，所以很多人在使用中会有些混淆。这里想要强调几点：

1. ID 和 URL 其实还是分开的概念。
2. 模块 URL 的计算一定是基于 Top-Level ID 的，一定在 normalize 后。
3. 由于 paths 和 packages 配置项的存在，模块不一定在 baseUrl 下，模块和目录结果不一定是完全对应的。
4. 默认情况下 paths 是相对 baseUrl 的，配置了 paths 时不同 ID 的模块可能对应到同一个 define 文件。

前面几点容易理解，不太容易理解的是第 4 点。我们举个例子，看看下面的配置：

```javascript
require.config({
    baseUrl: 'src',
    paths: {
        'bizUI': 'common/ui'
    }
})
```

这时候，你 require bizUI/TreeView 和 common/ui/TreeView，都会对应到 src/common/ui/TreeView.js 文件，这个文件不仅仅代表了一个模块。当然，一般开发者在应用中只会使用 bizUI/TreeView 去 require 模块。但是，你应该意识到这点，这里可能会是一个坑。比如团队来了新人，ta并不知道你这么玩了，也没仔细看 require.config，完全可能直接 require common/ui/TreeView。

### Package

熟悉 `CommonJS` 的人都应该熟知 Package 的概念。我理解，Package 是独立的同类功能的代码和资源集合，是一种包装方式。在 `AMD` 中，Package 的概念和 `CommonJS` 相似，但并没有对 Package 的结构和组织方式做任何的规定约束。

`AMD` 通过 [packages](https://github.com/amdjs/amdjs-api/blob/master/CommonConfig.md#packages-) 配置项，实现了对 Package 的支持。因为一个应用或一个页面可能会引入多个包，packages 配置项是一个 Array，其中每一项是单一的 Package 配置。Package 配置的关键点有：

1. Package 是需要被独立组织的，甚至是独立开发，模块查找规则需要一些配置支持。相应配置项名称为 location。
2. Package 在使用上绝大多数时候需要一个统一的出口（用于内部组织、整体配置、统一暴露等）。相应的配置项名称为 main。
3. Package 的名称当然是少不了。相应配置项名称为 name。


### 模块的灵活性

在 `AMD` 中，模块的灵活性主要体现在：

1. define 的时候，ID 是可以省略的。
2. 模块声明和引用依赖，可以通过 Relative ID。

这是一种和传统 namespace 模式完全不同的理念，让模块组织的模式从思路上发生了根本变化。想象一些场景：

1. 在项目开发的过程中，由于重构式的结构微调，模块文件可能要移动位置。
2. 某个目录下的所有模块，由于可能被跨项目复用，需要抽取成 Package。
3. 启动一个和原来项目在整体结构上比较类似的新项目，有的文件要复制过去（别说复制就一定是错误行为，总有些项目配置、项目启动模块之类的东西是无需封装，复制更方便的）。
4. 你发现 namespace 的某一级命名不够贴切，但是一想起每个文件里的 namespace 声明都要改，是不是很犹豫？

在传统模式下，无论如何你都要挨个去改 namespace 名称的。在 `AMD` 模式下，你可以完全平滑的迁移任何模块。如果同目录下（含子目录）的模块之间依赖全部使用 Relative ID 来 require，所有模块的依赖声明你都不需要改。

`AMD` 的模块能做到如此灵活的秘诀在于，在开发时，模块的 ID 是由应用的页面入口决定的，不是由模块的开发者决定的。页面入口通过 Loader Config 决定了哪些东西叫什么，从哪里找。在打包构建与合并时，ID 还是需要被固化的，否则合并的一个文件中包含多个模块定义，就没法知道谁是谁了。当然，想要拥有这些灵活的特性，模块开发者在编写模块时不能显示声明模块 ID，并且对非 Package 的依赖引用应该使用 Relative ID。


### 打包合并的支持

`AMD` 在开发时，一个模块一个文件。但是对于线上的服务来说，n个模块就有n个请求，从性能角度来说这是不可接受的。`AMD` 号称特别适合浏览器环境，设计的时候不可能不考虑到这点。其支持方式是这样的：

```javascript
require(['main'], function (main) {
    main.init();
});
```

还是用之前的老例子，页面上有这么一段脚本。Loader 会发起 main 模块的请求，然后分析并发起对其依赖模块的请求。但是如果 main 模块请求返回的内容里，包含了 main 模块以及其所有依赖模块的 define，那 Loader 就没必要发起依赖模块的请求了。

所以，开发时正常分文件定义模块，上线前通过工具构建打包，页面上启动应用的代码不需要更改。这种方式就能满足大部分的应用。下面是简单的开发时和打包后代码示例（不同工具打包的代码可能会有细微差别，下面代码仅为说明）。

```javascript
// 开发时 main 模块，src/main.js
define(function (require) {
    var conf = require('./conf');
    return {
        init: function () {}
    };
});

// 开发时 conf 模块，src/conf.js
define(function () {
    return {
        pageSize: 30
    };
});

// 打包后的 src/main.js
define('main', ['require', './conf'], function (require) {
    var conf = require('./conf');
    return {
        init: function () {}
    };
});
define('conf', [], function () {
    return {
        pageSize: 30
    };
});
```

可以看到，打包后的代码有如下几个要点：

1. 模块 ID 被固化了。不固化 Loader 认不出你是谁啊。
2. dependencies 被加上了。为了性能的考虑，Loader 不用再分析 factory body。
3. factory body 没有任何变化。
4. 打包产物可以被正常语法压缩，包括 factory 的特殊参数 require / exports / module。为什么呢，感兴趣的人可以自己思考下。


之前在 spec 上并没有这方面的描述，后来忘记哪一次再看的时候，发现多了好多应用场景的描述，其中 [Transporting more than one module at a time](https://github.com/amdjs/amdjs-api/blob/master/AMD.md#transporting-more-than-one-module-at-a-time-) 就有这种场景的描述：

> Multiple define calls can be made within a single script. The order of the define calls SHOULD NOT be significant. Earlier module definitions may specify dependencies that are defined later in the same script. It is the responsibility of the module loader to defer loading unresolved dependencies until the entire script is loaded to prevent unnecessary requests.

虽然很多人英文都很好，但我还是想啰嗦下里面的重点，大家感受一下：

1. 多个 define 可以放在一个 script 中。
2. 这些 define 的顺序应该没有任何影响。
3. 如果定义在前面的模块依赖了后面的模块，Loader 不能没分析到后面的模块，就脑残地发起请求。

### 插件

`AMD` 设计了插件机制，主要用于资源的加载，并且用了一个专门的 spec 描述这个插件机制：[Loader Plugin](https://github.com/amdjs/amdjs-api/blob/master/LoaderPlugins.md)。

一个 Loader Plugin Resource 的形式是， **!** 分割两个部分，前面部分是插件模块的 ID，后面部分是资源 ID：

```
[Plugin Module ID]![resource ID]
```

`AMD` 插件机制的巧妙之处在于：

1. 资源通过一个正常的 `AMD` 模块加载，编写插件模块就是编写一个 `AMD` 模块。
2. resource ID 是会被 normalize 的，模块就可以通过 Relative resource ID 来 require 自己所需要的资源。

#### resource 加载

对于Web应用来说，第一反应能想到的资源主要有：

- CSS
- 图片
- 文本
- 页面模板(一种特殊的文本)
- 多媒体内容
- 任何需要被包装，以便于反复使用的东西。页面模板其实属于这种的特例

大多数资源的加载需要通过网络，所以可能是异步的。 `AMD` 要求 Plugin 模块必须包含一个 load 方法。我们通过这个方法的签名，看看资源加载对异步的支持：

```
load: function (resourceId, require, load, config)
```

Loader 通过调用 Plugin 模块的load方法，发起对资源的加载。调用的时候会传给你几个东西：

1. resourceId: 这是 normalize 后的 ID。所以实现的时候，load 方法就只管根据 resource ID 去加载资源就好了。
2. require: 一个 local require，当你要计算加载资源地址的时候，可以调用 require.toUrl 方法。require.config 后，配置信息没有通过 Loader 的任何方法暴露给插件，通过配置查找模块 URL 的过程被封装成了 require.toUrl 方法对外暴露。
3. load: 最简单的异步处理方法就是 callback，load 就是这个 callback 函数。在异步资源返回后，用资源的值去调用 load 函数，这个值就会被 Loader 缓存下来，同样的 resource 下次使用会直接返回这个值，不会再走 Plugin 模块的 load。
4. config: 对当前资源的配置。用户可以在 require.config 的 config 项中配置模块的独有信息。

通过一个简单的加载 CSS 的 Plugin 模块，可以更容易明白 load 方法的作用。

```javascript
define('css', {
    load: function (resourceId, req, load) {
        var link = document.createElement('link');
        link.setAttribute('rel', 'stylesheet');
        link.setAttribute('type', 'text/css');
        link.setAttribute('href', req.toUrl(resourceId));

        var parent = document.getElementsByTagName('head')[0]
            || document.body;
        parent.appendChild(link);

        parent = null;
        link = null;

        load(true);
    }
});
```

题外话，`AMD` 的设计中并没有提供模块或资源卸载的 API，所以在应用程序设计之初就要考虑并规避可能产生的问题。比如加载的 CSS 资源是没有办法通过 `AMD` 的途径卸载的，所以需要避免不同的 CSS 之间通过前后关系进行优先级管理。


#### resource ID normalize

如果 resource ID 是 path style 的，resource ID 会自动按照默认方式进行 normalize，Plugin 模块的开发者不需要做任何事情。

你可以编写 Plugin 模块的 normailze 方法，在如下场景：

1. resource ID 不是 path style
2. 希望 resource 被缓存的粒度不是 path。但是 Loader 缓存 resource 是根据 normalize 后的 ID 决定的，normalize 过程在 load 之前。所以你不能根据资源内容自定义缓存粒度。



### 本篇结束

想着尽量分析详细些，没想写了这么多，有点写不下去了。自己看了一遍，基本上想说的关键点都已经说到了。还有一些不是很核心，但也还算有用的东西，就不细说了，感兴趣的自己看吧。主要有：

- map
- shim
- module config
- Loader Plugin 的 fromText

了解 `AMD` 的一些设计点，有助于在应用开发中更合理地设计结构与模块。说白了，用 `AMD` 的主要目的还是为了让应用开发更方便。请期待下一篇 **应用实践**。


