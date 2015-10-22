---
title: 前端MVC变形记
date: 2015-10-22
author: wangfengjiao
tags:
- JAVASCRIPT
- MVC
- MVP
- MVVM
---

## 背景：

MVC是一种架构设计模式，它通过关注点分离鼓励改进应用程序组织。在过去，MVC被大量用于构建桌面和服务器端应用程序，如今Web应用程序的开发已经越来越向传统应用软件开发靠拢，web和应用之间的界限也进一步模糊。传统编程语言中的设计模式也在慢慢地融入web前端开发。由于前端开发的环境特性，在经典MVC模式上也引申出了诸多MV\*模式，被实现到各个Javascript框架中都有多少的衍变。在研究MV*模式和各框架的过程中，却是“剪不断、理还乱”：

1. 为什么每个地方讲的MVC都不太一样？
2. MVP、MVVM的出现是要解决什么问题？
3. 为什么有人义正言辞的说“MVC在Web前端开发中根本无法使用”？

带着十万个为什么去翻阅很多资料，但是看起来像view、model、controller、解耦、监听、通知、主动、被动、注册、绑定、渲染等各种术语的排列组合，像汪峰的歌词似的。本篇希望用通俗易懂的方式阐述清楚一些关系，由于接触时间有限，英文阅读能力有限，可能会存在误解，欢迎讨论和纠正。

## MVC变形记

### MVC历史

MVC最初是在研究Smalltalk-80（1979年）期间设计出来的，恐怕没有一本书能够回到计算机石器时代介绍一下smalkTalK的代码是如何实现MVC的，不仅如此，连想搞清楚当时的应用场景都很难了，都要追溯到80后出生以前的事了。但是当时的图形界面少之又少，施乐公司正在研发友好的用户图形界面，以取代电脑屏幕上那些拒人于千里之外的命令行和DOS提示符。那时计算机世界天地混沌，浑然一体，然后出现了一个创世者，将现实世界抽象出模型形成model，将人机交互从应用逻辑中分离形成view，然后就有了空气、水、、鸡啊、蛋什么的。在1995年出版的《设计模式：可复用面向对象软件的基础》对MVC进行了深入的阐述，在推广使用方面发挥了重要作用。

MVC包括三类对象，将他们分离以提高灵活性和复用性。

* 模型model用于封装与应用程序的业务逻辑相关的数据以及对数据的处理方法，会有一个或多个视图监听此模型。一旦模型的数据发生变化，模型将通知有关的视图。

* 视图view是它在屏幕上的表示，描绘的是model的当前状态。当模型的数据发生变化，视图相应地得到刷新自己的机会。

* 控制器controller定义用户界面对用户输入的响应方式，起到不同层面间的组织作用，用于控制应用程序的流程，它处理用户的行为和数据model上的改变。

![经典MVC模式](/mvc-deformation/img/typicalMVC.png)

实线：方法调用
虚线：事件通知

其中涉及两种设计模式：

* view和model之间的观察者模式，view观察model，事先在此model上注册，以便view可以了解在数据model上发生的改变。

* view和controller之间的策略模式

> 一个策略是一个表述算法的对象，MVC允许在不改变视图外观的情况下改变视图对用户输入的响应方式。例如，你可能希望改变视图对键盘的响应方式，或希望使用弹出菜单而不是原来的命令键方式。MVC将响应机制封装在controller对象中。存在着一个controller的类层次结构，使得可以方便地对原有的controller做适当改变而创建新的controller。

> view使用controller子类的实例来实现一个特定的响应策略。要实现不同的响应的策略只要用不同种类的controller实例替换即可。甚至可以在运行时刻通过改变view的controller来改变用户输入的响应方式。例如，一个view可以被禁止接受任何输入，只需给他一个忽略输入事件的controller。

好吧，如果被上述言论绕昏了，请继续研读《设计模式：可复用面向对象软件的基础》。

###MVC for JAVASCRIPT

我们回顾了经典的MVC，接下来讲到的MVC主要是在Javascript上的实现。

![javascript MVC模式](/mvc-deformation/img/javascriptMVC.png)

