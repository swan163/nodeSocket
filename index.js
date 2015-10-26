var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var mongodb = require("mongodb");
http.setMaxListeners(0);
var server = new mongodb.Server('localhost',27017,{auto_reconnect:false},function(err,db) {
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

/*
 一对一聊天重点，根据socketId来匹配对应的用户,进而可以向特定的client推送相关信息
 但是如何获得这个socketId，
 就是生成一个哈希数组，key为username，值为socket.id，
 这样就可以通过用户名获取对应的id，进而可以向特定client推送消息。
*/

//在线用户
var onlineUsers = {};
//当前在线人数
var onlineCount = 0;
var nameexist;

var clients = {};

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

    var arry = [];
    var userName = "noRecord",userId;
    socket.on("login", function(arg) {
        database.open(function(err, db) {
            var userForm = db.collection('user');

            userForm.find().toArray(function(err, result) {
                if(result.length <= 0 ) {
                    socket.emit("noRecord");
                    database.close();
                    return;
                }
                result.forEach(function(doc) {
                    arry.push(doc.userName);
                    if(doc.userName == arg.userName) {
                        userName = arg.userName;
                        userId = doc.use_id;
                    }
                });
                // console.log(userName,"000000== "+ userId)
                if(userName == "noRecord") {
                    socket.emit("noRecord");
                } else {
                    // 通知所有用户当前加入新用户
                    io.emit("loginSuccess",{userName : userName, userId : userId});                    
                    clients[userName] = socket; // 根据arg.userName映射到socket对象的键值中,userName作为key
                    console.log(userName)
                    io.emit("allUser", {user: arry, num : result.length});
                }
                database.close();
            });            
            return;
        });
    })
    
    //监听用户退出
    socket.on('exit', function(arg){
        //向所有客户端广播用户退出
        io.emit('logout', {userName: arg.userName});
    });
    
    //监听用户发布聊天内容
    socket.on('message', function(data){
        // dataform : {userid: 'new Date().getTime()',to: 'all', username : 'swan', content :'msg'};
        var time1 = new Date().toLocaleTimeString();
        var time2 = new Date().toLocaleDateString();
        var times = (time2 + ' ' + time1);
        var msgData = {
            times : times,
            data : data,
            userName : userName,
            userId : userId
        };
        if(data.to == 'all') { // 全部人员
            //向所有客户端广播发布的消息
            io.emit('say',msgData);
            console.log('all cb');
        } else {
            // socket.emit("say",msgData);
            console.log(data.to,data.userName)
            clients[data.to].emit("say",msgData);
            clients[data.userName].emit("say",msgData);
        }
        // 存用户发送的消息
        database.open(function(err, db) {
            var msgForm = db.collection('msg');
            msgForm.insert({userId:userId, conent:data.content, userName:userName, time: times});
            database.close();
        });
    });

    // 聊天记录重现
    socket.on('record', function(arg) {
        database.open(function(err, db) {
            var msgForm = db.collection('msg');
            var timeArr = [], contentArr = [], userName = [];
            msgForm.find({}).toArray(function(err, res) {
                // console.log(err, res);
                database.close();
                return;
                if(res.length <= 0 ) {
                    database.close();
                    return;
                }
                res.forEach(function(doc) {
                    contentArr.push(doc.conent);
                    timeArr.push(doc.time);
                    userName.push(doc.userName)
                });
                console.log(contentArr,timeArr)
                socket.emit('recodMsg', {content: contentArr, times: timeArr, userName: userName});
                database.close();
            })
        })
        
    });
  
});
http.listen(2000, function(){
    console.log('listening on *:2000');
});