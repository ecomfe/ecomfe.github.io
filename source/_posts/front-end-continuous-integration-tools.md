---
title: 前端开源项目持续集成三剑客
date: 2016-7-25
author: cxtom
author_link: https://github.com/cxtom
tags:
- Travis CI
- tesing
- Coveralls
- Saucelabs
---


开发业务代码的时候，我们总能发现一些通用的功能。这时候，作为一个在互联网时代富有分享精神的程序员，就会想要把项目开源出去，让更多的小伙伴去使用，偶尔可能会有大神评论，能学到很多。
在 GitHub 上， README 是最先让人看到的，一些应用广泛的项目的 README ，除了非常详细的文字介绍，还常常会带有很多小徽章，比如 `Vue` 的这个 README 的开头：

![Vue](/blog/front-end-continuous-integration-tools/img/vue.png)

这些徽章 (badage) 展示了**代码的测试覆盖率**、**构建状态**、**在各个浏览器中的运行情况**，这会让项目显得更加专业和有说服力。本文以笔者集齐了一套徽章的亲身经历，总结了过程中的主要流程和一些踩到的坑，欢迎大家补充，让我们的项目流行起来！

<!-- more -->

首先，安利一下我们开发的一个基于 [React](https://facebook.github.io/react/) 和 [Masterial Design](https://www.google.com/design/spec/material-design/introduction.html) 的组件库 [Melon](https://github.com/react-melon/melon)，欢迎大家使用，如果能加个星，提个 pr 就更欢迎了。

## 测试代码的重要性

> 靠人工来保证项目的维护总是不出差错是不靠谱的，人总有健忘和糊涂的时候，尤其是当项目越来越复杂时，一个人甚至可能无法全部了解项目的全部逻辑，这时我们就要依靠测试来保证项目的可靠性，这里的测试包括但不限于，单元功能测试，UI 测试，兼容性测试等等。

关于单测框架已经有很多教程和文档，一个测试体系大体应该包含四部分

* 测试运行器 Test Runner: [edp-test](https://github.com/ecomfe/edp-test) [karma](https://github.com/karma-runner/karma)
* 测试框架 Testing Framework: [jasmine](http://jasmine.github.io/) [mocha](https://mochajs.org/) [qunit](https://qunitjs.com/) [Jest](https://facebook.github.io/jest/)
* 断言库 Assertion library: [expect.js](https://www.npmjs.com/package/expect.js) [should](https://www.npmjs.com/package/should) [chai](https://www.npmjs.com/package/chai)
* 覆盖率 Coverage library: [istanbul](https://github.com/gotwarlost/istanbul)

其中，`jasmine` 是一个比较完整的测试框架，还自带了丰富的断言函数，在编写测试用例的时候不再需要单独去引用断言库。以 Melon 项目为例，笔者使用的是 `karma+jasmine+istanbul` 的组合，由于这是基于 React 的库，并且代码是 ES6 编写的，因此需要加上 `browserify` `babelify` 这些插件。

Melon 项目 karma 配置示例：
[https://github.com/react-melon/melon-core/blob/master/tool/karma/config.js](https://github.com/react-melon/melon-core/blob/master/tool/karma/config.js)

有了一整套测试体系，编写完代码的测试用例，就可以开始应用下面的三个工具帮你生成徽章了

## 持续集成

> [持续集成](http://baike.baidu.com/link?url=N6-tOlIuf5lpnhD7LFAA5jIlOgD3dGEyTW_XQOEIo5etmYxxtoERwGOEz9q0jCtYWwHpvX4qZb31Hr0X4QvGRa)是一种软件开发实践，即团队开发成员经常集成它们的工作，通过每个成员每天至少集成一次，也就意味着每天可能会发生多次集成。每次集成都通过自动化的构建（包括编译，发布，自动化测试）来验证，从而尽早地发现集成错误。

GitHub 上比较主流的持续集成工具有 [Travis CI](https://travis-ci.org/) 和 [Circle CI](https://circleci.com/)，下面以 Travis CI 为例：

### 第一步 注册

进入 Travis 的 [首页](https://travis-ci.org/) 有个 `Sign Up` 的大按钮，点击进入就行了。第一次会进入一个github的登录页面，可以选择你想要开源的项目所在的组。有可能你不是这个组的Owner，并且这个组还没有开通连接 Travis 的服务，需要联系 Owner 去开通。

### 第二步 创建 `.travis.yml`

在项目根目录下创建 Travis 的配置文件，如下（如果没有这个文件，Travis 会默认执行 `npm install` 和 `npm test`）：

```
language: node_js
node_js:
    - 4
install:
|
    npm install -g npm@latest
    npm --version
    npm install --registry http://registry.npmjs.org
script:
    - npm run test-ci
```

这是按照 [YAML](http://yaml.org/) 的语法来写的，通过这个配置文件，我们需要告诉 Travis 服务器，我们的代码是用什么语言编写的（language）、每次构建之前需要运行什么命令来安装依赖包（install）、怎么执行测试程序（script）。对于 Node.js 我们还需要指定 Node 的版本，我们也可以设置多个 Node 版本来检测一些 Node 端工具的兼容性。当 `node_js` 配置设置了多个时，Travis 会同时创建多个 Job 来运行。
更多的配置可以参考 Travis 的[官方文档](https://docs.travis-ci.com/user/getting-started/)

这里有一个坑，如果安装的时候不指定 npm 源，Babel 的有一些依赖包都会神奇得挂掉，导致构建直接终止，当你的项目出现这种问题了，不妨试试加一下 `--registry http://registry.npmjs.org`

如果觉得每次都安装 npm 包太费时，Travis 有 `cache` 的功能，可以看[文档](https://docs.Travis-ci.com/user/caching/)配置

### 第三步 提交代码

每次代码 push 以后，Travis 会自动开始构建，并运行单测，构建成功以后就可以把徽章加到 README 里了
```
[![Build](https://img.shields.io/travis/react-melon/melon-core.svg)](https://travis-ci.org/react-melon/melon-core)
```

## 代码覆盖率集成

写完整单元测试代码是维护一个快速迭代项目不出差错的有效方法，代码覆盖率报告可以为编写测试程序提供参考。通过一些工具，还可以及时的把你的代码的测试情况及时的反馈给用户，让用户感知你的测试是否完备。

第二位剑客登场： **[Coveralls](http://coveralls.io/)**
它可以帮你生成一个展示代码覆盖率的徽章： [![Coverage Status](https://coveralls.io/repos/github/react-melon/melon-core/badge.svg)](https://coveralls.io/github/react-melon/melon-core)

### 第一步 注册

打开 [Coveralls 官网](http://coveralls.io/)，点击红框中的按钮再打开的页面中选择 `GITHUB SIGN UP`，后面类似 Travis CI。

![图片](/blog/front-end-continuous-integration-tools/img/coveralls.png)
![图片](/blog/front-end-continuous-integration-tools/img/coveralls2.png)

注册完成以后，就可以在 Dashboard 里面看到自己所有在 GitHub 上的代码库了。

### 第二步 创建 `.coveralls.yml`

进入 Coveralls 中相关代码库的的[详情页](https://coveralls.io/github/react-melon/melon-core)，如果你有权限，可以看到一个 `TOKEN` 的格子，把这个 token 复制一下。在项目的根目录新建一个文件 `.coveralls.yml` ，这是 Coveralls 的配置文件，在文件里写上对应的 token，如下：
```
repo_token: xxxxxxx
```

![图片](/blog/front-end-continuous-integration-tools/img/coveralls3.png)

### 第三步 生成测试报告

给 Coveralls 上传的测试报告需要有统一的 `lcov` 格式，大部分的单测框架都支持生成这种报告的生成，以 karma 为例
```
coverageReporter: {
    dir: path.join(__dirname, 'coverage'),
    reporters: [
        {type: 'html'},
        {type: 'lcov', subdir: 'lcov'}  // lcov
    ]
},
```

### 第四步 上传报告

首先安装上传的工具，然后执行一下上传的命令，就可以在网页上看到了
```
$ npm i coveralls --save-dev
$ cat ./coverage/lcov/lcov.info | ./node_modules/.bin/coveralls
```

最后把徽章放到 README 里
```
[![Coverage Status](https://img.shields.io/coveralls/react-melon/melon-core/master.svg)](https://coveralls.io/github/react-melon/melon-core)
```

### Travis + Coveralls

运用 Travis，可以实现自动上传代码覆盖率报告，实现也很简单：

在 `.tarvis.yml` 里面增加一个配置
```
after_script:
    - npm run coveralls
```

在 `.coveralls.yml` 里也增加配置，指定使用的是 Travis 的服务
```
service_name: travis-ci
```

`package.json` 里面也定义好相关脚本
```
"scripts": {
    "test": "./node_modules/.bin/karma start ./tool/karma.conf.js",
    "test-ci": "./node_modules/.bin/karma start ./tool/karma.ci.conf.js",
    "coveralls": "cat ./coverage/lcov/lcov.info | ./node_modules/.bin/coveralls"
},
```

## 跨浏览器集成测试

浏览器端使用的库，在各个浏览器端的兼容性也是非常重要的。很多项目会选择使用 PhantomJS / jsdom 作为浏览器环境来运行代码，这样虽然方便，但是毕竟是模拟的，无法完全替代真实的浏览器环境，比如 IE、FireFox 用的都不是 Webkit 的内核，IE 还有好几个版本。
咱们的第三位剑客 [SauceLabs](https://saucelabs.com/)，就提供了多重浏览器环境（包括 PC 端和移动端），帮助你在多个浏览器中自动运行脚本。

### 添加子用户
Saucelabs 注册了一个用户以后，没法和 GitHub 关联起来，它是通过创建子用户的方法来手动关联的，每一个项目都需要创建一个子用户，并且有不同的 `accessKey`。（而且每个子用户都需要一个不同的邮箱来注册。。。）

### 通用方法
可以查看官方的 [文档](https://wiki.saucelabs.com/display/DOCS/Using+Sauce+Labs+with+Continuous+Integration+Platforms)

在 `.travis.yml` 中增加配置，Travis 会在运行测试脚本之前自动安装 Saucelabs 需要的环境
```
addons:
  sauce_connect:
    username: "Your Sauce Labs username"
    access_key: "Your Sauce Labs access key"
```

### karma-sauce-launcher

karma 提供了一个调起 Saucelabs 中各个浏览器的插件，可以不需要配置 Travis 就能执行，插件库地址：https://github.com/karma-runner/karma-sauce-launcher 里面已经有了比较详细的 API 文档

下面是一个 karma 配置示例
```
var _ = require('lodash');

var karmaConfig = require('./karma/config');

var customLaunchers = {
    // pc
    slChrome: {
        base: 'SauceLabs',
        browserName: 'chrome',
        platform: 'Windows 7'
    },
    slFirefox: {
        base: 'SauceLabs',
        browserName: 'firefox'
    },
    // ie family
    slIE11: {
        base: 'SauceLabs',
        browserName: 'internet explorer',
        platform: 'Windows 8.1',
        version: '11'
    },
    slIE10: {
        base: 'SauceLabs',
        browserName: 'internet explorer',
        platform: 'Windows 8',
        version: '10'
    },
    slIE9: {
        base: 'SauceLabs',
        browserName: 'internet explorer',
        version: '9'
    },
    // mac safari
    slMacSafari: {
        base: 'SauceLabs',
        browserName: 'safari',
        platform: 'OS X 10.10'
    },
    // mobile
    slIosSafari: {
        base: 'SauceLabs',
        browserName: 'iphone',
        platform: 'OS X 10.9',
        version: '9.1'
    },
    slAndroid: {
        base: 'SauceLabs',
        browserName: 'android',
        platform: 'Linux',
        version: '4.3'
    }
};

module.exports = function (config) {

    // Use ENV vars on Travis and sauce.json locally to get credentials
    if (!process.env.SAUCE_USERNAME) {
        process.env.SAUCE_USERNAME = require('./sauce').username;
        process.env.SAUCE_ACCESS_KEY = require('./sauce').accessKey;
    }

    config.set(_.extend(karmaConfig, {
        frameworks: ['browserify', 'mocha', 'es5-shim'],
        sauceLabs: {
            'testName': 'Melon Core Unit Tests',
            'public': 'public'  // 这个配置需要设置为 public，不然我们生成的徽章就只有自己能看到了
        },
        customLaunchers: customLaunchers,
        browsers: Object.keys(customLaunchers),
        reporters: ['coverage', 'mocha', 'saucelabs'],
        singleRun: true
    }));
};
```

**SauceLabs 配置需要注意**

* 我们需要手动给 `process.env.SAUCE_USERNAME`  和 `process.env.SAUCE_ACCESS_KEY` 赋值，`accessKey` 对应的是子用户
* 如果想提交本地的测试结果，需要添加 `build` 参数，用来唯一标识某一次测试（如果在 Travis 上运行就不需要特别指定，会默认使用 Travis 的构建 ID），如果没有指定这个参数，是不会生成结果图的
* `public` 需要手动配置为 `public: 'public'`，否则默认只有自己能看到测试结果
* 移动端浏览器的 `browserName` 是 `android` 或 `iphone`，`version` 参数不是指的浏览器的版本号，而是系统的版本号

最后可以把徽章放到 README 里
```
[![Selenium Test Status](https://saucelabs.com/browser-matrix/YOUR_USERNAME.svg)](https://saucelabs.com/u/YOUR_USERNAME)
```

## 徽章的样式

大部分的图标都是用了 [Shield IO](http://shields.io/) 的服务，它提供了一些参数可以设置徽章的样式，以 Coveralls 为例

![Coveralls Status](https://img.shields.io/coveralls/react-melon/melon-core/master.svg?style=plastic)  https://img.shields.io/coveralls/react-melon/melon-core/master.svg?style=plastic

![Coveralls Status](https://img.shields.io/coveralls/react-melon/melon-core/master.svg?style=flat)  https://img.shields.io/coveralls/react-melon/melon-core/master.svg?style=flat

![Coveralls Status](https://img.shields.io/coveralls/react-melon/melon-core/master.svg?style=flat-square)  https://img.shields.io/coveralls/react-melon/melon-core/master.svg?style=flat-square

![Coveralls Status](https://img.shields.io/coveralls/react-melon/melon-core/master.svg?style=social)  https://img.shields.io/coveralls/react-melon/melon-core/master.svg?style=social


## 总结

我们的最终效果图，瞬间就高端了很多。

![图片](/blog/front-end-continuous-integration-tools/img/conclue.png)


## 参考文档

[一个靠谱的前端开源项目需要什么？](https://mp.weixin.qq.com/s?__biz=MzI2NzExNTczMw==&mid=2653284934&idx=1&sn=af82495f35adea9b919e27a20749145e&scene=1&srcid=0708AigCqTI0RpFMJT6MhAcp&key=77421cf58af4a65386d8a3d36fb7fb3f6a6a4631beb5f8a87c8448d85f1135802d43e85b216f113efa06f19f479902d5&ascene=0&uin=MzAyNjk4MDU1&devicetype=iMac+MacBookPro11%2C1+OSX+OSX+10.10.5+build(14F1808)&version=11020201&pass_ticket=hXS2sgF6aJfo9PbSLZf0ltuHlOg6150rr%2FOnA%2FyFI4Ze2rlQsKd9wrzsPz5yZH%2FV#rd)
