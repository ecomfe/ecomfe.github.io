---
title: 在 JavaScript 中实现私有成员的语法特性
date: 2015-10-21
author: exodia
author_link: http://weibo.com/exodia17
tags:
- JavaScript
- OO
---

### 前言

在面向对象的编程范式中，封装都是必不可少的一个概念，而在诸如 Java，C++等传统的面向对象的语言中，
**私有成员**是实现封装的一个重要途径。但在 JavaScript 中，确没有在语法特性上对**私有成员**提供支持，
这也使得开发人员使出了各种奇技淫巧去实现 JS 中的私有成员，以下将介绍下目前实现 JS 私有成员特性的几个方案以及它们之间的优缺点对比。

<!-- more -->

### 现有的一些实现方案

#### 约定命名方案

约定以下划线’_’开头的成员名作为私有成员，仅允许类成员方法访问调用，外部不得访问私有成员。简单的代码如下：

```javascript

var MyClass = function () {
    this._privateProp = ‘privateProp’;
};

MyClass.prototype.getPrivateProp = function () {
    return this._privateProp;
};

var my = new MyClass();
alert(my.getPrivateProp()); // ‘privateProp’;
alert(my._privateProp); // 并未真正隐藏，依然弹出 ‘privateProp’
```

##### 优点

- 毫无疑问，约定命名是最简单的私有成员实现方案，没有代码层面上的工作。
- 调试方便，能够在控制台上直接看到对象上的私有成员，方便排查问题。
- 兼容性好，ie6+都支持

##### 不足

- 无法阻止外部对私有成员的访问和变更，如果真有不知道或者不遵守约定的开发人员变更私有属性，也是无能为力。
- 必须强制或说服大家遵守这个约定，当然这个在有代码规范的团队中不是什么太大的问题。

#### es6 symbol 方案

