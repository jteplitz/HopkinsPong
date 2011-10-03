var names = ["Connor",
  "Jason",
  "Nate"];

// elo ratings, start at 1000 
var ratings = [];
for(i = 0; i < names.length; i++)
  ratings[i] = 1000.0;

//rankings, start at 0
//rankings[position] = player
var rankings = [];
for(i = 0; i < names.length; i++)
  rankings[i] = i;
  
var K = 32; //K-value in Elo formula

// Elo update function based on Wikipedia
function updateRatings(winner, loser) {
  var e = 1 / (1 + Math.pow(10, (ratings[winner] - ratings[loser]) / 400)); //expected value of the loser, winner is 1 - e
  
  // Assuming A is the winner and B is the loser (from Wikipedia):
  // Ra' = Ra + K * (Sa - Ea) = Ra + K * (1 - Ea) = Ra + K * e
  // Rb' = Rb + K * (Sb - Eb) = Ra - K * Eb = Ra - K * e
  ratings[winner] += K * e;
  ratings[loser] -= K * e;
  
  //Update rankings
  winnerPos = rankings.indexOf(winner);
  while(winnerPos > 0 && ratings[rankings[winnerPos - 1]] < ratings[winner]) {
    rankings[winnerPos] = rankings[winnerPos - 1];
    rankings[winnerPos - 1] = winner;
    winnerPos--;
  }
  
  loserPos = rankings.indexOf(loser);
  while(loserPos < rankings.length - 1 && ratings[rankings[loserPos + 1]] > ratings[loser]) {
    rankings[loserPos] = rankings[loserPos + 1];
    rankings[loserPos + 1] = loser;
    loserPos++;
  }
}


var http = require('http'),
util = require('util'),
url = require('url'),
path = require('path'),
fs = require('fs'),
mongoose = require("mongoose"),
express  = require("express");

var app = express.createServer(express.logger());

app.get("/names", function(req, res){
  res.writeHead(200, { "Content-Type": "application/json" });
  res.end(JSON.stringify(names));
});

app.get("/ratings", function(req, res){
  res.writeHead(200, { "Content-Type": "application/json" });
  res.end(JSON.stringify(ratings));
});

app.get("/rankings", function(req, res){
  res.writeHead(200, { "Content-Type": "application/json" });
  res.end(JSON.stringify(rankings));
});

app.get("/enterMatch", function(req, res){
  var query = url.parse(req.url, true).query;
  updateRatings(parseInt(query.winner), parseInt(query.loser));
  res.writeHead(204, { "Content-Type": "text/plain" });
  res.end();
});

// we should probbably create a schema.js file for these or something
var Schema = mongoose.Schema,
    ObjectId = Schema.ObjectId;
var User = new Schema({
  email     : {type: String, validate: [validatePresenceOf, 'an email is required'], index: { unique: true }},
  password  : {type: String, validate: [validatePresenceOf, 'a password is required']},
  firstName : String,
  lastName  : String,
  user_id   : ObjectId
});
  
app.post("/u/:email", function(req, res){
  mongoose.connect("mongodb://localhost/users");

  User = mongoose.model("User", User);
  var user = new User({
    email:      req.params.email,
    password:   req.params.password,
    firstName:  req.params.first_name,
    lastName:   req.params.last_name
  });
  user.save();
  
  res.end(JSON.stringify({error: 0, msg: "Successfully created user"})); // this is going to say it was a success even when it was not, we should probbably fix that.

});

app.get("/u/:email", function(req, res){
  mongoose.connect("mongodb://localhost/users");
  User = mongoose.model("User", User);
  
  User.find({email: req.params.email}, function(err, user){
    res.end(JSON.stringify(user));  //obviously we aren't just going to output the database object in the future but for now.
  });
});

function validatePresenceOf(value){
  return value && value.length;
}


/*app.get("/*", function(req, res){
  var filename = path.join(process.cwd(), uri);  
  path.exists(filename, function(exists) {  
    if(!exists) {  
      res.writeHead(404, {"Content-Type": "text/plain"});  
      res.end("404 Not Found\n");  
      return;  
    }  

    fs.readFile(filename, "binary", function(err, file) {  
      if(err) {  
        res.writeHead(500, {"Content-Type": "text/plain"});  
        res.end(err + "\n");    
        return;  
      }

      res.writeHead(200);  
      res.end(file, "binary");   
    });  
  });
});*/

var port = process.env.PORT || 3000;
app.listen(port, function(){
  console.log(port);
});
