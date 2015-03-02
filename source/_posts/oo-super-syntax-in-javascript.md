---
title: 在 Javascript 中实现调用父类同名方法的语法糖(this._super())
date: 2015-3-2
author: exodia
author_link: http://weibo.com/exodia17 
tags:
- JavaScript
---


在很多 OO 的语言中，都提供了某种便捷的语法糖去调用基类中被子类覆盖的方法，比如在 Java 中：

```java
public class A {
   void method() {
      System.out.println("A");
   }
}

public class B {
    void method() {
        super.method();
        System.out.println("B");
    }
}
```

在 Python 中：

```python
class A
  def method():
    print('A')

class B(A)
  def method():
    super(B, self).method()
    print()
```

这种调用方式的好处在于：基类名称变化后，子类不用多处的修改，同时语义也比直接引用父类方法更加清晰。

在 JS 中，我设想了以下方式的语法调用：

<!-- more -->

```javascript
var A = function () {};

A.prototype.method = function () {
    console.log('A#method');
};

var B = function () {};

B.prototype.method = function () {
    this._super(arguments);
    console.log('B#method');
};

inherits(B, A);

var b = new B();
b.method(); // 打印出: A#method B#method
```

本质就是inherits的实现，因为 super 为关键字，所以使用了_super 代替。

## 实现方案(1) - 字符串匹配_super关键字，动态改写

John Resig 在他的[博文](http://ejohn.org/blog/simple-javascript-inheritance/) 使用了该方案实现了 super 语法糖。

主要原理为：获取方法的代码字符串，通过正则检测字符串中是否包含 `_super` ，若包含，
则改写该方法，在改写的方法中动态的改变this._super，使其指向父类同名方法，以完成调用父类方法的目的。代码可参考上面给出的文章链接。

这种实现方案的问题在于：

1. 改写了原有方法，使得调试起来具有很大迷惑性；
2. 极端的场景可能会出问题，如字符串中出现个 `_super`。

## 实现方案(2) - 通过arguments.callee.caller查找调用方法名，再进行父类方法调用

简单的实现如下：

```javascript
var _super = function (args) {
    var method = this._super.caller;

    if (!method) {
        throw "Cannot call _super outside!";
    }

    var name = method.__name__;
    var superCls = method.__owner__._superClass;
    var superMethod = superCls[name];

    if (typeof superMethod !== 'function') {
        throw "Call the super class's " + name + ", but it is not a function!";
    }

    return superMethod.apply(this, args);
};

var inherits = function (SubCls, SuperCls) {
    var fn = function () {};

    if (typeof SuperCls !== 'function') {
        SuperCls = fn;
    }
    var overrides = SubCls.prototype;
    var superPro = SuperCls.prototype;

    fn.prototype = superPro;

    var subPro = SubCls.prototype = new fn;

    for (var k in overrides) {
        var v = overrides[k];
        if (typeof v === 'function') {
            v.__name__ = k;
            v.__owner__ = subPro;
        }

        subPro[k] = v;
    }

    subPro.constructor = SubCls;
    subPro._superClass = superPro;
    subPro._super = _super;
};
```

上述代码主要通过 _super 函数和 inherits 函数实现了调用基类方法的模板功能。

inherits 函数主要的功能有两个:

1. 实现了基本的继承
2. 对原型函数附加了 `__name__` 和 `__owner__` 属性。前者是为了提供对_super的支持，方便其找到函数名，后者是为了在多级继承的时候，跳出作用域的死循环。

_super 流程如下：

1. 找 caller
2. 获取caller的函数名`__name__`
3. 获取 caller 的拥有者`__owner__`
4. 找到`__owner__`的父类
5. 调用同名函数


方案二的缺点：

1. 无法用在严格模式下
2. 会给函数额外增加自定义的属性(`__name__`与`__owner__`)

## 综合考虑

在我们的[oo库](https://github.com/ecomfe/oo)中，最后选用的是方案二，主要权衡为：

1. 严格模式带来的缺陷避免收益完全可以由工具(ide, jshint..)取代，我们每次提交代码前都会经过 jshint 的代码检测，因此不使用严格模式对我们来说没有什么影响。
2. 在实际的编码过程中，基本是不会出现和自定义属性出现重名的场景，这也算是一个约定。





