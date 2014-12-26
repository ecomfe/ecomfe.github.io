---
title: just example 
date: 2014-11-11
author: errorrik
author_link: http://errorrik.com/
tags:
- example 
- test
---


This is just blog example. 

### Creating

You can create a draft by using `hexo new` command. For example:

```
$ hexo new draft <title>
```

Files will be saved in `source/_drafts` folder.


<!-- more -->


### Previewing

To preview your site with drafts, you can enable `render_drafts` setting in `_config.yml`:

```
render_drafts: true
```

or run `hexo server` with `-d` or `--drafts` flag.

```
$ hexo server --drafts
```

### Publishing

Once your draft is done, you can publish it with `hexo publish` command.

```
$ hexo publish [layout] <filename>
```

Files will be moved to `source/_posts` folder and applied with the layout you specified in the command.


