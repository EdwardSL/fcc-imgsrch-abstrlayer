var https = require("https")
var bl = require("bl")
var express = require("express");
var path = require("path");
var mongo = require("mongodb").MongoClient
var app = express();
require('dotenv').load();

app.get('/api/imagesearch/:q', function(req, res){
  var q = req.params.q;
  var offset = req.query.offset;
  var d = new Date();
  mongo.connect(process.env.MONGO_URI, function(err, db) {
    if (err) throw err;
    var doc = {
      term: q,
      when: d.toISOString()
    };
    db.collection("srchs").insertOne(doc, function(err, result) {
      if (err) throw err;
      console.log("1 document inserted");
      db.close();
    });
  });
  var num = 10;
  var url = 'https://www.googleapis.com/customsearch/v1' +
            '?q=' + q +
            '&cx=' + process.env.APPLY_ID +
            '&num=' + num +
            '&searchType=image' +
            '&start=' + ((offset-1) * num + 1) +
            '&key=' + process.env.APPLY_KEY;
  https.get(url, function(response) {
    var body = '';
    response.on('data', function(chunk){
      body += chunk;
    });
    response.on('end', function(){
      if(JSON.parse(body).hasOwnProperty('items')) {
        var items = JSON.parse(body).items;
        var result = items.map(function(item) {
          var newItem = {
            "url": item.link,
            "snippet": item.snippet,
            "thumbnail": item.image.thumbnailLink,
            "context": item.image.contextLink
          };
          return newItem;
        });
      } else {
        var result = JSON.parse(body);
      }
      res.json(result);
    });
  })
});

app.get('/api/latest/imagesearch/', function(req, res){
  mongo.connect(process.env.MONGO_URI, function(err, db) {
    if (err) throw err;
    db.collection("srchs").find({}, { _id: 0, term: 1, when: 1 }).toArray(function(err, result) {
      if (err) throw err;
      res.json(result);
      db.close();
    });
  });
});

var port = process.env.PORT || 8080;
app.listen(port, function () {
  console.log('Node.js listening on port ' + port + '...');
});