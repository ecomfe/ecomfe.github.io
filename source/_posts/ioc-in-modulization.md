---
title: IoC 在前端模块化中的实践应用
date: 2015-7-10
author: exodia
author_link: http://weibo.com/exodia17
tags:
- IoC
- DI
- 依赖注入
- 模块化
---

### 前端模块化背景

在大部分单页式应用中，前端代码都是以 MV* 的结构来组织的，好处自然不必多说。在开始一个项目时，我们往往会将项目的业务功能纵向切分成多个子业务功能，
以模块的形式分配给团队各个开发人员，以达到最大的并行开发。随着业务的发展，新的项目也越来越多，我们会发现很多新的项目和现有的项目是有不少功能交集的。

从业务角度来看，一个项目就是由各个模块组合而成：A 项目由 m1, m2, m3 组合而成， B 项目则可能由 m1, m3, m4 组合而成。

在业务上将各个功能拆分明确后，很明显的 m1, m3 两个功能在 A 项目都是存在的，从工程角度来说，开发 B 项目的时候如果能够直接将A项目已经开发完毕的 m1, m3 直接复用，
那么必然是能够带来很明显的人力节约。 

接下来就是从技术上去实现功能的复用，对于后端来说，通常的做法是服务化接口，而对于前端来说，我们目前的方案正是前端模块化：将功能打包为模块，发布至内部中央仓库，
使用方通过自己的方式（如：npm, bower, link[import], 百度的 edp, fis 等）导入模块包使用。

按照前端模块化的思路，开发新项目时，开发人员的工作从原来的开发所有功能变为：接入已有的功能模块，开发不存在的功能模块。

### 前端模块化中遇到的技术障碍

>唯一不变的就是变化 -- by 马云
 
这句话同样适用于技术领域，如果一个功能模块可以无缝引入，而无需做任何适配，那这个世界就完美了，让我们先看看在实际的推进过程中遇到的场景：

 - 新项目的部分业务功能和现有的模块确实是一致的，但产品经理希望在视图层面上针对新项目的用户群做大幅度调整。
 
 - 部分业务功能在视觉层面上一致，但后端还未形成服务化，在数据源上需要请求至新项目的服务端。
 
 - ...

在前端 MVC 的架构中，一个业务模块就是 model + controller + view 的打包组合，映射到上述两个场景则是：

- 现有 MVC 模块中的 view 和 controller 部分，新项目有自己的定制化实现

- 现有 MVC 模块中的 model 部分，新项目有自己的请求源

结合以上实际的场景，我们认为对于一个可复用的前端业务模块，至少要满足以下两点：

1. 独立可运行，有自己的一套默认的实现

2. 可满足扩展的需求，如 MVC 中各层次中的定制和扩展

对于第一点比较容易解决，对于第二点则是我们面临的主要挑战，举个简单的例子来说明，
假设我们要开发一个 A 项目下的列表页面，按照 MVC 的写法，骨架代码大概如下：

```javascript

// A/ListModel.js
define(
    function (require) {
        function ListModel() {
            this.store = {};
        }

        ListModel.prototype.load = function () {
            this.set('items', [1, 2, 3, 4, 5]);
        };

        ListModel.prototype.set = function (key, value) {
            this.store[key] = value;
        };

        ListModel.prototype.get = function (key) {
            return this.store[key];
        };

        return ListModel;
    }
);

// A/ListView.js
define(
    function (require) {
        function ListView() {}

        ListView.prototype.render = function () {
            document.body.innerHTML = this.model.get('items');
        };

        return ListView;
    }
);

// A/ListController.js
define(
    function (require) {
        var Model = require('./ListModel');
        var View = require('./ListView');

        function ListController() {
            this.model = new Model();
            this.view = new View();
            this.view.model = this.model;
        }

        ListController.prototype.enter = function () {
            this.model.load();
            this.view.render();
        };

        return ListController;
    }
);

// A/main.js
define(
    function (require) {
        var List = require('ListController');
        var list = new List();
        list.enter();
    }
);
```

运行结果就是在页面中展示列表数据。

过了一段时间，另一个新项目 B 来了，B 项目也要开发一个列表页，但交互展示和A项目的列表页是一致的，不同之处在于数据源要来自B项目的后端。

如何能够让B项目不需要话费太多的经历就能够复用 A 的列表模块，但又满足数据源变更需求？

### 继承覆写方案

