---
title: ES Decorators简介
date: 2015-7-1
author: otakustay
author_link: http://otakustay.com
tags:
- JavaScript
- ES6
- ES7
- ECMAScript6
- ECMAScript7
---
我跟你说，我最讨厌“简介”这种文章了，要不是语文是体育老师教的，早就换标题了！

[Decorators](https://github.com/wycats/javascript-decorators)是ECMAScript现在处于[Stage 1](https://github.com/tc39/ecma262)的一个提案。当然ECMAScript会有很多新的特性，特地介绍这一个是因为它能够在实际的编程中提供很大的帮助，甚至于改变不少功能的设计。

## 先说说怎么回事

如果光从概念上来介绍的话，官方是这么说的：

> Decorators make it possible to annotate and modify classes and properties at design time.

我翻译一下：

> 装饰器让你可以在设计时对类和类的属性进行注解和修改。

什么鬼，说人话！

所以我们还是用一段代码来看一下好了：

```javascript
function memoize(target, key, descriptor) {
    let cache = new Map();
    let oldMethod = descriptor.value;
    descriptor.value = function (...args) {
        let hash = args[0];
        if (cache.has(hash)) {
            return cache.get(hash);
        }
        let value = oldMethod.apply(this, args);
        cache.set(hash, value);
        return value;
    };
}

class Foo {
    @memoize;
    getFooById(id) {
        // ...
    }
}
```

别去试上面的代码，瞎写的，估计跑不起来就是了。这个代码的作用其实看函数的命名就能明白，我们要给`Foo#getFooById`方法加一个缓存，缓存使用第一个参数作为对应的键。

可以看出来，上面代码的重点在于：

1. 有一个`memoize`函数。
2. 在类的某个方法上加了`@memoize;`这样一个标记。

而这个`@memoize`就是所谓的Decorator，我称之为装饰器。一个装饰器有以下特点：

1. 首先它是一个函数。
2. 这个函数会接收3个参数，分别是`target`、`key`和`descriptor`，具体的作用后面再说。
3. 它可以修改`descriptor`做一些额外的逻辑。

看到了基本用法其实并不能说明什么，我们有几个核心的问题有待说明：

### 有几种装饰器

现阶段官方说有2种装饰器，但从实际使用上来看是有4种，分别是：

- 放在`class`上的“类装饰器”。
- 放在属性上的“属性装饰器”，这需要配合另一个Stage 0的[类属性语法](https://gist.github.com/jeffmo/054df782c05639da2adb)提案，或者只能放在对象字面量上了。
- 放在方法上的“方法装饰器”。
- 放在`getter`或`setter`上的“访问器装饰器”。

其中类装饰器只能放在`class`上，而另外3种可以同时放在`class`和属性或者对象字面量的属性上，比如这样也是可以的：

```javascript
let foo = {
    @memoize
    getFooById(id) {
        // ...
    }
};
```

不过注意放在对象字面量时，装饰器后面不能写分号，这是个比较怪异的问题，后面还会说到更怪异的情况，我也在和提案的作者沟通这是为啥。

之所以这么分，是因为不同情况下，装饰器接收的3个参数代表的意义并不相同。

### 装饰器的3个参数是什么

装饰器接收3个参数，分别是`target`、`key`和`descriptor`，他们各自分别是什么值，用一段代码就能很容易表达出来：

```javascript
function log(target, key, descriptor) {
    console.log(target);
    console.log(target.hasOwnProperty('constructor'));
    console.log(target.constructor);
    console.log(key);
    console.log(descriptor);
}

class Bar {
    @log;
    bar() {}
}

// {}
// true
// function Bar() { ...
// bar
// {"enumerable":false,"configurable":true,"writable":true}
```

这是使用[babel](babeljs.io)转换的JavaScript的输出，从这里可以看到：

1. `key`很明显就是当前方法名，我们可以推断出来用于属性的时候就是属性名
2. `descriptor`显然是一个`PropertyDescriptor`，就是我们用于`defineProperty`时的那个东西。
3. `target`确实不是那么容易看出来，所以我用了3行代码。首先这是一个对象，然后是一个有`constructor`属性的对象，最后`constructur`指向的是`Bar`这个函数。所以我们也能推测出来这货就是`Bar.prototype`没跑了。

那如果装饰器放在对象字面量上，而不是类上呢？这边就不再给代码，直接放结论了：

1. `key`和`descriptor`和放在类属性/方法上一样没变，这当然也不应该变。
2. `target`是`Object`对象，相信我你不会想用这个参数的。

当装饰器放在属性、方法、访问器上时，都符合上面的原则，但放在类上的时候，有一些不同：

1. `key`和`descriptor`不会提供，只有`target`参数。
3. `target`会变成`Bar`这个方法，而不是其`prototype`。

其实对于属性、方法和访问器，真正有用的就是`descriptor`，其它几个无视问题也不大就是了。而对于类，由于`target`是唯一能用的，所以会需要它。

对于这一环节，我们**需要特别注意一点**，由于`target`是类的`prototype`，所以往它上面添加属性是，要注意继承时是会被继承下去的，而子类上再加同样属性又会有覆盖甚至对象、数组同引用混在一起的问题。这和我们平时尽量不在`prototype`上放对象或者数组的思路是一致的，要避免这一问题。

### 装饰器在什么时候执行

既然装饰器本身是一个函数，那么自然要有函数被执行的时候。

现阶段，装饰器只能放在一个类或者一个对象上，我们可以用代码看一下什么时候执行：

```javascript
// 既然装饰器是函数，我当然可以用函数工厂了
function log(message) {
    return function() {
        console.log(message);
    }
}

console.log('before class');

@log('class Bar')
class Bar {
    @log('class method bar');
    bar() {}

    @log('class getter alice');
    get alice() {}

    @log('class property bob');
    bob = 1;
}

console.log('after class');

let bar = {
    @log('object method bar')
    bar() {}
};
```

输出如下：

```
before class
class method bar
class getter alice
class property bob
class Bar
after class
object method bar
```

从输出上，我们可以看到几个规则：

- 装饰器是在声明期就起效的，并不需要类进行实例化。类实例化并不会致使装饰器多次执行，因此不会对实例化带来额外的开销。
- 按编码时的声明顺序执行，并不会将属性、方法、访问器进行重排序。

因为以上这2个规则，我们需要**特别注意一点**，在装饰器运行时，你所能得到的环境是空的，在`Bar.prototype`或者`Bar`上的属性是获取不到的，也就是说整个`target`里其实只有`constructor`这一个属性。换句话说，装饰器运行时所有的属性和方法均**未定义**。

### descriptor里有啥

我们都知道，`PropertyDescriptor`的基本内容如下：

- `configurable`控制是不是能删、能修改`descriptor`本身。
- `writable`控制是不是能修改值。
- `enumerable`控制是不是能枚举出属性。
- `value`控制对应的值，方法只是一个`value`是函数的属性。
- `get`和`set`控制访问咕噜的读和写逻辑。

根据装饰器放的位置不同，`descriptor`参数中就会有上面的这些属性，其中前3个是必然存在的，随后根据放在属性、方法上还是放在访问器上决定是`value`还是`get/set`。

再说说类属性的情况，由于类属性本身是一个比装饰器更不靠谱的Stage 0的提案，所以情况就会变成2个提案的相互作用了。

当装饰器用于类属性时，`descriptor`将变成一个叫“类属性描述符”的东西，其区别在于没有`value`和`get`或`set`，且多出一个`initializer`属性，类型是函数，在类构造函数执行时，`initializer`返回的值作为属性的值，也就是说一个`foo`属性对应代码是类似这样的：

```javascript
class Foo {
    constructor() {
        let descriptor = Object.getPropertyDescriptor(this, 'foo');
        this.foo = descriptor.initializer.call(this);
    }
}
```

所以我们也可以写很简单的装饰器：

```javascript
function randomize(target, key, descriptor) {
    let raw = descriptor.initializer;
    descriptor.initializer = function() {
        let value = raw.call(this);
        value += '-' + Math.floor(Math.random() * 1e6);
        return value;
    };
}

class Alice {
    @randomize;
    name = 'alice';
}

console.log((new Alice()).name); // alice-776521
```

## 再说说怎么用

在基本把概念说完后，其实我们并没有说装饰器怎么用，虽然前面有一些代码，但并不能逻辑完善地说明问题。

### descriptor的使用

对于属性、方法、访问器的装饰器，真正的作用在于对`descriptor`这个属性的修改。我们拿一些原始的例子来看，比如你要给一个对象声明一个属性：

```javascript
let property = {
    enumerable: false,
    configurable: true,
    value: 3
};

Object.defineProperty(foo, 'foo', property);
```

但是我们现在又不高兴了，我们希望这个属性是只读的，OK这是个非常简单的问题：

```javascript
let property = {
    writable: false, // 加一行解决问题
    enumerable: false,
    configurable: true,
    value: 3
};

Object.defineProperty(foo, 'foo', property);
```

但是有时候，我们面对几百几千个属性，真心不想一个一个写`writable: false`，看着也不容易明白。或者这个`descriptor`根本是其他地方给我们的，我们只有`defineProperty`的权利，无法修改原来的东西，所以我们希望是这样的：

```javascript
Object.defineProperty(foo, 'foo', readOnly(property));
```

通过函数式的编程进行函数转换，既能读代码时就看出来这是只读的，又能用在所有以前的`descriptor`上而不需要改以前的代码，将“定义”和“使用”分离了开来。

而装饰器无非是将这件事放到了语法的层面上，我们有一个机会在类或者属性、访问器、方法定义的时候去修改它的`descriptor`，这种对“元数据”的修改使得我们有很大的灵活性，包括但不局限于：

1. 通过`descriptor.value`的修改直接给改成不同的值，适用于方法的装饰器。
2. 通过`descriptor.get`或`descriptor.set`修改逻辑，适用于访问器的装饰器。
3. 通过`descriptor.initializer`修改属性值，适用于属性的装饰器。
5. 修改`configurable`、`writable`、`enumerable`控制属性本身的特性，常见的就是修改为只读。

装饰器是最后的修改`descriptor`的机会，再往后如果`configurable`被设为`false`的话，就再也没机会去改变这些元数据了。

### 类装饰器的使用

类装饰器不大一样，因为没有`descriptor`给你，你唯一能获得的是**类本身**，也就是一个函数。

但是有了类本身，我们可以做一件事，就是继承：

```javascript
function countInstance(target) {
    let counter = new Map();

    return class extends target {
        constructor(...args) {
            super(...args);
            let count = counter.get(target) || 0;
            counter.set(target, count + 1);
        }

        static getInstanceCount() {
            return counter.get(target) || 0;
        }
    };
}


@countInstance
class Bob {
    // ...
}

new Bob();
new Bob();

console.log(Bob.getInstanceCount()); // 2
```

### 实际的使用场景

上面的代码可能都很扯谈，谁会有这种奇怪的需求，所以举一些真正实用的代码来看看。

一个比较可能的场合是在制作一个视图类的时候，我们可以：

- 通过访问器装饰器来声明类属性与DOM元素之间的绑定关系。
- 通过方法装饰器指定方法处理某个DOM元素的某个事件。
- 通过类装饰器指定一个类为视图处理类，且在`DOMContentLoaded`时执行。

参考代码如下，以一个简单的登录表单为例：

```javascript
const DOM_EVENTS = Symbol('domEvents');

function view(ViewClass) {
    class AutoView extends ViewClass {
        initialize() {
            super.initialize();

            // 注册所有事件
            for (let {id, type, handler} of this[DOM_EVENTS]) {
                let element = document.getElementById(id);
                element.addEventListener(type, handler, false);
            }
        }
    }

    let executeView = () => {
        let view = new AutoView();
        view.initialize();
    };

    window.addEventListener('DOMConentLoaded', executeView);

    return AutoView;
}

function dom(id) {
    return function (target, key, descriptor) {
        descriptor.get = () => document.getElementById(id || key);
    };
}

function event(id, type) {
    return (target, key, descriptor) {
        // 注意target是prototype，所以如果原来已经有了对象要做复制，不能直接污染
        target[DOM_EVENTS] = target.hasOwnProperty(DOM_EVENTS) ? target[DOM_EVENTS].slice() : [];

        target[DOM_EVENTS].push({id, type, handler: descriptor.value});
    };
}

@view
class LoginForm {
    @dom()
    get username() {}

    @dom()
    get password() {}

    @dom()
    get captcha() {}

    @dom('captcha-code')
    get captchaImage() {}

    @event('form', 'submit')
    [Symbol()](e) {
        let isValid = this.validateForm();
        if (!isValid) {
            e.preventDefault();
        }
    }

    @event('captcha-code', 'click')
    [Symbol()]() {
        // 点击刷新验证码
        this.captchaImage.src = this.captchaImage.src + 'x';
    }

    validateForm() {
        let isValid = true;
        if (!this.username.value.trim()) {
            showError(username, '请输入用户名');
            isValid = false;
        }
        if (!this.password.value.trim()) {
            showError(username, '请输入密码');
            isValid = false;
        }
        if (!this.captcha.value.trim()) {
            showError(username, '请输入验证码');
            isValid = false;
        }
        return isValid;
    }
}
```

这种编程方式我们经常称之为“声明式编程”，好处是更为直观，且能够通过装饰器等手段复用逻辑。

这只是一个很简单直观的例子，我们用装饰器可以做更多的事，有待在实际开发中慢慢发掘，同时[DecorateThis](https://github.com/mako-taco/DecorateThis)项目给我们做了不少的示范，虽然我觉得这个库提供的装饰器并没有什么卯月……

## 题外话的概念和坑

到这边基本把装饰器的概念和使用都讲了，我理解有不少FE一时不好接受这些（QWrap那边的人倒应该能非常迅速地接受这种函数式的玩法），后面说一些题外话，主要是装饰器与其它语言类似功能的比较，以及一些坑爹的坑。

### 和其它语言的比较

大部分开发者都会觉得装饰器这个语法很眼熟，因为我们在Java中有[Annotation](https://en.wikipedia.org/wiki/Java_annotation)这个东西，而在C#中也有[Attribute](https://msdn.microsoft.com/en-us/library/aa288454(v=vs.71).aspx)这个东西。

所以我说为啥一个语言搞一个东西还要名字不一样啊……我推荐PHP也来一个，就叫`GreenHat`好了……

不过有些同学可能会受此误导，其实装饰器和Java、C#里的东西不一样。

其区别在于Annotation和Attribute是一种元数据的声明，仅包含信息（数据），而不包含任何逻辑，必须有外部的逻辑来读取这些信息产生分支才有作用，比如`@override`这个Annotation相对应的逻辑在编译器是实现，而不是在对应的class中实现。

而装饰器，和Python的相同功能同名（赤裸裸的抄袭），其核心是一段逻辑，起源于[装饰器设计模式](https://en.wikipedia.org/wiki/Decorator_pattern)，让你有机会去改变一个方法、属性、类的逻辑，[StackOverflow上Python的回答](http://stackoverflow.com/questions/15347136/is-a-python-decorator-the-same-as-java-annotation-or-java-with-aspects)能比较好地解释这个区别。

### 几个坑

在我看来，装饰器现在有几个坑得注意一下。

首先，语法上很奇怪，特别是在装饰器后面的分号上。属性、访问器、方法的装饰器后面是可以加分号的，并且个人推荐加上，不然你可能遇到这样的问题：

```javascript
class Foo {
    @bar
    [1 + 2]() {}
}
```

上面的代码到底是`@bar`作为装饰器的方法呢，还是`@bar[1 + 2]()`后跟着一个空的Block`{}`呢？

但是，放在类上的装饰器，以及放在对象字面量的属性、访问器、方法上的装饰器，是不能加分号的， 不然就是语法错误。我不明白为啥就不能加分号，以至于这个语法简直精神分裂……

其次，如果你把装饰器用在类的属性上，建议**一定加上分号**，看看下面的代码：

```javascript
class Foo {
    @bar
    foo = 1;
}
```

想一想如果因为特性比较新，压缩工具一个没做好没给补上分号压成了一行，这是一个怎么样的代码……

## 总结

我不写总结，就酱。
