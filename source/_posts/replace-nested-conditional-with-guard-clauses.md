---
title: 嵌套条件的重构
date: 2015-3-9
author: 我佛山人
author_link: http://weibo.com/wfsr
tags:
- 重构
- JavaScript
---

嵌套的条件判断会导致方法的正常执行路径不明晰，使代码可读性下降。本文提供一种对嵌套条件重构的方法，能有效提升代码的可读性。


原文：[http://sourcemaking.com/refactoring/replace-nested-conditional-with-guard-clauses](http://sourcemaking.com/refactoring/replace-nested-conditional-with-guard-clauses)

条件判断会导致方法的正常执行路径不明晰。

特例一概使用 `Guard Clauses`。

<!-- more -->

```javascript
function getPayAmount() {
    var result;
    if (_isDead) {
        result = deadAmount();
    }
    else {
        if (_isSeparated) {
            result = separatedAmount();
        }
        else {
            if (_isRetired) {
                result = retiredAmount();
            }
            else {
                result = normalPayAmount();
            }
        }
    }
    return result;
}
```

改成：

```javascript
function getPayAmount() {
    if (_isDead) {
        return deadAmount();
    }

    if (_isSeparated) {
        return separatedAmount();
    }

    if (_isRetired) {
        return retiredAmount();
    }

    return normalPayAmount();
}
```

## 缘起

条件表达式有两种形式。一种是检查是否正常行为。另一种是先响应正常的行为，其余的都是异常状况。

这些条件类型目的各异，并且会在代码中体现出来。如果都属于正常行为，用一个 `if-else`。如果是一种异常条件，检查到该异常条件为 true 后返回。第二种检查方式通常叫作 `Guard Clauses`。


本文标题是强调的关键点之一。如果你正在使用 `if-else` 的结构，表明赋予 `if` 和 `else` 同等的权重。传达给读者两个分支有着相同的可能性和重要性。而 `Guard Clauses` 则说：“这种情况很少见，一旦出现，得处理一下才能离开。”

在与遵循方法只有一个入口一个出口的程序员合作时，我通常要用 `Guard Clauses` 替换他的嵌套条件。一个入口是由现代语言强制要求的，而一个出口则不是一条有用规则。关键是要谨记：如果一个出口能使方法更清晰，用之，否则不用。


## 过程

- 把每个检查放到 `Guard Clauses`。

    > `Guard Clauses` 要么返回，要么抛异常。

- 替换为 `Guard Clauses` 之后要编译和测试。

    > 如果所有 `Guard Clauses` 产出同样的结果，合并条件表达式。


## 示例


假设有一个对死亡、离职和退休员工有特殊规则的薪酬系统，这些都是不寻常的情况，但时有发生。


如果我看到这样的代码：

```javascript
function getPayAmount() {
    var result;
    if (_isDead) {
        result = deadAmount();
    }
    else {
        if (_isSeparated) {
            result = separatedAmount();
        }
        else {
            if (_isRetired) {
                result = retiredAmount();
            }
            else {
                result = normalPayAmount();
            }
        }
    }
    return result;
}
```

这种校验会掩盖正常的行为。因此换成 `Guard Clauses` 更清晰。我可以逐个引入，先由最上面的开始：

```javascript
function getPayAmount() {
    var result;

    if (_isDead) {
        return deadAmount();
    }
    if (_isSeparated) {
        result = separatedAmount();
    }
    else {
        if (_isRetired) {
            result = retiredAmount();
        }
        else {
            result = normalPayAmount();
        }
    }

    return result;
}
```

继续替换：

```javascript
function getPayAmount() {
    var result;

    if (_isDead) {
        return deadAmount();
    }

    if (_isSeparated) {
        return separatedAmount();
    }

    if (_isRetired) {
        result = retiredAmount();
    }
    else {
        result = normalPayAmount();
    }

    return result;
}
```

然后：

```javascript
function getPayAmount() {
    var result;

    if (_isDead) {
        return deadAmount();
    }

    if (_isSeparated) {
        return separatedAmount();
    }

    if (_isRetired) {
        return retiredAmount();
    }

    result = normalPayAmount();

    return result;
}
```

现在 `result` 临时变量是多余的，可以去掉：

```javascript
function getPayAmount() {
    if (_isDead) {
        return deadAmount();
    }

    if (_isSeparated) {
        return separatedAmount();
    }

    if (_isRetired) {
        return retiredAmount();
    }

    return normalPayAmount();
}
```

遵循方法只有一个出口的程序员常常写出嵌套的条件代码，我觉得这样做很傻很天真。当我对方法后面不感兴趣时，会选择马上退出。 这时出现的空 `else` 块只会令人费解。

## 示例：条件反转

在评审本书稿时，`Joshua Kerievsky` 指出，还可以用反转条件表达式实现替换 `Guard Clauses`。他的示例让我茅塞顿开：

```javascript
function getAdjustedCapital() {
    var result = 0;

    if (_capital > 0) {
        if (_intRate > 0 && _duration > 0) {
            result = (_income / _duration) * ADJ_FACTOR;
        }
    }

    return result;
}
```

依然是逐个替换，不过这次我反转放到 `Guard Clauses` 的条件：

```javascript
function getAdjustedCapital() {
    var result = 0;

    if (_capital <= 0) {
        return result;
    }

    if (_intRate > 0 && _duration > 0) {
        result = (_income / _duration) * ADJ_FACTOR;
    }

    return result;
}
```

由于下个条件复杂点，要分两步来反转。首先取反：

```javascript
function getAdjustedCapital() {
    var result = 0;

    if (_capital <= 0) {
        return result;
    }

    if (!(_intRate > 0 && _duration > 0)) {
        return result;
    }

    result = (_income / _duration) * ADJ_FACTOR;

    return result;
}
```

这样取反的条件不易理解，所以展开简化如下：

```javascript
function getAdjustedCapital() {
    var result = 0;

    if (_capital <= 0) {
        return result;
    }

    if (_intRate <= 0 || _duration <= 0) {
        return result;
    }

    result = (_income / _duration) * ADJ_FACTOR;

    return result;
}
```

这种情形下我喜欢让它返回明确的值。这样你能轻易明白 `Guard Clauses` 失败的结果（我考虑过用常量代替魔法数字）。

```javascript
function getAdjustedCapital() {
    var result = 0;

    if (_capital <= 0) {
        return 0;
    }

    if (_intRate <= 0 || _duration <= 0) {
        return 0;
    }

    result = (_income / _duration) * ADJ_FACTOR;

    return result;
}
```

最后移除临时变量：

```javascript
function getAdjustedCapital() {
    if (_capital <= 0) {
        return 0;
    }

    if (_intRate <= 0 || _duration <= 0) {
        return 0;
    }

    return (_income / _duration) * ADJ_FACTOR;
}
```
