#!/bin/sh
#***************************************************************************                                                                                 
# * 
# * Copyright (c) 2012 Baidu.com, Inc. All Rights Reserved
# * 
# **************************************************************************

#MULTI_UPLOAD_LEN_LIMIT=256M

path=$(which $0 2>/dev/null)

if [[ $path != "" ]];then
	libdir=$(dirname $path)
fi

function usage(){
	echo "Usage:"
	echo -e "\tbsutil.sh [-v] [-H key:value] [-A ak] [-S sk] [-D bs_host] [-K] [cp|bcp|merge|mv|rm|put_acl|get_acl|ls|put_bucket|delete_bucket|head] [parameters]"
	echo -e "\tWeb Support : http://dev.baidu.com/wiki/bcs/index.php?title=shelltool"
	echo "Description:"
	echo -e "\tMust Set [ak] [sk] [openssl_path] in the file[bsconf] or set ak sk bs_host in the options"
	echo -e "\tthen create a bucket by use command: put_bucket"
	echo -e "\t{cloud_resource begins with  bs:// eg. bs://document/readme indicates bucket=document object=/readme}"
	echo "Options:"
	echo -e "\t-v(Optional)\tMake the operation more talkative"
	echo -e "\t-H key:value\tAdd header information,you can add several key:value using -H k1:v1 -H k2:v2"
	echo -e "\t-A ak\tSet the ak"
	echo -e "\t-S sk\tSet the sk"
	echo -e "\t-D bs_host\tSet the bs_host"
	echo -e "\t-K\tuse https to send data"
	echo -e "\tcp [src] [dst]\t copy local resource to cloud_resource or copy cloud_resource  to local "
	echo -e "\tbcp [-r(Optional,recursively)][local-resource-set] [cloud_folder]\t eg. ./bsutil.sh bcp document bs://document/ " 
	echo -e "\tmerge [cloud_resource_list] [cloud_dst]"
	echo -e "\tmv [src] [dst]\t move local resource to cloud_resource or move cloud_resource  to local "
	echo -e "\trm [cloud_resource]\t remove cloud_resource"
	echo -e "\tput_acl [acl_file] [cloud_resource]\t put the acl_file as the acl of the cloud_resource"
	echo -e "\tget_acl [acl_file] [cloud_resource]\t get the acl of cloud_resource,and store as the acl_file"
	echo -e "\tls [cloud_bucket]\t ls - list the buckets ; ls cloud_[bucket] - list the objects of the cloud_bucket."
	echo -e "\tput_bucket [cloud_bucket]\t create the bucket"
	echo -e "\tdelete_bucket [cloude_bucket]\t delete the bucket"
	echo -e "\thead [cloud_object]\t head the cloud_object"
	echo "Examples:"
	echo -e "\t./bsutil.sh [-v] cp local_file bs://bucket/object"
	echo -e "\t./bsutil.sh [-v] bcp [-r] local_dir bs://bucket/folder/"
	echo -e "\t./bsutil.sh [-v] head bs://bucket/object"
	echo -e "\t./bsutil.sh [-v] merge bs://bucket/object1 bs://bucket/object2 bs://bucket/dst"
	echo -e "\t./bsutil.sh [-v] mv local_file bs://bucket/object"
	echo -e "\t./bsutil.sh [-v] rm bs://bucket/object"
	echo -e "\t./bsutil.sh [-v] put_acl acl_file bs://bucket/object"
	echo -e "\t./bsutil.sh [-v] get_acl out_acl_file bs://bucket/object"
	echo -e "\t./bsutil.sh [-v] [-l] ls [bs://bucket/foder/] [list_start] [list_limit]"
	echo -e "\t./bsutil.sh [-v] put_bucket bs://bucket"
	echo -e "\t./bsutil.sh [-v] delete_bucket bs://bucket"
	echo "bsconf Example"
	echo -e "\tak=akvalue"
	echo -e "\tsk=skvalue"
	echo -e "\tbs_host=bcs.duapp.com"
	echo -e "\topenssl_path=/usr/local/ssl/bin/openssl"
	echo -e "\tMULTI_UPLOAD_LEN_LIMIT=256m"
	echo -e "Notice ********"
	echo -e "\t1.You must add \"\" in your special filename or cloud_resource name.Such as the name contains *."
}

function part_len(){
	#UNIT [B|b,K|k,M|m,G|g] default unit  byte 
	#delete all spaces 
	#toupper
	MULTI_UPLOAD_LEN_LIMIT=$(echo $MULTI_UPLOAD_LEN_LIMIT | awk '{d=toupper($0);print d}')
	
	#get unit
	len=$(echo $MULTI_UPLOAD_LEN_LIMIT |  awk '{print length($0)}')
	unit=${MULTI_UPLOAD_LEN_LIMIT:$(($len-1))}

	#get number 
	number=${MULTI_UPLOAD_LEN_LIMIT:0:$(($len-1))}
	

	if [[ $unit != B && $unit != K && $unit != M && $unit != G ]];then
		unit=M
		number=$MULTI_UPLOAD_LEN_LIMIT
	fi

	#transfer to bytes
	B=1
	K=1024
	M=$((1024*1024))
	G=$((1024*1024*1024))
    
    SLICE_LIMTE_LEN=$(($K*256))    
	mult=$(($unit))
	MULTI_UPLOAD_LEN_LIMIT=$(($number* $mult ))  

}

