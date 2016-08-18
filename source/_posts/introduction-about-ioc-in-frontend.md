---
title: 前端 IoC 理念入门
date: 2016-08-19
author: exodia
author_link: http://weibo.com/exodia17
tags:
- IoC
- DI
---

## 背景

近几年，前端应用（WebApp）正朝着大规模方向发展，在这个过程中我们会对项目拆解成多个模块/组件来组合使用，以此提高我们代码的复用性，最终提高研发效率。

在编写一个复杂组件的时候，总会依赖其他组件来协同完成某个逻辑功能。组件越复杂，依赖越多，可复用性就越差，我们可以借助软件工程中优秀的编程理念来提高复杂组件的可复用性，以下将详述其中之一的依赖倒置理念。

## 什么是 IoC

IoC 全称 Inversion of Control，中文术语为依赖倒置（反转），包含两个准则：

1. 高层次的模块不应该依赖于低层次的模块，他们都应该依赖于抽象。

2. 抽象不应该依赖于具体实现，具体实现应该依赖于抽象

其背后的核心思想还是：面向接口编程。

我们用一个例子来说明：我们要实现一个列表 A，能够加载一系列的信息并展示，

于是很自然的我们遵守职责单一功能，将展示和加载两个逻辑拆分成2个类：

<!-- more -->

```javascript
// Loader.js
export default class Loader {
    constructor(url) {
        this.url = url;
    }

    async load() {
        let result = await fetch(this.url);
        return result.text();
    }
}

// List.js
import Loader from './Loader';
export default class List {
    constructor(container) {
        this.container = container;
        this.loader = new Loader('list.json');
    }

    async render() {
        let items = await this.loader.load();
        this.container.textContent = items;
    }
}

// main.js
import List from './List';
let list = new List(document.getElementById('a'));
List.render();
```

列表 A 很快开发完毕，于是你要继续开发下一个列表 B，B 的功能和 A 类似，也是加载数据展示数据，区别在于 B 的数据来源是一个第三方的服务，他们提供一个 js sdk 给你调用能够返回数据信息。很自然的我们想到 A 的展示逻辑是可以复用的，对于数据加载这个逻辑我们重新实现一个 ThirdLoader 来专门加载第三方服务就是了，但回到 List 模块，我们发现在其构造函数中写死了对 Loader 的依赖：this.loader = new Loader(‘/list’);  导致无法对 List 设置第三方数据加载逻辑。这个问题就在于 List 依赖了具体的实现而不是依赖一个 Loader 接口。

IoC 正是解决这一类问题的最佳良药，我们再回顾 IoC 的两条准则，看看如何利用 IoC 理念解决这类问题：

`1. 高层次的模块不应该依赖于低层次的模块，他们都应该依赖于抽象`

上述代码中，列表模块是高层次的模块，Loader  是低层次模块， 高层次的 List 依赖了低层次的 Loader，违背了该准则。好在准则也提供了解决方案：**应该依赖于抽象**。那什么是抽象？ 放在我们编程语言中正是广为周知的接口，放在 JS 语言中，接口则是隐式的。

我们正好实践下该准则：

1. 我们定义一个隐式的接口 ILoader，ILoader 声明了一个 load 方法，该方法签名是返回一个包含请求结果的 Promise。

2. 将 List 模块对 Loader 模块的依赖调整为对 ILoader 接口的依赖：我们在 List 模块中移除对 Loader 模块的依赖(即移除 import 语句)，同时构造函数中增加一个参数，该参数是一个实现了 ILoader 接口的实例。

    ```javascript
    // List.js
    export default class List {
        constructor(container, loader) {
            this.container = container;
            this.loader = loader;
        }
    
        async render() {
            this.container.textContent = await this.loader.load();
        }
    }
    ```

3. 为了完成列表 A 的功能，我们还要改造 main.js，将实现了 ILoader 的 Loader 模块实例化传递给 List 模块：

    ```javascript
    // main.js
    import List from './List';
    import Loader from './Loader';
    let list = new List(document.getElementById('a'), new Loader('list.json'));
    list.render();
    ```

至此，我们完成了对 List 模块的一次改造，List 从对具体实现 Loader 的依赖变成了对抽象接 口 ILoader 的依赖，而 List 模块中对 Loader 模块的导入和实例化过程转移到了 main.js， 这一过程就是我们的依赖倒置，依赖创建的控制权交给了外部(main.js)，而在 main.js 中查找创建依赖并将依赖传递给 List 模块的这一过程我们称之为依赖注入(Denpendency Injection)。

我们再来看看 IoC 的第二个准则：`抽象不应该依赖于具体实现，具体实现应该依赖于抽象`，我们的 ILoader 接口显然不会依赖于任何具体实现，而 Loader 这个具体实现了依赖于 ILoader 接口，完全符合了 IoC 的第二个准则。

原有系统的依赖关系图转变结果如下：

![原有系统的依赖关系图](/blog/introduction-about-ioc-in-frontend/1.jpg)

基于新的依赖架构，List 模块具备了设置不同数据加载逻辑的能力，现在我们可以复用 List 模块再实现列表 B 的 数据加载逻辑并在 main 中组装即可完成列表 B 的功能：

```javascript
// ThirdLoader.js
import {request} from '../third/sdk';
export default class ThirdServiceLoader {
    async load() {
        return request();
    }
}

// main.js
import List from './List';
import Loader from './Loader';
import ThirdLoader from './ThirdLoader';
let listA = new List(document.getElementById('a'), new Loader('list.json'));
listA.render();

let listB = new List(document.getElementById('b'), new ThirdLoader());
listB.render();
```

