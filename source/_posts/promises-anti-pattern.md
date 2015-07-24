---
title: 谈谈使用promise时候的一些反模式 
date: 2015-07-24
author: 刘超凡
tags:
- JavaScript
- promise
---


> 本文翻译自[We have a problem with promises](http://pouchdb.com/2015/05/18/we-have-a-problem-with-promises.html)，同时也为原文题目，翻译时重新起了一个题目并且对原文有删改。

各位JavaScript程序员，是时候承认了，我们在使用promise的时候，会写出许多有问题的promise代码。
当然并不是promise本身的问题，[A+ spec](https://promisesaplus.com/)规范定义的promise非常棒。
在过去的几年中，笔者看到了很多程序员在调用PouchDB或者其他promise化的API时遇到了很多困难。这让笔者认识到，在JavaScript程序员之中，只有少数人是真正理解了promise规范的。如果这个事实让你难以接受，那么思考一下我给出的一个题目：

Question：下面四个使用promise的语句之间的不同点在哪儿？

```
doSomething().then(function () {
    return doSomethingElse();
})；

doSomethin().then(functiuoin () {
    doSomethingElse();
});

doSomething().then(doSomethingElse());

doSomething().then(doSomethingElse);
```

如果你知道这个问题的答案，那么恭喜你，你已经是一个promise大师并且可以直接关闭这个网页了。

但是对于不能回答这个问题的程序员中99.9%的人，别担心，你们不是少数派。没有人能够在笔者的tweet上完全正确的回答这个问题，而且对于第三条语句的最终答案也令我感到震惊，即便我是出题人。

答案在这篇博文的底部，但是首先，笔者必须先介绍为何promise显得难以理解，为什么我们当中无论是新手或者是很接近专家水准的人都有被promise折磨的经历。同时，笔者也会给出自认为能够快速、准确理解promise的方法。而且笔者确信读过这篇文章之后，理解promise不会那么难了。

在此之前，我们先了解一下有关promise的一些基本设定。

<!-- more -->

### promise从哪里来？

如果你读过有关promise的文章，你会发现文章中一定会提到[回调深坑](https://medium.com/@wavded/managing-node-js-callback-hell-1fe03ba8baf)，不说别的，在视觉上，回调金字塔会让你的代码最终超过屏幕的宽度。

promise是能够解决这个问题的，但是它解决的问题不仅仅是缩进。在讨论到如何[解决回调金字塔问题](https://www.youtube.com/watch?v=hf1T_AONQJU&feature=youtu.be)的时候，我们遇到真正的难题是回调函数剥夺了程序员使用return和throw的能力。而程序的执行流程的基础建立于一个函数在执行过程中调用另一个函数时产生的副作用。(译者注：个人对这里副作用的理解是，函数调用函数会产生函数调用栈，而回调函数是不运行在栈上的，因此不能使用return和throw)。

事实上，回调函数会做一些更邪恶的事情，它们剥夺我们在栈上执行代码的能力，而在其他语言当中，我们始终都能够在栈上执行代码。编写不在栈上运行的代码就像驾驶没有刹车的汽车一样，在你真正需要它之前，你是不会理解你有多需要它。

promise被设计为能够让我们重新使用那些编程语言的基本要素：return，throw，栈。在想要使用promise之前，我们首先要学会正确使用它。

### 新手常见错误

一些人尝试使用[漫画](http://andyshora.com/promises-angularjs-explained-as-cartoon.html)的方式解释promise，或者是像是解释名词一样解释它：它表示同步代码中的值，并且能在代码中被传递。

笔者并没有觉得这些解释对理解promise有用。笔者自己的理解是：promise是关于代码结构和代码运行流程的。因此，笔者认为展示一些常见错误，并告诉大家如何修正它才是王道。

扯远一点，对于promise不同的人有不同的理解，为了本文的最终目的，我在这里只讨论promise的官方[规范](https://promisesaplus.com/)，在较新版本的浏览器会作为window对象的一个属性被暴露出来。然而并不是所有的浏览器都支持这一特性，但是到目前为止有许多对于规范的实现，比如这个有着很嚣张的名字的promise库：[lie](https://github.com/calvinmetcalf/lie)，同时它还非常精简。

#### 新手错误No.1：回调金字塔

PouchDB有许多promise风格的API，程序员在写有关PouchDB的代码的时候，常常将promise用的一塌糊涂。下面给出一种很常见的糟糕写法。

```javascript
remote.allDocs({
    include_docs: true,
    attachment: true
}).then(functionb (result) {
    var docs = result.rows;
    docs.forEach(function(element) {
        localdb.put(element.doc).then(function(response){
            alert('pulled doc with id' + element.doc._id + 'and added to local db.');}).catch(function (err) {
        if (err.status == 409) {
            localdb.get(element.doc._id).then(function (resp) {
             localdb.remove(resp._id, resp._rev).then(function (resp) {
// et cetera...
```

你确实可以将promise当做回调函数来使用，但这却是一种杀鸡用牛刀的行为。不过这么做也是可行的。
你可能会认为这种错误是那些刚入行的新手才会犯的。但是笔者在黑莓的[开发者博客](http://devblog.blackberry.com/2015/05/connecting-to-couchbase-with-pouchdb/)上曾经看到类似的代码。过去的书写回调函数的习惯是很难改变的。

下面给出一种代码风格更好的实现：

```javascript
remotedb.allDocs(...).then(functioin (resultofAllDocs) {
    return localdb.put(...);
}).then(function (resultOfPut) {
    return localdb.get(...);
}).then(function (resultOfGet) {
    return localdb.put(...);
}).catch(function (err) {
    console.log(err);
});
```

这就是promise的链式调用，它体现promise的强大之处，每个函数在上一个promise的状态变为resolved的时候才会被调用，并且能够得到上一个promise的输出结果。稍后还有详细的解释。

#### 新手错误2：怎样用`forEach()`处理promise

这个问题是大多数人掌握promise的拦路虎，当这些人想在代码中使用他们熟悉的`forEach()`方法或者是写一个`for`循环，亦或是`while`循环的时候，都会为如何使用promise而疑惑不已。他们会写下这样的代码：

```javascript
// I want to remove() all docs
db.allDocs({include_docs: true}).then(function (result) {
    result.rows.forEach(function (row) {
        db.remove(row.doc);
    });
}).then(function () {
    // I naively believe all docs have been removed() now!
});
```

这段代码的问题在于第一个回调函数实际上返回的是`undefined`，也就意味着第二个函数并不是在所有的`db.remove()`执行结束之后才执行。事实上，第二个函数的执行不会有任何延时，它执行的时候被删除的doc数量可能为任意整数。

这段代码看起来是能够正常工作的，因此这个bug也具有一定的隐藏性。写下这段代码的人设想PouchDB已经删除了这些docs，可以更新UI了。这个bug会在一定几率下出现，或者是特定的浏览器。而且一旦出现，这种bug是很难调试的。

总结起来说，出现这个bug并不是promise的错，这个黑锅应该`forEach()`/`for`/`while`来背。这时候你需要的是`Promise.all()`

```javascript
db.allDocs({include_docs: true}).then(function (result) {
    return Promise.all(result.rows.map(function (row) {
        return db.remove(row.doc);
    }));
}).then(function (arrayObject) {
    // All docs have really been removed() now!
})
```

从根本上说，`Promise.all()`以一个promise对象组成的数组为输入，返回另一个promise对象。这个对象的状态只会在数组中所有的promise对象的状态都变为resolved的时候才会变成resolved。可以将其理解为异步的for循环。

`Promise.all()`还会将计算结果以数组的形式传递给下一个函数，这一点十分有用。举例来说，如果你想用get()方法从PouchDB得到多个值的时候，就可以利用这个特性。同时，作为输入的一系列promise对象中，如果有一个的状态变为rejected，那么`all()`返回的promise对象的状态也会变为rejected。

#### 新手错误3：忘记添加catch()方法

这是一个很常见的错误。很多程序员对他们代码中的promise调用十分自信，觉得代码永远不会抛出一个`error`，也可能他们只是简单的忘了加`catch()`方法。不幸的是，不加`catch()`方法会让回调函数中抛出的异常被吞噬，在你的控制台是看不到相应的错误的，这对调试来说是非常痛苦的。

为了避免这种糟糕的情况，我已经养成了在自己的promise调用链最后添加如下代码的习惯：

```javascript
somePromise().then(function () {
    return anotherPromise();
}).then(function () {
    return yetAnotherPromise();
}).catch(console.log.bind(console)); // <-- this is badass
```

即使你并不打算在代码中处理异常，在代码中添加`catch()`也是一个谨慎的编程风格的体现。在某种情况下你原先的假设出错的时候，这会让你的调试工作轻松一些。

#### 新手错误4：使用"deferred"

这类型[错误](http://gonehybrid.com/how-to-use-pouchdb-sqlite-for-local-storage-in-your-ionic-app/)笔者经常看到，在这里我也不想重复它了。简而言之，promise经过了很长一段时间的发展，有一定的历史包袱。JavaScript社区用了很长的时间才纠正了发展道路上的一些错误。在早些时候，jQuery和Angular都在使用'deferred'类型的promise。而在最新的ES6的Promise标准中，这种实现方式已经被替代了，同时，一些Promise的库，比如Q，bluebid，lie也是参照ES6的标准来实现的。

如果你还在代码中使用deferred的话，那么你就是走在错误的道路上了，这里笔者给出一些修正的办法。

首先，绝大多数的库都给出了将第三方库的方法包装成promise对象的方法。举例来说，Angular的$q模块可以使用`$q.when()`完成这一包装过程。因此，在Angular中，包装PouchDB的promise API的代码如下：

```javascript
$q.when(db.put(doc)).then(...) // <-- this is all the code you need
```

另一种方法就是使用暴露给程序员的[构造函数](https://blog.domenic.me/the-revealing-constructor-pattern/)。promise的构造函数能够包装那些非promise的API。下面给出一个例子，在该例中将node.js提供的`fs.readFile()`方法包装成promise。

```javascript
new Promise(function (resolve, reject) {
    fs.readFile('myfile.txt', function (err, file) {
        if (err) {
            return reject(err);
        }
        resolve(file);
    });
}).then(...)
```

齐活！

> 如果你想更多的了解为什么这样的写法是一个反模式，猛戳这里[the Bluebird wiki page on promise anti-patterns](https://github.com/petkaantonov/bluebird/wiki/Promise-anti-patterns#the-deferred-anti-pattern)

#### 新手错误5：不显式调用return

下面这段代码的问题在哪里？

```javascript
somePromise().then(function () {
    someOtherPromise();
}).then(function () {
    // Gee, I hope someOtherPromise() has resolved
    // Spoiler alert: it hasn't
});
```

Ok，现在是时候讨论所有需要了解的关于promise的知识点了。理解了这一个知识点，笔者提到的一些错误你都不会犯了。

就像我之前说过的，promise的神奇之处在于让我们能够在回调函数里面使用return和throw。但是实践的时候是什么样子呢？

每一个promise对象都会提供一个then方法或者是catch方法：

```javascript
somePromise().then(function () {
    // I'm inside a then() function!
});
```

在then方法内部，我们可以做三件事：

1.`return`一个promise对象
2.`return`一个同步的值或者是`undefined`
3.同步的`throw`一个错误

理解这三种情况之后，你就会理解promise了。

1.返回另一个promise对象

在有关promise的相关文章中，这种写法很常见，就像上文提到的构成promise链的一段代码：

```javascript
getUserByName('nolan').then(function (user) {
    return getUserAccountById(user.id);
}).then(funcxtion (userAccount) {
});
```

这段代码里面的return非常关键，没有这个return的话，getUserAccountById只是一个普通的被别的函数调用的函数。下一个回调函数会接收到undefined而不是userAccount

2.返回一个同步的值或者是`undefined`

返回一个`undefined`大多数情况下是错误的，但是返回一个同步的值确实是一个将同步代码转化成promise风格代码的好方法。举个例子，现在在内存中有users。我们可以：

```javascript
getUserByName('nolan').then(fcuntion (user) {
    if (inMemoryCache[user.id]) {
        return inMemoryCache[user.id];  // returning a synchronous value!
    }
    return inMemoryCache[user.id]; // returning a promise
}).then(function (userAccount) {
    // I got a user account
})
```

第二个回调函数并不关心userAccount是通过同步的方式得到的还是异步的方式得到的，而第一个回调函数即可以返回同步的值又可以返回异步的值。

不幸的是，如果不显式调用return语句的话，javaScript里的函数会返回`undefined`。这也就意味着在你想返回一些值的时候，不显式调用return会产生一些副作用。

出于上述原因，笔者养成了一个个人习惯就是在then方法内部永远显式的调用return或者throw。笔者也推荐你这样做。

3.抛出一个同步的错误

说到throw，这又体现了promise的功能强大。在用户退出的情况下，我们的代码中会采用抛出异常的方式进行处理：

```javascript
getUserByName('nolan').then(function (user) {
  if (user.isLoggedOut()) {
    throw new Error('user logged out!'); // throwing a synchronous error!
  }
  if (inMemoryCache[user.id]) {
    return inMemoryCache[user.id];       // returning a synchronous value!
  }
  return getUserAccountById(user.id);    // returning a promise!
}).then(function (userAccount) {
  // I got a user account!
}).catch(function (err) {
  // Boo, I got an error!
});
```

如果用户已经登出的话，`catch()`会收到一个同步的错误，如果有promise对象的状态变为rejected的话，它还会收到一个异步的错误。`catch()`的回调函数不用关心错误是异步的还是同步的。

在使用promise的时候抛出异常在开发阶段很有用，它能帮助我们定位代码中的错误。比方说，在then函数内部调用`JSON.parse（）`，如果JSON对象不合法的话，可能会抛出异常，在回调函数中，这个异常会被吞噬，但是在使用promise之后，我们就可以捕获到这个异常了。

### 进阶错误

接下来我们讨论一下使用promise的边界情况。

下面的错误笔者将他们归类为"进阶错误"，因为这些错误发生在那些已经相对熟练使用promise的程序员身上。但是为了解决本文开头提出的问题，还是有必要对其进行讨论。

#### 进阶错误1：不了解Promise.resolve()

就像之前所说的，promise能够将同步代码包装成异步的形式。然而，如果你经常写出如下的代码：

```javascript
new Promise(function (resolve, reject) {
  resolve(someSynchronousValue);
}).then(...);
```

你可以使用`Promise.resolve()`将上述代码精简。

```javascript
Promise.resolve(someSynchronousValue).then(...);
```

在捕获同步异常的时候这个做法也是很有效的。我在编写API的时候已经养成了使用`Promise.resolve()`的习惯：

```javascript
function somePromiseAPI() {
  return Promise.resolve().then(function () {
    doSomethingThatMayThrow();
    return 'foo';
  }).then(...);
}
```

记住，有可能抛出错误的代码都有可能因为错误被吞噬而对你的工作造成困扰。但是如果你用`Promise.resolve()`包装了代码的话，你永远都可以在代码后面加上`catch()`。

相同的，使用`Promise.reject()`可以立即返回一个状态为rejected的promise对象。

```javascript
Promise.reject(new Error('some awful error'));
```

#### 进阶错误2：`cacth()`和`then(null, ...)`并不完全相同

笔者提到过过`cacth()`是`then(null, ...)`的语法糖，因此下面两个代码片段是等价的

```javascript
somePromise().catch(function (err) {
  // handle error
});

somePromise().then(null, function (err) {
  // handle error
});
```

但是，这并不意味着下面的两个代码片段是等价的

```javascript
somePromise().then(function () {
  return someOtherPromise();
}).catch(function (err) {
  // handle error
});

somePromise().then(function () {
  return someOtherPromise();
}, function (err) {
  // handle error
});
```

如果你不理解的话，那么请思考一下如果第一个回调函数抛出一个错误会发生什么？

```javascript
somePromise().then(function () {
  throw new Error('oh noes');
}).catch(function (err) {
  // I caught your error! :)
});

somePromise().then(function () {
  throw new Error('oh noes');
}, function (err) {
  // I didn't catch your error! :(
});
```

结论就是，当使用`then(resolveHandler, rejectHandler) `，`rejectHandler`不会捕获在`resolveHandler`中抛出的错误。

因为，笔者的个人习惯是从不使用then方法的第二个参数，转而使用`catch()`方法。但是也有例外，就是在笔者写异步的[Mocha](http://mochajs.org/)的测试用例的时候，如果想确认一个错误被抛出的话，代码是这样的：

```javascript
it('should throw an error', function () {
  return doSomethingThatThrows().then(function () {
    throw new Error('I expected an error!');
  }, function (err) {
    should.exist(err);
  });
});
```

说到测试，将mocha和Chai联合使用是一种很好的测试promise API的方案。

#### 进阶错误3：promise vs promise factories
某些情况下你想一个接一个的执行一系列promise，这时候你想要一个类似于`Promise.all()`的方法，但是`Proimise.all()`是并行执行的，不符合要求。你可能一时脑抽写下这样的代码：

```javascript
function executeSequentially(promises) {
  var result = Promise.resolve();
  promises.forEach(function (promise) {
    result = result.then(promise);
  });
  return result;
}
```

不幸的是，这段代码不会按照你所想的那样执行，那些promise对象里的异步调用还是会并行的执行。原因是你根本不应当在promise对象组成的数组这个层级上操作。对于每个promise对象来说，一旦它被创建，相关的异步代码就开始执行了。因此，这里你真正想要的是一个promise工厂。

```javascript
function executeSequentially(promiseFactories) {
  var result = Promise.resolve();
  promiseFactories.forEach(function (promiseFactory) {
    result = result.then(promiseFactory);
  });
  return result;
}
```

一个promise工厂非常简单，它就是一个返回promise对象的函数

```javascript
function myPromiseFactory() {
  return somethingThatCreatesAPromise();
}
```

为什么采用promise对象就可以达到目的呢？因为promise工厂只有在调用的时候才会创建promise对象。它和`then()`方法的工作方式很像，事实上，它们就是一样的东西。

#### 进阶错误4：如果我想要两个promise的结果应当如何做呢？

很多时候，一个promise的执行是依赖另一个promise的。但是在某些情况下，我们想得到两个promise的执行结果，比方说：

```javascript
getUserByName('nolan').then(function (user) {
  return getUserAccountById(user.id);
}).then(function (userAccount) {
  // dangit, I need the "user" object too!
});
```

为了避免产生回调金字塔，我们可能会在外层作用域存储user对象。

```javascript
var user;
getUserByName('nolan').then(function (result) {
  user = result;
  return getUserAccountById(user.id);
}).then(function (userAccount) {
  // okay, I have both the "user" and the "userAccount"
});
```

上面的代码能够到达想要的效果，但是这种实现有一点不正式的成分在里面，我的建议是，这时候需要抛开成见，拥抱回调金字塔：

```javascript
getUserByName('nolan').then(function (user) {
  return getUserAccountById(user.id).then(function (userAccount) {
    // okay, I have both the "user" and the "userAccount"
  });
});
```

至少，是暂时拥抱回调金字塔。如果缩进真的成为了你代码中的一个大问题，那么你可以像每一个JavaScript程序员从开始写代码起就被教导的一样，将其中的部分抽出来作为一个单独的函数。

```javascript
function onGetUserAndUserAccount(user, userAccount) {
  return doSomething(user, userAccount);
}

function onGetUser(user) {
  return getUserAccountById(user.id).then(function (userAccount) {
    return onGetUserAndUserAccount(user, userAccount);
  });
}

getUserByName('nolan')
  .then(onGetUser)
  .then(function () {
  // at this point, doSomething() is done, and we are back to indentation 0
});
```

随着你的promise代码越来越复杂，你会将越来越多的代码作为函数抽离出来。笔者发现这会促进代码风格变得优美：

```javascript
putYourRightFootIn()
  .then(putYourRightFootOut)
  .then(putYourRightFootIn)  
  .then(shakeItAllAbout);
```

这就是promise的最终目的。

#### 进阶错误5：promise坠落现象

这个错误我在前文中提到的问题中间接的给出了。这个情况比较深奥，或许你永远写不出这样的代码，但是这种写法还是让笔者感到震惊。
你认为下面的代码会输出什么？

```javascript
Promise.resolve('foo').then(Promise.resolve('bar')).then(function (result) {
  console.log(result);
});
```

如果你认为输出的是bar，那么你就错了。实际上它输出的是foo！

产生这样的输出是因为你给then方法传递了一个非函数（比如promise对象）的值，代码会这样理解：`then(null)`，因此导致前一个promise的结果产生了坠落的效果。你可以自己测试一下：

```javascript
Promise.resolve('foo').then(null).then(function (result) {
  console.log(result);
});
```

随便添加任意多个`then(null)`，结果都是不变的

让我们回到之前讲解promise vs promise factoriesde的地方。简而言之，如果你直接给then方法传递一个promise对象，代码的运行是和你所想的不一样的。then方法应当接受一个函数作为参数。因此你应当这样书写代码：

```javascript
Promise.resolve('foo').then(function () {
  return Promise.resolve('bar');
}).then(function (result) {
  console.log(result);
});
```

这样就会如愿输出bar。

### 答案来了！

下面给出前文题目的解答

\#1

```
doSomething().then(function () {
  return doSomethingElse();
}).then(finalHandler);
```
答案：
```
doSomething
|-----------------|
                  doSomethingElse(undefined)
                  |------------------|
                                     finalHandler(resultOfDoSomethingElse)
                                     |------------------|
```

\#2

```
doSomething().then(function () {
  doSomethingElse();
}).then(finalHandler);
```

答案：

```
doSomething
|-----------------|
                  doSomethingElse(undefined)
                  |------------------|
                  finalHandler(undefined)
                  |------------------|
```

\#3

```
doSomething().then(doSomethingElse())
  .then(finalHandler);
```

答案

```
doSomething
|-----------------|
doSomethingElse(undefined)
|---------------------------------|
                  finalHandler(resultOfDoSomething)
                  |------------------|
```

\#4

```
doSomething().then(doSomethingElse)
  .then(finalHandler);
```

答案

```
doSomething
|-----------------|
                  doSomethingElse(resultOfDoSomething)
                  |------------------|
                                     finalHandler(resultOfDoSomethingElse)
                                     |------------------|
```

> 需要说明的是，在上述的例子中，我都假设`doSomething()`和`doSomethingElse()`返回一个promise对象，这些promise对象都代表了一个异步操作，这样的操作会在当前event loop之外结束，比如说有关IndexedDB，network的操作，或者是使用`setTimeout`。这里给出[JSBin](http://jsbin.com/tuqukakawo/1/edit?js,console,output)上的示例。

### 最后再说两句

promise是个好东西。如果你还在使用传统的回调函数的话，我建议你迁移到promise上。这样你的代码会更简介，更优雅，可读性也更强。

有这样的观点：promise是不完美的。promise确实比使用回调函数好，但是，如果你有别的选择的话，这两种方式最好都不要用。

尽管相比回调函数有许多优点，promise仍然是难于理解的，并且使用起来很容易出错。新手和老鸟都会经常将promise用的乱七八糟。不过说真的，这不是他们的错，应该甩锅给promise。因为它和我们在同步环境的代码很像，但仅仅是像，是一个优雅的替代品。

在同步环境下，你无需学习这些令人费解的规则和一些新的API。你可以随意使用像return，catch，throw这样的关键字以及for循环。你不需要时刻在脑中保持两个相并列的编程思想。

### 等待async/await

笔者在了解了ES7中的async和await关键字，以及它们是如何将promise的思想融入到语言本身当中之后，写了这样一篇博文[用ES7驯服异步这个猛兽](http://pouchdb.com/2015/03/05/taming-the-async-beast-with-es7.html)。使用ES7，我们将没有必要再写catch()这样的伪同步的代码，我们将能使用try/catch/return这样的关键字，就像刚开始学计算机那样。

这对JavaScript这门语言来说是很好的，因为到头来，只要没有工具提醒我们，这些promise的反模式会持续出现。

从JavaScript发展历史中距离来说，笔者认为JSLint和JSHint对社区的贡献要大于[JavaScript:The Good Parts](http://www.amazon.com/dp/0596517742/ref=cm_sw_su_dp)，尽管它们实际上包含的信息是相同的。区别就在于使用工具可以告诉程序员代码中所犯的错误，而阅读却是让你了解别人犯的错误。

ES7中的async和await关键字的美妙之处在于，你代码中的错误将会成为语法错误或者是编译错误，而不是细微的运行时错误。到了那时，我们会完全掌握promise究竟能做什么，以及在ES5和ES6中如何合理的应用。
