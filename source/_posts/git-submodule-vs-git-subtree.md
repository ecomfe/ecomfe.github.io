---
title: git submoudle vs git subtree
date: 2015-4-14
author: leeight
author_link: https://github.com/leeight
tags:
- git
- submoudle
- subtree
---


先说结论：在项目模块拆分的时候，先考虑使用了 git submoudle 的方案，因为遇到一些问题，又研究了一下 git subtree 的方案，最后发现 git subtree 的成本更高，最后还是选择了 git submodule 的方案

git submodule 最初作为项目模块拆分时候的方案，在使用的过程中发现了几个问题：

1. 同步代码比较麻烦
2. 冲突解决起来不方便（因人而异）
3. 有时候不确定是否应该PUSH本次的改动（主要是 new commits 的状态）
4. 代码的重复性很高，占用硬盘（各个模块依赖的 common 和 dep 的体积很大，重复了很多次）

查询了一些相关资料之后，看到有同学提到使用 git subtree 的一种解决方案，因此在bce-console/console上面弄了一个subtree的分支尝试了一下。

首先，我们还是把 bce-console/console 作为整个项目的集合来进行管理。

<!-- more -->

第一步：检出代码

```
git clone http://git.server/bce-console/console.git all-bce-console
git checkout subtree
```

此时我们发现，这个分支上面基本上什么都没有，src目录是空的

第二步：添加一些 remote

```
git remote add x-dep http://git.server/bce-console/dep.git
git remote add x-mockup http://git.server/bce-console/mockup.git
git remote add x-common http://git.server/bce-console/common.git
```

后续我们就可以使用  x-dep 来代替 http://git.server/bce-console/dep.git 这个仓库了，就跟我们平时使用 origin 代替 http://git.server/bce-console/console.git 一样。

第三步：使用subtree添加目录

添加目录之前我们先把 x-dep, x-mockup, x-common 代码下载下来

```
git fetch x-common
git fetch x-dep
git fetch x-mockup
```

现在就可以调用 subtree 命令了

```
git subtree add --prefix=dep x-dep master --squash
git subtree add --prefix=mockup x-mockup master --squash
git subtree add --prefix=src/common x-common master --squash
```

`--prefix` 就是我们要添加的那个目录，x-dep 就是前面 git remote 添加的那个地址，master 就是分支的名字

现在切换到 dep, mockup, src/common 目录去看看，应该发现已经有代码了吧

第四步：来是修改业务代码

假如我们要修改 bcc 模块的代码，可以参考类似前面的做法：

```
git remote add x-bcc http://git.server/bce-console/bcc.git
git fetch x-bcc
git subtree add --prefix=src/bcc x-bcc master
```

好了，到此为止，代码都有了，开始干活。

不过干活之前，先备个份呗

```
git push origin subtree
```

第五步：提交代码

吭哧吭哧开始写代码，把 dep, mockup, src/common, src/bcc 都修改了，改完之后本地也commit了，开始要push了，但是应该提交到哪里呢？

其实不要想那么多，直接

```
git commit -a -m ‘some commit message'
git push origin subtree
```

就把这些改动提交到了 bcc-console/console 的 subtree 分支。

但是这些改动并没有体现在 x-dep, x-common, x-mockup 的仓库，如果以后其他人 clone 了这些仓库，并没有看到我们改动，岂不是很麻烦，如果能想到这个问题，非常好，其实已经有解决方案了，就是使用 git subtree push。执行下面的命令：

```
git subtree push --prefix=src/bcc x-bcc subtree
```

意思就是把最近的一些改动 push 到 x-bcc 这个仓库的 subtree 分支。

第六步：同步代码

既然前面提到了提交代码，就肯定会涉及到代码的同步，假如我直接修改了 x-mockup 仓库里面的数据，怎么同步过过来呢？其实方案跟上面的过程类似，首先需要把最新的代码拖下来，执行

```
git fetch x-mockup
```

然后就是

```
git subtree pull --prefix=mockup x-mockup master --squash
```

### 关于 squash

如果细心的同学可能注意到了，前面 git subtree add 和 git subtree pull 的时候都有一个 squash 参数，这个参数是干啥的呢？我也不好解释，只能举个例子来说明：

假如我们在 x-mockup 上面提交了 10 个commit，如果没有 squash 参数，那么 git subtree pull 的时候，这 10 个commit 都会体现在 bce-console/console 的 git history 里面。

