#!/bin/sh
#***************************************************************************            
# * 
# * Copyright (c) 2012 Baidu.com, Inc. All Rights Reserved
# * 
#**************************************************************************                                                                               

	#config
	
	###temp file###
	
	
	api_response_header_file=$(mktemp /tmp/bstmp.XXXX)
	
	
	path=$(which $0 2>/dev/null)

	if [[ $path != "" ]];then
		libdir=$(dirname $path)
	fi
	
	dir=${libdir%/*}
	conf2=$dir/bsconf


	if [[ -f ./bsconf ]];then 
		source ./bsconf
	elif [[ -f $conf2 ]];then
		source $conf2
	else
		echo -e "[ERROR]\tThere is no config file [bsconf] in the directory"
		exit 1 
	fi


	api_server="http://${bs_host}"
	sign_flag=MBO
	#get sign
	function get_sign( )
	{
		if [[ $AK != "" ]] ;then
			ak="$AK"
		fi

		if [[ $SK != "" ]] ;then
			sk="$SK"
		fi

		if [[ $BS_HOST != "" ]] ;then
			bs_host="$BS_HOST"
		fi

		object_tmp=$(echo "$object" | tr -s [//])
		flag="MBO";
		sign=$(echo  $flag$'\n'"Method=""$method"$'\n'"Bucket=""$bucket"$'\n'"Object=""$object_tmp" | "$openssl_path" dgst -binary -sha1 -hmac "$sk" | "$openssl_path" base64)

		sign_urlencode=$(echo "$sign" | $dir/lib/urlencode.sh)
		sign="sign="$flag":""$ak":"$sign_urlencode"

		bucket_urlencode=$(echo "$bucket"| $dir/lib/urlencode.sh)

		object_tmp=`echo "$object_tmp" | awk 'BEGIN{FS="\n"} {print substr($1,2,10000)}'`

		if [[ "$object" != "/" ]];then
		object_urlencode=/$(echo "$object_tmp"| $dir/lib/urlencode.sh)
		else
		object_urlencode="//"	
		fi

		if [[ "$need_https" != "" ]];then   
		sign=$(echo "https://$bs_host"/"$bucket_urlencode""$object_urlencode"?"$sign")
		else
		sign=$(echo "http://$bs_host"/"$bucket_urlencode""$object_urlencode"?"$sign")
		fi
	}

	put_file_param=
	function bcs_api()
	{
		get_sign
	   	
		if [[ "${method}" != "HEAD" ]] && [[ "${method}" != "GET" ]]; then
			api_response_body_file=$(mktemp /tmp/bstmp.XXXX)
		fi
		if [[ -f ${api_response_body_file} ]];then     	
			rm -f "${api_response_body_file}"
		fi
		if [[ -f ${api_response_header_file} ]];then     
			rm -f "${api_response_header_file}"
		fi

		if [[ $put_file_param != "" ]];then
			put_file_param=$(echo "$put_file_param" | sed -e "s/\`/\\\\\`/g" | sed -e "s/\[/\\\[/g" | sed -e "s/\]/\\\]/g" | sed -e "s/{/\\\{/g" | sed -e "s/}/\\\}/g")
	
			cmd="curl -s -S  $need_https $verbose ${header_param[*]} ${speed_limit} ${extra_param} "$put_file_param" -o \"${api_response_body_file}\" -D "${api_response_header_file}" ${range} ${config_file} --url \"${sign}${acl}${superfile}${prefix}${querystring_opt} \" "
		else
		    cmd="curl -s -S  $need_https $verbose ${header_param[*]} ${speed_limit} ${extra_param} -o \"${api_response_body_file}\" -D "${api_response_header_file}" ${range} ${config_file} --url \"${sign}${acl}${superfile}${prefix}${querystring_opt}\""
		
		fi
		
#		echo "cmd:$cmd"
		eval "$cmd"
			
		if [[ -f ${api_response_body_file} ]];then
	 	
			fail=$(grep "Error\":{\"code" ${api_response_body_file})
		
			if [[ $fail != "" ]];then
				cat $api_response_body_file
				echo ""
			fi
			
			if [[ "${method}" != "HEAD" ]] && [[ "${method}" != "GET" ]]; then
				rm -f ${api_response_body_file}
			fi
		fi
	
		fail=$(grep "HTTP/1.1 20[06]" ${api_response_header_file})
		

				
		if [[ $fail == "" ]];then
			echo "[NOTICE]failed"
		else
			echo "[NOTICE]success"
		fi
	    
		if [[ -f ${api_response_header_file} ]];then     	
			rm -f ${api_response_header_file}
		fi
		
	}


	function usage()
	{
		echo " sdk.sh -m [-t] [-b] [-o] [-a] [-H] [-s] [-l] [-r] [-R] [-O] [-A] [-S] [-D] [-k] [-p]
            [-q]"
		echo " m: method"
		echo " b: bucket"
		echo " o: object"
		echo " t: putdata"
		echo " a: acl"
		echo " K: config file"
		echo " s: superfile"
		echo " l: speed limit"
		echo " r: range"
		echo " R: renametype=md5"
		echo " O: api_response_body_file"
		echo " H: header,eg  Cotent-Type:xhtml/text"
		echo " A: AK"
		echo " S: SK"
		echo " D: bs_host"
		echo " k: use HTTPS"
		echo " p: prefix"
		echo " q: querystring"
	}

	if [ $# -eq 0 ]; then
		usage
		exit
	fi
	
	while getopts ":t:b:o:m:asK:l:L:Rr:vO:H:A:S:D:kp:q:" optname
	do
		case "$optname" in
	
	v)
		# verbose print target(url)/RequestHeader/ResponseHeader
		verbose="-v"
		;;
	"t")
		put_data=$OPTARG
		put_data=$(echo "$put_data" | sed -e "s/\\\\/\\\\\\\\/g"|  sed -e "s/\"/\\\\\"/g")
		put_file_param="-T\"$put_data\""
		;;
	
	"K")
   		config_file="  -K ${OPTARG} "
		;;
	H)
		OPTARG=$(echo "$OPTARG"|sed -e "s/\"/\\\\\"/g")
		
		header_param[$hi]="-H\"$OPTARG\""
		header_param[$hi]=$(echo "${header_param[$hi]}"| sed -e "s/%20/\ /g"|sed -e "s/\`/\\\\\`/g")
		
		hi=$(($hi+1))	
		;;
	A)   
		AK="$OPTARG"
		;;   

	S)   
		SK="$OPTARG"
		;;   
	D)   
		BS_HOST="$OPTARG"
		;;   
	q)
		querystring_opt="&$OPTARG"
		;;
	k)   
		need_https="-k"
		;;   
	
	"b")
		bucket=$OPTARG
	    bucket_tmp=`echo "$bucket" | awk 'BEGIN{FS="\n"} {print substr($1,1,10000)}'`
		
		bucket=$(echo "$bucket_tmp")
	
		;;

	"o")
		object="$OPTARG"
   		object_tmp=`echo "$object" | awk 'BEGIN{FS="\n"} {print substr($1,2,10000)}'`
		
		object=/$(echo "$object_tmp")
		;;
	
	"p")
		prefix="$OPTARG"
   		prefix_tmp=`echo "$prefix" | awk 'BEGIN{FS="\n"} {print substr($1,2,10000)}'`
		prefix=/$(echo "$prefix_tmp"| $dir/lib/urlencode.sh)/
		prefix="&prefix=$prefix"
		;;
	O)
		api_response_body_file=${OPTARG}
		;;
	
	"m")
		method=$OPTARG
   		if [ "${method}" == "DELETE" ]; then
			extra_param=" $extra_param -X DELETE "
       	fi

    	if [ "${method}" == "HEAD" ]; then
        	 extra_param=" $extra_param -I "
       	fi

   		if [ "${method}" == "PUT" ]; then
             extra_param=" $extra_param -X PUT "
       	fi

	#	echo "Option $optname has value $OPTARG"
		;;

	"a")
		acl="&acl=1"
		;;
	
	"R")
		renametype="&renametype=md5"
	
	#	echo "Option $optname has value $OPTARG"
		;;
	
	"r")
		range=" -r ${OPTARG}"
	
#	echo "Option $optname has value $OPTARG"
		;;

	"s")
		superfile="&superfile=1"
		;;

	"l")
		speed_limit=" --limit-rate ${OPTARG} "
		;;

	"L")
		api_response_body_file=$OPTARG;
	#	echo "Option $optname has value $OPTARG"
		;;
	"?")
		echo "Unknown option ${OPTARG}"
		exit
		;;

	":")
		exit
		echo "No argument value for option $OPTARG"
		exit
		;;

	"\?")
		usage
		exit
		;;

	*)
		echo "Unknown error while processing options"
		exit
		;;
	esac
	done

	#echo sdk.shheader_param=${header_param[*]}
	#main 
	#read -n 1 -p "Press any key to continue.."
	bcs_api