针对上述代码，我们将数据源变化的需求映射到A列表模块的代码中，发现 ListController.js, ListView.js 好像都不用变，
仅仅需要覆写 ListModel.js 的 load 方法，使得其加载的数据来自B项目就解决了数据源变化的需求。

于是我们在B项目中新建一个 ListModel，继承自 A/ListModel，重写 load 方法：

```javascript
// B/ListModel.js
define(
    function (require) {

        var AListModel = require('A/ListModel');

        function ListModel() {
            AListModel.apply(this, arguments);
        }

        // 数据源设置为了 B 的数据 
        ListModel.prototype.load = function () {
            this.set('items', [5, 4, 3, 2, 1]);
        };

        return ListModel;
    }
);
```

我们在 B/ListModel.js中重写了 load 方法，接下来就是怎么去重用A/ListController, A/ListView, 
继续看下 A 的代码，我们发现 A/ListController中有这两行代码：

```javascript
var Model = require('./ListModel');
var View = require('./ListView');
```

这两行代码导致了A/ListController的直接依赖自身的两个 model 和 view，
意味着如果B 项目要接入自己的 ListModel，必须修改 A 模块的源代码，这违背了软件设计的**对扩展开发，对修改关闭**的设计原则。

上述问题的本质在于，**A 项目的代码针对了具体实现编程，而非接口。**
A/ListController 直接依赖了具体实现（A/ListModel, A/ListView），这使得其复用性大大降低。

### IoC 依赖替换方案

IoC(Inversion of Control) 即控制反转，将依赖的管理交由外部控制。 IoC在服务端的开发中很常见，而在前端的应用范围暂时还不是太广，
相信很多前端同学是从angular接触到 IoC 和 DI（依赖注入）的概念。

接下来我们利用IoC的理念重构下 A 项目的代码，将依赖外置，由外部传入依赖实例，也就是具体实现，不同的项目有不同的实现，但都遵守同一个接口（js 中则是隐式接口）：

```javascript
// A/ListController.js
define(
    function (require) {

        function ListController(model, view) {
            this.model = model;
            this.view = view;
            this.view.model = this.model;
        }

        ListController.prototype.enter = function () {
            this.model.load();
            this.view.render();
        };

        return ListController;
    }
);

// A/main.js
define(
    function (require) {
        var List = require('ListController');
        var Model = require('ListModel');
        var View = require('ListView');

        var model = new Model();
        var view = new View();
        var list = new List(model, view);
        
        list.enter();
    }
);
```

上面的代码中将 A/ListController 对具体 model 和 view 的依赖都外置了，由外部（这里是 A/main.js）创建好传入构造函数，
A/ListController 对 model 和 view 如何构造，是怎么实现的都不需要关心，只要知道 model 实现了 load 接口，view 实现了 render 接口就行了。
好了，到这一步基本解决了对具体依赖的解耦，接下来我们看看 B 项目的代码怎么写：

```javascript
/ B/ListModel.js
define(
    function (require) {

        var AListModel = require('A/ListModel');

        function ListModel() {
            AListModel.apply(this, arguments);
        }

        // 继承 A/ListModel
        ListModel.prototype = new AListModel();
        
        // 数据源设置为了 B 的数据 
        ListModel.prototype.load = function () {
            this.set('items', [5, 4, 3, 2, 1]);
        };
        
        return ListModel;
    }
);

// B/main.js
define(
    function (require) {
        // 重用 A项目的Controller 和 View
        var List = require('A/ListController');
        var View = require('A/ListView');

        // 引入自己的定制 Model
        var Model = require('ListModel');

        var model = new Model();
        var view = new View();
        // 由构造函数将 model 和 view 两个依赖注入给控制器
        var list = new List(model, view);

        list.enter();
    }
);
```

我们看到，通过依赖注入，B项目的列表开发工作量仅仅是简单的重写 A.ListMdel#load，以及在入口文件处创建好依赖即可。
控制和视图的开发工作量都节约下来了，这无疑是巨大的工作量节约。

### IoC 容器 - 依赖注入的抽象

上面的代码中，我们将模块的依赖在 main.js 中手动创建好，然后调用模块的构造函数传入，
这个过程就是依赖反转，依赖的创建转移给了外部 main.js，模块仅仅做获取依赖的工作。
我们发现这一过程也是冗余重复的，当需要创建的依赖多了后，main.js 的代码也要随之冗余膨胀，
于是有了 IoC 容器来做这一过程：**项目声明依赖配置，IoC 容器根据配置做好相关的依赖创建工作即可**。

