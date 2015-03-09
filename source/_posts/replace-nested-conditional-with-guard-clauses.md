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


原文：http://sourcemaking.com/refactoring/replace-nested-conditional-with-guard-clauses

说明：本译文中所有 `Guard Clauses` 一律使用 `GC` 代替，不作翻译。

A method has conditional behavior that does not make clear the normal path of execution.
条件判断会导致方法的正常执行路径不明晰。

Use guard clauses for all the special cases.
特例一概使用 `GC`。

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

## Motivation 缘起

I often find that conditional expressions come in two forms. The first form is a check whether either course is part of the normal behavior. The second form is a situation in which one answer from the conditional indicates normal behavior and the other indicates an unusual condition.
条件表达式有两种形式。一种是检查是否正常行为。另一种是先响应正常的行为，其余的都是异常状况。

These kinds of conditionals have different intentions, and these intentions should come through in the code. If both are part of normal behavior, use a condition with an if and an else leg. If the condition is an unusual condition, check the condition and return if the condition is true. This kind of check is often called a guard clause [Beck].
这些条件类型目的各异，并且会在代码中体现出来。如果都属于正常行为，用一个 `if-else`。如果是一种异常条件，检查到该异常条件为 true 后返回。第二种检查方式通常叫作 `GC`。


The key point about Replace Nested Conditional with Guard Clauses is one of emphasis. If you are using an if-then-else construct you are giving equal weight to the if leg and the else leg. This communicates to the reader that the legs are equally likely and important. Instead the guard clause says, "This is rare, and if it happens, do something and get out."
本文标题是强调的关键点之一。如果你正在使用 `if-else` 的结构，表明赋予 `if` 和 `else` 同等的权重。传达给读者两个分支有着相同的可能性和重要性。而 `GC` 则说：“这种情况很少见，一旦出现，得处理一下才能离开。”

I often find I use Replace Nested Conditional with Guard Clauses when I'm working with a programmer who has been taught to have only one entry point and one exit point from a method. One entry point is enforced by modern languages, and one exit point is really not a useful rule. Clarity is the key principle: if the method is clearer with one exit point, use one exit point; otherwise don't.
在与遵循方法只有一个入口一个出口的程序员合作时，我通常要用 `GC` 替换他的嵌套条件。一个入口是由现代语言强制要求的，而一个出口则不是一条有用规则。关键是要谨记：如果一个出口能使方法更清晰，用之，否则不用。


## Mechanics 过程

- For each check put in the guard clause.

    > The guard clause either returns, or throws an exception.

- Compile and test after each check is replaced with a guard clause.

    > If all guard clauses yield the same result, use Consolidate Conditional Expressions.

- 把每个检查放到 `GC`。

    > `GC` 要么返回，要么抛异常。

- 替换为 `GC` 之后要编译和测试。

    > 如果所有 `GC` 产出同样的结果，合并条件表达式。


## Example 示例


Imagine a run of a payroll system in which you have special rules for dead, separated, and retired employees. Such cases are unusual, but they do happen from time to time.
假设有一个对死亡、离职和退休员工有特殊规则的薪酬系统，这些都是不寻常的情况，但时有发生。


If I see the code like this
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

Then the checking is masking the normal course of action behind the checking. So instead it is clearer to use guard clauses. I can introduce these one at a time. I like to start at the top:
这种校验会掩盖正常的行为。因此换成 `GC` 更清晰。我可以逐个引入，先由最上面的开始：

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

I continue one at a time:
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

and then
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

By this point the result temp isn't pulling its weight so I nuke it:
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

Nested conditional code often is written by programmers who are taught to have one exit point from a method. I've found that is a too simplistic rule. When I have no further interest in a method, I signal my lack of interest by getting out. Directing the reader to look at an empty else block only gets in the way of comprehension.
遵循方法只有一个出口的程序员常常写出嵌套的条件代码，我觉得这样做很傻很天真。当我对方法后面不感兴趣时，会选择马上退出。 这时出现的空 `else` 块只会令人费解。

## Example: Reversing the Conditions 示例：条件反转

In reviewing the manuscript of this book, Joshua Kerievsky pointed out that you often do Replace Nested Conditional with Guard Clauses by reversing the conditional expressions. He kindly came up with an example to save further taxing of my imagination:
在评审本书稿时，`Joshua Kerievsky` 指出，还可以用反转条件表达式实现替换 `GC`。他的示例让我茅塞顿开：

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

Again I make the replacements one at a time, but this time I reverse the conditional as I put in the guard clause:
依然是逐个替换，不过这次我反转放到 `GC` 的条件：

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

Because the next conditional is a bit more complicated, I can reverse it in two steps. First I add a not:
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

Leaving nots in a conditional like that twists my mind around at a painful angle, so I simplify it as follows:
这样取反的条件不易理解，所以简化如下：

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

In these situations I prefer to put an explicit value on the returns from the guards. That way you can easily see the result of the guard's failing (I would also consider Replace Magic Number with Symbolic Constant here).
这种情形下我喜欢让它返回明确的值。这样你可以容易理解 `GC` 失败的结果（我考虑过用常量代替魔法数字）。

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

With that done I can also remove the temp:
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
