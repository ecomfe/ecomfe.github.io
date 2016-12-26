---
title: How you create your own Native Bridge
date: 2016-12-26
author: leeight
author_link: https://github.com/leeight
tags:
- React Native
- JS Engine
- Objective C
---

原文地址：https://medium.com/@kureevalexey/how-to-create-you-own-native-bridge-93a8d4a40bd2#.fnruczgl6

![1.png](/blog/how-to-create-you-own-native-bridge/1.png)

I’ve been using React Native for a while before I started to dive into the codebase to see how it works. Since then I’ve made quite a few contributions to the project and even managed to become a part of react-native core team.

和很多人一样，在我弄清楚 React Native 的实现机制之前，其实已经在实际项目中用过一段儿时间了。不过在我学习 React Native 实现机制的过程中，逐渐开始给这个项目贡献代码，最终成为核心开发者中的一员。

Although, one part of the project was truly mystical to me — how it bridges two different languages: JavaScript and Objective C. This lack of understanding gave me the motivation to do some research on the bridge and document my findings in these articles.

尽管如此，这个项目中的 Native Bridge 对我来说还是很神秘的，它到底是通过什么『魔法』打通了 JavaScript 和 Objective C 这两种不同编程语言之间的边界。正因为缺少对这部分内容的了解，才促使我花了一些时间做了这些调研，然后把我的理解通过这几篇文章分享给大家。

No doubt, it is pointless to write code without having a clear mental picture of the finished product (or a milestone). Architectural design is an important step of software development. I will try to guide you through the thought process and explain in detail what decisions were made and why.

毋庸置疑，在没有一个对项目清晰的规划设计之前就写代码是没有任何意义的。架构设计对于软件开发来说是很重要的一步，我会讲解整个思考过程，详细解释我们做的一些决策以及背后的原因。

<!-- more -->

## Chapter 1: Designing an architecture
## 第一章：设计一个架构

### First iteration
### 第一个迭代

When you start a new project, it makes sense to determine a list of technologies you’re going to use. 
在开始一个新项目之前，首先需要确定一下在这个项目中应该采用哪些技术方案：

In my case they were:
在我们这个场景下，选择的技术方法如下：

1. Objective C to manipulate Cocoa UI
2. C++ to work with JSVM
3. JSVM (V8 or Chakra)
4. JavaScript
5. React + custom renderer

I assumed my main executable will be written in C++. It will run a JS engine with a patched global context (all major JS engines provides you a possibility to extend their built-in functionality by custom objects/functions). Don’t be afraid of “patched global context”, it means nothing but adding a few new functions written in C++ to your JS environment. Later on, we will talk about it in details.

我默认主要的执行逻辑是用 C++ 写的，它内部有一个自定义全局上下文的 JS 引擎（基本上所有主流的 JS 引擎 都提供扩展内置函数的能力），所以当看到自定义全局上下文的时候不要惊讶，其实并没有什么特殊的地方，只是通过 C++ 扩充了一些内置的 JS 函数，稍候我们会介绍相关的内容。

Once we call one of these custom JS functions, it goes through the JSVM (JavaScript Virtual Machine) and invokes a C++ implementation, which in turn, triggers the Objective C code to construct a UI element. It may sound a bit complex, but don’t give up yet!

一旦我们调用这些自定义的 JS 函数，JS 虚拟机就会执行我们在 C++ 里面实现的那部分代码，然后就可以继续调用 Objective C 的代码来绘制 UI。听起来有点儿复杂，但是不要灰心，很快就看到曙光了。

All these things can be run in the same (main) thread, but it’ll cause certain performance issues. To avoid that, we dedicate a new thread to handle Objective C ↔ UI jobs.

上述所有的逻辑都可以在同一个线程（主线程）中运行，但是可能会导致一些性能问题。为了避免性能问题，我门给通过 Objective C 进行 UI 渲染的工作专设了一个新的线程。

![2.png](/blog/how-to-create-you-own-native-bridge/2.png)

Even though this approach makes sense, it doesn’t work.

尽管听起来比较合理，可是实际上却并不管用。

