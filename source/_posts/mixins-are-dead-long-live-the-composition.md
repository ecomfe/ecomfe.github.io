---
title: Mixin 已死，Composition 万岁
date: 2016-01-14
author: huyao
author_link: http://weibo.com/ever20110408?is_all=1
tags:
- React
- mixin
- JavaScript
- 高阶组合
---

原文：[Mixins Are Dead. Long Live Composition](https://medium.com/@dan_abramov/mixins-are-dead-long-live-higher-order-components-94a0d2f9e750)
 
  当 React 0.13 推出的时候，大家都震惊了。
  
  它的开篇表达得很明确，mixin 正在逐步退出历史舞台：

> 不好意思，React ES6 将不再支持mixin，否则有悖 JavaScript 语义化的初衷。
    
> 在 JavaScript 中我们找不到通用的标准来定义 mixin，事实上，ES6 也摒弃了不少支持 mixin 的特性。语义混乱的类库已经很多了。尽管我们认为应该有一个统一的方法来定义 mixin，便于对 JavaScript 各种“类”的操作，但 React 并不打算这么做。
  
  mixin 始终会来的，某些人可能会有这样的理解。但实际上， **Sebastian Markbåge**，**[伟大的API终结者](https://www.youtube.com/watch?v=4anAwXYqLG8)**，也不太看好 mixin：
 
> [“坦白说，mixin 其实是一个后门，它可以绕过系统对某些复用的限制，但是语义化的 React 不该是这样的。让组合更加便捷较之随心所欲地 mixin 应该享有更高的优先级，对 React 来说，这才是正事。”](https://github.com/facebook/react/issues/1380#issuecomment-73958749)

  为什么要用 mixin？mixin 解决了什么问题？我们是否可以换一种无继（Tong）承（ku）的方式去解决这些问题？

### 通用函数

   这个例子举得稍微有点脑残。与其用 mixin 的方式去共享通用功能，直接将其提取出来并模块化，需要的时候直接引用不是更好么？

### 生命周期和状态选择

   这是 mixin 的主要用例。如果你对 React 的 mixin 系统还不是特别熟悉，可以这么理解，它"合并"了生命周期钩子并且更加智能。假如同时使用了组合以及一些 mixin 去定义 `componentDidMountlifecycle` 钩子，React 会自动合并它们以保证每个方法都能被调用。类似地，使用一些mixin也能作用于 `getInitialState` 方法。

   **在实践中，这是唯一体现 mixin 用处的地方**。mixin 可以向 Flux Store 订阅组件的状态或者作用于更新后的组件 DOM 节点。任何一个组件扩展机制均能获得组件的生命周期，这一点是绝对有必要的。
  
   然而mixin还是有不少弱点：

<!-- more -->

   **一个组件和它的 mixin 之间的关联是隐式的**。mixin 通常依赖于定义在组件中的特定方法，但是又没有办法可以从组件的定义中查看到。

   **当在单一组件中使用多个 mixin 时会产生冲突**。例如当使用了一个 StoreMixin，然后又添加了另一个的 StoreMixin，React 会抛出异常，因为你的组件此时拥有两版相同命名的的方法。不同的 mixin 定义了相同的状态字段时也一样会产生冲突。

   **mixin倾向于添加更多的状态到你的组件中，但其实我们希望能努力让状态精简一点**。关于这一点，推荐大家读一读 [Andrew Clark](https://twitter.com/acdlite) 写的 [Why Flux Component is better than Flux Mixin](https://github.com/acdlite/flummox/blob/v3.5.1/docs/docs/guides/why-flux-component-is-better-than-flux-mixin.md).

   **mixin让性能优化复杂化了**。如果你在组件中（手动地或者通过 `viaPureRenderMixin` 方式）定义 `shouldComponentUpdate` 方法，很可能会产生这样的问题：某些 mixin 是否需要在自己的 `shouldComponentUpdate` 执行中被考虑到？虽然这可以通过[使用更多的合并魔法](https://github.com/facebook/react/issues/2669)来解决，但这真的是正确的发展方向咩？
 
### 加入高阶组件
 
   我第一次知道这个方法是源自 [Sebastian Markbåge 的谈话要点](https://gist.github.c
om/sebmarkbage/ef0bf1f338a7182b6775)。这个要点略微有些难以理解，尤其是在还没完全适应 ES6 语法的情况下，所以我打算用 Flux Store mixin 来解释。

   注意这只是用组合替代 mixin 的**方法之一**。要了解更多方法，可以关注文章结尾。

   假设有一个 mixin，订阅了特定的 Flux Stores，并且可触发组件状态改变。它可能长这样：

```javascript
function StoreMixin(...stores) {
    var Mixin = {
        getInitialState() {
            return this.getStateFromStores(this.props);
        },
        componentDidMount() {
            stores.forEach(store =>
                store.addChangeListener(this.handleStoresChanged)
            );
            this.setState(this.getStateFromStores(this.props));
        },
        componentWillUnmount() {
            stores.forEach(store =>
                store.removeChangeListener(this.handleStoresChanged)
            );
        },
        handleStoresChanged() {
            if (this.isMounted()) {
                this.setState(this.getStateFromStores(this.props));
            }
        }
    };
    return Mixin;
}
```

   为了使用它，组件将 `StoreMixin` 添加到 mixin 列表并且定义了 `getStateFromStores(props)` 方法：
 
```javascript
var UserProfilePage = React.createClass({
    mixins: [StoreMixin(UserStore)],
    propTypes: {
        userId: PropTypes.number.isRequired
    },
    getStateFromStores(props) {
        return {
            user: UserStore.get(props.userId);
        }
    }
    render() {
        var { user } = this.state;
        return <div>{user ? user.name : 'Loading'}</div>;
    }
```
 
   那么在不使用任何 mixin 的前提下如何解决这个问题呢？

   高阶组件实际上只是一个方法，这个方法利用一个现有组件去返回另一个包装它的组件。看一下这个 `connectToStores` 的执行：

```javascript
function connectToStores(Component, stores, getStateFromStores) {
    const StoreConnection = React.createClass({
        getInitialState() {
            return getStateFromStores(this.props);
        },
        componentDidMount() {
            stores.forEach(store =>
                store.addChangeListener(this.handleStoresChanged)
            );
        },
        componentWillUnmount() {
            stores.forEach(store =>
                store.removeChangeListener(this.handleStoresChanged)
            );
        },
        handleStoresChanged() {
            if (this.isMounted()) {
                this.setState(getStateFromStores(this.props));
            }
        },
        render() {
            return <Component {...this.props} {...this.state} />;
        }
    });
    return StoreConnection;
};
```

   这看起来和 mixin 非常类似，但是它包装了组件并且传递状态给这个被包装的组件，用这种办法替代管理组件的内在状态。**通过简单的组件嵌套，包装组件的生命周期钩子无需任何特殊的合并行为就可以发挥作用**。

   接下来是这样用的：

```javascript
var ProfilePage = React.createClass({
    propTypes: {
        userId: PropTypes.number.isRequired,
        user: PropTypes.object // note that user is now a prop
    },
    render() {
        var { user } = this.props; // get user from props
        return <div>{user ? user.name : 'Loading'}</div>;
    }
});
// Now wrap ProfilePage using a higher-order component:
ProfilePage = connectToStores(ProfilePage, [UserStore], props => ({
    user: UserStore.get(props.userId)
});
```

这样就 OK 啦！

   **最后被遗漏的部分是关于 `componentWillReceiveProps` 的处理，你可以在已更新的[Flux React Router Example](https://github.com/gaearon/flux-react-router-example/)的[connectToStores](https://github.com/gaearon/flux-react-router-example/blob/master/scripts/utils/connectToStores.js)源码中找到。**

### 下一步

   我打算在下一个版本的 React DnD中使用高阶组件。

   这暂时不能解决全部关于 mixin 的使用场景，不过快了。别忘了包装组件可以传递任意属性给被包装的组件，包括回调函数在内。高阶组件也可能存在被滥用的情况，但是不同于 mixin 的是，它们只依赖于简单的组件组合而不是一大堆奇技淫巧和特殊的方式。
 
   也有一些情况是不适合使用高阶组件的。比如，在高阶组件中 `PureRenderMixin` 无法执行，因为外层组件无法查询自己的状态以及定义自身的 `shouldComponentUpdate`. 不过恰巧有这样一个案例，在 React 0.13 里，你可能会想到用一个不同的基础类，比如从 `Component`继承`PureComponent` 然后实现 `shouldComponentUpdate` 。这是继承的正确使用场景。

   此外，在 DOM 节点上操作也会有些诡异，因为组件容器没有办法知道被包含组件什么时候更新状态。不过我们可以通过将被组合的组件的一个属性设计为回调函数来解决这一问题。然后再用 `ref = {this.props.someRef}` 来通知高阶组件是否附上或者分离某个特定的DOM节点，高阶组件接下来就能通过使用 `React.findDOMNode` 来找到这个节点。
 
![](https://cdn-images-1.medium.com/max/800/1*QwHP9HYNykPro9RQzihWrA.png)

### 其他方法

   除了上述方法，我们还有其他非常有效的途径来组合，例如[ Flummox 使用的在 `render()` 当中进行组合的方式](https://github.com/acdlite/flummox/blob/v3.5.1/docs/docs/api/fluxcomponent.md#custom-rendering)。这种方式同样是基于嵌套，但是没有高阶组件那么繁冗。在 React0.14 [转变为基于上一级的环境](https://github.com/facebook/react/pull/3615)之后使用这种方式将会更加简单。

   愿意的话，你可以选择编写属于你自己的 mixin 系统，而非受限于更高层级的组合。写这篇文章是为了提供一个可参考的方法。接下来几个月我们可以验证一下哪种方式是最好的。我坚信，最后胜出的方法一定是通过组合的方式，而不是多重的继承（承认吧，mixin 就是多重继承）。

   另外，React [通过一个新的基于属性监控的 API 可以阻止sideways data loading](https://github.com/facebook/react/issues/3398)。[译者注：关于sideways data loading，是指将数据直接推送给某些具体的组件，而非从父级层层传递，数据加载后基本上无需从底层刷新app，而是刷新若干组件中某个具体的部分。]

   鉴于原文作者的高颜值，附赠头像一张，你们自己决定要不要去Twitter关注他。
   
   [Dan Abramov](https://twitter.com/dan_abramov)

   ![](https://pbs.twimg.com/profile_images/553711083064541184/9VsY9i09_400x400.jpeg)
 