#!/bin/sh
#这是一个get object命令，即下载文件到本地路径
#其中-v 是为了显示过程
#bs://your-bucket-name/1.txt 是你想要下载文件的地址,需要将your-bucket-nam 1.txt这两样名字改成你的bucket和Object名字
#2.txt表示想要下载后的文件名字
./bsutil.sh -v  cp "bs://your-bucket-name/1.txt" "2.txt" 
