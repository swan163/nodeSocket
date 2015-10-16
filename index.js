var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var mongodb = require("mongodb");

var server = new mongodb.Server('localhost',27017,{auto_reconnect:true},function(err,db) {
    // createCollection
    // db.createCollection('user', {strict:true}, function(err, collection) {
    //     console.log("create database success")
    // });
});



// connected collection
var database = new mongodb.Db("socketData",server,{safe:true});

app.get('/', function(req, res){
    res.send('<h1>Welcome Realtime Server</h1>');
    // res.sendfile('./chat/index.html');
});

//在线用户
var onlineUsers = {};
//当前在线人数
var onlineCount = 0;
var nameexist;

io.on('connection', function(socket){
    console.log('a user connected');
    
   
    // 监听用户注册
    socket.on("submit", function(obj) {
        
        database.open(function(err, db) {
            var userForm = db.collection('user');
            userForm.find({userName:obj.userName}).toArray(function(err,curt) {
                if(curt.length == 0 ) {
                    var random = Math.random() * 101;
                    userForm.insert({userName:obj.userName , "use_id":random});
                    database.close();
                } else {
                    console.log("重复");
                    // 广播当前用户已有相同名字存在
                    socket.emit("repeat");
                    database.close();
                    return;
                }
                socket.emit("regSuccess");
            });
        })
    });

    socket.on("login", function(arg) {
        database.open(function(err, db) {
            var userForm = db.collection('user');
            var arry = [];
            userForm.find({}).toArray(function(err, result) {
                if(result.length <= 0 ) {
                    socket.emit("noRecord");
                } else {
                    for(var i = 0; i < result.length; i++) {
                        arry.push(result[i].userName);
                    }
                    var join = arry.join("-");

                    if(join.match(arg.userName) == null || !join.match(arg.userName)) {
                        socket.emit("noRecord");
                    } else {
                        // 通知所有用户当前加入新用户
                        io.emit("loginSuccess",{username : arg.userName, socketId : socket.id});
                    }
                    io.emit("allUser", {user: arry, num : arry.length});
                }
                database.close();
            });
            return;
        });
    })
    
    //监听用户退出
    socket.on('disconnect', function(){
        //将退出的用户从在线列表中删除
        if(onlineUsers.hasOwnProperty(socket.name)) {
            //退出用户的信息
            var obj = {userid:socket.name, username:onlineUsers[socket.name]};
            
            //删除
            delete onlineUsers[socket.name];
            //在线人数-1
            onlineCount--;
            
            //向所有客户端广播用户退出
            io.emit('logout', {onlineUsers:onlineUsers, onlineCount:onlineCount, user:obj});
            console.log(obj.username+'退出了聊天室');
            // db.open(function(err,db){
            //     db.collection('socketData',{safe:true},function(err,col){
            //         col.remove({userid:obj.username});
            //     })
            // })
            // onlineCount = 0;
        }
    });
    
    //监听用户发布聊天内容
    socket.on('message', function(data){
        // dataform : {userid: 'new Date().getTime()',to: 'all', username : 'swan', content :'msg'};
         // data = JSON.parse(data);
         var msgData = {
            times : (new Date()).getTime(),
            data : data
         };
         if(data.to == 'all') { // 全部人员
            //向所有客户端广播发布的消息
            // io.emit('msgPost', data); 
            io.emit('say',msgData);
         } else {
            socket.emit("say",msgData);
         }
        
        console.log(data.username+'说：'+data.content);
        
    });
  
});
http.listen(2000, function(){
    console.log('listening on *:2000');
});