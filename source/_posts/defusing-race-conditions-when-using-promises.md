---
title: 化解使用 Promise 时的竞态条件
date: 2015-11-26
author: zhouqinghuai
author_link: http://weibo.com/presidentsZhou
tags:
- JavaScript
- promise

---


原文：https://quickleft.com/blog/defusing-race-conditions-when-using-promises/


网络时代，创建现代软件时其中一个很大的限制是所需要的数据往往在远程服务器上。应用程序在等待网络请求时简单地锁死是不现实（甚至不可能）的。相反，我们必须让应用程序在等待时保持响应。。


为此，我们需要写出并发的代码。当应用的某一部分正在等待网络请求的响应时，其他部分必须继续运行。 [Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise) 对于编写非阻塞型的代码是很不错的工具，而且你的浏览器就支持这个。

Promise 能让潜在可怕的异步代码变得非常友好。下面假设一个博客的文章视图这样从远程服务器加载一篇文章并显示它：

```javascript
// Called from `componentWillMount` and `componentWillReceiveProps`:
ArticleView.prototype.updateArticle = function (props) {
    this.setState({
        error: null,
        title: null,
        body: null
    });
    ArticleStore.fetch(props.articleID).then(article => {
        this.setState({
            title: article.title,
            body: article.body
        });
    }).catch(err => {
        this.setState({ error: 'Oh Noes!' });
    });
};

```


注意：这个例子使用了 React，但是这个概念适用于绝大多数前端视图系统。


这样的代码是很优雅的。许多复杂的异步调用消失了，取而代之的是直接明了的代码。然而，使用 promise 并不能保证代码是正确的。



**注意到我例子中引入的不易察觉的竞态条件了吗？**


提示：竞态条件出现的原因是无法保证异步操作的完成会按照他们开始时同样的顺序。

<!-- more -->

### 轮子掉了

为了阐明竞态条件，假设有这样一个左侧是文章列表，右侧是选中的文章内容的博客：
![App with Article 1 Selected](/blog/defusing-race-conditions-when-using-promises/img/img1.png)


让我们从第一个选中的文章标题开始。然后，选中第二个文章标题。该应用发送一个请求去加载文章的内容（this.store.fetchArticle(2)），并且用户可以看见一个加载的指示器，就像这样：
![App with Article 2 Selected](/blog/defusing-race-conditions-when-using-promises/img/img2.png)

因为网络原因，文章内容的加载需要一小会儿。数秒之后，用户觉得厌烦就（又）选择了第一篇文章。由于这篇文章已经加载过，它的内容几乎立即显示，应用仿佛回到最开始的状态。
![App with Article 1 Reselected](/blog/defusing-race-conditions-when-using-promises/img/img3.png)


但是接着发生了奇怪的事情：应用最终收到了第二篇文章的内容，文章视图只好尽职地更新它的标题和主体来显示新加载的内容，导致用户看到这样的厌恶的东西：
![App with Article 1 Selected but Article 2 Displayed](/blog/defusing-race-conditions-when-using-promises/img/img4.png)


文章列表（也可能是 URL 和其他 UI 元素）表明选中的是第一篇文章，但是用户看到的却是第二篇文章的内容。


这个问题很严重，更糟糕的是在开发环境你未必能发现。在你的本机上（或者本局域网等等），加载更快而且更少出现意外。因此，代码运行时，在等待请求完成的过程中你很可能不会觉得厌烦。

### 装回轮子


首先要明白发生了什么才能解决这个问题。我们遇到的竞态条件过程如下：
1.在状态 A 时开始异步操作（选中第二篇文章）。
2.应用变换至状态 B （选中第一篇文章）。
3.异步操作完成，然而代码仍然按应用处于状态 A 来处理。

找出问题之后，我们就可以设计解决方案了。跟绝大多数 bug 一样，也有很多备选方案。理想的方案是从一开始就杜绝产生 bug 的可能。例如，很多路由库将 promise 作为路由选择的一部分，从而避免了此类 bug。如果你手上有这样的工具可以直接使用。

然而，在这种情况下需要我们自行管理这些 promise。这里要杜绝产生竞态条件不大现实，所以只好退而求其次，使竞态条件简单明了的抵消。

我最喜欢的『简单明了』的方案是这样的：
1.异步操作开始时记录应用的相关状态。
2.异步操作完成后校验应用是否仍处于同一状态。

举例如下：

```javascript
ArticleView.prototype.updateArticle = function (props) {
    this.setState({
        error: null,
        title: null,
        body: null
    });
    // 记录应用的状态:
    var id = props.articleID;

    ArticleStore.fetch(id).then(article => {

        // 校验应用的状态:
        if (this.props.articleID !== id) return;

        this.setState({
            title: article.title,
            body:article.body
        });
    }).catch(err => {
        // 校验应用的状态:
        if (this.props.articleID !== id) return;

        this.setState({
            error: 'Oh Noes!'
        });
    });
};
```

之所以喜欢这个方案是因为记录和校验状态的所有代码都在一块，正好紧挨着异步操作的代码。

### 结语


这个问题并不是基于 promise 的代码特有的，Node 式的回调代码也有同样的问题。基于 promise 的代码看起来越来越无害处，尽管它能轻松避免这样的问题。虽然我很乐意使用 [async 函数和 await 关键字](https://github.com/lukehoban/ecmascript-asyncawait)，但有点担心他们更容易导致忽略这些问题(这里有个[例子](https://gist.github.com/nonsensery/847be84fcae9b57e6af3))：


我在本文中所举的例子并非子虚乌有，它来自我在实际产品应用中看到的代码。


异步代码是开发者最难搞懂的事情之一 。执行顺序的数量会随着异步操作的数量呈指数增长，很快使代码变得非常的复杂。


如果可能，利用平台或框架级的抽象来管理因此增加的复杂性。否则，最好将异步操作当做严格的界限。（异步操作完成）代码恢复时，将一切都当成已改变，因为它也许改变了。
