---
title: 使用ES6进行开发的思考
date: 2015-5-21
author: otakustay
author_link: http://otakustay.com
tags:
- JavaScript
- ES6
- ESNext
---

ECMAScript6已经于近日进入了RC阶段，而早在其处于社区讨论时，我就开始一直在尝试使用ES6进行开发的方案。在[Babel](https://babeljs.io)推出后，基于ES6的开发也有了具体可执行的解决方案，无论是Build还是Debug都能得到很好的支持。

而在有了充足的环境、工具之后，我们面临的是对ES6众多新特性的选择和分析，以便选取一个最佳的子集，让我们可以享受ES6带来的便利（减少代码量、提高可读性等）的同时，也可以顺利运行于当前以ES3-ES5为主的浏览器环境中。

经过分析后，本文试图对ES6各个特性得出是否适合应用的初步结论，并一一解释其使用场景。ES6的特性列表选自[es6features](https://github.com/lukehoban/es6features)。


- ★★★ 推荐使用 
- ★★ 有考虑地使用 
- ★ 慎重地使用 
- ☆ 不使用


特性                                             推荐程度       
---------------------------------------------   --------------
arrows                                          ★★★
classes                                         ★★★
enhanced object literals                        ★★★
template strings                                ★★★
destructuring                                   ★★
default + rest + spread                         ★★★
let + const                                     ★★★
iterators + for..of                             ★★
generators                                      ★
unicode                                         ☆
modules                                         ★★
module loaders                                  ☆
map + set + weakmap + weakset                   ★★
proxies                                         ☆
symbols                                         ★
subclassable built-ins                          ☆
promises                                        ★★★
math + number + string + array + object APIs    ★★★
binary and octal literals                       ★
reflect api                                     ☆
tail calls                                      ★★
---------------------------------------------   --------------


接下来我们以上特性挨个进行介绍。需要关注一点：如果你不想使用shim库（如Babel的`browser-polyfill.js`和`generatorsRuntime.js`）或者想使用尽可能少的helper（Babel的`externalHelpers`配置），那么需要按你的需求进一步缩减可使用的ES6特性，如`Map`、`Set`这些就不应该使用。

<!-- more -->

## 语法增强类

### Arrow function

[Arrow functions](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/Arrow_functions)是ES6在语法上提供的一个很好的特性，其特点有：

- 语法更为简洁了。
- 文法上的固定`this`对象。

我们**鼓励在可用的场景下使用Arrow functions**，并以此代替原有的`function`关键字。

当然Arrow functions并不是全能的，在一些特别的场景下并不十分适用，最为典型的是Arrow functions无法提供函数名称，因此做递归并不方便。虽然可以使用[Y combinator](http://en.wikipedia.org/wiki/Y_combinator)来实现函数式的递归，但其可读性会有比较大的损失。

配合后文会提到的对象字面量增强，现在我们定义方法/函数会有多种方式，建议执行以下规范：

- 所有的Arrow functions的参数均使用括号`()`包裹，即便只有一个参数：

        // Good
        let foo = (x) => x + 1;

        // Bad
        let foo = x => x + 1;

- 定义函数尽量使用Arrow functions，而不是`function`关键字：

        // Good
        let foo = () => {
            // code
        };

        // Bad
        function foo() {
            // code
        }

        // Bad
        let foo = function () {
            // code
        }

    除非当前场景不合适使用Arrow functions，如函数表达式需要自递归、需要运行时可变的`this`对象等。

- 对于对象、类中的方法，使用增强的对象字面量：

        // Good
        let foo = {
            bar() {
                // code
            }
        };

        // Bad
        let foo = {
            bar: () => {
                // code
            }
        };

        // Bad
        let foo = {
            bar: function () {
                // code
            }
        };

### 增强的对象字面量

对象字面量的增强主要体现在3个方面：

#### 可在对象中直接定义方法

```javascript
let foo = {
    bar() {
        // code
    }
};
```

我们**推荐使用**这种方式定义方法。

#### 可使用通过计算得出的键值

```javascript
let MY_KEY = 'bar';
let foo = {
    [MY_KEY + 'Hash']: 123
};
```

我们**推荐在需要的时候使用计算得出的键值**，以便在一个语句中完成整个对象的声明。

#### 与当前Scope中同名变量的简写

```javascript
let bar = 'bar';
let foo = {
    bar // 相当于bar: bar
};
```

我们**并不推荐**这样的用法，这对可读性并没有什么帮助。

### 模板字符串

模板字符串的主要作用有2个：

### 多行字符串

```javascript
let html =
`<div>
    <p>Hello World</p>
</div>`
```

从上面的代码中可以看出，实际使用多行字符串时，对齐是个比较麻烦的事。如果`let html`这一行本身又有缩进，那么会让代码更为难受一些。

因此我们**不推荐使用多行字符串**，必要时还是可以使用数组和`join('')`配合，而生成HTML的场景我们应该尽量使用模板引擎。

#### 字符串变量替换

```javascript
let message = `Hello ${name}, it's ${time} now`;
```

这是一个非常方便的功能，我们**鼓励使用**。但需要注意这些变量并不会被HTML转义，所以在需要HTML转义的场景，还是乖乖使用模板引擎或者其它的模板函数。

### 解构

解构（原谅我没什么好的翻译）是个比较复杂的语法，比如：

```javascript
let [foo, bar] = [1, 2];
let {id, name, children} = getTreeRoot();
```

还可以有更复杂的，具体可以参考[MDN的文档](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Destructuring_assignment)。

对于这样一个复杂且多变的语法，我们要有选择地使用，建议遵循以下原则：

- 不要一次通过解构定义过多的变量，建议不要超过5个。
- 谨慎在解构中使用“剩余”功能，即`let [foo, bar, ...rest] = getValue()`这种方式。
- 不要在对象解构中使用过深层级，建议不要超过2层。

### 函数参数增强

ES6为函数参数提供了默认值、剩余参数等功能，同时在调用函数时允许将数组展开为参数，如：

```javascript
var foo = (x = 1) => x + 1;
foo(); // 2

var extend = (source, ...args) => {
    for (let target in args) {
        for (let name in Object.keys(target) {
            if (!source.hasOwnProperty(name) {
                source[name] = target[name];
            }
        }
    }
};

var extensions = [
    {name: 'Zhang'},
    {age: 17},
    {work: 'hard'}
];
extend({}, ...extensions);
```

我们**鼓励使用这些特性让函数的声明和调用变得更为简洁**，但有一些细节需要注意：

- 在使用默认参数时，如果参数默认值是固定且不会修改的，建议使用一个常量来作为默认值，避免每一次生成的开销。
- 不要对`arguments`对象使用展开运算，这不是一个数组。

## 关键字类

### let和const

这是2个用来定义变量的关键字，众所周知的，`let`表示块作用域的变量，而`const`表示常量。

需要注意的是，`const`仅表示这个变量不能被再将赋值，但并不表示变量是对象、数组时其内容不能改变。如果需要一个不能改变内容的对象、数组，使用`Object.freeze`方法定义一个真正的常量：

```javascript
const DEFAULT_OPTIONS = Object.freeze({id: 0, name: 'unknown'});
```

不过如果你在程序中能控制不修改对象的话，这并不具备什么意义，`Object.freeze`是否会引起执行引擎的进一步优化也尚未得到证实。

我们**推荐使用`let`全面替代`var`**。同时**建议仅在逻辑上是常量的情况下使用`const`**，不要任何不会被二次赋值的场景均使用`const`。

### 迭代器和for..of

迭代器是个好东西，至少我们可以很简单地遍历数组了：

```javascript
for (let item in array) {
    // code
}
```

但是迭代器本身存在一些细微的缺点：

- 性能稍微差了一些，对于数组来说大致与`Array.prototype.forEach`相当，比不过原生的`for`循环。
- 不能在循环体中得到索引`i`的值，因此如果需要索引则只能用原生的`for`循环。
- 判断一个对象是否可迭代比较烦人，没有原生方法提供，需要自行使用`typeof o[Symbol.iterator] === 'function'`判断。

对于迭代器，我们**鼓励使用并代替原生`for`循环**，且推荐关注以下原则：

- 对于仅一个语句的循环操作，建议使用`forEach`方法，配合Arrow functions可非常简单地在一行写下循环逻辑。
- 对于多个语句的循环操作，建议使用`for..of`循环。
- 对于循环的场景，需要注意非数组但可迭代的对象，如`Map`和`Set`等，因此除`arguments`这类对象外，均建议直接判断是否可迭代，而不是`length`属性。

### 生成器

生成器（Generators）也是一个比较复杂的功能，具体可以参考[MDN的文档](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/function*)。

对于生成器，我的建议是**非常谨慎地使用**，理由如下：

- 生成器不是用来写异步的，虽然他确实有这样一个效果，但这仅仅是一种Hack。异步在未来一定是属于`async`和`await`这两个关键字的，但太多人眼里生成器就是写异步用的，这会导致滥用。
- 生成器经过Babel转换后生成的代码较多，同时还需要`generatorsRuntime`库的支持，成本较高。
- 我们实际写应用的大部分场景下暂时用不到。

生成器最典型的应用可以参考[C#的LINQ](https://msdn.microsoft.com/en-us/library/bb397926.aspx)获取一些经验，将对一个数组的多次操作合并为一个循环是其最大的贡献。

### 模块和模块加载器

ES6终于在语言层面上定义了模块的语法，但这并不代表我们现在可以使用ES6的模块，因为实际在ES6定稿的时候，它把模块加载器的规范给移除了。因此我们现在有的仅仅是一个模块的`import`和`export`语法，但具体如“模块名如何对应到URL”、“如何异步/同步加载模块”、“如何按需加载模块”等这些均没有明确的定义。

因此，在模块这一块，我们的建议是**使用标准语法书写模块，但使用AMD作为运行时模块解决方案**，其特点有：

- 保持使用`import`和`export`进行模块的引入和定义，可以安全地使用命名`export`和默认`export`。
- 在使用Babel转换时，配置`modules: 'amd'`转换为AMD的模块定义。
- 假定模块的URL解析是AMD的标准，`import`对应的模块名均以AMD标准书写。
- 不要依赖`SystemJS`这样的ES6模块加载器。

这虽然很可能导致真正模块加载器规范定型后，我们的`import`模块路径是不规范的。但出于ES6的模块不配合HTTP/2简直没法完的考虑，AMD一定很长一段时间内持续存在，我们的应用基本上都是等不到HTTP/2实际可用的日子的，所以无需担心。

## 类型增强类

### Unicode支持

这个东西基本没什么影响，我们很少遇到这些情况且已经习惯了这些情况，所以可以认为这个特性不存在而继续开发。

### Map和Set

两个非常有用的类型，但对不少开发者来说，会困惑于其跟普通对象的区别，毕竟我们已经拿普通对象当`Map`和`Set`玩了这么多年了，也很少自己写一个类型出来。

对于此，我们的建议是：

- 当你的元素或者键值有可能不是字符串时，无条件地使用`Map`和`Set`。
- 有移除操作的需求时，使用`Map`和`Set`。
- 当仅需要一个不可重复的集合时，使用`Set`优先于普通对象，而不要使用`{foo: true}`这样的对象。
- 当需要遍历功能时，使用`Map`和`Set`，因为其可以简单地使用`for..of`进行遍历。

因此，事实上仅有一种情况我们会使用普通的对象，即使用普通对象来表达一个仅有增量`Map`，且这个`Map`的键值是字符串。

另外，`WeakMap`和`WeakSet`是没有办法模拟实现的，因此**不要使用**。

### Proxy

这不是一个可以模拟实现的功能，没法用，因此**不要使用Proxy**。

### Symbol

`Symbol`最简单的解释是“可用于键值的对象”，最大的用处可能就是用来定义一些私有属性了。

我们建议**谨慎使用`Symbol`**，如果你使用它来定义私有属性，那么请保持整个项目内是一致的，不要混用`Symbol`和闭包定义私有属性等手段。

### 可继承的内置类型

按照ES6的规范，内置类型如`Array`、`Function`、`Date`等都是可以继承且没有什么坑的。但是我们的代码要跑在ES3-5的环境下，显然这一特性是不能享受的。

### Promise

这个真没什么好说的，即便不是ES6，我们也已经满地用着`Promise`了。

建议**所有异步均使用Promise实现**，以便在未来享受`async`和`await`关键字带来的便携性。

另外，虽然Babel可以转换`async`和`await`的代码，但**不建议使用**，因为转换出来的代码比较繁琐，且依赖于`generatorsRuntime`。

### 各内置类型的方法增强

如`Array.from`、`String.prototype.repeat`等，这些方法都可以通过shim库支持，因此放心使用即可。

### 二进制和八进制数字字面量

这个特性基本上是留给算法一族用的，因此我们的建议是**除非数字本身在二/八进制下才有含义，否则不要使用**。

### 反射API

`Reflect`对象是ES6提供的反射对象，但其实没有什么方法是必要的。

其中的`delete(name)`和`has(name)`方法相当于`delete`和`in`运算符，而`defineProperty`等在`Object`上本身就有一套了，因此**不建议使用该对象**。

### 尾递归

当作不存在就好了……