最终的一个依赖关系图如下：

![最终依赖关系图](/blog/introduction-about-ioc-in-frontend/2.jpg)

至此我们上面演示了应用 IoC 理念对高层模块的一个依赖架构改造，提高了高层模块的可复用性。

### IoC 小结

总结我们最开始遇到的问题：类 A 直接依赖类 B，假如要将类 A 改为依赖类 C，则必须通过修改类 A 的代码来达成。这种场景下，类 A 一般是高层模块，负责复杂的业务逻辑；类 B 和类 C 是低层模块，负责基本的原子操作；假如修改类 A，会给程序带来不必要的风险。

IoC 解决方案：将类 A 修改为依赖接口 I，类 B 和类 C 各自实现接口 I，类 A 通过接口 I 间接与类 B 或者类 C 发生联系，则会大大降低修改类 A 的几率。

## 利用 uioc 框架简化依赖注入过程

在上一节中我们抽象了 List 中的数据加载逻辑，而依赖注入这一过程转移到了应用的入口文件 main.js 中，这也导致了我们需要在 main.js 中手动创建并组装各个依赖，随着项目规模的增加，依赖数量必然也是成规模上升，手动组装模块显然是一件繁琐的事；再加上模块对依赖注入的方式，依赖的创建方式，依赖的实例数量等都有多方面的需求，于是就有了 IoC 框架来帮助我们解决这些问题，简化依赖注入这个过程，最终让业务开发者精力集中在业务逻辑层。

接下来我要安利一下如何利用我们开发的 [uioc](https://github.com/ecomfe/uioc) 框架来实现依赖注入，在这之前先介绍一下 uioc 中的一些术语：

- 组件：是完成一项或一系列功能的集合，对外提供相关功能的接口。

- 注册组件：即声明一个组件如何创建（类，工厂方法），创建时需要什么样的依赖，创建完毕后又需要哪些依赖，组件是单例的还是多例的。

- 获取组件：IoC 容器根据组件的注册信息创建并返回组件的过程。

整个应用在 IoC 中就被看成是一系列组件的组装和获取调用：注册组件 -> 获取组件 -> 调用组件方法完成业务逻辑，基于以上概念我们来着手改造前面的例子：

1. 安装 uioc：```npm install uioc --save```

2. 新建一个 config.js 文件用来存放组件的注册信息

    ```javascript
    // config.js
    import List from './List';
    import Loader from './Loader';
    import ThirdLoader from './ThirdLoader'
    
    export default {
        listA: {
            creator: List,
            args: [document.getElementById('a'), {$ref: 'loader'}]
        },
        listB: {
            creator: List,
            args: [document.getElementById('b'), {$ref: 'thirdLoader'}]
        },
        loader: {
            creator: Loader,
            args: ['list.json']
        },
        thirdLoader: {
            creator: ThirdLoader
        }
    };
    ```

    上面的代码我们声明了4个组件配置：listA, listB, loader, thirdLoader。
    其中组件配置中的 creator 表示创建组件的类，组件 listA, listB 对应的 creator 都是 List，那如何给 listA 和 listB 分别注入不同的 loader 实现呢？这个工作由 args 配置来完成，args 是一个数组，表示要传递给组件构造函数的参数配置。
    
    args 中的第一个元素是一个 dom 节点，作为 List 的容器；第二元素中使用了 ``$ref `` 关键字，其作用是声明该参数是一个组件，``$ref`` 对应的值则是组件名称。
    listA 第二个参数为 loader 组件，listB 则是 thirdLoader。
    
    在获取组件时，uioc 会先创建该关键字声明的组件，接着调用 creator 将 dom 节点和 $ref 对应的组件按其在 args 声明的顺序作为参数传入。

3. 最后我们在 main.js 中实例化一个 IoC 容器并传入组件注册信息，最后通过容器获取组件并渲染页面：

    ```javascript
    // main.js
    import {IoC} from 'uioc';
    import config from './config';
    
    // 实例化 IoC 容器
    let ioc = new IoC(config);
    
    // 获取应用初始化需要的组件
    ioc.getComponent(['listA', 'listB']).then(([listA, listB]) => {
        listA.render();
        listB.render();
    });
    ```

至此我们借助了 uioc 对原应用进行了依赖注入的改造，通过配置化的方式完成了整个应用的组装。

上述示例中完整的代码可以查看：<https://github.com/ecomfe/uioc/tree/develop/examples/simple-es6-module>

事实上 uioc 还提供了更多强大的功能：

1. 结合前端 AMD Loader 的异步组件模块加载
2. 多种注入方式
3. 实例生命周期管理
4. aop 支持
5. 多种依赖类型支持
6. 不同的组件创建方式
7. 插件机制

细节参考：<https://github.com/ecomfe/uioc/wiki/Index>

## 总结

本文首先介绍了如何利用 IoC 理念改造模块，从而提高模块的复用性；最后通过 uioc 框架简化了依赖的创建和注入，来帮助我们更方便的实施 IoC 理念。

关于 uioc 框架，非常欢迎任何人一起与我(d_xinxin@163.com)讨论和吐槽，也可以通过 issue 和 pr 的方式来完善 uioc。 要是觉得不错的话，就顺手赏个 star 呗 ：）

<iframe src="https://ghbtns.com/github-btn.html?user=ecomfe&repo=uioc&type=star&count=true&size=large" frameborder="0" scrolling="0" width="160px" height="30px"></iframe>