function is_local(){

	var="$1";
	isLocal=1;

	if [[ ${var:0:2} ==  ":/" ]];then	
		isLocal=0;
		return
	fi

	if [[ ${var:0:5} == "bs://" ]];then
		isLocal=0
		return
	fi
}

#resolve to get bucket and object.
#para: eg.[ :/document/readme or bs://document/readme ] 
function resolve(){
        
	if [[ $# -eq 0 ]];then
         	echo "too few parameters in func [resolve]";
	    	return ;
   	fi
	raw="$1";
	if [[ "${raw:0:2}" == ":/" ]];then
         var=`echo $raw| awk 'BEGIN{FS="\n"} {print substr($1,3,10000)}'`
	elif [[ "${raw:0:5}" == "bs://" ]];then
        var=`echo $raw| awk 'BEGIN{FS="\n"} {print substr($1,6,10000)}'`        	
    fi	
	
	bucket=${var%%/*};
	tmp="${var#*/}";
	if [[ "$bucket" == "$tmp" ]] && [[ "$var" != "$bucket"/"$tmp" ]];then
		object='/';
	else
		object='/'"$tmp";
	fi

	object=$(echo "$object"|sed -e "s/%20/ /g")

}

#Parameters:
#	$1 md5_value  -- head the resource
#   $2 cloud_resource -- extract the bucket.
function head_ok(){
	
	isExist=0
	resolve "$2"
		
	$libdir/bsutil.sh $other_option  head bs://$bucket/$1 >head_$md5_value
	line=$(cat head_$md5_value | grep "\[NOTICE\]success")
	if [[ $line != "" ]];then
		isExist=1
	fi
	
	rm -f head_$md5_value
}


#Called by fcp()
#Parameters
#	$1 super file
#	$2 cloud_resource
function put_super_file(){
	echo "put superfile start, time:$SECONDS"	
	echo -e "You are uploading a super file!"
	
	resolve $2

	put_thread_num_x=$put_thread_num	
	
	content_length=$(wc -c "$1"|cut -d " " -f 1)
	content_length=$(echo $content_length | sed 's/^\([0-9]*\)[^0-9]*.*$/\1/' )
	split_part_len=$(echo $content_length $put_thread_num_x | awk '
						{
							print int($1/$2)
						}
					')
	put_thread_num_x=$(echo $content_length $put_thread_num_x | awk '
						{
							if(int($1%$2)!=0)
								print $2+1
							else
								print $2
						}
					')
	echo "put_thread_num_x:$put_thread_num_x"
	echo "split_part_len:$split_part_len"
	
	if [[ $split_part_len -gt 2147483648 ]];then	
			echo "[ERROR] split_part_len is $split_part_len ,it larger than 2G, please increase the put_thread_num"
			echo "[NOTICE]failed"
			return 1
	fi

	rm -f $1_part_*
	
	suffix_num=$(echo "l($put_thread_num_x)/l(10)" | bc -l )
	suffix_num=${suffix_num%%.*}
	if [[ $suffix_num == "" ]];then
			 suffix_num=0
	fi
	
	echo "suffix_num:$suffix_num"

	split -b $split_part_len -a $(($suffix_num+1))  -d "$1" "$1"_part_ 
	
	part_num=$( ls "$1"_part_*|wc -l )

	echo "part_num:$part_num"
	
	for((retry=1;retry<=$put_retry_num;++retry))
	do
			echo "put superfile retry:[$retry/$put_retry_num] start:"
			
			retry_failed=0
			super_meta="{\"object_list\":{"
			
			# md5,head,put_object,generate the super-file meta (need md5)
			j=0
			
			#init notExist ,in case all part exist
			notExist="ok"
				
			for i in "$1"_part_*
			do
				echo "Processing $i"
				
				md5_value=$(md5sum "$i" | cut -d " " -f 1)
				
				#generate the super-file meta
				super_meta="$super_meta\"part_$j\":{\"url\":\"bs://$bucket/$md5_value\",\"etag\":\"$md5_value\"},"
				
				j=$(($j+1))	
				
				echo "check part_[$j/$part_num] is exist or not"
				
				arr_cloud_filename[$j]="/$md5_value"	

				head_ok "$md5_value" "$2"
				
				if [[ $isExist -eq 1 ]];then
					echo part_[$j/$part_num] existed
					continue # save the repeated put-object time
				else
					echo part_[$j/$part_num] not existed, upload it ,please wait.
				fi
				
				#put the part
				{
					tmp=$(mktemp /tmp/bstmp.XXXX)
					log=$($libdir/lib/sdk.sh $other_option -m PUT -b $bucket -o /"$md5_value" -t "$i" -v 2>$tmp)
				
					if [[ $VERBOSE == '-v' ]];then
						cat $tmp
					fi
				
					#if code:2 (not exists) ,jump out the loop  
					notExist=$(grep "HTTP/1.1 200 OK" $tmp)
					rm -f $tmp
				
					if [[ $notExist == "" ]];then
						echo $log
						break
					fi
					
					echo part_[$j/$part_num] finished
				}&
			done #for

			wait
			
			if [[ $notExist != "" ]] ;then
				super_meta=${super_meta%,*}
				super_meta="$super_meta}}"
				
				echo $super_meta > %%
				# put the super file meta 
				$libdir/lib/sdk.sh  $other_option -m PUT -b $bucket -o $object -s -t %% $VERBOSE ${header_param[*]} >put_superfile_result
				line=$(cat put_superfile_result | grep "\[NOTICE\]success")
				if [[ $line == "" ]];then
						cat put_superfile_result
						echo "put superfile retry:[$retry/$put_retry_num] failed"
						retry_failed=1
						rm -f %%
						rm -f put_superfile_result
						continue
				else
						echo "put supefile retry:[$retry/$put_retry_num] success"
						retry_failed=0
				fi
				
				#rm the splits and super-file meta
				rm -f put_superfile_result
				rm -f "$1"_part_*
				rm -f %%
				
				arr_length=${#arr_cloud_filename[@]}    
				if  [[ $delete_superfile_temp_file -eq 1 ]];then

					for (( arr_i=1;arr_i<=$arr_length;++arr_i ))
					do   
						for (( arr_j=1; arr_j<$arr_i; ++arr_j ))
						do   
							if [[ "${arr_cloud_filename[$arr_i]}" == "${arr_cloud_filename[$arr_j]}" ]];then
								break;
							fi   
						done 
					
						if [[ $arr_j -eq $arr_i ]];then
							tmp_file_name="${arr_cloud_filename[$arr_i]}"
							echo "start delete object:$tmp_file_name"
							$libdir/lib/sdk.sh -b "$bucket" -o "$tmp_file_name" -m DELETE $VERBOSE                                                       
						fi   
					done 

				fi   
				break	
			else
				echo "put superfile failed"
				retry_failed=1
			fi
	done
	
	if [[ $retry_failed -eq 1 ]];then	
		rm -f "$1"_part_*
		if  [[ $delete_superfile_failed_temp_file -eq 1 ]];then
			temp_file_num=${#arr_cloud_filename[@]}
			for((i=1;i<=$temp_file_num;++i))
			do
				 tmp_file_name="${arr_cloud_filename[i]}"
				 echo "start delete object:$tmp_file_name"
				 $libdir/lib/sdk.sh $other_option -b "$bucket" -o "$tmp_file_name" -m DELETE $VERBOSE		 
			done	
		fi
		echo "put superfile [$1] failed, time:$SECONDS"	
		return 1
	else	
		echo "put superfile [$1] success, time:$SECONDS"	
		return 0
	fi
}

function object_name_check()
{
	check_error="";
	resolve "$1"
	if [[ $bucket == "" || "$object" == "" || "$object" == "/" ]];then
		check_error="\t[ERROR]$1 is not a valid object name"
		echo -e "$check_error"
		exit 1
	fi
}

function bucket_name_check()
{
	resolve "$1"
	
	if [[ "$bucket" == "" || "$object" != "/" ]];then
		check_error="\t[ERROR]["$1"] is not a valid bucket name, bucket name must start with bs://"
		echo -e $check_error
		exit 1
	fi
}
	
#@deprecated
function end_error()
{
	echo -e "$check_error"
	exit 1
}

function range_down()
{
	local bucket="$1"
	local object="$2"
	local dst_path="$3"
	local start="$4"
	local end="$5"	
	local tmp_file=$(mktemp /tmp/bstmp.XXXX)
	echo "$tmp_file"
	echo $libdir/lib/sdk.sh $other_option -b "$bucket" -o "$object" -m GET -L "$tmp_file" $VERBOSE ${header_param[*]} "-HRange:bytes=$start-$end"
	$libdir/lib/sdk.sh $other_option -b "$bucket" -o "$object" -m GET -L "$tmp_file" $VERBOSE ${header_param[*]} "-HRange:bytes=$start-$end"
	dd if="$tmp_file" of="$dst_path" bs=$split_len count=1 skip=0 seek=$start conv=notrunc
	rm -f $tmp_file
}

function check_result()
{

	tmp="$1"
	log="$2"

	if [[ $VERBOSE == '-v' ]];then
		cat "$tmp"
	fi
	echo "$log"
	notExist=$(grep "HTTP/1.1 20[06] OK" "$tmp")
	rm -f "$tmp"

	if [[ $notExist == "" ]];then
		return 1
	fi
	return 0
}

function fcp()
{
	#may be put_object/get_object/copy_object

	#1 means failed 
	#0 means success
	fcp_result=1

	is_local "$1"
	srcLocal=$isLocal;

   	is_local "$2" ;
	dstLocal=$isLocal;
	
	if [[ $srcLocal -eq 0 && $dstLocal -eq 0 ]];then	

		object_name_check "$1"
		object_name_check "$2"
		
		tmp=$(mktemp /tmp/bstmp.XXXX)
		log=$($libdir/lib/sdk.sh $other_option -b "$bucket" -o"$object" -m PUT -H"x-bs-copy-source:$1" -v ${header_param[*]} 2>$tmp)
		check_result "$tmp" "$log"
		fcp_result=$?
		return $fcp_result
	fi

	if [[ $srcLocal -eq 1 && $dstLocal -eq 0 ]];then
		resolve "$2";
		
		if [[ -f "$1" ]];then
			if [[ "$bucket" == "" || "$object" == "" || "$object" == "/" ]];then
				echo "bucket:["$bucket"], object:["$object"]"
				echo -e "\t[ERROR][$2] is not a valid object name"
                exit 1
			fi

			content_length=$(wc -c "$1"|cut -d " " -f 1)
            
#     if [[ $content_length -ge $SLICE_LIMTE_LEN ]];then
#                query_opt="fast-put-version=1&start=0&end=262143";
#                content_md5=$(md5sum "$1" | cut -d " " -f 1) 
#                slice_md5=$(dd if="$1" bs=1024 count=256| md5sum | cut -d " " -f 1)
#                query_opt="$query_opt&content-md5=$content_md5&content-length=$content_length"
#                query_opt="$query_opt&slice-md5=$slice_md5"
#                tmp=$(mktemp /tmp/bstmp.XXXX)
#                log=$($libdir/lib/sdk.sh $other_option -q "$query_opt" -b "$bucket" -o "$object" -m PUT -v ${header_param[*]} 2>$tmp)
#
#                check_result "$tmp" "$log"
#                fcp_result=$?
#                if [[ $fcp_result -eq 0 ]];then
#                   return $fcp_result
#                fi
#            fi
			
            if [[ $content_length -gt  $MULTI_UPLOAD_LEN_LIMIT ]];then
				put_super_file "$1" "$2"
				fcp_result=$?
				return $fcp_result
			else
				for((i=1;i<=$put_retry_num;++i))
				do
					echo "put object retry:[$i/$put_retry_num]  start"
					tmp=$(mktemp /tmp/bstmp.XXXX)
					log=$($libdir/lib/sdk.sh $other_option -b "$bucket" -o "$object" -m PUT -t "$1" -v ${header_param[*]} 2>$tmp)
					
					check_result "$tmp" "$log"
					fcp_result=$?

					if [[ $fcp_result -eq 0 ]];then
							break;
					fi
				done

				if [[ $i -gt $put_retry_num ]];then
					echo "[NOTICE]retry [$put_retry_num]/[$put_retry_num], but sill failed"
					return 1
				else
					echo "[NOTICE]retry [$i]/[$put_retry_num], result is success"
					return 0 
				fi
			fi
		else 
			echo -e "\t[ERROR]file[$1] not exist"
			exit 1
		fi
		return 1
	fi

	if [[ "$srcLocal" -eq 0 && "$dstLocal" -eq 1 ]];then

		resolve "$1"

		if [[ "$bucket" == "" || "$object" == "" || "$object" == "/" ]];then
			echo -e "\t[ERROR][$1] is not a valid resource name"
			exit 1
		fi	

		if [[ -d "$2" ]];then
			echo -e "\t[ERROR][$2] is a directory. Not a valid parameter here"
			exit 1
		fi
					
		for param in ${header_param[*]}
		do
			if [[ "${param:0:7}" == "-HRange" ]];then
				tmp=$(mktemp /tmp/bstmp.XXXX)
				log=$($libdir/lib/sdk.sh $other_option -b "$bucket" -o "$object" -m GET -L "$2" $VERBOSE "${header_param[*]}" 2>$tmp )
				check_result "$tmp" "$log"
				fcp_result=$?
				return $fcp_result
			fi
		done
	
		echo "get object start, time:$SECONDS"   	
	    echo "start get object length"	
		tmp_file=$(mktemp /tmp/bstmp.XXXX)	
        $libdir/lib/sdk.sh  $other_option -b "$bucket" -o "$object" -m HEAD $VERBOSE -O $tmp_file  ${header_param[*]}
    
    	fail=$(grep "HTTP/1.1 200 OK" ${tmp_file})
        
		if [[ $fail == "" ]];then
				echo "get object length failed, maybe" "$1" "doesn't exist or you have no auth to visit the resource"
				echo "please head" "$1" "to prove you have auth to visit the resource"	
				rm -f $tmp_file
				fcp_result=1
				return 1
		fi
		get_thread_num_x=$get_thread_num	
		download_len_x=$(cat $tmp_file |  grep "Content-Length:" | cut -d " " -f 2 )
		download_len_x=$(echo $download_len_x | sed 's/^\([0-9]*\)[^0-9]*.*$/\1/' )
		rm -f $tmp_file	
		if [[ $download_len_x == "" ]] || [[ $download_len_x -eq 0 ]];then
			echo "" >"$2"
			fcp_result=0
			echo [NOTICE]success
			return 0
		fi
		
		split_len=$(echo $download_len_x $get_thread_num_x | awk '
			{
				print int($1/$2)
			}
		')
		
		get_thread_num_x=$(echo $download_len_x $get_thread_num_x | awk '
			{
				if(int($1%$2)!=0)
					print $2+1
				else
					print $2
			}
		')

		if [[ $split_len -eq 0 ]];then
				split_len=$download_len_x
				get_thread_num_x=1
		fi
		
		echo "split_len:$split_len"	
		echo "get_thread_num_x:"$get_thread_num_x
		echo "download_len_x:$download_len_x"
		
		for i in `seq 1 $get_thread_num_x`
		do
				start=$(echo "$i" "$split_len" | awk '
								{
									start=($1-1)*$2
									print start
								}
								')
				end=$(echo "$start" "$split_len" "$download_len_x" | awk '
								{
									tmp_sum=$1+$2
									tmp_end=$3
									if(tmp_sum > tmp_end)
										print tmp_end-1
									else
										print tmp_sum-1
								}
								')
				tmp_part_num=$(($i-1))
				tmp_file=$2_part_$tmp_part_num
				tmp_result_file=$2_result_$tmp_part_num
				arr_start[$i]=$start
				arr_end[$i]=$end
				arr_save_file[$i]=$tmp_file
				arr_result_file[$i]=$tmp_result_file
		done
				
		for((get_retry=1;get_retry<=$get_retry_num;++get_retry))
		do
				echo "get object retry:[$get_retry/$get_retry_num] start:"
				for(( i=1;i<=$get_thread_num_x;++i))
				do
					tmp_part_num=$(($i-1))
					tmp_file=$2_part_$tmp_part_num
					tmp_result_file=$2_result_$tmp_part_num
					start="${arr_start[i]}"
					end="${arr_end[i]}"
					echo "get $tmp_file start"	
					{
						$libdir/lib/sdk.sh $other_option -b "$bucket" -o "$object" -m GET -L "$tmp_file" $VERBOSE ${header_param[*]} "-HRange:bytes=$start-$end" >$tmp_result_file
						echo "get $tmp_file end"	
					}&
				
				done
				
				wait
				#check part

				for ((i=1;i<=$get_thread_num_x;i++))
				do
					tmp_result_file="${arr_result_file[i]}"
					result_ok=$(cat $tmp_result_file | grep "\[NOTICE\]success")
					if [[ $result_ok == "" ]];then
						echo "get some object failed"
						for ((j=1;j<=$get_thread_num_x;j++))
						do
							tmp_file="${arr_save_file[j]}"
							rm -f  $tmp_file
							if [[ $delete_fail_log_file -eq 1 ]];then
								tmp_file="${arr_result_file[j]}"
								rm -f  $tmp_file
							fi
						done
						break;
					fi
				done

				if [[ $i -gt $get_thread_num_x ]];then
					echo "get all part success"
					break;
				fi
		done
		
		if [[ $get_retry -gt $get_retry_num ]];then
			echo "get object failed"
			fcp_result=1
			return 1
		fi
		
		echo "merge_file, time:$SECONDS"   	
#		read -n 1
#		for ((i=1;i<=$get_thread_num_x;i++))
#		do
#				tmp_file="${arr_save_file[i]}"
#				start="${arr_start[i]}"
#				echo "file:$tmp_file"
#				echo "start:$start"
#				dd if="$tmp_file" of="$2" bs=$split_len count=1 skip=0 seek=$start conv=notrunc
#				rm -f "$tmp_file"
#		done
		
		if [[ -f "$2" ]];then
			rm -f "$2"
		fi
		
		for ((i=1;i<=$get_thread_num_x;i++))
		do
				tmp_file="${arr_save_file[i]}"
				cat $tmp_file >>"$2"
				rm -f  $tmp_file
				tmp_file="${arr_result_file[i]}"
				rm -f  $tmp_file
		done
		fcp_result=0
		echo "get object end, time:$SECONDS"   	
		
		return 0
	fi

	echo -e "\t[ERROR]parameter must at least have a cloud resource."
	return 1
}
	
#Parameters:
# ./bsutil.sh merge cloud_src_list cloud_dst_object 
function merge()
{
	dst=${!#}
	resolve "$dst"

   	super_meta="{\"object_list\":{"
	j=-1

	for i in $@
	do 
		if [[ $j -lt 0 ]];then
			j=$(($j+1))
			continue
		fi

		if [[ $i == "$dst" ]];then
			continue
		fi

		cur=$(echo $i|sed -e "s/%20/ /g")

		echo -e "\tProcessing $cur "

		md5_value=$($libdir/bsutil.sh $other_option head "$cur" |  grep "ETag" | cut -d " " -f 2 )	
		md5_value=${md5_value:0:32}

		if [[ $md5_value == "" ]];then
			echo -e "\t$cur doesn't exist or you have no auth to visit the resource"
			exit 0
		fi

		super_meta="$super_meta\"part_$j\":{\"url\":\"$cur\",\"etag\":\"$md5_value\"},"

		j=$(($j+1))

	done	
    	
	super_meta=${super_meta%,*}
	super_meta="$super_meta}}"
	tmp=$(mktemp /tmp/bstmp.XXXX)
	
	echo $super_meta > $tmp
	cat $tmp
   
	ttmp=$(mktemp /tmp/bstmp.XXXX)	
	log=$($libdir/lib/sdk.sh $other_option -m PUT -b $bucket -o"$object" -s -t $tmp -v ${header_param[*]} 2>$ttmp)
	
	rm -f $tmp
	
	check_result "$ttmp" "$log" 
	return $?
}

function fmv()
{
	fcp "$1" "$2"
	
	if [[ $fcp_result -eq 1 ]];then
		echo "[NOTICE]fcp failed, so mv failed"
		exit 1
	fi

	is_local "$1"
	srcLocal=$isLocal;
   	is_local "$2" ;
	dstLocal=$isLocal;
	if [[ $srcLocal -eq 0 && $dstLocal -eq 0 ]];then	
		frm "$1"
		return "$?" 
	fi
	if [[ $srcLocal -eq 1 && $dstLocal -eq 0 ]];then
		echo "rm $1"
		rm -f "$1"
		return "$?"
	fi
	if [[ $srcLocal -eq 0 && $dstLocal -eq 1 ]];then
		frm "$1"
		return "$?"
	fi

	echo -e "\t[ERROR]parameter must at least have a cloud resource."
	exit 1
}

function brm()
{
	if [[ $# -eq 0 ]];then
		echo 'too few arguments in function[brm]';
		return;
	fi

	resolve "$1"

	tmp=$(mktemp /tmp/bstmp.XXXX)
	log=$($libdir/lib/sdk.sh $other_option -b "$bucket" -o "$object" -m DELETE -v 2>$tmp)
	check_result "$tmp" "$log"
	return $?	
}

function frm()
{
	if [[ $# -eq 0 ]];then
		echo 'too few arguments to rm cloud resource';
		exit 1
	fi
	
	is_local "$1"

	if [[ $isLocal -eq 1 ]];then 
		echo The file["$1"] is not a cloud resource;
		exit 1
	fi

	object_name_check "$1"
	
	tmp=$(mktemp /tmp/bstmp.XXXX)
	log=$($libdir/lib/sdk.sh $other_option ${header_param[*]} -b "$bucket" -o "$object" -m DELETE -v 2>$tmp)
	check_result "$tmp" "$log"
	return $?	
}

function layoutbucketJson()
{
    if [[ $LIST_MORE_INFO == "-l" ]];then
	    cat "$1" | sed -e "s/},/}\n/g" | sed -e "s/\[/\n/g" | sed -e "s/\]/\n/g"
    	echo
    else
        cat "$1" | sh $libdir/lib/JSON.sh  | grep "\[*,\"bucket_name\"\]"
#cat "$1" | sh $libdir/lib/JSON.sh  | grep "\[*,\"bucket_name\"\]" | cut  -d '"' -f  4
    fi
}

function layoutobjectJson()
{
	total=$(cat "$1"| sed -e "s/,\"start.*//g" | sed -e "s/{//g" | sed -e "s/\"//g")
	echo "$total"
    if [[ $LIST_MORE_INFO == "-l" ]];then
        object_list=$(cat "$1"| sed -e "s/.*\"object_list\"://g"| sed -e "s/},/}\n/g" | sed -e "s/\]}//g" | sed -e "s/\[//g")
	    echo -e "$object_list"
    else
        cat "$1" | sh $libdir/lib/JSON.sh |  grep "\[\"object_list\",[0-9]*,\"object\"\]" 
#        cat "$1" | sh $libdir/lib/JSON.sh |  grep "\[\"object_list\",[0-9]*,\"object\"\]" | cut -f 2 |
#        awk '{print substr($0,1,length($0))}'
    fi
#    object_num=`echo "$total"| cut -d ':' -f 2 | cut -d ',' -f 1`
}

function fls()
{
#list_bucket ls
#list_object ls bs://bucket_name/
#ls_prefix   ls bs://bucket_name/prefix/
#ls limit ls bs://bucket_name/ start limit such as ls bs://bucket_name/ 0 10
	if [[ $# -gt 3 ]];then
		echo 'too many parameters in function[fls].';
		exit 1
	fi
	api_response_body_file=$(mktemp /tmp/bstmp.XXXX)
    #ls bucket
    if [[ $# -eq 0 ]];then
		$libdir/lib/sdk.sh $other_option -b "" -o / -m GET $VERBOSE -O "$api_response_body_file"
		if [[ -f ${api_response_body_file} ]]; then
            fail=$(grep "Error\":{\"code" ${api_response_body_file})
            if [[ $fail == "" ]];then
                layoutbucketJson "$api_response_body_file"
		    	rm -f "$api_response_body_file"
			    return 0
            fi
		    rm -f "$api_response_body_file"
		fi
		return 1	
	fi
    #ls object or prefix
	if [[ $# -eq 1 ]];then
		resolve "$1"
		if [[ "$object" == "/" ]];then
			$libdir/lib/sdk.sh $other_option -b "$bucket" -o / -m GET $VERBOSE -O "$api_response_body_file"
		else
			$libdir/lib/sdk.sh $other_option -b "$bucket" -o / -m GET $VERBOSE -O "$api_response_body_file" -p "$object"
		fi
	fi
    #ls object or prefix with limit
	if [[ $# -eq 3 ]] || [[ $# -eq 2 ]];then
		resolve "$1"
        list_start="$2"
        if [[ $# -eq 2 ]];then
            list_limit=200
        else
            list_limit="$3"
        fi
        query_opt="start=$list_start&limit=$list_limit"
		if [[ "$object" == "/" ]];then
			$libdir/lib/sdk.sh $other_option -q "$query_opt" -b "$bucket" -o / -m GET $VERBOSE -O "$api_response_body_file"
		else
			$libdir/lib/sdk.sh $other_option -q "$query_opt" -b "$bucket" -o / -m GET $VERBOSE -O "$api_response_body_file" -p "$object"
		fi
	fi

	if [[ -f ${api_response_body_file} ]]; then
        fail=$(grep "Error\":{\"code" ${api_response_body_file})
        if [[ $fail == "" ]];then
    		layoutobjectJson "$api_response_body_file"
	    	rm -f "$api_response_body_file"
		    return 0
        fi
	    rm -f "$api_response_body_file"
	fi
	return 1
}

function resource_name_check()
{
	resolve "$1"

	if [[ "$bucket" == "" ]];then
		check_error="\t[ERROR]["$1"] is not a valid resource name"
		echo -e "$check_error" 
		exit 1
	fi
}

function local_file_check()
{
	if [[ -f "$1" ]];then
		return
	fi

	if [[ -d "$1" ]];then
		check_error="\t[ERROR]["$1"] is a directory, not a file"
	else 
		check_error="\t[ERROR]file["$1"] not exist"
	fi

	echo -e "$check_error"
	exit 1
}

function local_target_file_check()
{
	if [[ -d "$1" ]];then
		check_error="\t[ERROR]["$1"] is a directory,need a local file name here"
		echo -e "$check_error"
		exit 1
	fi
}

function put_acl()
{
	if [[ $# -ne 2 ]] ;then
		echo 'usage:put_acl acl_file cloud_resource'
		return 1
	fi

	local_file_check "$1"
	resource_name_check "$2"

	tmp=$(mktemp /tmp/bstmp.XXXX)
	log=$($libdir/lib/sdk.sh $other_option -a -t "$1" -b "$bucket" -o "$object" -m PUT -v $header_param 2>$tmp)
	check_result "$tmp" "$log"
	return $?	
}


function get_acl()
{
	if [[ $# -ne 2 ]] ;then
		echo 'usage:get_acl acl_file cloud_resource'
		return 1
	fi
	
	local_target_file_check "$1"
	resource_name_check "$2"
	
	tmp=$(mktemp /tmp/bstmp.XXXX)
	log=$($libdir/lib/sdk.sh $other_option -a -b "$bucket" -o "$object" -L "$1" -m GET -v 2>$tmp)
	check_result "$tmp" "$log"
	return $?	
}

function put_bucket(){
	
	if [[ $# -ne 1 ]];then
		echo 'usage:put_bucket cloud_bucket_name'
		return 1 
	fi
	
	bucket_name_check "$1"
	
	tmp=$(mktemp /tmp/bstmp.XXXX)
	log=$($libdir/lib/sdk.sh $other_option -b "$bucket" -o "$object" -m PUT -v $header_param 2>$tmp)
	check_result "$tmp" "$log"
	return $?	
}

function head()
{
	if [[ $# -ne 1 ]];then 
		echo 'usage:head cloud_object'
		exit 1
	fi
	
	is_local "$1"
	
	if [[ $isLocal -eq 1 ]];then
		echo 'usage:head cloud_object';
		return 1
	fi
	
	object_name_check "$1"
	api_response_body_file=$(mktemp /tmp/bstmp.XXXX)

	
    $libdir/lib/sdk.sh  $other_option -b "$bucket" -o "$object" -m HEAD $VERBOSE -O $api_response_body_file  ${header_param[*]}
    
	fail=$(grep "HTTP/1.1 200 OK" ${api_response_body_file})
        
	if [[ $fail == "" ]];then 
	 	echo "    [Suggest]your bucket name or object name not exist, please check the name"
		if [[ -f ${api_response_body_file} ]];then   	
			rm "$api_response_body_file"
		fi
		exit 1
   	else    
		cat "$api_response_body_file"
    fi 
	
	if [[ -f ${api_response_body_file} ]];then   	
		rm "$api_response_body_file"
	fi
	exit 0
}

function is_object(){

	raw=$1;
	raw=${raw##*/}
	isObject=1

	if [[ $raw == "" ]];then
		isObject=0
	fi
}

function recursive_cp(){
	
	ifs=$IFS 
	IFS=

	local local_object
	
	if [[ -d "$1" ]];then

		ls -1 "$1" | while read -r local_object
		do
			if [[ -d "$1"/"$local_object" ]];then 
				recursive_cp "$1"/"$local_object" "$2/$local_object"
			elif [[ -f "$1"/"$local_object" ]];then
				echo start upload object["$1"/"$local_object"]
				fcp "$1"/"$local_object" "$2/$local_object" 
				if [[ $fcp_result -eq 1 ]];then
					echo object["$1"/"$local_object"] failed >>bcp_result
				else
					echo object["$1"/"$local_object"] success >>bcp_result
				fi
			else
				echo [ERROR]file:"$1"/"$local_object" not exist
				echo [ERROR]file:"$1"/"$local_object" not exist >>bcp_result
			fi
		done
	else
		echo [ERROR]directory:"$1" not exist
		echo [ERROR]directory:"$1" not exist >>bcp_result
		echo "[NOTICE]failed"
	fi

	IFS=$ifs 
}

#main function	

	if [ $# -eq 0 ]; then
		usage
	exit 1 
	fi

	which=$(which $0 2>/dev/null)

	if [[ $which != "" ]];then
		dir=$(dirname $which)
	fi

	conf2=$dir/bsconf
	if [[ -f ./bsconf ]];then 
		source ./bsconf	
		echo "Use Conf [./bsconf]"
	elif [[ -f $conf2 ]];then
		source $conf2
		echo "Use Conf [$conf2]"
	else
		echo -e "[ERROR]\tThere is no config file [bsconf] in the directory"
		exit 1 
	fi
	LIST_MORE_INFO=""
    VERBOSE=""
	shift_count=0
	hi=0

	while getopts "lvrku:c:H:A:S:D:" OPTION
	do
		case $OPTION in
	
	v)
		VERBOSE="-v"
		shift_count=$((shift_count+1))
		;;
	l)
		LIST_MORE_INFO="-l"
		shift_count=$((shift_count+1))
		;;
	k)
	    need_https="-K"
		shift_count=$((shift_count+1))
		;;

	H)
		header_param[$hi]="-H$OPTARG"
		header_param[$hi]=$(echo "${header_param[$hi]}" | sed -e  "s/ /%20/g")
		hi=$(($hi+1))
		shift_count=$((shift_count+2))
		;;
	A)
		AK="$OPTARG"
		shift_count=$((shift_count+2))
		;;

	S)
		SK="$OPTARG"
		shift_count=$((shift_count+2))
		;;
	D)
		BS_HOST="$OPTARG"
		shift_count=$((shift_count+2))
		;;
	r) 
		;;

	\?)
		echo $OPTION
		usage
		exit 1
		;;
	esac
	done
	
	shift $shift_count
	
	part_len $MULTI_UPLOAD_LEN_LIMIT
#	echo "AK:$AK, SK:$SK, BS_HOST:$BS_HOST"
	
	if [[ $AK != "" ]] ;then
		other_option="$other_option -A $AK"
	fi

	if [[ $SK != "" ]] ;then
		other_option="$other_option -S $SK"
	fi
	
	if [[ $BS_HOST != "" ]] ;then
		other_option="$other_option -D $BS_HOST"
	fi

	if [[ $need_https != "" ]] ;then
		other_option="$other_option -k "
	fi

#	echo "other_option:$other_option"
	case $1 in
	bcp)
	
		if [[ $# -eq 1 ]] ||  [[ $# -eq 2 ]] ;then
	   		echo "ERROR: parameters is NULL,please input local_dir and bs://bucket/"
	  		 exit 1
		fi
		
		if [[ "$2" == "-r" ]] && [[ $# -eq 4 ]] ;then
			recursive_flag=1
			local_path="$3"
			cloud_path="$4"
		else
			recursive_flag=0
			local_path="$2"
			cloud_path="$3"
		fi
	
		if [[ ${cloud_path:0:5} != "bs://" ]];then	
			echo "[ERROR]The last parameter["$cloud_path"] must be a folder-type resourece ,start with bs://,end with /, eg :bs://document/"
			echo "[Notice]failed"
			exit 1
		fi

		ifs="$IFS" 
		IFS=

		rm -f bcp_result

#		echo "local_path:$local_path"
#	read -n 1
		if [[ -d "$local_path" ]];then
		
			ls -1 "$local_path" | while read -r local_object
			do
				if [[ -d "$local_path"/"$local_object" ]];then 
		
					if [[ $recursive_flag -eq 1 ]];then
						recursive_cp  "$local_path"/"$local_object" "$cloud_path$local_object"
					else
						echo "[Notice] [$local_object] is directory, omit its file and directory " 		
						echo "[Notice] [$local_object] is directory, omit its file and directory " >>bcp_result	
					fi
				elif [[ -f "$local_path"/"$local_object" ]];then
					echo start upload object["$local_path"/"$local_object"]
					fcp "$local_path"/"$local_object" "$cloud_path$local_object"
				   	if [[ $fcp_result -eq 1 ]];then
						echo object["$local_path"/"$local_object"] failed >>bcp_result
					else
						echo object["$local_path"/"$local_object"] success >>bcp_result
					fi
				else
					echo [ERROR] file["$local_path"/"$local_object"] not exist
					echo [ERROR] file["$local_path"/"$local_object"] not exist >>bcp_result
				fi
			done
		else
			echo "[ERROR]directory["$local_path"] not exist"
			echo "[ERROR]directory["$local_path"] not exist" >>bcp_result
			echo "[NOTICE]failed"
			IFS="$ifs"
			exit 1
		fi
		
		IFS="$ifs"
		exit 0
		
		;;

	cp)
		if [[ $# -ne 3 ]] ;then
			echo "[ERROR] parameters num must be 3"
			exit 1
		fi
		fcp "$2" "$3" ;;
	

	head)
		if [[ $# -ne 2 ]] ;then
			echo "[ERROR] parameters num must be 2"
			exit 1
		fi

	 	head "$2"
		;;

	merge)
		j=0

		if [[ $# -eq 1 ]] ||  [[ $# -eq 2 ]] ;then
		   echo "ERROR: parameters is NULL,please input cloud_resource_list and cloud_dst"
	   	   exit 1
		fi	
		
		for (( i=1;i<=$#;i++ ))
		do
			arg=$(eval echo "\$$i")
			paras[$j]=$arg
			paras[$j]=$(echo $arg|sed -e "s/ /%20/g")
			if [[ $j -ne 0 ]] &&  [[ ${paras[$j]:0:5} != "bs://" ]];then
		  		echo "please input cloud_resource_list and cloud_dst which start with bs://"
		   		exit 1
			fi

			j=$((j+1))
		done
		
		merge ${paras[*]}
		;;

	mv)
		fmv "$2" "$3"
		;;

	rm)
		frm "$2"
		;;

	put_acl)
		put_acl "$2" "$3";
		;;
	
	get_acl)
		get_acl "$2" "$3";
		;;

	ls)
        if [[ $# -eq 4 ]];then
		    fls "$2" "$3" "$4";
        elif [[ $# -eq 3 ]];then
            fls "$2" "$3";
        elif [[ $# -eq 2 ]];then
		    fls "$2";
        else
            fls;
        fi
		;;

	put_bucket)
		put_bucket "$2";
		;;

	delete_bucket)
		brm "$2"
		;;

	-h|--help)
		usage;;

	*)
		echo "unknown option";
		usage
		exit 1
  	esac
