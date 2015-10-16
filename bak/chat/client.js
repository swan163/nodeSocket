(function () {
	var d = document,
	w = window,
	p = parseInt,
	dd = d.documentElement,
	db = d.body,
	dc = d.compatMode == 'CSS1Compat',
	dx = dc ? dd: db,
	ec = encodeURIComponent;
	
	
	w.CHAT = {
		msgObj:d.getElementById("message"),
		contentBox : d.getElementById("contentBox"),
		screenheight:w.innerHeight ? w.innerHeight : dx.clientHeight,
		username:null,
		userid:null,
		socket: null,
		// socket : io.connect('ws://100.84.92.125:3000'),
		nameval : d.getElementById("username").value,
		//让浏览器滚动条保持在最低部
		scrollToBottom:function(){
			w.scrollTo(0, this.msgObj.clientHeight);
		},
		logout:function(){
			//this.socket.disconnect();
			location.reload();
		},
		//提交聊天消息内容
		submit:function(){
			var content = d.getElementById("content").value;
			if(content != ''){
				var obj = {
					userid: this.userid,
					username: this.username,
					content: content
				};
				this.socket.emit('message', obj);
				d.getElementById("content").value = '';
			}
			return false;
		},
		genUid:function(){
			return new Date().getTime()+""+Math.floor(Math.random()*899+100);
		},
		//更新系统消息，本例中在用户加入、退出的时候调用
		updateSysMsg:function(o, action){
			//当前在线用户列表
			console.log(o.nameexist,"===")
			console.log(o.onlineUsers,o.onlineCount)
			var onlineUsers = o.onlineUsers;
			//当前在线人数
			var onlineCount = o.onlineCount;
			//新加入用户的信息
			var user = o.user;
				
			//更新在线人数 userName
			var userhtml = document.createElement('span');
			userhtml.className = 'userName';
			var separator = '';
			var box = '';
			for(key in onlineUsers) {
		        if(onlineUsers.hasOwnProperty(key)){
					// userhtml += separator+onlineUsers[key];
					var nameDom = document.createElement('i');
					nameDom.className = 'nameOnline';
					nameDom.innerHTML += separator+onlineUsers[key];
					// separator = '、';
					userhtml.appendChild(nameDom);
				}
		    }
		    // console.log(userhtml)
			// d.getElementById("onlinecount").innerHTML = '当前共有 '+ onlineCount +' 人在线，在线列表：' + userhtml;
			d.getElementById("onlinecount").innerHTML = '<p class="lis-title">群成员( '+ onlineCount +')';
			d.getElementById("onlinecount").appendChild(userhtml)
			
			//添加系统消息
			var html = '';
			html += '<div class="msg-system">';
			html += user.username;
			html += (action == 'login') ? ' 加入了聊天室' : ' 退出了聊天室';
			html += '</div>';
			var section = d.createElement('section');
			section.className = 'system J-mjrlinkWrap J-cutMsg';
			section.innerHTML = html;
			this.contentBox.appendChild(section);	
			this.scrollToBottom();
		},
		//第一个界面用户提交用户名(登录)
		usernameSubmit:function(){
			var username = d.getElementById("username").value;
			// this.socket = io.connect('ws://100.84.92.125:3000');
			if(username != ""){
				this.socket.on('submit', function(o) {
					// alert(o.nameexist+"===");
					if (o.nameexist) {
						alert("重新输入,已有用户存在");
						return;
					} else {
						d.getElementById("username").value = '';
						d.getElementById("loginbox").style.display = 'none';
						d.getElementById("chatbox").style.display = 'block';
					}
				});
				this.init(username);
			}
			return false;
		},
		// 注册
		regist : function() {
			var txtVal = d.getElementById("username").value;
			if(txtVal != "") {
				var _socket = io.connect('ws://100.84.92.125:3000');
				console.log("1");
				/*_socket.on("testSubmit", function(data)	{
					console.log(data,"client");
					_socket.emit("submitEvent", {my:"Oup"})
				})
				return;*/
				_socket.on('testSubmit', function(o) {
					alert(o.nameexist+"===");
					console.log(o)
					_socket.emit("submitEvent", {userid:this.userid, username:txtVal})
					
					if (o.nameexist) {
						alert("重新输入,已有用户存在");
						return;
					} else {
						d.getElementById("username").value = '';
						d.getElementById("loginbox").style.display = 'none';
						d.getElementById("chatbox").style.display = 'block';
						this.init(username);
					}
				});
			} else {
				alert("不能为空")
			}
		},
		init:function(username){
			/*
			客户端根据时间和随机数生成uid,这样使得聊天室用户名称可以重复。
			实际项目中，如果是需要用户登录，那么直接采用用户的uid来做标识就可以
			*/
			this.userid = this.genUid();
			this.username = username;
			
			d.getElementById("showusername").innerHTML = this.username;
			this.msgObj.style.minHeight = (this.screenheight - db.clientHeight + this.msgObj.clientHeight) + "px";
			this.scrollToBottom();
			
			//连接websocket后端服务器
			// this.socket = io.connect('ws://100.84.92.125:3000');
			
			//告诉服务器端有用户登录
			this.socket.emit('login', {userid:this.userid, username:this.username});
			
			//监听新用户登录
			this.socket.on('login', function(o){
				CHAT.updateSysMsg(o, 'login');	
			});
			
			//监听用户退出
			this.socket.on('logout', function(o){
				CHAT.updateSysMsg(o, 'logout');
			});

			//监听消息发送
			this.socket.on('message', function(obj){
				var isme = (obj.userid == CHAT.userid) ? true : false;
				var contentDiv = '<div>'+obj.content+'</div>';
				var usernameDiv = '<span>'+obj.username+'</span>';

				var section = d.createElement('section');
				if(isme){
					section.className = 'user';
					section.innerHTML = contentDiv + usernameDiv;
				} else {
					section.className = 'service';
					section.innerHTML = usernameDiv + contentDiv;
				}
				CHAT.contentBox.appendChild(section);
				CHAT.scrollToBottom();	
			});

		}
	};
	//通过“回车”提交用户名
	d.getElementById("username").onkeydown = function(e) {
		e = e || event;
		if (e.keyCode === 13) {
			CHAT.usernameSubmit();
		}
	};
	//通过“回车”提交信息
	d.getElementById("content").onkeydown = function(e) {
		e = e || event;
		if (e.keyCode === 13) {
			CHAT.submit();
		}
	};

	d.getElementById("registBtn").onclick = function() {
		CHAT.regist();
	}
})();