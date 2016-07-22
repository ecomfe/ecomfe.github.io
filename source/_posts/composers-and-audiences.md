---
title: 作曲家与听众
date: 2016-07-22
author: daaaabeen
author_link: http://weibo.com/daaaabeen
tags:
- JavaScript
- 用户体验
- 工具疲劳
---

原文：[Composers and audiences](http://www.pocketjavascript.com/blog/2016/1/25/composers-and-audiences)

(没错，这篇文章是关于 JavaScript 的，在这个比喻里 YY 一会吧。)

想象一下自己是一个十八世纪的年轻宫廷作曲家。你刚刚从学校里出来到维也纳，心里有一个目标：向前辈大师们学习，提高你的技艺。你听过莫扎特的令人震撼的歌剧，巴赫沉重的赋格曲，也梦想着用这种传奇的艺术形式来征服你的听众。

![Source: Wikimedia Commons](/blog/composers-and-audiences/img/pic1.jpg)

你对近期在乐器响度上的进展感到激动——毕竟小提琴的[音孔](https://en.wikipedia.org/wiki/F-hole)在你那个年代才刚刚完善。你还被探索者们所描述的来自远东的陌生记谱法深深吸引，它们完全不像你在学校所学的12个音符音阶。你甚至还听过非洲鼓复杂的韵律，要远远的复杂于欧洲标准锁步打击乐器。

<!-- more -->

于是在你上班的第一天，你靠近乐队的[乐长](https://en.wikipedia.org/wiki/Kapellmeister)，兴奋地问：“现在宫廷正在发展什么样的新技术？什么样的音乐创新才会在未来几年震惊的歌剧爱好者们呢？”

大师叹了口气，把一只手搭在你的肩膀上，解释道：“现代作曲是非常艰巨的一件事情，当今作曲家们之间争论最激烈的就是如何适当的使用乐谱。”

“你看”，他说，“不久前我们意识到对于不懂意大利语的人来说，像 *播奏（Pizzicato）* 与 *快板（Allegro）* 这样的注解理解起来是比较困难的。此外，它们把页面弄得杂乱，它们让音乐家们在视奏的时候耗费了太多的时间。因此，我们正逐步用表达同样概念的符号来代替它们。”

![](/blog/composers-and-audiences/img/pic2.jpg)

“啊”，你说，对于如此平淡的主题你有点吃惊。“这确实很有意义。为了能够更好的取悦听众，音乐家应该使用他们最大的潜能来演绎。”

“是呀，是呀”，大师轻蔑地挥动着他的手。“但是这又很不幸的带来了一个额外的问题，我们需要把现有的曲谱费力的迁移到新的系统中。此外，并非所有的作曲家都能认同同一体系，因此存在很多竞争与不兼容的标准。”

“那势必会给音乐家以及作曲家们创造麻烦！” 你认同地说。

“的确”，大师说。“同时你也会因为这新发明的谱曲器而感到头痛。每年，随着谱曲器的设计更新，作曲家要么就是去熟悉新设计的谱曲系统，要么就是坚持自己所熟悉的一个”，他摇摇头说。作为一个社会群体，我们正遭受着工具疲劳。

“那音乐呢？” 尽管只有你自己，你还是迫不及待的问到。“对于作曲家来说这一切都很好，但是我们如何才能提高听众的体验呢？他们一点都不关心我们是怎么创造的音乐，只关心音乐听起来的样子。”

“孩子啊，”大师笑着说，“你还有太多东西要学。我们越是能高效地创造出音乐，最后呈现给听众的就越好。最重要的事情是学习最纯粹的系统来记谱，我这就屈尊教你。来来来，我给你看看我的谱曲器，它毫无疑问是当前市场上最为先进的一款...” 

#### 写JavaScript

这个类比虽然有点不恰当，但是这正是当前 web 开发给我的感觉。

每天，我们都被微博和文章里所吹捧的一个又一个的框架所轰炸。它们的关注点总是在开发工具的条款以及开发经验上，很少关注用户体验。通过阅读 Hacker News 或者 EchoJS，你会觉得 JavaScript 中最重要的部分是工具、模式、以及思想。而某人在某处与屏幕上的像素点交互的事实却不那么重要。

当然，[工具疲劳](https://medium.com/@ericclemmons/javascript-fatigue-48d4011b6fc4)是一个老生常谈的话题，但是我要讨论的不只是这个。还有那些尤其是在当前流行的 React/Redux 社区中关于 “action creators”、“subreducers” 和 “sagas” 的无休止的讨论，这些抽象概念太复杂了，你需要一个[卡通版本](https://code-cartoons.com/a-cartoon-intro-to-redux-3afb775501a6)来理解他们。花费精力去避免我们的应用代码变成意大利面条一样不可读是有必要的（或者这才是争执点）。[[1]](#脚注)

当然，有的框架竞争者[宣扬他们的思想相比当前流行的模型更加的纯粹](http://staltz.com/why-react-redux-is-an-inferior-paradigm.html)。我读的越多，就越开始听起来像是一个谁的知识胜人一筹的游戏：“噢，我只使用 *不可变的数据（immutable data）*”、“噢，我只使用 *纯函数（pure functions）*”、“噢，我只使用 *树荫下种植的有机 npm 模块* ”。由于这些冠冕堂皇的术语，有时我都分辨不出阅读的是关于 JavaScript 框架还是最新的排毒果汁。

#### 忘记用户

当然，工具和模式是非常重要的，我们应该谈论它们。尤其是和初级开发者合作时，强制执行最佳实践并且给他们讲解晦涩的概念是很有帮助的。这样的探讨我一点都不觉得有问题，除了用户（真正使用你产品的那些古怪的非程序员，你懂的）的体验慢慢地被遗忘了。

Paul Lewis 已经在《[The Cost of Frameworks](https://aerotwist.com/blog/the-cost-of-frameworks/)》中写过这个，但值得反复的强调。用户一点也不关心你是怎么构建应用的，他们只关注：1）能用，2）流畅。我为大量主题被归类到“性能”下感到失望，导致我们不得不极力让大家明白[“性能很重要”](https://twitter.com/search?q=%23perfmatters)这个观点，实际上，“性能”只是开发者对用户口中“体验好” 最接近的翻译。[[2]](#脚注)

我在 Squarespace 的工作中、JavaScript 的聚会上、博客里，花了很多的时间来讨论性能。我一次又一次惊讶地发现，“性能”对于很多开发者来说竟还是作为一种黑魔法而存在。事实上在一些老旧的硬件设备上做一些简单的测试，就可以发现大部分的性能问题。

例如，我对很多开发者（不管新手还是老手）仍然使用 CSS 的 top 和 left 而不是 transform 创建平移动画感到震惊，尽管只要你在除了 8 核 MacBook Pro 之外的设备上进行过测试，就会发现帧率的差别极其明显。（我个人喜欢的机器是难用的2011年产的 [Galaxy Nexus](http://amzn.com/B005ZEF01A) 和一台便宜的 [Acer 笔记本](http://amzn.com/B00P6FM23W)）

我说这些的不是要让新手要为这个错误而内疚；top/left 比 transform 更加的直观。然而，这正是我们（老手）应该努力学习并推广此类优化技术而不是本周最佳框架中的微小细节给他们的原因。

#### 迷失的艺术

像 transform 这种性能优化技巧由于比较新颖而显得神秘是可以理解的，但是很多行之有效的东西却似乎被故意忽略了。比如，像 IndexedDB、WebSQL 和 AppCache 这种离线缓存工具（发布时间分别是[2010](https://hacks.mozilla.org/2010/06/beyond-html5-database-apis-and-the-road-to-indexeddb/comment-page-1/), [2007](https://webkit.org/blog/126/webkit-does-html5-client-side-database-storage/)以及[2009](http://googlecode.blogspot.com/2009/04/gmail-for-mobile-html5-series-using.html)），虽然已经发布多年了，但是和我聊过的大多数 web 开发者几乎都不了解它们。同样，[2010](http://www.html5rocks.com/en/tutorials/workers/basics/)年发布的 WebWorkers 使并行成为了可能，可是你在大部分网站上都找不到关于它的内容。

这些新技术可以通过减少服务器的往返次数（离线）或者提高UI的响应速度（并行）的方式来大大的提高你的网络应用程序的用户体验。然而看起来我们中的许多人更热衷于学习一些新的框架来提高自己的开发体验，而不是学习使用现有的技术赋予用户更好的体验。

我的确对这些领域缺乏进展而感到痛苦。就在上周我发布了 [pseudo-worker](https://www.npmjs.com/package/pseudo-worker)——WebWorker 的 polyfill, 因为找遍了 npm 和 Github 都没有找到一个合适的（嗯，WebWorkers：一项六岁的技术）。同时我过去几年参与 [PouchDB](http://pouchdb.com/) 和相关的 IndexedDB/WebSQL 项目，在这些经历中最令我意外的的部分是我意识到在这个领域的工作太少了。[我常常为一些实现上的缺陷给浏览器提 bug](https://gist.github.com/nolanlawson/11672431f0d219b96335)。而如果真有人在使用这些的东西的话，这些 bug 在几年前就应该就被发现了。

我一直在等待 web 开发者“发现”这些技术（就像2005年“发现” [Ajax](http://adaptivepath.org/ideas/ajax-new-approach-web-applications/) 一样），但是我几乎不能在博客圈子中听到一丁点，除了在我自己的小圈子里。相反，在2015年其中一个最受欢迎的网络技术却是 [热加载](http://gaearon.github.io/react-hot-loader/), 它是一种可以帮你省去你的app缓慢的加载时间，来提高你的开发效率的工具。一个工具好到开发者牺牲用户也要使用，我想不到这样的例子。

#### 展望

我们还是有希望来扭转这一趋势的。我被 [ServiceWorkers](https://ponyfoo.com/articles/serviceworker-revolution) 所取得的令人激动的进展所鼓舞，事实上在我的文章 “[Introducing Pokedex.org](http://www.pocketjavascript.com/blog/2015/11/23/introducing-pokedex-org)” 中就对 [progressive webapps](https://medium.com/@slightlylate/progressive-apps-escaping-tabs-without-losing-our-soul-3b93a8561955) 的潜在能力进行了关注。还有更加令我激动是 Malte Ubl（谷歌 APM 项目的负责人）已经宣布2016年将会成为 [web 的并发年](https://medium.com/@cramforce/2016-will-be-the-year-of-concurrency-on-the-web-c39b1e99b30f)。

这些努力提高了 web 用户的体验，即使它们增加了一点点我们程序代码与构建流程的复杂性。事实上，这两者并不互相排斥；我们可以创造工具同时帮助开发者和用户，[Hoodie](http://hood.ie/) 和 [UpUp](https://www.talater.com/upup/) 项目正在这方面大踏步的前进，我也很喜欢 React 和 Ember (尤其是 [Glimmer](http://emberjs.com/blog/2015/05/05/glimmer-merging.html)) 成功在性能上取得的成绩，[Angular 2](https://docs.google.com/document/d/1M9FmT05Q6qpsjgvH1XvCm840yn2eWEg0PMskSQz7k4E) 又将其推进到了新的高度。

然而，这些问题只能通过教育来提高。开发者需要更努力的学习 web 平台本身，而不是某种框架对其的抽象。幸运的是有很多人做了伟大的工作来提高开发人员对性能和用户体验的关注，并且展示了当今 web 的能力：[Paul Lewis](https://youtu.be/obtCN3Goaw4?list=PLNYkxOF6rcIBz9ACEQRmO9Lw8PW7vn0lr), [Rachel Nabors](https://youtu.be/GxOq1bnlZXk), [Tom Dale](https://youtu.be/puOrC7cfjRI), [Jason Teplitz](https://youtu.be/Kz_zKXiNGSE), 还有 [Henrik Joreteg](https://youtu.be/okk0BGV9oY0)是我心里想到的名字。（这些链接都是视频，值得关注！）

总体来说，在2016年，我希望 web 开发者们能够少花一些时间在钻研流程、原理、以及抽象化上。这些东西对于日常构建和维护代码是很重要，但不能因此转移我们对最终服务用户的需求的关注。

#### 脚注

> [1] 我没有冒犯 Dan Abramov, Lin Clark, André Staltz, 或者其他尝试使应用程序的复杂逻辑更易于管理的人。这些是很给力的计算机科学成果和有趣的思考！并非完全如此，特此说明。

> [2] “设计” 是另一个不错的翻译，虽然我认为设计和性能有着千丝万缕的联系（例如：60fps 的动画，在相关的画面间平滑的过渡，等）。

感谢 Nick Colley, Jan Lehnardt, André Miranda, 和 Garren Smith 对本篇博文的草稿的意见反馈。

#### 26/01/2016 更新

我在这篇文章中对 React, Redux, 还有 Cycle.js 的小伙伴们非常的严厉，[并且直接的表达了出来](https://twitter.com/dan_abramov/status/691976015594311680)。因此我应该澄清一下：我知道这些社区中的很多小伙伴还是很关心性能的，而且从一开始，最终用户体验也[激发了很多的这样的工具](https://medium.com/swlh/the-case-for-flux-379b7d1982c6)。

React 开拓了一些事情，比如同构渲染，这对性能来说影响绝对是巨大的。Webpack 使得代码切分变得容易。所有的这些事情都是非常棒的！我甚至觉得热加载很潮（只要你还会测试应用的实际加载时间）。

我们都想写出出色的软件。这是我们进入这个行业的初衷。我的意思是，我没听到一点关于 web 平台的能力，以及如何把 webapp 往有趣的方向推进的讨论。

有时感觉我们已经断定没有需要征服的疆域了，只需要弄清楚如何完善编写网站的程序，就像他们在2012年左右写的那样。那将是一种耻辱。今天 web 还存在荒漠（不只是前文中的离线与并行；Jenn Simmons 有[一个非常棒的关于 CSS 布局的话题](https://youtu.be/ZNpn7FBp_9U)，但是没有人这么用）。我只是不想让工具和抽象分散了注意力。
