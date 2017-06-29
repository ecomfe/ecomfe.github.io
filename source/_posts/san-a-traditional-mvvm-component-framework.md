---
title: San - 一个传统的MVVM组件框架
date: 2017-6-22
author: errorrik
author_link: http://errorrik.com/
tags:
- MVVM
- San
---

<img src="/blog/san-a-traditional-mvvm-component-framework/logo.svg" height="220">

这一年多来，其实受到过不少质疑，比如“咦，你们又在发明轮子了？”。每当此时我只能嘿嘿嘿一笑，毕竟你做的东西看起来还只是个垃圾而已，而看起来我们有很多成熟的东西可以选了：[Vue](https://vuejs.org/)、[React](https://facebook.github.io/react/)、[Angular](https://angular.io/)、[Polymer](https://www.polymer-project.org/)等等。在今天，我们觉得 [San](https://ecomfe.github.io/san/) 经过了一些项目的验证（踩坑）和进化（填坑），能够出来见人时，我们打算出来说说为啥要造轮子，造的是个啥样的轮子。

根据厚脸皮的惯例，先求Star。接下来是广告，可能你能从广告里得到一点启发。

<iframe src="https://ghbtns.com/github-btn.html?user=ecomfe&repo=san&type=star&count=true" frameborder="0" scrolling="0" width="170px" height="20px"></iframe>


### 为什么要做 San

[MVVM](https://en.wikipedia.org/wiki/Model%E2%80%93view%E2%80%93viewmodel) 并不是什么新鲜事物，在 Web 上的应用我们也远不是先驱。从几年前，我们有些团队在 [Angular](https://angular.io/)1 开始一些实践，也有些团队接触了 [React](https://facebook.github.io/react/)，但是让我印象最深刻的还是 [Vue](https://vuejs.org/)，并不是因为多高深的技术，而是因为真的“好用”。我们在一些要求不那么高（兼容性、性能等）的应用中实践一些流行技术，并享受一些便利。将近2年前，我们对实践过的东西进行了一些总结，有些东西已经比较常识了：

- 组件化
- 声明式视图
- view=f(data)
- 数据到视图的渲染引擎
- 异步渲染
- ......

<!-- more -->

但是由于 IE8- 占有率仍然可观，在 to C 的应用中，我们只能老老实实的 [JQuery](http://jquery.com/)、挨个 DOM 操作。兼容性是横在我们面前最大的问题。随着时间流逝，总有一天兼容性将不再是问题，但你真的要等到几年后所有落后都淘汰吗？任何时候我们都会发现有一些东西将要被淘汰，有一些东西将要来，但如果你站着不动，还不如去当一块叉烧咯。

说白了，不折腾会死的精神让我们开了新坑，初衷仅仅是因为 **兼容性** ，这种看起来不大又可笑的理由。但是它确实绕不开，它也可能会带来其他问题，比如移动端和PC端无法使用相同的组件架构。


### 为什么叫 San

在 2010 年左右，为了应对 SPA 类型的各种业务系统，我们写了个 MVC 的框架叫 ER（Enterprise RIA），看起来是个 2。主席[Justineo](https://www.zhihu.com/people/justineo/answers)说既然新坑要比老坑更先进，那就叫 3 吧。一帮起名困难症患者觉得貌似很有道理，于是就这么定了。

所以 San 不是什么的缩写，就是 3 而已......虽然名字很随意，但是造轮子的过程我们是认真的


### 把 San 做成什么样

既然要自己做了，那我们希望完整的表达我们的想法和原则，不是东拼西凑的追随。


#### 怎样都能用

你想怎样引用一个 Library？

- 直接下下来
- npm install
- CDN

产品开发是什么环境？

- 啥都没，裸的，怎样开发怎样上线
- 有些简单的 bundle 和 compress
- 模块化管理，不过是古老的 AMD
- 主流代表，WebPack + Babel

我们不关心你从哪里来，要到哪里去，我们只想给你提供一个舒适的港湾。这个广告词是不是恶心到大家了...... **怎样都能用** 确实是我们的目标，提供 CDN、支持 AMD 和 Global Object、npm publish 也都是很简单的事情，更难抉择的是 “你们怎么解决兼容性问题”。



#### 通过方法操作组件数据，解决兼容性

在 San 组件中，对数据的变更需要通过 `set` 或 `splice` 等方法。[数据操作](https://ecomfe.github.io/san/tutorial/data-method/)文档详细描述了这一点。这意味着：

- 用最简单的形式，解决兼容性问题
- San 的开发体验不可能做的比 Vue 更好
- 数据操作的过程可控。实际上，从 3.1.0 开始，数据变更在内部是 Immutable 的
- change tracking好做了。我们并不认为 v-dom 是万金油，并且 San 是面向 Web 设计的，我们并没期望它跨平台。所以少掉 v-dom 这一层是一件好事

我们也考虑过让使用者自己通过 Immutable 的方式操作数据，然后再怼回来，但这样对使用者的成本会变高，而且使用者未必会理解为啥要这样干，所以还是封起来了。

```javascript
this.data.set('user', userName);

// vs

setData(Object.assign({}, data, {user: userName}));
```

但是，把数据封起来意味着获取数据成本也变高了，特别是想一次获取多个数据的时候。所以我们把获取数据的 get 方法实现为，无参的时候返回整个数据对象，如果你用 ESNext 开发可以方便的使用解构。但是，操作数据还是要通过 `set` 或 `splice` 等方法的。

```javascript
let {name, email} = this.data.get();
```


#### 组件形态

虽然我们很欣赏 Vue，但是我们并不认同 component = data。在 Vue 中，数据直接置于组件下，methods被规约。

```javascript
new Vue({
    el: '#example-3',

    // methods被规约
    methods: {
        reverseMessage: function () {
            this.message = this.message.split('').reverse().join('')
        }
    }
})
```

我们更习惯 method 直接置于组件下，数据被规约（其实已经被封装）。

```javascript
san.defineComponent({
    template: '<div>...<button type="button" on-click="submit">submit</button></div>',

    // method 直接置于组件下
    submit: function () {
        var title = this.data.get('title');
        if (!title) {
            return;
        }
        sendData({title: title});
    }
});
```

不过，这是一个理念问题，并没有谁好谁坏。


#### 组件声明

我们认为组件应该是一个 class（不要较真，就是 function）。在 ESNext 中，我们可以利用 extends 构造组件之间的继承关系。这样看起来更自然。

```javascript
import {Component} from 'san';

class HelloComponent extends Component {
    static template = '<p>Hello {{name}}!</p>';

    initData() { 
        return {name: 'San'} 
    }
}
```

ESNext 是无法声明 prototype property 的。所以，对于 template / filters / components 等属性，San 提供了 static property 的支持。

对于不愿意使用 ESNext 的产品，我们提供 defineComponent 方法，能够方便快捷的声明组件。

```javascript
var HelloComponent = san.defineComponent({
    template: '<p>Hello {{name}}!</p>',

    initData: function () { 
        return {name: 'San'} 
    }
});
```

#### 组件反解

我们希望 San 能够从带有特定标记的 HTML 中，解析出组件结构来，通过组件来响应和管理后续的用户交互等操作，我们管这事叫做 [组件反解](https://ecomfe.github.io/san/tutorial/reverse/)。 （什么，你说叫反序列化？也行啊，开心就好）

- 后端直出 HTML 在首屏时间是有优势的，特别是内容为主的应用
- 使用 NodeJS 提供在线 Web 服务不一定在任何地方都行得通，至少在我厂很多地方是行不通的。NodeJS 也不是万金油

所以我们先制定了 `特定标记` 的协议，基于此实现了组件反解的功能。后来实现的 NodeJS 服务端渲染功能也是基于 **组件反解** 的，输出符合协议的 HTML。

另外，对于服务端渲染，恐怕大家最关心的是性能。[San的服务端渲染](https://ecomfe.github.io/san/tutorial/ssr/)经过测试，比号称最快的 JS 模板引擎 [art-template](http://aui.github.io/art-template/) 慢30%-40%，慢的部分主要是因为要额外生成前端可被辨识和反解的标记。已经是 string-based 模板引擎的性能级别了。



#### 10k

在各种 Library 不在乎体积的今天，大体积的副作用其实并不少，除了网络传输以外，[移动端 JS Parse 的时间其实并不可忽视](http://www.infoq.com/cn/articles/javascript-start-up-performance)。所以我设定了个目标，不包含开发调试支持的版本，GZip 后体积不能超过 10k。为什么是 10k 呢，拍脑袋而已，可能是 mission impossible，不去试试谁知道呢？


最开始的简陋版本确实不太大，但是由于增加兼容性的处理、增加新 feature、代码拆分，让我们不止一次体积超过 10k。每次回头去找代码有什么可以优化的地方，到后来可优化的地方越来越少，也差点被当成强迫症患者送去医院。不过到最后竟然真的做到了。


其实这也不是什么很有技术含量的事情，为此我们直接手写 ES5 代码而不是 ESNext + Babel，在很多人看来还是挺 low B 的。具体是不是 10k 也没什么意义，只是态度而已。我们希望 San 的使用者不会受到体积的困扰，我们也希望体积强迫症患者能有更多的选择。


#### 性能

在我们刚开始做 San 的时候，很多流行的方案还是有一些性能问题的（比如Angular的更新、Vue的初始渲染等等）。但是世界变化那么快，1年多过去了，现在大家的性能其实都还不错，谁比谁笨呢？San 的性能也还不错，但也没有一骑绝尘，大家都差不多，不同场景也各有优势。感兴趣的同学自己测吧。



### 还有些什么


#### 应用状态管理

这年头，一个方案里没有应用状态管理，别人看你都像残废。所以我们提供了 [san-store](https://github.com/ecomfe/san-store)。它还是有自己的特点的：

- 名字有特点。在大家都叫 nnnx 的时候，我们希望传达 store 做为全局唯一的应用状态源的观念，就叫 store了
- 抽象有不同。我们还是希望尽量好用好理解。redux 的模式我们嫌烦琐，为了假装有节操又不能抄 vuex，所以我们提供了更简单的抽象，只有Action。
- 应用状态数据的操作，我们通过 [san-update](https://github.com/ecomfe/san-update) 完成


#### router

这也是一个没有就残废的东西，但想想也没啥好说的，有需要的自己看吧。[san-router](https://github.com/ecomfe/san-router)


#### 组件库

组件库是减少实际业务开发工作量、解放生产力的根本。

- [Material Design](https://material.io/guidelines/) 是认知度比较高的一套视觉体系，我们基于它开发了一个[MUI组件库](https://ecomfe.github.io/san-mui/)。
- [WeUI](https://weui.io/) 是微信输出的、Mobile 友好的一套视觉体系，但是目前没有 San 的实现，欢迎感兴趣的同学来一套，质量好的话我们会在官网推荐喔。
- [AntDesign](https://ant.design/) 是蚂蚁输出的、适合各种管理系统的一套视觉体系，但是目前没有 San 的实现，也欢迎感兴趣的同学来一套，质量好的话我们会在官网推荐喔。
- 如果你的应用拥有自己的视觉体系，自己开发组件库是免不了的

曾经有人和我说，你们应该推自己的组件库啊，其实大家做应用的时候并不 care 是什么，只要好看好用就行。可是我厂是没有自己的视觉交互体系的，我能怎么办，我也很绝望啊。


#### DevTool

DevTool 在写这篇广告的时候还没有 ready，快了，一周以内吧。请关注 [San WebSite](https://ecomfe.github.io/san/)



### 最后

到这里，应该不难看出，San 有一些 **传统** 的地方：

- 还在兼容 Old IE
- 还在考虑不使用 babel transform 的业务开发场景
- 还在为体积纠结
- 还想保持后端无关，而不是推 NodeJS

如果拿车来比喻，我们想造的是一台陆巡。相比轿车甚至多数SUV，它没有那么好开，看不到很多 2.0T 的车尾灯；相比牧马人和 benz G，他越野能力和通过性也没那么强。但是它很可靠，能稳稳当当、舒适地带你到任何想去的地方。


既然你都能有耐心看到这，不介意关注下？ ^_^

<iframe src="https://ghbtns.com/github-btn.html?user=ecomfe&repo=san&type=star&count=true" frameborder="0" scrolling="0" width="170px" height="20px"></iframe>