[源图](https://www.safaribooksonline.com/library/view/learning-javascript-design/9781449334840/ch10s02.html)

如图所示，view承接了部分controller的功能，负责处理用户输入，但是不必了解下一步做什么。它依赖于一个controller为她做决定或处理用户事件。事实上，前端的view已经具备了独立处理用户事件的能力，如果每个事件都要流经controller，势必增加复杂性。同时，view也可以委托controller处理model的更改。model数据变化后通知view进行更新，显示给用户。这个过程是一个圆，一个循环的过程。

这种从经典MVC到Javascript MVC的1对1转化，导致控制器的角色有点尴尬。MVC这样的结构的正确性在于，任何界面都需要面对一个用户，而controller “是用户和系统之间的链接”。在经典MVC中，controller要做的事情多数是派发用户输入给不同的view，并且在必要的时候从view中获取用户输入来更改model，而Web以及绝大多数现在的UI系统中，controller的职责已经被系统实现了。由于某种原因，控制器和视图的分界线越来越模糊，也有认为，view启动了action理论上应该把view归属于controller。比如在Backbone中，Backbone.view和Backbone,Router一起承担了controller的责任。这就为MVC中controller的衍变埋下了伏笔。

### MVP

MVP（model-view-Presenter）是经典MVC设计模式的一种衍生模式，是在1990年代Taligent公司创造的，一个用于C++ CommonPoint的模型。背景上不再考证，直接上图看一下与MVC的不同。

![MVP模式](/mvc-deformation/img/mvp.png)

经典MVC中，一对controller-view捆绑起来表示一个ui组件，controller直接接受用户输入，并将输入转为相应命令来调用model的接口，对model的状态进行修改，最后通过观察者模式对V进行重新渲染。

进化为MVP的切入点是修改controller-view的捆绑关系，为了解决controller-view的捆绑关系，将进行改造，使view不仅拥有UI组件的结构，还拥有处理用户事件的能力，这样就能将controller独立出来。为了对用户事件进行统一管理，view只负责将用户产生的事件传递给controller，由controller来统一处理，这样的好处是多个view可共用同一个controller。此时的controller也由组件级别上升到了应用级别，然而更新view的方式仍然与经典MVC一样：通过Presenter更新M，通过观察者模式更新view。

另一个显而易见的不同在于，MVC是一个圆，一个循环的过程，但MVP不是，依赖Presenter作为核心，负责从model中拿数据，填充到view中。常见的MVP的实现是被动视图(passive view),Presenter观察model，不再是view观察model，一旦model发生变化，就会更新view。Presenter有效地绑定了model到view。view暴露了setters接口以便Presenter可以设置数据。对于这种被动视图的结构，没有直接数据绑定的概念。但是他的好处是在view和model直接提供更清晰的分离。但是由于缺乏数据 绑定支持，意味着不得不单独关注某个任务。在MVP里，应用程序的逻辑主要在Presenter来实现，其中的view是很薄的一层。

### MVVM
MVVM，model－view－viewmodel，最初是由微软在使用Windows Presentation Foundation和SilverLight时定义的，2005年John Grossman在一篇关于阿瓦隆（WPF的代码）的博客文章中正式宣布了它的存在。如果你用过Visual Studio, 新建一个WPF Application，然后在“设计”中拖进去一个控件、双击后在“代码”中写事件处理函数、或者绑定数据源。就对这个MVVM有点感觉了。比如VS自动生成的如下代码：

    Xaml代码
    <GroupBox Header="绑定对象">
        <StackPanel Orientation="Horizontal" Name="stackPanel1">
            <TextBlock Text="学号:"/>
            <TextBlock Text="{Binding Path=StudentID}"/>
            <TextBlock Text="姓名:"/>
            <TextBlock Text="{Binding Path=Name}"/>
            <TextBlock Text="入学日期:"/>
            <TextBlock Text="{Binding Path=EntryDate, StringFormat=yyyy-MM-dd}"/>
            <TextBlock Text="学分:"/>
            <TextBlock Text="{Binding Path=Credit}"/>
        </StackPanel>
    </GroupBox>

    Xaml后台代码
    stackPanel1.DataContext = new Student() {
        StudentID=20130501,
        Name="张三",
        EntryDate=DateTime.Parse("2013-09-01"),
        Credit=0.0
    };

其中最重要的特性之一就是数据绑定，Data-binding。没有前后端分离，一个开发人员全搞定，一只手抓业务逻辑、一只手抓数据访问，顺带手拖放几个UI控件，绑定数据源到某个对象或某张表，一步到位。

背景介绍完毕，再来看一下理论图

![MVVM模式](/mvc-deformation/img/mvvm.png)


首先，view和model是不知道彼此存在的，同MVP一样，将view和model清晰地分离开来。
其次，view是对viewmodel的外在显示，与viewmodel保持同步，viewmodel对象可以看作是view的上下文。view绑定到viewmodel的属性上，如果viewmodel中的属性值变化了，这些新值通过数据绑定会自动传递给view。，反过来viewmodel会暴露model中的数据和特定状态给view。
所以，view不知道model的存在，viewmodel和model也觉察不到view。事实上，model也完全忽略viewmodel和view的存在。这是一个非常松散耦合的设计。

## 流行的MV*框架：

每个框架都有自己的特性，这里主要讨论MVC三个角色的责任。粗浅地过一遍每个框架的代码结构和风格。

### BackboneJS

Backbone通过提供模型models、集合Collection、视图Veiew赋予了Web应用程序分层结构，其中模型包含领域数据和自定义事件；集合Colection是模型的有序或无序集合，带有丰富的可枚举API； 视图可以声明事件处理函数。最终将模型、集合、视图与服务端的RESTful JSON接口连接。

Backbone在升级的过程中，去掉了controller，由view和router代替controller，view集中处理了用户事件（如click，keypress等）、渲染HTML模板、与模型数据的交互。Backbone的model没有与UI视图数据绑定，而是需要在view中自行操作DOM来更新或读取UI数据。Router 为客户端路由提供了许多方法，并能连接到指定的动作（actions）和事件（events）。

Backbone是一个小巧灵活的库，只是帮你实现一个MVC模式的框架，更多的还需要自己去实现。适合有一定Web基础，喜欢原生JS去操作DOM（因为没有数据绑定）的开发人员。为什么称它为库，而不是框架，不仅仅是由于仅4KB的代码，更重要的是
使用一个库，你有控制权。如果用一个框架，控制权就反转了，变成框架在控制你。库能够给予灵活和自由，但是框架强制使用某种方式，减少重复代码。这便是Backbone与Angular的区别之一了。


至于Backbone属于MV\*中的哪种模式，有人认为不是MVC，有人觉得更接近于MVP，事实上，它借用多个架构模式中一些很好的概念，创建一个运行良好的灵活框架。不必拘泥于某种模式。

    view:
    var Appview = Backbone.view.extend({
        // 每个view都需要一个指向DOM元素的引用，就像ER中的main属性。
        el: '#container',

        // view中不包含html标记，有一个链接到模板的引用。
        template: _.template("<h3>Hello <%= who %></h3>"),

        // 初始化方法
        initialize: function(){
          this.render();
        },

        // $el是一个已经缓存的jQuery对象
        render: function(){
          this.$el.html("Hello World");
        },

        // 事件绑定
        events: {'keypress #new-todo': 'createTodoOnEnter'}
    });
    var appview = new Appview();

    model:
    // 每个应用程序的核心、包含了交互数据和逻辑
    // 如数据验证、getter、setter、默认值、数据初始化、数据转换
    var app = {};

    app.Todo = Backbone.model.extend({
      defaults: {
        title: '',
        completed: false
      }
    });

    // 创建一个model实例
    var todo = new app.Todo({title: 'Learn Backbone.js', completed: false});
    todo.get('title'); // "Learn Backbone.js"
    todo.get('completed'); // false
    todo.get('created_at'); // undefined
    todo.set('created_at', Date());
    todo.get('created_at'); // "Wed Sep 12 2012 12:51:17 GMT-0400 (EDT)"

    collection：
    // model的有序集合，可以设置或获取model
    // 监听集合中的数据变化，从后端获取模型数据、持久化。
    app.TodoList = Backbone.Collection.extend({
      model: app.Todo,
      localStorage: new Store("backbone-todo")
    });

    // collection实例
    var todoList = new app.TodoList()
    todoList.create({title: 'Learn Backbone\'s Collection'});

    // model实例
    var model = new app.Todo({title: 'Learn models', completed: true});
    todoList.add(model);
    todoList.pluck('title');
    todoList.pluck('completed');


### KnockoutJS

KnockoutJS是一个名正言顺的MVVM框架，通过简洁易读的data-bind语法，将DOM元素与viewmodel关联起来。当模型（viewmodel）状态更新时，自动更新UI界面。
viewmodel是model和view上的操作的一个连接，是一个纯粹的Javascript对象。它不是UI，没有控件和样式的概念，它也不是持久化的模型数据，它只是hold住一些用户正在编辑的数据，然后暴露出操作这些数据（增加或删除）的方法。

view是对viewmodel中数据的一个可视化的显示，view观察viewmodel，操作view时会发送命令到viewmodel，并且当viewmodel变化时更新。view和model是不了解彼此的存在的。

    view：
    <form data-bind="submit: addItem">
        New item:
        <input data-bind='value: itemToAdd, valueUpdate: "afterkeydown"' />
        <button type="submit" data-bind="enable: itemToAdd().length > 0">Add</button>
        <p>Your items:</p>
        <select multiple="multiple" width="50" data-bind="options: items"> </select>
    </form>


    viewmodel
    var SimpleListmodel = function(items) {
        this.items = ko.observableArray(items);
        this.itemToAdd = ko.observable("");
        this.addItem = function() {
            if (this.itemToAdd() != "") {
                // 把input中的值加入到items，会自动更新select控件
                this.items.push(this.itemToAdd());
                // 清空input中的值
                this.itemToAdd("");
            }
        // 确保这里的this一直是viewmodel
        }.bind(this);
    };

    ko.applyBindings(new SimpleListmodel(["Alpha", "Beta", "Gamma"]));

### angularJS

AngularJS试图成为WEB应用中的一种端对端的解决方案。这意味着它不只是你的WEB应用中的一个小部分，而是一个完整的端对端的解决方案。这会让AngularJS在构建一个CRUD的应用时看起来很呆板，缺乏灵活性。AngularJS是为了克服HTML在构建应用上的不足而设计的。使用了不同的方法，它尝试去补足HTML本身在构建应用方面的缺陷。通过使用标识符(directives)的结构，让浏览器能够识别新的语法。例如使用双大括号{{}}语法进行数据绑定；使用ng-controller指定每个控制器负责监视视图中的哪一部分，使用ng-model，把输入数据绑定到模型中的一部分属性上

双向数据绑定是AngularJS的另一个特性。UI控件的任何更改会立即反映到模型变量（一个方向），模型变量的任何更改都会立即反映到问候语文本中（另一方向）。AngularJS通过作用域来保持数据模型与视图界面UI的双向同步。一旦模型状态发生改变，AngularJS会立即刷新反映在视图界面中，反之亦然。

AngularJS原本是倾向于MVC，但是随着项目重构和版本升级，现在更接近MVVM。和Knockout view中的风格类似，都像从WPF衍变过来的，只是Knockout使用了自定义属性data-bind作为绑定入口，而AngularJS对于HTML的变革更彻底，扩展HTML的语法，引入一系列的指令。

在AngularJS中，一个视图是模型通过HTML模板渲染之后的映射。这意味着，不论模型什么时候发生变化，AngularJS会实时更新结合点，随之更新视图。比如，视图组件被AngularJS用下面这个模板构建出来：

      <body ng-controller="PhoneListCtrl">
        <ul>
          <li ng-repeat="phone in phones">
            {{phone.name}}
          <p>{{phone.snippet}}</p>
          </li>
        </ul>
      </body>

在<li>标签里面的ng-repeat语句是一个AngularJS迭代器。包裹在phone.name和phone.snippet周围的花括号标识着数据绑定，是对应用一个数据模型的引用。当页面加载的时候，AngularJS会根据模版中的属性值，将其与数据模型中相同名字的变量绑定在一起，以确保两者的同步性。

  在PhoneListCtrl控制器里面初始化了数据模型：

    controller:
    function PhoneListCtrl($scope) {
      // 数组中存储的对象是手机数据列表
      $scope.phones = [
        {"name": "Nexus S",
         "snippet": "Fast just got faster with Nexus S."},
        {"name": "Motorola XOOM™ with Wi-Fi",
         "snippet": "The Next, Next Generation tablet."},
        {"name": "MOTOROLA XOOM™",
         "snippet": "The Next, Next Generation tablet."}
      ];
    }

尽管控制器看起来并没有什么控制的作用，但是它在这里的重要性在于，通过给定数据模型的作用域$scope，允许建立模型和视图之间的数据绑定。方法名PhoneListCtrl和<body>标签里面的ngcontroller指令的值相匹配。当应用启动之后，会有一个根作用域被创建出来，而控制器的作用域是根作用域的一个典型后继。这个控制器的作用域对所有<body ng-controller="PhoneListCtrl">标记内部的数据绑定有效。

AngularJS的作用域理论非常重要：一个作用域可以视作模板、模型和控制器协同工作的粘接器。AngularJS使用作用域，同时还有模板中的信息，数据模型和控制器。这些可以帮助模型和视图分离，但是他们两者确实是同步的！任何对于模型的更改都会即时反映在视图上；任何在视图上的更改都会被立刻体现在模型中。

## 实践中的思考

我们使用的MVC框架是ER，适用于并能很方便地构建一个整站式的AJAX web应用。提供精简、核心的Action、model和view的抽象，使得构建RIA应用变得简单可行。在使用的过程中近距离地体会到非常多方面的优秀的设计理念。也让我开始思考各个角色的转型。

### 让view上前线

我开始思考action（controller）这个角色。我觉得从纯粹地解耦角度来说，view和model应该是互相不知道彼此存在的，所有的事件流和对数据、UI的处理应该都流经action。但是这一点又极不现实。用户操作了一个UI，需要更新model的一个数据，就要fire到action，通过action来调用model的set方法。这样又有点麻烦，因为view中有对model的应用，可以一句代码搞定这一个数据的设置。所以，我自己设置了一个规则：如果是简单的模型数据读写可以直接在view中操作；如果要经过复杂的数据处理，必须流经action。于是，我遇到了一种怎么都偷不了懒（必须经过action）的情况：
比如有个主action mainMVC，两个子action listMVC、selectMVC，用户在listMVC中的view选择一条数据添加到右侧selectMVC中。那走过的流程是这样的：

![实践中的思考](/mvc-deformation/img/practice.png)

1、子Action中的listview接受UI事件，fire到listAction中
2、listAction继续将事件fire到Mainview中，由主action来处理另外子Action的事情。
3、Mainview接收到事件、调用子Action selecteAction的方法
4、selecteAction继续调用selectview的方法来完成UI的更新。

其中涉及的model的变化暂时不考虑。我在想，view既然把经典MVC中的controller接受用户事件的角色承接过来的，那如果借鉴backone的思想，把view作为controller的一个实现，推到战场的最前线。省掉两次action的中转传递，是不是更简单。

### model驱动开发

实际开发中，常常会以view为核心，页面上需要展示什么数据，就去model中设置数据源。发生了用户事件，我会在action中更新model，然后刷新view。有时候会遗漏更新model，直到需要数据时才发现没有保存到model中。

model本身是独立的，自控制的，不依赖于view，能够同步支持多view的显示。就像linux上的应用程序通常会提供图形界面和命令行两种操作方式一样。那如果以model为核心，model驱动开发，数据在手、天下我有，以模型验证保证数据的完整性和正确性。实现数据绑定，任何对模型的更改都会在界面上反映出来。那我们只要预先写好view和model的关系映射（类似viewmodel），然后只关注模型数据，就OK了。


**对于MV\*家族，都是在经典MVC基础上随着时代的发展、应用环境的变化衍变出来的。实现MV\*模式的这些框架到底归属于哪种模式，也不必泥古。MV\*是一个很有争议性的话题，能够构建一个健壮、具有良好设计、遵从关注点分离的项目比花时间去争论到底是MV\*更有意义。**




