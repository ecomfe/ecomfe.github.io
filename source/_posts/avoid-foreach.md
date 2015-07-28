---
title: 避免使用 forEach
date: 2015-07-28
author: yaochang
tags:
- JavaScript
- forEach
---

原文：http://aeflash.com/2014-11/avoid-foreach.html

> 遍历集合，会产生副作用。——如 [mori.each 文档](http://swannodette.github.io/mori/#each)所说

First of all, this post is not about performance. for-loops will always be faster than Array.forEach. If profiling reveals that the overhead of iteration is significant enough and performance is paramount, then you should definitely avoid forEach and use a for-loop. (I would also add that always using a for-loop is the quintessential premature optimization. You can still iterate through a 50-element array in one microsecond) This post is about coding style, not about performance — about an observation I've made about forEach in relation to the other Array.prototype methods.

首先声明，本文和性能无关。执行 `for` 循环总是比执行 `Array.forEach` 快。如果性能测试显示迭代的开销足够显著并且性能优先，那么你绝对应该使用 `for` 循环而不是 `forEach`（总是使用 `for` 循环是典型的过早优化。`forEach` 仍然可以在 1 微秒内遍历长度为 50 的数组）。本文和编码风格有关，是我对 `forEach` 和其它 `Array.prototype` 方法的思考，与性能无关。

### forEach 为副作用而生

[].forEach or _.each is usually the first method that people turn to when refactoring imperative code to a more functional style. forEach is a direct analog to the most basic for loop — iterating over an array and doing something — so it is a pretty mechanical transformation. But, like a for-loop, forEach must have a side effect somewhere else in your program for it to accomplish anything. It has to modify an object in a parent scope, or call an external method, or invoke a function, or otherwise interface with something external to the iterator function. Using forEach also means your iterator function is inherently coupled to the scope in which it is defined.

当人们想要把代码重构成一个更加实用的风格时，往往首选 `[].forEach` 或 `_.each`。`forEach` 直接模拟最基本的 `for` 循环——遍历数组并且执行一些操作——所以它是一个很机械的转换。但是就像 `for` 循环一样，`forEach` 在程序的某个地方必定会产生副作用。它必须修改父作用域中的对象，或者调用一个外部方法，或者使用迭代函数以外的其它变量。使用 `forEach` 也意味着你的迭代函数和它所在的作用域产生了耦合。

Side effects are generally considered bad in programming. They make programs harder to reason about, can lead to bugs, and make refactoring difficult. Granted, forEach usually introduces minor side effects in the grand scheme of things, but they are unnecessary side effects.

在编程中，我们通常认为副作用是不好的。他们使程序更难理解，可能导致 bug 的产生，而且难以重构。当然，`forEach` 在大项目中引起的副作用是微不足道的，但是这些副作用是不必要的。

There are also cases where you do want side effects, or side effects are unavoidable.

当然也有一些副作用是无法避免的。

```javascript
arr.forEach(function (item) {
    console.log(item);
});
```

This is perfectly acceptable.

这种情况完全可以接受。

### forEach Hides the Purpose of Iteration

### `forEach` 隐藏了迭代的意图

When reading code and coming across an invocation of forEach, at first you do not know what it is trying to accomplish. All you know is that it causes at least one side effect somewhere. You then must read the code and/or comments to understand what is going on. It is a un-semantic method.

阅读 `forEach` 代码段的时候，你并不能马上知道它的作用，只知道它会在某个地方产生副作用，然后必须阅读这段代码或者注释才明白。这是一个非语义的方法。

There are better iteration functions. There is map, which creates a new array with the results of a function applied. There is filter which returns a (usually) smaller array based on the results of the supplied predicate. There is some (or _.any) which returns true if any of the elements match a predicate. There is every (or _.all) which returns true if all the elements match a predicate. There is reduce which iterates over an array and progressively builds a single other thing, with which you can create the other basic iteration methods. Hopefully this is not news to you, the ES5 Array methods are very powerful. The Lodash/Underscore libraries also augment these basic ES5 methods with more useful and semantic iteration functions (as well as providing better performing implementations of the built-in Array.prototype methods that also work on Objects).

除了 `forEach`，还有更好的迭代方法。比如 `map`——在使用迭代函数以后会返回一个新数组；比如 `filter`——返回由符合条件的元素组成的新数组；比如 `some`（或者 `_.any`）——如果数组中至少有一个元素满足要求时返回 `true`；比如 `every`（或者 `_.all`）——如果数组中所有元素满足要求时返回 `true`；比如 `reduce`——遍历数组并且使用数组中的所有元素进行某种操作迭代生成一个新的变量，数组中的很多方法都可以用 `reduce` 来实现。ES5 的数组方法非常强大，希望你对此并不陌生。[Lodash](https://lodash.com/)/Underscore 库增强了 ES5 的方法，增加了很多有用且语义化的迭代函数（此外还提供了可用于对象的数组原型方法的更优实现）。

### Refactoring
### 重构

Here are a several example usages of each, taken from actual projects, and how to refactor them into something better.

下面是一些实际项目中使用 `each` 的例子，看看如何更好地重构它们。

#### Example 1

#### 例 1


```javascript
var obj = {};

arr.forEach(function (item) {
    obj[item.key] = item;
});
```

A very common operation — building an object out of an array. This usage of forEach is coupled to its scope, since it relies on obj. The iterator function couldn't be reused outside of its current closure scope. Here is a way to rewrite it:

这是一个很常见的操作——将数组转换为对象。由于迭代函数依赖 `obj`，所以 `forEach` 跟它所在的作用域耦合在一起。迭代函数不能在它的闭包作用域之外执行。我们换个方式来重写它：

```javascript
var obj = arr.reduce(function (newObj, item) {
    newObj[item.key] = item;
    return newObj;
}, {});
```

Now the reducing function only relies on its arguments and nothing else. reduce is the basic building block of side-effect-free iteration: iterate over a collection and produce a single other something. It is the least semantic of the ES5 methods, but it is flexible. It is possible implement all of the others in terms of reduce.

现在归并函数只依赖于它的形参，没有别的。`reduce` 无副作用——遍历集合，并且只产出一个东西。它是 ES5 方法中最不语义的方法，但它很灵活，可以用来实现所有其余的函数。

Using Lodash, a more semantic way to write this might be:

Lodash 还有更语义化的写法：

```javascript
var obj  = _.zipObject(_.pluck(arr, 'key'), arr);
```

It does require 2 iterations, but it is more expressive.

这里需要遍历2次，但是看起来更直观。

> 译者注：实际上有更好的方法
```javascript
var obj = _.indexBy(arr, 'key');
```

#### Example 2

#### 例 2

```javascript
var replacement = 'foo';
var replacedUrls = urls;

urls.forEach(function replaceToken(url, index) {
    replacedUrls[index] = url.replace('{token}', replacement);
});
```

This is a simple use case for map:

用 `map` 重构：

```javascript
var replacement = 'foo';
var replacedUrls;

replacedUrls = urls.map(function (url) {
    return url.replace('{token}', replacement);
});
```

The mapping function still relies on the closure scope for the replacement, but the intent of iteration is more clear. The initial implementation also re-uses the original array, whereas the map implementation allocates a new one. Notice that it might not be immediately obvious that urls was modified. Elsewhere in the code, something might expect urls to still contain the tokens. Always allocating a new Array prevents this subtle detail from becoming an issue, at the cost of slightly higher memory usage.

`map` 函数仍然依赖于 `replacement` 的作用域，但是迭代的意图更加清晰。前一种方法改变了 `urls` 数组，而 `map` 函数则分配了一个新的数组。需要注意的是，它对 `urls` 的修改不易被察觉，其它地方可能仍然期望 `urls` 中会含有 `{token}`。采用分配新数组的方法可以防止这个小细节引发的问题，代价就是需要多一点内存开销。


#### Example 3

#### 例 3

```javascript
var html = '';
var self = this;

_.each(this.values, function (value) {
    var id = 'radio_button_' + self.groupName + '_' + value.id;

    html += ''
        + '<li>'
        +   '<input type="radio" name="' + self.groupName + '" id="' + id + '" value="' + value.id + '">'
        +   '<label for="' + id + '">' + value.description + '</label>'
        + '</li>';

    if (!touchEnabled) {
        var tooltip = value.getTooltip();
        if (tooltip) {
            self.tooltips.push(tooltip);
        }
    }
});
```

A more complicated example. This is actually doing two things: building a HTML string, and creating tooltips for each value. The iterator function is unnecessarily complicated — or "complected" [as Rich Hickey would say](http://www.infoq.com/presentations/Simple-Made-Easy). It wraps the two operations together, when it doesn't need to. The first part is a classic use for reduce, so lets split up the two operations:

这个例子稍微复杂一点。这段代码实际上做了两件事：拼接 HTML 字符串，为每一个 `value` 创建 `tooltips`。其实迭代函数没必要这么复杂——或者如 Rich Hickey 所说的 「[complected](http://www.infoq.com/presentations/Simple-Made-Easy)」。它将两种操作放在一个函数里，而实际上没有必要。第一部分操作是典型的 `reduce` 函数的应用范围，所以我们把这两部分操作分开：

```javascript
var html;
var self = this;

html = _.reduce(this.values, function (str, value) {
    var id = 'radio_button_' + self.groupName + '_' + value.id;

    str += ''
        + '<li>'
        +   '<input type="radio" name="' + self.groupName + '" id="' + id + '" value="' + value.id + '">'
        +   '<label for="' + id + '">' + value.description + '</label>'
        + '</li>';

    return str;
}, '');

_.each(this.values, function (value) {

    if (!touchEnabled) {
        var tooltip = value.getTooltip();
        if (tooltip) {
            self.tooltips.push(tooltip);
        }
    }
});
```

The first part is pretty acceptable. We are iterating over the values and producing a single HTML string. It still relies on self.groupName, but with some partial application you could do away with it.

现在第一部分就可以接受了。在 `values` 上迭代，最后生成 HTML 字符串。它仍然依赖于 `self.groupName`，不过可以通过偏函数（[partial application](https://en.wikipedia.org/wiki/Partial_application)）来避免。

> 译者注：Underscore 中提供了偏函数 `_.partial` 可以帮助我们解决这个问题，相应的代码如下：

```javascript
var part = _.partial(function (groupName, str, value) {
  // ....
}, self.groupName);

_.reduce(this.values, part, '');
```

Now let's focus on the second operation. If touch is enabled, we get the tooltip. This may or may not return a valid tooltip, so we conditionally push it to the instance's list of tooltips. We can fix this by chaining functions together:

现在来看一下第二部分。如果 `touchEnabled` 为假，可以得到 `tooltip`。这时不确定会不会返回一个有效的 `tooltip`，因此将每个实例对应的 `tooltip` 放进数组中的操作是带条件的。我们可以把多个方法串联起来解决这个问题：

```javascript
if (!touchEnabled) {
    this.tooltips = this.tooltips.concat(
        this.values
            .map(function (value) {
                return value.getTooltip();
            })
            .filter(_.identity)
    );
}
```

We move the touch check outside of the iteration since we only need to do it once. We then map over the collection and call getTooltip() on each value, and then filter out the non-truthy values. The result is concatenated with the existing tooltips. This method does create an intermediate array for each step, but as I said in the other example, expressiveness and clarity matters more.

我们将 touch 检查移到循环的外面，因为只需要检查一次就够了。然后对集合使用 `map` 方法，在每次迭代中调用 `getTooltip()`，然后过滤掉不符合条件的值。最后结果合并到 `tooltips` 数组。这种方法每次都会创建临时数组，但是正如我在其它例子中所说的，表达清晰更重要。

You could do away with the inline function definition if you defined another helper method:

你可以定义一个辅助函数把上面的内联函数去掉：

```javascript
var dot = _.curry(function (methodName, object) {
    return object[methodName]();
});

// ...
this.tooltips = this.tooltips.concat(
    this.values
        .map(dot('getTooltip'))
        .filter(_.identity));
```

More concise and more expressive.

这样更简洁直观。

> 译者注：这里其实可以直接用 `_.invoke` 函数和 `_.union` 函数，更加简洁。
```javascript
this.tooltips = _.union(this.tooltips, _.filter(_.invoke(this.values, 'getTooltip'), _.identity));
```

#### Example 4

#### 例 4

```javascript
var matches = [];
var nonMatches = [];

values.forEach(function(value) {
    if (matchesSomething(value)) {
        matches.push(value);
    }
    else {
        nonMatches.push(value);
    }
});
```
Seems pretty simple — split an array into two new arrays based on whether an item matches a predicate. But it is not as simple as it could be. I would rewrite it like this:

这个例子看起来很简单——基于判断条件将数组拆分成两个。但还不够简单。我会这样重写：

```javascript
var matches = values.filter(matchesSomething);
var nonMatches = values.filter(not(matchesSomething));
```

The iterator function is really doing two things. It is more clear to separate it out into two separate iterations. I would only keep the first implementation if there were literally thousands of values, or matchesSomething was very expensive.

迭代函数实际上在做两件事，拆分成两个迭代函数更加清晰。如果确实有成千上万的值，或者 `matchesSomething` 操作非常耗时，我会保留第一种方案。

> 译者注：这段代码其实可以用 `reduce` 加以改进：

```js
var result = values.reduce(function (result, value) {
    if (matchesSomething(value)) {
        result.matches.push(value);
    }
    else {
        result.nonMatches.push(value);
    }
}, {matches: [], nonMatches: []});
```

When refactoring you may notice that you do end up with more things, but if these things are simpler, then it is okay. Simpler things that compose are easier to reason about than fewer (but more complicated) things.

重构时你会发现多了些东西，如果这些东西使程序更简单，那就没问题。多个简单的东西组合起来会比一个大而复杂的东西更容易理解。

### Transducers

### 转换器

Recall the final result of Example 3:

让我们再看一下例 3 的最终代码：

```javascript
this.tooltips = this.tooltips.concat(this.values
    .map(dot('getTooltip'))
    .filter(_.identity));
```

Chaining map and filter means an intermediate array is created and discarded. For small arrays, or small numbers of map() and filter() steps, this is fine. The extra overhead is negligible. But what if you had an array of thousands of values, or dozens of mapping and filtering steps? Suddenly a single iterator is looking attractive again...

`map` 和 `filter` 的串联操作意味着临时数组的创建和删除。对于元素较少的数组来说是可以接受的，额外的开销可以忽略不计。但是如果这个数组包含了数千个元素，或者要做很多次的映射和过滤操作呢？这时单一的迭代函数又变得诱人了。

Luckily, with the advent of [transducers](http://blog.cognitect.com/blog/2014/8/6/transducers-are-coming), you can chain together arbitrarily many mapping and filtering operations in a single iteration. I won't get into how transducers work here ([This is a good introduction.](http://phuu.net/2014/08/31/csp-and-transducers.html)), but the end result would look like this:

幸运的是，随着 [Transducers](http://blog.cognitect.com/blog/2014/8/6/transducers-are-coming)（其实是 transform 和 reducer 的合成词，transform 是变换，reducer 就是 JS 中的 reducer）的出现，你可以任性地将很多 `map` 和 `filter` 函数放在一个迭代中。也就是说，先在第一个元素上应用所有变换（`map` 和 `filter` 或者其它），然后依次处理其它元素。本文中不会深入研究 Transducers 的原理（[这里有关于它的介绍](http://phuu.net/2014/08/31/csp-and-transducers.html)），不过经过 Transducers 改造以后会是这样：

```javascript
var t = require('transducers-js');

var tooltips = t.transduce(
    t.comp( // 变换函数
        t.map(dot('getTooltip')),
        t.filter(_.identity),
        // 想加多少map和filter就加多少
        t.map(someFunction),
        t.filter(somePredicate)
    ),
    concat, // reducer
    [], // 初始值
    values // 输入
);
```

It looks a bit different, has a similar flavor to reduce, but it only involves a single iteration, and only allocates one extra array: the initial one you pass to it. You can comp together as many maps or filters as you want and it will only iterate once. You can also make it return any type of result by swapping out concat with any reducer function that takes in two values and returns one. I'd strongly recommend more in depth reads if you want to know more.

它看上去有点不一样，和 `reduce` 类似，但是它只涉及到一个迭代器，而且只分配了一个唯一的数组。你想加入多少 `map` 和 `filter`，就加入多少，它只会迭代一次。通过使用其它函数替换 `concat`，你也可以让它返回任何类型的结果。如果你想了解更多，那就深入地研究一下 `Transducers` 吧。

> 译者注：有了 ES6 的 Generator，这事就是原生支持的了。

## 总结

- forEach is for side effects. If you want to avoid side effects, avoid forEach.

- `forEach` 总会产生副作用。如果你想避免产生副作用，那就不要使用它了。

- forEach hides the intent behind iteration. Use a more semantic iteration methods, such as map, filter, or some.

- `forEach` 隐藏了迭代的意图。推荐使用更加语义化的迭代方法，例如 `map`、`filter` 和 `some`。

- If your operation does many things in one iteration pass, separate it out into many operations.

- 如果每次迭代包含了太多操作，将它们拆分到不同的函数中。

- Chain methods together to isolate individual transformations. Use transducers if it gets crazy.

- 通过多个方法的串联调用，将不同的数据转换隔离开来。如果性能不可接受，那就使用 Transducers 重构它。

- You will end up with more operations, but if you do things right, each step will be simpler and easier to reason about.

- 改造后的程序最终会多了操作，但是如果你处理得当，那么每一步都会更容易理解。

- If you do need side effects, forEach is perfectly fine.

- 如果你确实需要循环产生的副作用，完全可以用 `forEach`。

- In the end, if profiling reveals that more semantic iteration functions are a bottleneck or in a hot code path, just use for-loops.

- 最后，如果性能测试表明更加语义化的迭代函数是性能瓶颈或者被频繁执行， 那就用 `for` 循环好了。
