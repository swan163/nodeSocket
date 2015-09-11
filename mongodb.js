var mongodb = require("mongodb");


var server = new mongodb.Server('localhost',27017,{auto_reconnect:true});

var db = new mongodb.Db("test",server,{safe:false});

 

db.open(function(err,db){

  if(err){

    console.log(err);

    return false;

  }

  console.log("We are connected!");

  db.collection('test',{safe:true},function(err,collection){
    for (var i = 0; i < 5; i++) {
        collection.insert({userid:"test"+i,pwd:"num"+i});
     }
  });

});
