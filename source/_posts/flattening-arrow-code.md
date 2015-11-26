---
title: 扁平化箭形代码
date: 2015-7-1 13:30
author: 我佛山人
author_link: http://weibo.com/wfsr
tags:
- 重构
- JavaScript
---


作为[《嵌套条件的重构》](http://efe.baidu.com/blog/replace-nested-conditional-with-guard-clauses/) 的姊妹篇，补充说明箭形代码的缺点，并以函数分解的方式扁平化箭形代码。

原文：[Flattening Arrow Code](http://blog.codinghorror.com/flattening-arrow-code/)


经常看到这种代码：

```javascript
if (rowCount > rowIdx) {
    if (drc[rowIdx].table.columns.contains("avalId")) {
        do {
          if (attributes[attrVal.attributeClassId] == null) {
              // do stuff
          }
          else {
              if (!Array.isArray(attributes[attrVal.attributeClassId])) {
                  // do stuff
              }
              else {
                  if (!isChecking) {
                      // do stuff
                  }
                  else {
                      // do stuff
                  }
              }
          }
          rowIdx++;
        }
        while (rowIdx < rowCount && parseInt(drc[rowIdx], 10) === Id);
    }
    else {
        rowIdx++;
    }
}
return rowIdx;
```

太多的条件嵌套使代码变成一个箭头的样子：

```
if
    if
        if
            if
                do something
            endif
        endif
    endif
endif
```



当你在1280x1024 分辨率下阅读代码时会超出右边边界。这就是箭头反模式。


我重构的首要任务之一是把这样的箭形代码 “扁平化”。那些锋利的尖钩很危险！箭形代码有着很高的圈复杂度 -- 衡量贯穿代码有多少不同路径：

> 研究表明程序的质量与它的圈复杂度（[WIKI](http://en.wikipedia.org/wiki/Cyclomatic_complexity), [百度百科](http://baike.baidu.com/link?url=NhIy14F1G0pKk9NeWcromnkCAJzqZofWwvMweET_R6JolBvlX4Mf2CcLLclZ4GtPqg9Y66SDXzZ09CfIpvd6Ja)）有关。低圈复杂度的程序更简单易懂，修改时的风险也更低。模块的圈复杂度与它的可测试性也是高度相关的。

在适当的地方，我通过以下方式扁平化箭形代码：


1. 替换条件为 `guard clauses`，这个代码..

```javascript
if (SomeNecessaryCondition) {
    // function body code
}
```

.. 改成 `guard clause` 会更好：

```javascript
if (!SomeNecessaryCondition) {
    throw new RequiredConditionMissingException;
}
// function body code
```

2. 用函数来分解条件块。在上例中，我们把 do..while 循环里的条件分解。

```javascript
do {
    validateRowAttribute(drc[rowIdx]);
    rowIdx++;
}
while (rowIdx < rowCount && parseInt(drc[rowIdx], 10) === Id);
```

3. 将否定检查转为肯定检查。主要规则是把肯定比较置前，让否定比较自然落到 else 中。我认为这样可读性肯定更好，更重要的是，避免 “我永远不会不做” 句式。


```javascript
if (Array.isArray(attributes[attrVal.attributeClassId])) {
    // do stuff
}
else {
    // do stuff
}
```

4. 总是尽快从函数返回。一旦工作完成，马上退出。这个并非永远合适的 -- 你可能需要清理资源。但无论如何，你必须放弃只应在底部有一个出口的错误想法。

目的是让代码在垂直方向滚动多些...而不是在水平方向上。

