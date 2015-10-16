$(function () {
	console.log("@33")
	var indepen = {
		userid : null,
		showName : function() {
			var $showusername = $("#showusername");
			$showusername.html(this.sesCov.cur);
			var curt = '<p class="lis-title">' + this.sesCov.indeName + '</p>';
			$("#onlinecount").append(curt);
		},
		submit:function(){
			var content = this.chatEdit.html();
			if(content != ''){
				var obj = {
					userid: this.userid,
					username: this.username,
					content: content
				};
				this._socket.emit('message', obj);
				this.chatEdit.html("");
			}
			return false;
		},
		genUid:function(){
			return new Date().getTime()+""+Math.floor(Math.random()*899+100);
		},
		initMsg : function(socket) {
			
			var $this = this;
			this._socket.on('msgPost', function(obj){
				var isme = (obj.userid == $this.userid) ? true : false;
				var contentDiv = '<div>'+obj.content+'</div>';
				var usernameDiv = '<span>'+obj.username+'</span>';
				
				var section = document.createElement('section');
				if(isme){
					section.className = 'user';
					section.innerHTML = contentDiv + usernameDiv;
				} else {
					section.className = 'service';
					section.innerHTML = usernameDiv + contentDiv;
				}
	
				$("#contentBox").append(section);
			});

		},
		init : function() {
			var $this = this;
			this.chatEdit = $("#chatEdit");
			this.userid = this.genUid();

			this.ses = sessionStorage.getItem("name");
			if(this.ses) {
				this.sesCov = JSON.parse(this.ses);
				this.username = this.sesCov.cur;
				$("#forer").html(this.sesCov.indeName)
			}


			this._socket = io.connect('ws://100.84.92.125:3000');
			this.initMsg();
			this.chatEdit.keydown(function(e) {
				e = e || event;
				if (e.keyCode === 13) {
					$this.submit();
				}
			});
			$("#mjr_send").click(function() {
				$this.submit();
			})
			this.showName();
		},
	};
	indepen.init();

	
	
});