在 angular 中，依赖声明是在构造函数中或者 $inject 中做的，在构造函数中 angular 根据命名参数去查找依赖声明，并做好依赖的创建工作。

但 angular 的依赖注入存在以下问题：

1. 和 angular 紧密整合，移植成本较大。

2. 依赖注入方式单一，仅有构造函数注入。要是一个模块依赖很多的话，构造函数中的依赖声明得写脱。
既然我们可以通过构造函数传入依赖，那完全也可以提供另一个函数给 IoC 容器，让 IoC 容器调用这个函数传入依赖，这个注入方式称之为接口注入；
如果函数命名风格为 setter(setXXX)，又可以称之为 setter注入；
再加上 js 语言的动态性，可以动态的给对象赋值新属性，于是我们还可以直接赋值注入：instance.dependency = xxxx， 这个我们暂时称之为属性注入。

3. 未能和模块加载器结合。 在浏览器环境中，很多场景都是异步的过程，我们需要的依赖模块并不是一开始就加载好的，
或许我们在创建的时候才会去加载依赖模块，再进行依赖创建，而 angular 的 IoC 容器则没法做到这点。

针对 angular 依赖注入的这些问题，我们自己开发了一套 IoC 框架 [uioc](https://github.com/ecomfe/uioc) 来解决模块化对依赖注入抽象的需求，主要特点如下：

1. 独立的库，不和任何框架整合，随便用。

2. 配置上支持 AMD/CMD 规范的异步 Loader (NodeJS 自不必说，同步 loader 更简单了)。

3. 丰富的 IoC 注入方式：setter 注入，构造函数注入，属性注入。

4. 简化配置的方案：根据 setter 自动注入，配置导入。

5. 依赖作用域的管理：单例，多例，静态。

6. 支持 constructor 和 factory 两种依赖构造方式。

将上面的B项目用 uioc 改造后如下：

```javascript
// B/config.js
define(
    {
        // key 为提供给 ioc 的组件id，值为相关配置
        list: {
            // 组件所在的模块id，这里复用了 A的 ListController
            module: 'A/ListController',
            // 构造函数注入，$ref声明依赖，两个依赖id分别为 model 和 view
            args: [
                {$ref: 'model'}, {$ref: 'view'}
            ]
        },

        // 这里使用了B定制的 ListModel
        model: {module: 'B/ListModel'},
        view: {module: 'A/ListView'}
    }
);


// B/ListModel.js
define(
    function (require) {

        var AListModel = require('A/ListModel');

        function ListModel() {
            AListModel.apply(this, arguments);
        }

        // 继承 A/ListModel
        ListModel.prototype = new AListModel();

        // 数据源设置为了 B 的数据 
        ListModel.prototype.load = function () {
            this.set('items', [5, 4, 3, 2, 1]);
        };

        return ListModel;
    }
);

// B/main.js
define(
    function (require) {
        var IoC = require('uioc');
        var config = require('config');

        // 实例化ioc容器，传入配置注册各个组件
        var ioc = IoC(config);

        // 获取 list 组件后，调用对应的 enter 方法
        ioc.getComponent('list', function (list) {
            list.enter();
        });
    }
);

```

当有新的项目 C 对 view 层上有定制需求，那么仅需继承或者重写一个 ListView，在配置中将 view 定制为 C/ListView 即可完成新一轮的开发，变的只是配置和定制的部分。

### 总结

真正的项目复杂性远不止本文的示例代码这么简单，还包括了数据源对象，模板，对 dom 封装的控件等其他模块。

我们系统原来的 MVC 架构，开发一个业务模块将 M, V,C 等各个依赖紧紧的耦合在了一起。
随着业务的发展，项目也越来越多，我们发现这些项目具有很多共同点，仅仅是局部不同，
于是我们通过控制反转将业务模块中各个容易变化的部件抽象解耦，不同的项目去实现自己的定制需求，而通用代码不要重复开发，
大概的架构演变如下图（Action 对应代码中的 Controller）：

![mvc](/blog/ioc-in-modulizaton/ioc.png)

基本思路都躲不过：**封装变化的，固化不变的。但难点又在于区分哪些是变化的，哪些又是不变的**。