但是一般情况下，我同步代码的时候，并不关心 commit A 和 commit B 之间提交了哪些东西，我只关心从 commit A 升级到 commit B，此时加上 squash 参数就可以在 git history 里面只体现一个 commit。例如：

实际上 bbabe74 到 a8f8105 之间有 2 个commit，这个从 x-mockup 的 git history 里面可以看出来

但是因为我实际上是比较关心 x-bcc 的提交历史的，因此执行 git subtree add 时候，并没有带着 squash 参数，所以 x-bcc 这个仓库的历史都可以体现在 bce-console/console 这个仓库里面。

### FAQ

1. 为啥搞得这么复杂？

我（个人）感觉并不是特别复杂，我们面对的问题是一个很常见的模块复用的问题。git 里面默认集成的 submodule 和 subtree 自然有它的原因，学习使用这些工具来解决我们的问题，是很常见的一种方式。

2. 为什么不考虑使用 symlink 的方式呢？

通过软链接也是可以解决问题的，但是有两个弊端：第一个是在 Windows 平台上支持的程度有限（如果有其它方式，望不吝赐教）；另外一个问题是，如果我需要同步代码的话，就必须切换到 软链接 所在的目录，而不是直接使用 git subtree pull 来完成操作，还有就是如果改动了 软链接 所在目录的代码，也必须切换过去才能 push。

3. 如果我想使用另外一个分支的内容，肿么办？

前面我添加 x-common 的时候，用的是 master 分支。

```
git subtree add --prefix=src/common x-common master --squash
```

如果这个分支上面有些 BUG，成阳修改之后先 PUSH 到了 x-common 仓库的 develop 分支，我应该如何切换到 develop 分支呢？其实方式很简单

```
git fetch x-common
git rm -r src/common
git commit -a -m ‘Before switch src/common subtree branch'
git subtree add --prefix=src/common x-common develop --squash
```

主要的原理就是先删除，再加上。另外还有一种方式就是 git subtree pull 另外一个分支的名字

```
git subtree pull --prefix=src/common x-common develop --squash
```

### 使用 git subtree 的时候遇到几个问题

按照上面的开发流程，本地的项目实际上可以正常的运行的，但是使用了一段儿时间之后，发现用 git subtree 管理这些模块有一些明显的劣势：

1. 切换分支并不太方便

   因为我们使用 Gitlab 的 Merge Request 的功能来 Review 代码，大部分功能基本上都是在分支上面进行开发的，如果想要把本地某个目录的代码切换到某个分支，就需要执行`git rm -rf`和`git subtree add`的操作，明显没有`git checkout branch`来的方便


2. 代码提交的速度问题

   我没有详细研究过 git 的原理，不太清楚为什么 git subtree push 的速度如此，其实 [SO](http://stackoverflow.com/questions/16134975/reduce-increasing-time-to-push-a-subtree) 上面也有人问过类似的问题，最终随着 commit 的记录越来越多，已经到了无法忍受的底部了，有的同学每次 push 需要花费几分钟的时间（当然跟设备的配置也有一定的关系），很影响工作效率
   
3. 冲突的解决不太方便

   具体不方便在什么地方我也记得不是很清楚了
   
   
这几个问题相比最初使用 git submodule 遇到的问题而言，感觉使用 git submodule 遇到的那几个问题根本不是什么大问题了


1. 同步代码比较麻烦

   自己写个简单的脚本来同步
   
   ```
   #!/usr/bin/env bash

   set -x
   git submodule update --remote
   git submodule -q foreach 'pwd; git checkout -q master; git pull -q'
   ```
   
2. 冲突解决起来不方便（因人而异）

   发起 Merge Request 的同学自行解决冲突，Reviewer合并代码到 master 的时候如果有冲突就暂时不处理。这种机制保证了我们 master 分支的提交历史是很干净的，然后代码同步到 svn server 也很顺利。
   
3. 有时候不确定是否应该PUSH本次的改动（主要是 new commits 的状态）

   new commits 就不要提交了
   
4. 代码的重复性很高，占用硬盘（各个模块依赖的 common 和 dep 的体积很大，重复了很多次）

   调整了一下目录的结构，common 和 dep 从业务目录中提取出来，放到上一层目录，逻辑上还是存在的，比如请求 `/bcc/dep/xxx.js`的时候，让 `edp webserver`处理一下，从 `/dep/xxx.js`的位置读取文件，同样的对于`/bcc/common/yyy.js`也是同样的处理逻辑
