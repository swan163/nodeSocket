$(function () {
	var d = document,
	w = window,
	p = parseInt,
	dd = d.documentElement,
	db = d.body,
	dc = d.compatMode == 'CSS1Compat',
	dx = dc ? dd: db,
	ec = encodeURIComponent;

	var to = 'all'; //针对全部人广播
	
	var baseInit = {
		msgObj : d.getElementById("message"),
		contentBox : d.getElementById("contentBox"),
		// nameval : d.getElementById("username").value,
		faceList : d.getElementById("faceList"),
		chatEdit : d.getElementById("chatEdit"),

		scrollToBottom:function(){
			w.scrollTo(0, this.contentBox.clientHeight);
		},

		tipsHtml : function(name, action) {
			var html = '';
			html += '<div class="msg-system">';
			html += name;
			html += (action == 'login') ? ' 加入了聊天室' : ' 退出了聊天室';
			html += '</div>';
			var section = d.createElement('section');
			section.className = 'system J-mjrlinkWrap J-cutMsg';
			section.innerHTML = html;
			this.contentBox.appendChild(section);
			this.scrollToBottom();
		},

		genUid:function(){
			return new Date().getTime()+""+Math.floor(Math.random()*899+100);
		},
		winClose : function() {
			$(window).click(function() {
				this.faceList.style.display = 'none';
			})
		},
	}

	
	w.CHAT = {
		screenheight:w.innerHeight ? w.innerHeight : dx.clientHeight,
		username:null,
		userid:null,
		socket: null,
		//让浏览器滚动条保持在最低部
		
		logout:function(){
			//this.socket.disconnect();
			location.reload();
		},
		//提交聊天消息内容
		submit:function(){
			var content = baseInit.chatEdit.innerHTML;
			if(content != ''){
				var obj = {
					userid: this.userid,
					username: this.username,
					content: content,
					to : to,
				};
				
				this._socket.emit('message', obj);
				baseInit.chatEdit.innerHTML = '';
				baseInit.scrollToBottom();
			}
			return false;
		},
		initMsg : function() {
			var $this = this;
			this.userid = baseInit.genUid();
			this._socket.on('say', function(obj){
				var data = obj.data;
				var times = obj.times;
				var isme = (data.userid == CHAT.userid) ? true : false;
				var contentDiv = '<div>'+data.content+'</div>';
				var usernameDiv = '<span>'+data.username+'</span>';
				var time = '<p>'+ times +'</p>'
				
				var section = d.createElement('section');
				if(isme){
					section.className = 'user';
				} else {
					section.className = 'service';
				}

				var _html = "";
				var losName = localStorage.getItem("curName");
				losName = losName || $this.username;
				if(data.to == 'all') {
					_html = time + usernameDiv + '说' + contentDiv;
					section.innerHTML = _html;
				} else if(data.username == $this.username) {
					_html = time + '<span>我对</span>' + data.to + '说' + contentDiv;
					section.innerHTML = _html;
				} else if($this.username == losName) {
					_html = time + usernameDiv + '对我' + '说' + contentDiv;
					section.innerHTML = _html;
				}
				console.log(data.to,$this.username)
				baseInit.contentBox.appendChild(section);
			});
			
			baseInit.scrollToBottom();
		},
		

		updateInfo : function(user, num) {
			var userhtml = document.createElement('span');
			userhtml.className = 'userName';
			// userhtml.innerHTML = '<i class="nameOnline">所有人</i>';
			var olcount = d.getElementById("onlinecount");
			var separator = '';
			for(key in user) {
		        if(user.hasOwnProperty(key)){
					var nameDom = document.createElement('i');
					nameDom.className = 'nameOnline';
					nameDom.innerHTML += separator + user[key];
					userhtml.appendChild(nameDom);
					if(this.username === user[key]) {
						nameDom.className += ' curt'; // 高亮当前用户
					};
				}
		    }

			olcount.innerHTML = '<p class="lis-title">群成员( '+ num +')</p>';
			olcount.appendChild(userhtml);
		},

		//登录
		usernameSubmit:function(){
			var $this = this;
			var userInput = d.getElementById("username");
			var username = userInput.value;
			if(username != "") {
				this.username = username;
				this._socket.emit('login', {userName:this.username});
			} else {
				alert("不能为空");
				userInput.focus();
				return;
			}
			return false;
		},
		// 注册
		regist : function() {
			var userInput = d.getElementById("username");
			var txtVal = userInput.value;
			if(txtVal != "") {
				this._socket.emit('submit', {userName:txtVal});
			} else {
				alert("不能为空")
			}
		},
		// 表情展开
		faceCollection : function() {
			if (baseInit.faceList.style.display =="none" || baseInit.faceList.style.display == "") {
				baseInit.faceList.style.display = 'block';
			} else {
				baseInit.faceList.style.display = 'none';
			}
		},
		// 表情点击
		faceVal : function(curt) {
			var img = curt.getElementsByTagName("img")[0];
			var newImg = new Image();
			newImg.src = img.src;
			newImg.className = "faces"
			chatEdit.appendChild(newImg);
		},

		init : function () {
			var $this = this;
			this.userInput = d.getElementById("username");
			this.username = this.userInput.value;
			
			this._socket = io.connect('ws://100.84.92.125:2000');

			this._socket.on("noRecord", function() {
				alert("此用户不存在,请先注册");
				console.log("23323");
				$this.userInput.select();
				return;
			});
			this._socket.on("loginSuccess",function(arg) {
				// alert("登录成功");
				d.getElementById("username").value = '';
				d.getElementById("loginbox").style.display = 'none';
				d.getElementById("chatbox").style.display = 'block';
				baseInit.tipsHtml(arg.username, 'login');
				d.getElementById("showusername").innerHTML = arg.username;
				return;
			});
			
			this._socket.on("allUser", function(arg) {
				$this.updateInfo(arg.user, arg.num);
			});

			// 注册
			this._socket.on("repeat", function() {
				alert("用户名已存在----");
				$this.userInput.select();
			});
			this._socket.on("regSuccess",function() {
				alert("注册成功");
			});

			this.initMsg();
			var screeHeight = document.documentElement.clientHeight;
			$(baseInit.contentBox).css({
				height:screeHeight - 120 - 28 + "px",
			});
			baseInit.winClose();
		}
	};
	CHAT.init();
	var file = {
		domInit : function() {
			this.mask = $("#maskMod");
			this.glassImg = $("#glassImg");
		},
		uploadManage : function(fileInputs) {
            var that = this;
            if(!fileInputs) return;
            fileInputs.onchange = function (e) {
                e.preventDefault();
                var files = e.target.files;
                
                // for file list
                var fileReader = new FileReader();
                    // onload
                fileReader.onload = function(e) { 
                    var image = new Image();
                    console.log(this.result)
                    image.src = e.target.result;// base 64位图片地址
                    image.className = "piced";
                    chatEdit.appendChild(image);
                };
                fileReader.readAsDataURL(files[0]);
                // loading
                fileReader.onprogress = function(evt){}
                // loadError
                fileReader.onerror = function(){}
            };
        },
        glassImgEdit : function() {
        	var $this = this;
        	$("#contentBox").delegate(".piced", "click", function() {
        		var $ts = $(this);
        		var screeWidth = document.documentElement.clientWidth;
        		
    			$this.mask.show();
    			$this.glassImg.attr("src", $ts.attr("src"));
    			$this.glassImg.css({
    				"max-width" : screeWidth +"px",
    			});
        	});
        	$this.mask.click(function() {
        		var $ts = $(this);
        		$ts.hide();
        	})
        },
        init : function() {
        	this.domInit();
        	this.glassImgEdit();
        }
	};
	file.init();

	var indepen = {
		dnlOneToOne : function () {
			var $this = this;
			// 打开新窗口
			$("#onlinecount").delegate(".nameOnline", "dblclick", function() {
				var $ts = $(this);
				if($ts.html() == CHAT.username) {
					alert("自己不能对自己发起私聊");
					return;
				};

				to = $ts.html();
				$ts.addClass("clienTag");
				$ts.append('<em class="exit" id="exit">退出</em>');
				localStorage.setItem("curName",to);
			});
			$("#onlinecount").delegate("#exit", "click", function() {
				to = 'all';
				$(this).parent().removeClass("clienTag");
				$(this).remove();
				localStorage.removeItem("curName");
			});
		},
		init : function() {
			this.dnlOneToOne();
		},
	};
	indepen.init();

	var faceImg = d.getElementById("faceImg");
    file.uploadManage(faceImg);

	//通过“回车”提交用户名
	d.getElementById("username").onkeydown = function(e) {
		e = e || event;
		if (e.keyCode === 13) {
			CHAT.usernameSubmit();
		}
	};
	//通过“回车”提交信息
	d.getElementById("chatEdit").onkeydown = function(e) {
		e = e || event;
		if (e.keyCode === 13) {
			CHAT.submit();
		}
	};
	d.getElementById("chatEdit").onclick = function() {
		CHAT.submit();
	}

	d.getElementById("registBtn").onclick = function() {
		CHAT.regist();
	}
	d.getElementById("loginBtn").onclick = function() {
		CHAT.usernameSubmit();
	}
	d.getElementById("face-btn").onclick = function(e) {
		e.stopPropagation();
		CHAT.faceCollection();
	}
	var items = baseInit.faceList.getElementsByTagName("span");
	for(var i = 0; i < items.length; i++) {
		items[i].onclick = function(e) {
			e.stopPropagation();
			CHAT.faceVal(this);
			baseInit.faceList.style.display = "none";
		}
	}
	
});