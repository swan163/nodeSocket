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
    
    //监听新用户加入
    socket.on('login', function(obj){
        console.log("新用户加入成功")
        //将新加入用户的唯一标识当作socket的名称，后面退出的时候会用到
        socket.name = obj.userid;
        
        //检查在线列表，如果不在里面就加入
        // if(!onlineUsers.hasOwnProperty(obj.userid)) {
        //     onlineUsers[obj.userid] = obj.username;
        //     onlineCount++;
        // }
        database.open(function(err,db) {
            var userForm = db.collection('user');
            var arry = [];
            userForm.find({userid:obj.username}).toArray(function(err,items) {
                console.log(err,items)
                if(items.length == 0) { // 无记录
                    userForm.insert({userid:obj.username, pwd:"000"});
                    console.log("insert");
                } else {
                    nameexist = obj.username;
                    console.log("重复");
                    io.emit('submit', {nameexist:nameexist});
                    database.close();
                    return;
                }

                // 文档个数
                userForm.count(function(error, nbDocs) {
                    onlineCount = nbDocs;
                    console.log(nbDocs,"条");
                });
                // 文档所有向前台展示
                userForm.find({}).toArray(function(err, result) {
                    for(var i=0; i < result.length; i++) {
                        arry.push(result[i].userid);
                    }
                });
                io.emit('login', {onlineUsers:arry, onlineCount:onlineCount, nameexist : nameexist, user:obj});
                database.close();
            })
        })

        
        //向所有客户端广播用户加入
        // io.emit('login', {onlineUsers:onlineUsers, onlineCount:onlineCount, user:obj});
        /*database.open(function(err,db){
            console.log("mongodb connected!")
             var userForm = db.collection('user');
            userForm.insert({userid:obj.username, pwd:"000"},function(err,result) {
                // console.log(result);
                database.close();
            });
        })*/
        
    });

    // 监听用户注册
    socket.emit("testSubmit", {hello: 'world'});
    socket.on("submitEvent", function(obj) {
        console.log(obj,"swan")
        database.open(function(err,db) {
            var userForm = db.collection('user');
            var arry = [];
            userForm.find({userid:obj.username}).toArray(function(err,items) {
                console.log(err,items)
                if(items.length == 0) { // 无记录
                    userForm.insert({userid:obj.username, pwd:"000"});
                    console.log("insert");
                } else {
                    nameexist = obj.username;
                    console.log("重复");
                    // io.emit('submit', {nameexist:nameexist});
                    database.close();
                    return;
                }

                // 文档个数
                userForm.count(function(error, nbDocs) {
                    onlineCount = nbDocs;
                    console.log(nbDocs,"条");
                });
                // 文档所有向前台展示
                userForm.find({}).toArray(function(err, result) {
                    for(var i=0; i < result.length; i++) {
                        arry.push(result[i].userid);
                    }
                });
                io.emit('login', {onlineUsers:arry, onlineCount:onlineCount, nameexist : nameexist, user:obj});
                database.close();
            })
        })
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
    socket.on('message', function(obj){
        //向所有客户端广播发布的消息
        io.emit('message', obj);
        console.log(obj.username+'说：'+obj.content);
        
    });
  
});
http.listen(3000, function(){
    console.log('listening on *:3000');
});