The problem is that Apple doesn’t allow you to render your UI in non-main thread. Moreover, if UI can be rendered only in the main thread, it means that Objective C should be run in the same thread as well. Unfortunately, this approach ties your application’s entry point to the platform (or, at least, makes it really complicated to run it on the other platforms). But we have what we have. Let’s change our initial approach to fit this requirement.

问题在于 Apple 限制了只可以在主线程中渲染 UI，这也就导致我们只能在主线程中去执行 Objective C 的代码。可惜的是，这样应用的入口就和平台绑定了（至少要让它跑在其他平台上会变的非常复杂）。但事已至此，我们只能调整我们最初的设计，来满足这项限制。

### Corrections
### 修正方案

If we have to run a UI in the main thread, let’s do it! Instead of running a C++ program, we run a Cocoa application. When its bootstrapped, we spawn a new background thread with a JSVM on board. JSVM runs the main JavaScript file (your bundle) in order to get instructions to execute. As in the previous approach, if you have any proxied C++ functions in your JS code, JSVM will take care of them. Once one of those functions is called, it sends a command to the main thread to draw UI.

如果必须在主线程渲染 UI，那我们就接受这个限制。不过我们要运行一个 Cocoa 应用，而非 C++ 的程序。在它启动时我们创建一个包含了 JSVM 的后台线程来运行打包好的 JS 代码。和前一种方法里一样，因为有 JSVM 的存在，我们可以在 JS 代码中调用 C++ 写的函数。一旦这样的函数被调用，主线程就会收到指令并绘制 UI。

In the main thread, Objective C process is given a command and renders an appropriate interface element for it. If there are no errors, Objective C triggers a callback that has been passed in from C++ in order to call a function representing a callback from JS.

在主线程中，（JS 线程）发来的指令通过 Objective C 渲染出对应的界面元素。如果成功，Objective C 会回调一个从 C++ 传递过来的函数（代表 JSVM 对 JS 逻辑的回调）。

![3.png](/blog/how-to-create-you-own-native-bridge/3.png)

### Final architecture
### 最终的架构

Now, let’s try to combine all these together:

好了，最后总结一下：

1. We start a native Cocoa Application because we need to run UI in the main thread.
1. 因为需要在主线程中绘制 UI，所以我们需要一个 Cocoa 类型的应用

2. Right at the moment when our blank application is bootstrapped, we create a new thread with JSVM. Once it’s done, we run JavaScript. As I said above, we patch our JSVM context and expose some additional APIs to manipulate the user interface layer.
2. 当程序启动的时候，我们需要创建一个 JS 线程来初始化 JS 引擎，然后执行我们打包在一起的 JS 代码。之前说过，我们给 JSVM 上下文打过补丁，暴露了一些额外的 API 来操作 UI 层。

3. Once we receive a command from JS to draw UI, we dispatch it to Objective C. In it’s turn, Objective C parses the command and renders appropriate UI elements.
3. 一旦JS线程需要绘制UI的时候，就给主线程发一个命令，主线程收到之后，Objective C 代码就开始执行对应的绘制逻辑。

4. After that, Objective C invokes a sequence of callbacks in order to pass a return value to JS.
4. 最后，Objective C 执行一系列的回调函数，从而把最终的执行结果传递通过 JS 线程 传递给我们在 JS 里面逻辑。

### Building a platform foundation
### 搭建基础平台

Time for the hands on experience! First of all, let’s create a blank OS X Cocoa Application:
动手实践的时候到了！首先，我们创建一个空白的 Cocoa 应用，如下图所示：

![4.png](/blog/how-to-create-you-own-native-bridge/4.png)

Once this step is done, you have your foundation. Now, if you open your AppDelegate.m, you will find two application lifetime hooks: applicationDidFinishLaunching and applicationWillTerminate. Our application should spawn a new thread at the moment of creation, so let’s change our applicationDidFinishLaunching to do the trick:
第一步完成之后，我们就有了一个基础的程序架构。之后，编辑 `AppDelegate.m` 文件里面的 `applicationDidFinishLaunching` 函数，在这个函数里面应该启动一个新的线程来初始化 JS 引擎，代码如下：