在 es6中，引入了一个 [Symbol](https://babeljs.io/docs/learn-es2015/#symbols) 的特性，该特性正是为了实现私有成员而引入的。

主要的思路是，为每一个私有成员的名称产生一个随机且唯一的字符串key，这个 key 对外不可见，对内的可见性则是通过 js 的闭包变量实现，示例代码如下：

```javascript

(function() {
      var privateProp = Symbol(); // 每次调用会产生一个唯一的key
    
      function MyClass() {
          this[privateProp] = ‘privateProp’; // 闭包内引用到这个 key
      }
    
      MyClass.prototype.getPrivateProp = function () {
          return this[privateProp];
     };
})();

var my = new MyClass();
alert(my.getPrivateProp()); // ‘privateProp’;
alert(my.privateProp); // 弹出 undefined，因为成员的key其实是随机字符串
```

##### 优点

- 弥补了命名约定方案的缺陷，外部无法通过正常途径获得私有成员的访问权。
- 调试便捷程度上可以接受，一般是通过给 symbol 的构造函数传入一个字符串参数，则控制台上对应的私有属性名称会展示为：Symbol(key)
- 兼容性不错，不支持 Symbol的浏览器可以很容易的 shim 出来。

##### 不足 

- 写法上稍显别扭，必须为每一个私有成员都创建一个闭包变量让内部方法可以访问。
- 外部还是可以通过 Object.getOwnPropertySymbols的方式获取实例的 symbol 属性名称，通过该名称获得私有成员的访问权。这种场景出现得比较少，且知道这种途径的开发人员水平相信都是有足够的能力知道自己的行为会有什么影响，因此这个不足点也算不上真正意义的不足。

#### es6 WeakMap 方案

在 es6 中引入了 [Map, WeakMap](https://babeljs.io/docs/learn-es2015/#map-set-weak-map-weak-set) 容器，最大的特点是容器的键名可以是任意的数据类型，虽说初衷不是为了实现私有成员引入，但意外的可以被用来实现私有成员特性。

主要的思路是，在类的级别上创建一个 WeakMap 容器，用于存储各个实例的私有成员，这个容器对外不可见，对内通过闭包方式可见；内部方法通过将实例作为键名获取容器上对应实例的私有成员，示例代码如下：

```javascript

(function() {
      var privateStore = new WeakMap(); // 私有成员存储容器
    
      function MyClass() {
          privateStore.set(this, {privateProp: ‘privateProp’}); // 闭包内引用到privateStore, 用当前实例做 key，设置私有成员
      }
    
      MyClass.prototype.getPrivateProp = function () {
          return privateStore.get(this).privateProp; 
     };
})();

var my = new MyClass();
alert(my.getPrivateProp()); // ‘privateProp’;
alert(my.privateProp); // 弹出 undefined，实例上并没有 privateProp 属性

```

##### 优点

- 弥补了命名约定方案的缺陷，外部无法通过正常途径获得私有成员的访问权。
- 对 WeakMap 做一些封装，抽出一个私有特性的实现模块，可以在写法上相对 Symbol 方案更加简洁干净，其中一种封装的实现可以查看参考文章3。
- 最后一个是个人认为最大的优势：基于 WeakMap 方案，可以方便的实现**保护成员特性**（这个话题会在其他文章说到：））

##### 不足

- 不好调试，因为是私有成员都在闭包容器内，无法在控制台打印实例查看对应的私有成员
- 待确认的性能问题，根据 es6的相关邮件列表，weakmap 内部似乎是通过顺序一一对比的方式去定位 key 的，时间复杂度为 O(n)，和 hash 算法的 O(1)相比会慢不少
- 最大的缺陷则是兼容性带来的内存膨胀问题，在不支持 WeakMap 的浏览器中是无法实现 WeakMap 的弱引用特性，因此实例无法被垃圾回收。
比如示例代码中 privateProp 是一个很大的数据项，无弱引用的情况下，实例无法回收，从而造成内存泄露。

### 现有实现方案小结

从上面的对比来看，Symbol方案最大优势在于很容易模拟实现；而WeakMap的优势则是能够实现保护成员，
现阶段无法忍受的不足是无法模拟实现弱引用特性而导致的内存问题。于是我的思路又转向了将两者优势结合起来的方向。

### Symbol + 类WeakMap 的整合方案

在 WeakMap 的方案中最大的问题是**无法 shim 弱引用**，较次要的问题是不大方便调试。

shim 出来的 WeakMap 主要是无法追溯实例的生命周期，而实例上的私有成员的生命周期又是依赖实例，
因此将实例级别的私有成员部分放在实例上不就好了？ 实例没了，自然其属性也随之摧毁。而私有存储区域的隐藏则可以使用 Symol 来做。

该方案的提供一个 createPrivate 函数，该函数会返回一个私有的 token 函数，对外不可见，对内通过闭包函数获得，
传入当前实例会返回当前实例的私有存储区域。使用方式如下：

```javascript

(function() {

      var $private = createPrivate(); // 私有成员 token 函数，可以传入对象参数，会作为原型链上的私有成员
    
      function MyClass() {
          $private(this).privateProp = ‘privateProp’ ; // 闭包内引用到privateStore, 用当前实例做 key，设置私有成员
      }
    
      MyClass.prototype.getPrivateProp = function () {
          return $private(this).privateProp; 
     };
})();

var my = new MyClass();
alert(my.getPrivateProp()); // ‘privateProp’;
alert(my.privateProp); // 弹出 undefined，实例上并没有 privateProp 属性
```
代码中主要就是实现 createPrivate 函数，大概的实现如下：

```javascript
// createPrivate.js
function createPrivate(prototype) {
    var privateStore = Symbol('privateStore');
    var classToken = Symbol(‘classToken’);
    return function getPrivate(instance) {
         if (!instance.hasOwnProperty(privateStore)) {
             instance[privateStore] = {};
         }
	     var store = instance[classToken];
         store[token] = store[token] || Object.create(prototype || {});
         return store[token];
     };
}
```

上述实现做了两层存储，privateStore 这层是实例上统一的私有成员存储区域，而 classToken 对应的则是继承层次之间不同类的私有成员定义，基类有基类的私有成员区域，子类和基类的私有成员区域是不同的。

当然，只做一层的存储也可以实现，两层存储仅仅是为了调试方便，可以直接在控制台通过Symbol(‘privateStore’)这个属性来查看实例各个层次的私有部分。

### 奇葩的 es5 property getter 拦截方案

该方案纯粹是闲得无聊玩了玩，主要是利用了 es5 提供的 getter，根据 argument.callee.caller 去判断调用场景，如果是外部的则抛异常或返回 undefined，
如果是内部调用则返回真正的私有成员，实现起来比较复杂，且不支持 strict 模式，不推荐使用。 
有兴趣的同学可以看看[实现](https://github.com/ecomfe/oo/blob/feature/private/src/definePrivateMembers.js)。

### 总结

以上几个方案对比下来，我个人是倾向 Symbol+WeakMap 的整合方案，结合了两者的优点，又弥补了 WeakMap 的不足和 Symbol 书写的冗余。
当然了，我相信随着 JS 的发展，私有成员和保护成员也迟早会在语法层面上进行支持，正如  es6 对 class 关键字和 super 语法糖的支持一样，
只是现阶段需要开发者使用一些技巧去填补语言特性上的空白。

### 参考文章

1. [Private instance members with weakmaps in JavaScript](https://www.nczonline.net/blog/2014/01/21/private-instance-members-with-weakmaps-in-javascript/)

2. [Private Properties: Mozilla Developer Network](https://developer.mozilla.org/en-US/Add-ons/SDK/Guides/Contributor_s_Guide/Private_Properties)

3. [Implementing Private and Protected Members in JavaScript](http://philipwalton.com/articles/implementing-private-and-protected-members-in-javascript/?utm_source=github)

