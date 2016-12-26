---
title: 如何编写自己的 Native Bridge
date: 2016-12-26
author: leeight
author_link: https://github.com/leeight
tags:
- React Native
- JS Engine
- Objective C
---

原文地址：[How you create your own Native Bridge](https://medium.com/@kureevalexey/how-to-create-you-own-native-bridge-93a8d4a40bd2#.fnruczgl6)

![](/blog/how-to-create-you-own-native-bridge/1.png)

和很多人一样，在我弄清楚 React Native 的实现机制之前，其实已经在实际项目中用过一段儿时间了。不过在我学习 React Native 实现机制的过程中，逐渐开始给这个项目贡献代码，最终成为核心开发者中的一员。

尽管如此，这个项目中的 Native Bridge 对我来说还是很神秘的，它到底是通过什么『魔法』打通了 JavaScript 和 Objective C 这两种不同编程语言之间的边界。正因为缺少对这部分内容的了解，才促使我花了一些时间做了这些调研，然后把我的理解通过这几篇文章分享给大家。

毋庸置疑，在没有一个对项目清晰的规划设计之前就写代码是没有任何意义的。架构设计对于软件开发来说是很重要的一步，我会讲解整个思考过程，详细解释我们做的一些决策以及背后的原因。

<!-- more -->

## 第一章：设计一个架构

### 第一个迭代

在开始一个新项目之前，首先需要确定一下在这个项目中应该采用哪些技术方案：

在我们这个场景下，选择的技术方法如下：

1. Objective C 来控制 Cocoa UI
2. C++ 来和 JSVM 交互
3. JSVM (V8 或 Chakra)
4. JavaScript
5. React + 自定义渲染器

我默认主要的执行逻辑是用 C++ 写的，它内部有一个自定义全局上下文的 JS 引擎（基本上所有主流的 JS 引擎 都提供扩展内置函数的能力），所以当看到自定义全局上下文的时候不要惊讶，其实并没有什么特殊的地方，只是通过 C++ 扩充了一些内置的 JS 函数，稍候我们会介绍相关的内容。

一旦我们调用这些自定义的 JS 函数，JS 虚拟机就会执行我们在 C++ 里面实现的那部分代码，然后就可以继续调用 Objective C 的代码来绘制 UI。听起来有点儿复杂，但是不要灰心，很快就看到曙光了。

上述所有的逻辑都可以在同一个线程（主线程）中运行，但是可能会导致一些性能问题。为了避免性能问题，我门给通过 Objective C 进行 UI 渲染的工作专设了一个新的线程。

![](/blog/how-to-create-you-own-native-bridge/2.png)

尽管听起来比较合理，可是实际上却并不管用。

问题在于 Apple 限制了只可以在主线程中渲染 UI，这也就导致我们只能在主线程中去执行 Objective C 的代码。可惜的是，这样应用的入口就和平台绑定了（至少要让它跑在其他平台上会变的非常复杂）。但事已至此，我们只能调整我们最初的设计，来满足这项限制。

### 修正方案

如果必须在主线程渲染 UI，那我们就接受这个限制。不过我们要运行一个 Cocoa 应用，而非 C++ 的程序。在它启动时我们创建一个包含了 JSVM 的后台线程来运行打包好的 JS 代码。和前一种方法里一样，因为有 JSVM 的存在，我们可以在 JS 代码中调用 C++ 写的函数。一旦这样的函数被调用，主线程就会收到指令并绘制 UI。

在主线程中，（JS 线程）发来的指令通过 Objective C 渲染出对应的界面元素。如果成功，Objective C 会回调一个从 C++ 传递过来的函数（代表 JSVM 对 JS 逻辑的回调）。

![](/blog/how-to-create-you-own-native-bridge/3.png)

### 最终的架构

好了，最后总结一下：

1. 因为需要在主线程中绘制 UI，所以我们需要一个 Cocoa 类型的应用；

2. 当程序启动的时候，我们需要创建一个 JS 线程来初始化 JS 引擎，然后执行我们打包在一起的 JS 代码。之前说过，我们给 JSVM 上下文打过补丁，暴露了一些额外的 API 来操作 UI 层；

3. 一旦JS线程需要绘制UI的时候，就给主线程发一个命令，主线程收到之后，Objective C 代码就开始执行对应的绘制逻辑；

4. 最后，Objective C 执行一系列的回调函数，从而把最终的执行结果传递通过 JS 线程 传递给我们在 JS 里面逻辑。

### 搭建基础平台

动手实践的时候到了！首先，我们创建一个空白的 Cocoa 应用，如下图所示：

![新建 Mac OS X Cocoa Application 窗口](/blog/how-to-create-you-own-native-bridge/4.png)

第一步完成之后，我们就有了一个基础的程序架构。之后，编辑 `AppDelegate.m` 文件里面的 `applicationDidFinishLaunching` 函数，在这个函数里面应该启动一个新的线程来初始化 JS 引擎，代码如下：

```
- (void)applicationDidFinishLaunching:(NSNotification *)aNotification {
    _jsvmThread = [[NSThread alloc] initWithTarget:self
                                          selector:@selector(runJSVMThread)
                                            object:nil];
    [_jsvmThread start];
}
```

现在你可能有两个疑问：

1. `_jsvmThread`是个什么鬼？

2. `@selector(runJSVMThread)` 是什么意思？

我们是通过创建一个 `NSThread` 的实例来启动一个新的线程的，`_jsvmThread` 就是 `NSThread` 的一个实例。后续如果要执行 C++ 回调函数的时候，我们需要 `NSThread` 实例的引用，因此通过 `_jsvmThread` 变量保存了下来。

关于 Selector 的问题，根据 Apple 的文档所述，是一个用来选择一个对象要执行那个方法的名称，或是在源码编译后用来代替这个名称的唯一标识符。更多细节建议还是参考[Apple的官方文档](https://developer.apple.com/library/content/documentation/General/Conceptual/DevPedia-CocoaCore/Selector.html)。

换句话说，当创建了 `NSThread` 之后就会执行当前实例上面的 `runJSVMThread` 方法来完成 JS引擎 的初始化工作：

```
- (void)runJSVMThread {
    [[[ChakraProxy alloc] init] run];
    
    NSRunLoop *runloop = [NSRunLoop currentRunLoop];
    
    while (true) {
        [runloop runMode:NSDefaultRunLoopMode beforeDate:[NSDate distantFuture]];
    }
}
```

正如在代码中看到的，我这里用了 ChakraCore 而没有选择 V8。原因是：

1. 编译 V8 花了我1个多小时的时间，然后又花了2个小时才能把 HelloWorld 运行起来；

2. 编译 ChakraCore 以及运行 HelloWorld 总共花了 10 多分钟的时间。

> 由于我们只是编写一个原型，所以我把 ChakraCore 提供的更好的开发体验放在了首位。

ChakraProxy 初始化之后，我们必须通过一个 runloop 来保证线程不会退出（如果没有这个机制的话，线程的代码执行完毕之后就结束了），如果想要对 Runloop 有更深的了解，建议还是去参考一下 [Apple官方的文档](https://developer.apple.com/library/content/documentation/Cocoa/Conceptual/Multithreading/RunLoopManagement/RunLoopManagement.html)。

现在我们的程序可以正常启动了，而且还启动了一个新的线程等待 UI 绘制的命令。现在我们来着手实现 ChakraProxy 这个类。

ChakraProxy 的逻辑很简单，简单来说就是用来整合 Objective C 和 C++ 代码的一个封装：

**ChakraProxy.h**

```
#import <Foundation/Foundation.h>

@interface ChakraProxy : NSObject

-(void)run;

@end
```

**ChakraProxy.m**

```
#import "ChakraProxy.h"

@implementation ChakraProxy

-(void)run {
  NSLog(@"Hello from the JSVM thread!");
}

@end
```

显而易见，ChakraProxy 除了输出一行日志之外，什么也没有做，但是我们可以在此基础上开展更多的工作了。在下一篇我们会添加更多的功能，比如整合 ChakraCore，基本的桥接模型，以及其他好多好多内容。

与此同时，可以从[我的 Github](http://github.com/Kureev/ExampleBridge) 下面获取实例代码来本地运行测试看看。

如果想要了解更多关于 Runtime，Context，Scope 以及如何通过 C++ 扩充 JS 的功能，那就敬请期待下一篇吧。
