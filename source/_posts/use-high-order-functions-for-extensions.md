---
title: 使用高阶函数实现类的扩展设计
date: 2015-12-21
author: otakustay
author_link: http://otakustay.com/
tags:
- JavaScript
- ESNext
- 设计
- 扩展性
- 高阶函数
---


在不少框架中，都会对“扩展”这一概念有需求。所谓扩展，即一个可组合的组件，用于嵌入到目标的生命周期中，对目标的行为进行额外的处理使得目标拥有不同的表现。

一个非常简单的案例即日志的记录。通常框架自身并不会有业务相关的日志记录的功能，而业务代码也不希望混入并非业务逻辑的日志记录部分。那么使用一个扩展，在合适的点进行日志的收集和存储是很合适的设计。

在以往，比较流行的扩展通常有几种形式：

<!-- more -->

1. Mixin形式。这种形式下扩展与目标形成完全的覆盖关系，属于暴力而简单的方法。

        class Component {
            constructor({mixins}) {
                mixins.forEach(mixin => Object.assign(this, mixin));
            }

            doWork() {
                // ...
            }
        }

        let logMixin = {
            doWork(...args) {
                console.log('Start do work');
                Component.prototype.doWork.apply(this, ...args);
                console.log('Finish do work');
            }
        };

        let foo = new Component({mixins: [logMixin]});
        foo.doWork();

2. 生命周期形式。这种模式在框架设计之初就定义多个扩展可运作的点，在生命周期的特定阶段激活扩展，同时给予扩展足够的事件以及可重写的方法来完成其功能：

        class Component {
            constructor({extensions}) {
                for (let extension of extensions) {
                    extension.target = this;
                    extension.enable();
                }
            }

            doWork() {
                this.fire('beforedowork');
                // ...
                this.fire('dowork');
            }
        }

        let logExtension = {
            enable() {
                this.target.on('beforedowork', () => console.log('Start do work'));
                this.target.on('finishdowork', () => console.log('Finish do work'));
            }
        };

        let foo = new Component({extensions: [logExtension]});
        foo.doWork();

但是这两种方式都存在着一些固有的缺陷：

1. 目标需要有非常精细的设计来支持扩展的运作，如果事件不够则扩展需要重写特定方法。虽然JavaScript确实是一个弱类型的动态语言，但是否应该放任一段外部逻辑重写任意方法，在设计上是值得商榷的。
2. 类的保护（`protected`）方法是否对扩展开放，在概念上难以权衡。如果不开放保护方法则很可能扩展没有足够的信息来完成工作，而开放保护方法则破坏了面向对象本身封装性的概念。
3. 多个扩展都对同一个方法的重写时存在冲突，设计不合理导致相互覆盖很可能让扩展产生不可预期的结果。
4. 重写方法较为复杂，需要先保留原有方法函数引用再进行重写，重写过程中需要使用`.apply`或`.call`进行调用，无法使用如`super`等ES6的语言特性。
5. 如果扩展应用的对象不幸经过了`Object.freeze`等方法的处理，则扩展很大概率将无法工作。
6. 扩展启用/销毁的生命周期难以设计，过早介入可能导致扩展在启用时没有足够的信息判断自己需要做的工作，过晚介入则可能错过一些阶段。

总结以上的问题，我们发现很多问题在于目标成员的可访问性上，而可访问性是应用于“继承”这一概念上的。

那么，一个很好的方案是让扩展也在“继承”上进行体现，而不是以“组合”的关系工作。虽然我们一直说“组合优于继承”，但是在可访问性限制等种种因素下，在扩展这一场景下，继承恰恰能给予更好的支持。

在JavaScript中，类实际上就是一个函数，那么对于类进行转换的所谓“扩展”，我们也称其为一个高阶函数，其范式为：

```js
F(class1) => class2
```

即我们的扩展接受一个类的构造函数（也是类本身），返回另一个类，其作用是通过继承对类进行一定的转换。在这种设计下，我们上面的代码可以实现为：

```js
class Component {
    constructor() {
    }

    doWork() {
        // ...
    }
}

let log = (Target) => {
    return class extends Target {
        doWork() {
            console.log('Start do work')
            super.doWork();
            console.log('Finish do work')
        }
    }
};

let create = (Class, extensions) {
    let TargetClass = extensions.reduce((Raw, extension) => extension(Raw), Class);
    return new TargetClass();
};

let foo = create(Component, [log]);
foo.doWork();
```

通过继承我们可以很好地实现方法的重写，也可以利用如`super`这样的关键字，同时也不需要考虑`doWork`是保护方法还是公开方法，使得`Component`类完全不需要为了扩展而进行额外的设计，所有的扩展均在外部的工厂（`create`函数）实现，更好地进行了逻辑的解耦。

同时，这一方案也与[JavaScript Class Decorator](https://github.com/wycats/javascript-decorators#class-declaration)的功能相兼容，其微小的区别在于：

1. 由于扩展生效时类的`prototype`已经封闭，因此扩展必须返回一个子类，而不能直接对`prototype`进行修改。
2. 扩展可在创建实例时动态定义。

由于扩展的限制比装饰器更为严格，因此一个扩展同时可以静态地在定义类时通过装饰器的形式使用，也可以在工厂生产实例时动态地使用，这也保证了更好的代码复用性。
