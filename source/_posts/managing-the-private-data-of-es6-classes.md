uthor: huyao
author_link: http://weibo.com/ever20110408?is_all=1
tags:
- ES6
- Weakmap
- Symbol
---

原文：[http://www.2ality.com/2016/01/private-data-classes.html](http://www.2ality.com/2016/01/private-data-classes.html)

如何在ES6中管理类的私有数据？本文为你介绍四种方法：

- 在类的构造函数作用域中处理私有数据成员
- 遵照命名约定（例如前置下划线）标记私有属性
- 将私有数据保存在WeakMap中
- 使用Symbol作为私有属性的键

对构造函数来说，前两种方法在 `ES5` 中已经很常见了，后两种方法是 `ES6` 中新出现的。现在我们在同一个案例上分别用这四种方法来实践一下：

1. ** 在类的构造函数作用域中处理私有数据成员 **

我们要演示的这段代码是一个名为 `Countdown` 的类在 `counter`（初始值为 counter）变成0时触发一个名为 `action` 的回调函数。其中 `action` 和 `counter` 两个参数应被存储为私有数据。

在这个实现方案中，我们将 `action` 和 `counter` 存储在 `constructor` 这个类的环境里面。环境是指JS引擎存储参数和本地变量的内部数据结构，变量存在即可，无论是否进入一个新的作用域（例如通过一个函数调用或者一个类调用）。来看看代码：

```javascript
class Countdown {
    constructor(counter, action) {
        Object.assign(this, {
            dec() {
                if (counter < 1) return;
                counter--;
                if (counter === 0) {
                    action();
                }
            }
        });
    }
}
```

然后这样使用 Countdown：

```javascript
> let c = new Countdown(2, () => console.log('DONE'));
> c.dec();
> c.dec();
DONE
```
优点：
- 私有数据非常安全；
- 私有属性的命名不会与其他父类或子类的私有属性命名冲突。

缺点：
- 当你需要在构造函数内把所有方法（至少那些需要用到私有数据的方法）添加到实例的时候，代码看起来就没那么优雅了；
- 作为实例方法，代码会浪费内存；如果作为原型方法，则会被共享。

关于此方法的更多内容请参考：《Speaking Javascript》的[Private Data in the Environment of a Constructor (Crockford Privacy Pattern)](http://speakingjs.com/es5/ch17.html#private_data_constructor_environment)(构造函数环境中的私有数据)章节。

2. ** 通过命名约定来标记私有属性 **

下面的代码将私有数据保存在添加了前置下划线命名的属性中：

```javascript
class Countdown {
    constructor(counter, action) {
        this._counter = counter;
        this._action = action;
    }
    dec() {
        if (this._counter < 1) return;
        this._counter--;
        if (this._counter === 0) {
            this._action();
        }
    }
}
```
优点：
- 代码比较美观；
- 可以使用原型方法。

缺点：
- 不够安全，只能用规范去约束用户代码；
- 私有属性的命名容易冲突。

3. ** 通过 WeakMaps 保存私有数据 **

有一个利用 WeakMap 的小技巧，结合了方法一和方法二各自的优点：安全性和能够使用原型方法。可以参考以下代码：我们利用 `_counter` 和 `_action` 两个WeakMap来存储私有数据。


```javascript
let _counter = new WeakMap();
let _action = new WeakMap();
class Countdown {
    constructor(counter, action) {
        _counter.set(this, counter);
        _action.set(this, action);
    }
    dec() {
        let counter = _counter.get(this);
        if (counter < 1) return;
        counter--;
        _counter.set(this, counter);
        if (counter === 0) {
            _action.get(this)();
        }
    }
}
```

`_counter` 和 `_action` 这两个 WeakMap 都分别指向各自的私有数据。由于 WeakMap 的设计目的在于键名是对象的弱引用，其所对应的对象可能会被自动回收，只要不暴露 WeakMap ，私有数据就是安全的。如果想要更加保险一点，可以将 `WeakMap.prototype.get` 和 `WeakMap.prototype.set` 存储起来再调用（动态地代替方法）。这样即使有恶意代码篡改了可以窥探到私有数据的方法，我们的代码也不会受到影响。但是，我们只保护我们的代码不受在其之后执行的代码的干扰，并不能防御先于我们代码执行的代码。

优点：
- 可以使用原型方法；
- 比属性命名约定更加安全；
- 私有属性命名不会冲突。

Con:

- 代码不如命名约定优雅。


4. ** 使用Symbol作为私有属性的键名 **

另外一个存储私有数据的方式是用 Symbol 作为其属性的键名：

```javascript
const _counter = Symbol('counter');
const _action = Symbol('action');

class Countdown {
    constructor(counter, action) {
        this[_counter] = counter;
        this[_action] = action;
    }
    dec() {
        if (this[_counter] < 1) return;
        this[_counter]--;
        if (this[_counter] === 0) {
            this[_action]();
        }
    }
}
```

每一个 Symbol 都是唯一的，这就是为什么使用Symbol的属性键名之间不会冲突的原因。并且，Symbol 某种程度上来说是隐式的，但也并不完全是：

```javascript
let c = new Countdown(2, () => console.log('DONE'));

console.log(Object.keys(c));
// []
console.log(Reflect.ownKeys(c));
// [Symbol(counter), Symbol(action)]
```

优点：
- 可以使用原型方法；
- 私有属性命名不会冲突。

缺点：
- 代码不如命名约定优雅；
- 不太安全：可以通过 `Reflect.ownKeys()` 列出一个对象所有的属性键名（即使用了 Symbol）。

延伸阅读：

- Sect. [“Keeping Data Private”](http://speakingjs.com/es5/ch17.html#private_data_for_objects) in “Speaking JavaScript” (covers ES5 techniques)
- Chap. [“Classes”](http://exploringjs.com/es6/ch_classes.html) in “Exploring ES6”
- Chap. [“Symbols”](http://exploringjs.com/es6/ch_symbols.html) in “Exploring ES6”

