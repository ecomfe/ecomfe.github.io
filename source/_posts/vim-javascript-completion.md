title: VIM的JavaScript补全
date: 2015-05-05
author: hushicai
tags:
- VIM
- JavaScript
- Completion
s: VIM JavaScript Completion
---

最近微软出了个Visual Studio Code，听说很diao，尤其是对JavaScript的补全支持很令人惊艳！

如果你是一个vim党，那么请淡定！

在JavaScript开发过程中，使用vim内置的`ins-completion`再加上一些插件，我们同样可以获得很牛逼的completion支持！

<!-- more -->

## ins-completion

vim其实已经提供了很好的代码补全支持。

### 整行

快捷键：`<C-X><C-L>`

![](/blog/vim-javascript-completion/c-x-c-l.gif)

### 文件名

快捷键：`<C-X><C-F>`

![](/blog/vim-javascript-completion/c-x-c-f.gif)

### 当前文件中的关键字

快捷键：`<C-X><C-P>`或`<C-X><C-N>`

![](/blog/vim-javascript-completion/c-x-c-pn.gif)

### `complete`选项所指定的范围中的关键字

快捷键：`<C-N>`或`<C-P>`

![](/blog/vim-javascript-completion/c-pn.gif)

`<C-N>`、`<C-P>`跟`<C-X><C-N>`、`<C-X><C-P>`类似，但是查找范围更广，不局限于当前文件。

如上图所示，我打开两个文件，在`src/echarts.js`中补全`src/component.js`中的关键字，就可以使用`<C-N>`或`<C-P>`。

具体查找范围由`complete`选项所规定，详见`:help E535`。

### `dictionary`中的关键字

快捷键：`<C-X><C-K>`

假设你有一个`javascript.dict`文件，其内容如下：
```text
Promise
Proxy
let
class
extends
```

设置`:set dictionary+=/path/to/es6.dict`之后就可以用`<C-X><C-K>`来补全这些关键字了。

![](/blog/vim-javascript-completion/c-x-c-k.gif)

### omni completion

快捷键：`<C-X><C-O>`

这个是基于语义上的补全，vim会猜测光标之前的关键词，然后给出补全。

![](/blog/vim-javascript-completion/c-x-c-o.gif)

更多补全方式，请看`:help ins-completion`。

## YouCompleteMe

按键太多了，真不开心...

先上一个自动打开候选菜单的插件，再继续吹牛逼吧...

YouCompleteMe是一个不错的选择，补全速度比neocomplete快。

基本配置如下：

```vim
let g:ycm_min_num_of_chars_for_completion = 3 
let g:ycm_autoclose_preview_window_after_completion=1
let g:ycm_complete_in_comments = 1
let g:ycm_key_list_select_completion = ['<c-n>', '<Down>']
let g:ycm_key_list_previous_completion = ['<c-p>', '<Up>']
" 比较喜欢用tab来选择补全...
function! MyTabFunction ()
    let line = getline('.')
    let substr = strpart(line, -1, col('.')+1)
    let substr = matchstr(substr, "[^ \t]*$")
    if strlen(substr) == 0
        return "\<tab>"
    endif
    return pumvisible() ? "\<c-n>" : "\<c-x>\<c-o>"
endfunction
inoremap <tab> <c-r>=MyTabFunction()<cr>
```

现在，对于关键字补全、路径补全、`omni completion`，YouCompleteMe可以自动打开补全菜单了。

![](/blog/vim-javascript-completion/ycm.gif)

恩，看起来`ins-completion`还不错，但是跟vscode比起来还不够！

vim的`omni completion`实际上可以支持更牛逼的completion，于是有了[tern](http://ternjs.net)。

## tern_for_vim

`tern_for_vim`是ternjs给vim量身定做的插件，它实际上是给javascript实现了一个新的`omnifunc`，叫做`tern#Complete`。

当我们按下`<C-X><C-O>`时，vim实际上就是调用`omnifunc`。

`tern_for_vim`改写了`omnifunc`，接管了vim的`omni completion`。

vim安装了`tern_for_vim`之后，在项目的根目录中新建一个配置文件`.tern-project`，以echarts为例，配置如下：

```json
{
    "libs": [
        "browser"
    ],
    "plugins": {
        "requirejs": {
            "baseUrl": "./src",
            "paths": {
                "zrender": "bower_components/zrender/src"
            }
        }
    }
}
```

`libs`字段指明要导入哪些库，tern内置了以下几种库：

- browser
- chai
- ecma5，默认自动导入
- ecma6
- jquery
- underscore

我们现在只配置了browser，看看会发生什么事情？

![](/blog/vim-javascript-completion/tern-browser.gif)

如果你的项目还用到了jquery，那么你可以把jquery加到`.tern-project`的libs字段中，效果如下：

![](/blog/vim-javascript-completion/tern-jquery.gif)

`plugins`更猛，可以补全模块化的代码，tern支持以下几种插件：

- angular.js
- complete_string.js
- component.js
- doc_comment.js，默认自动启用
- nodejs
- requirejs

看看echarts项目配置了requirejs插件之后会怎么样？

![](/blog/vim-javascript-completion/tern-requirejs.gif)

碉堡了，有木有！

我们再也不用担心某个模块到底提供了哪些方法，require它，输入点号，然后提示，你所要做的就是选择！

如果第三方库在代码中提供足够的文档注释，我们甚至都不需要再去查文档了！

哦，稍等，听说vscode还支持nodejs的补全。

在nodejs项目下配置一下`.tern-project`：

```json
{
    "libs": [],
    "plugins": {
        "node": {}
    }
}
```

看看tern对nodejs项目的支持如何？

![](/blog/vim-javascript-completion/tern-node.gif)

嗯，貌似还可以！

## 小结

如果你是一个vim粉丝，那希望本文对你有所帮助！
