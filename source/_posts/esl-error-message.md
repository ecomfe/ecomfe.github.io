---
title: ESL 中的错误提示信息
date: 2015-12-16
author: errorrik
author_link: http://errorrik.com/
tags:
- AMD
- 模块化
- JavaScript
- ESL
---

![](/blog/esl-error-message/error.png)

[AMD](https://github.com/amdjs/amdjs-api) 为浏览器端开发带来了诸多好处：模块声明、异步加载、依赖管理、bundle等，已经成为很多团队应用开发的标配。在正确的代码下，一切看起来都还好，但是当问题出现时，追查过程通常会令人头疼，此时Loader的提示信息对错误的追查非常关键。[ESL](https://github.com/ecomfe/esl) 是熊厂应用得比较多的 AMD Loader，本篇blog试图对 [ESL](https://github.com/ecomfe/esl) 的错误场景与信息提示策略，以及如何追查错误，进行简单的介绍。主要涉及以下3个方面：

1. 模块结构问题
2. 初始化运行中的错误
3. 疏忽导致在模块定义内使用了global require

首先，建议大家在开发中追查错误时，使用 chrome 浏览器的开发者工具。因为它对 re-throw 错误的 stack 跟踪与查看支持得比较好。

<!-- more -->

### 模块结构问题

和 RequireJS 一样，ESL 支持通过 `waitSeconds` 参数，指定超时时间。当到达指定时间后，如果模块还没加载完成，将抛出 `MODULE_TIMEOUT` 错误。这种错误通常用于追查`模块结构问题`。


#### 模块缺失

`模块缺失`是常见的`模块结构问题`场景。下面的示例代码中可见，`a` 模块和 `c` 模块是缺失的。

```javascript
// main.js
define(function (require) {
    var a = require('./a');
    var b = require('./b');
});

// a.js
// 无此文件

// b.js
define(function (require) {
    var c = require('./c');
    var d = require('./d');
});

// c.js
// 无此文件

// d.js
define({});
```

![Miss Modules](/blog/esl-error-message/miss-error.png)

可以看到，上面的提示信息分成两个部分：

- `Hang` - 模块是存在的，但是由于依赖模块未能加载、或是循环依赖等原因，导致无法进行初始化。
- `Miss` - 模块缺失，可能由于网络原因未加载完成，或者依赖模块名写错等原因导致。

如果提示信息里包含 `Miss` 项，一定要优先解决模块缺失问题。


#### 循环依赖

ESL 对循环依赖的支持要优于 RequireJS，任何活的循环依赖场景都能支持，但是应用开发者有可能写出死循环依赖场景。比如下面的示例代码，所有模块之间的依赖都是装载时依赖，并且形成了环。

```javascript
// main.js
define(function (require) {
    var a = require('./a');
});

// a.js
define(function (require) {
    var b = require('./b');

    return {
        getB: function () {
            return b;
        }
    };
});

// b.js
define(function (require) {
    var c = require('./c');

    return {
        getC: function () {
            return c;
        }
    };
});

// c.js
define(function (require) {
    var a = require('./a');

    return {
        getA: function () {
            return a;
        }
    };
});
```

循环依赖的场景下，我们会看到两条错误：

1. 第一条是 `MODULE_MISS` ，意思是循环依赖的运行是在哪里中断的。
2. 第二条是 `MODULE_TIMEOUT`，特点是：`Miss` 中没有任何模块，依赖环中所有模块都出线在`Hang`中。

![Circular Dependencies](/blog/esl-error-message/circular-deps.png)

点击 `MODULE_MISS` 错误旁边的三角，找到 stack 中的 **非esl.js** 项，可以定位到循环依赖的 `require` 位置。提醒一下，如果在错误抛出后才打开开发者工具，是不会出现展开 stack 的三角箭头的，此时可以刷新下页面，让错误重新来一遍。

![Circular Dependencies Source](/blog/esl-error-message/circular-deps-source.png)

循环依赖的解决办法是：

1. 从 `Hang` 提示的模块列表，从后往前追查，理出整个循环依赖环的结构。
2. 将环中任意一条依赖边，从装载时依赖改成运行时依赖。

```javascript
// main.js
define(function (require) {
    var a = require('./a');
});

// a.js
define(function (require) {
    var b = require('./b');

    return {
        getB: function () {
            return b;
        }
    };
});

// b.js
define(function (require) {
    var c = require('./c');

    return {
        getC: function () {
            return c;
        }
    };
});

// c.js
define(function (require) {
    return {
        getA: function () {
            var a = require('./a'); // 改了这里
            return a;
        }
    };
});
```

### 初始化运行中的错误

有时候，我们的模块结构并没有问题，但写代码基本不可能一次写就完全正确。当 factory 运行出错时，模块初始化也无法完成。如果我们不使用 AMD，开发者工具将直接报错，并且定位准确。但由于要支持 `MODULE_TIMEOUT`，ESL 需要在一个 try 里运行初始化的 factory，做一些 `MODULE_TIMEOUT` 错误将用到的记录，然后重新抛出 error。于是，开发者工具对错误的显示就变了。下面通过一个例子，讲解这种场景下怎么追查。

```javascript
// main.js
define(function (require) {
    var a = require('./a');
    var b = require('./b');
});

// a.js
define(function (require) {
    alert(noExists);
});

// b.js
define(function () {});
```

可以看到，上面的例子中，a.js 用到了一个未定义的变量，运行到这里时会出错。但我们看下面错误提示信息，对应的是 esl.js 的第一行，并不准确。

![Runtime Error](/blog/esl-error-message/runtime-error.png)

这是由于 ESL 捕获了这个错误，然后重新抛出导致的。其实，这个错误的完整 stack 信息还在。请点击错误左边的小三角：

![Runtime Error Stack](/blog/esl-error-message/runtime-error-stack.png)

在这个 stack 信息中，有一些是 esl.js 的，这些可以忽略。点击 **非esl.js** 项，就能定位到错误的相应代码位置了。

![Runtime Error Source](/blog/esl-error-message/runtime-error-source.png)

我听到过好多同学抱怨，说错误没法追查，都被吞掉了。其实，只要你试试点击那个小三角，一切如常。再提醒一下，如果在错误抛出后才打开开发者工具，是不会出现展开 stack 的三角箭头的，此时可以刷新下页面，让错误重新来一遍。


### 疏忽导致在模块定义内使用了global require

```javascript
define(
    function () { // 这里忘写require了
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

ESL针对这种场景，会抛出一种 `REQUIRE_FATAL` 错误。根据惯例，旁边的小三角也是能点开查看 stack 的。

![REQUIRE_FATAL](/blog/esl-error-message/require-fatal.png)

解决办法很简单，去源码中 factory 的参数部分加上 `require` 就好了。


### 总结

掌握以下几点，使用 AMD 和 [ESL](https://github.com/ecomfe/esl) 开发应用就基本很方便，无障碍了。

1. 使用 chrome 开发者工具。
2. 遇到错误时，通过小三角点开查看 stack 信息，通过点击 `非esl.js` 项追查到源码的相应位置。
3. 开发时使用 `waitSeconds` 配置参数。先解决 `Miss` 部分的问题，`Hang` 部分的模块从后往前追查。
4. 注意 `REQUIRE_FATAL`。