```
- (void)applicationDidFinishLaunching:(NSNotification *)aNotification {
    _jsvmThread = [[NSThread alloc] initWithTarget:self
                                          selector:@selector(runJSVMThread)
                                            object:nil];
    [_jsvmThread start];
}
```

Now I have to answer two questions:
现在你可能有两个疑问：

1. What is a _jsvmThread variable?
1. `_jsvmThread`是个什么鬼？

2. What does @selector(runJSVMThread) mean?
2. `@selector(runJSVMThread)` 是什么意思？

_jsvmThread is nothing else but an instance variable that stores a reference to our new NSThread. We need this reference in order to execute our C++ callbacks in the proper thread.

我们是通过创建一个 `NSThread` 的实例来启动一个新的线程的，`_jsvmThread` 就是 `NSThread` 的一个实例。后续如果要执行 C++ 回调函数的时候，我们需要 `NSThread` 实例的引用，因此通过 `_jsvmThread` 变量保存了下来。

Selector, according to Apple’s docs, is the name used to select a method to execute for an object, or the unique identifier that replaces the name when the source code is compiled.

关于 Selector 的问题，根据 Apple 的文档所述，是一个用来选择一个对象要执行那个方法的名称，或是在源码编译后用来代替这个名称的唯一标识符。更多细节建议还是参考[Apple的官方文档](https://developer.apple.com/library/content/documentation/General/Conceptual/DevPedia-CocoaCore/Selector.html)

In other words, we initialize a new NSThread and run runJSVMThread method of object self (which points to the current instance of the class) in it.

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

As you can see, I decided to use ChakraCore instead of V8. There are some reasons for that:
正如在代码中看到的，我这里用了 ChakraCore 而没有选择 V8。原因是：

1. It took me 1 hour to compile V8 and 2 hours to run HelloWorld example
1. 编译 V8 花了我1个多小时的时间，然后又花了2个小时才能把 HelloWorld 运行起来

2. ChakraCore took me 10 mins to compile and run HelloWorld example
2. 编译 ChakraCore 以及运行 HelloWorld 总共花了 10 多分钟的时间

> Side note: since we’re building a prototype, I would prefer better developer experience that I have with ChakraCore.
> 由于我们只是编写一个原型，所以我把 ChakraCore 提供的更好的开发体验放在了首位。

Right after ChakraProxy initialization we have a run loop. We use it here to keep our thread alive (otherwise it’ll die after run function is finished). If you want to know more about run loops, Apple docs is a good place to start.

ChakraProxy 初始化之后，我们必须通过一个 runloop 来保证线程不会退出（如果没有这个机制的话，线程的代码执行完毕之后就结束了），如果想要对 Runloop 有更深的了解，建议还是去参考一下 [Apple官方的文档](https://developer.apple.com/library/content/documentation/Cocoa/Conceptual/Multithreading/RunLoopManagement/RunLoopManagement.html) 

Now we have an application that starts, spawns a new thread and waits for commands. Next step would be to define a ChakraProxy class.

现在我们的程序可以正常启动了，而且还启动了一个新的线程等待 UI 绘制的命令。现在我们来着手实现 ChakraProxy 这个类。

ChakraProxy is just a container which encapsulates Objective C and C++ code:

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

Of course, this code doesn’t do anything handy yet, but gives you a room to maneuver. In the next chapter we’ll add some fancy things like ChakraCore, basic bridging model and way, way more.

显而易见，ChakraProxy 除了输出一行日志之外，什么也没有做，但是我们可以在此基础上开展更多的工作了。在下一篇我们会添加更多的功能，比如整合 ChakraCore，基本的桥接模型，以及其他好多好多内容。

In the meanwhile, you can play with the code in my github repository.
与此同时，可以从[我的 Github](http://github.com/Kureev/ExampleBridge) 下面获取实例代码来本地运行测试看看

Want to know more about runtimes, contexts, scopes and their implementation? Or maybe extend idiomatic JavaScript by adding your own C++ functions? All these and even more awaits you in the Chapter 2: JSVM and the first adventure.
如果想要了解更多关于 Runtime，Context，Scope 以及如何通过 C++ 扩充 JS 的功能，那就敬请期待下一篇吧。
