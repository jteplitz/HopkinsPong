var K = 32; //K-value in Elo formula

// Elo update function based on Wikipedia
function updateRatings(winnerRating, loserRating) {
  var e = 1 / (1 + Math.pow(10, (winnerRating - loserRating) / 400)); //expected value of the loser, winner is 1 - e
  
  // Assuming A is the winner and B is the loser (from Wikipedia):
  // Ra' = Ra + K * (Sa - Ea) = Ra + K * (1 - Ea) = Ra + K * e
  // Rb' = Rb + K * (Sb - Eb) = Ra - K * Eb = Ra - K * e
  winnerRating += K * e;
  loserRating -= K * e;
  
  var ratings = [winnerRating, loserRating];
  
  /*
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
  } */
  
  return ratings;
}


var http = require('http'),
util = require('util'),
url = require('url'),
path = require('path'),
fs = require('fs'),
mongoose = require("mongoose"),
hashlib  = require("hashlib"),
config   = require("./config"),
express  = require("express");

var app = express.createServer(express.logger());
app.use(express.bodyParser());

app.post("/m", function(req, res){
    console.log("adding match between " + req.body.winner + " and " + req.body.loser);
    mongoose.connect(config.databaseURI);
    User = mongoose.model("User", User);
    User.find({email: req.body.winner}, function(err, winner) {
        var winner = winner[0];
        if (!authenticateReq(winner.password, req.body.winner, "/m", req.body.winnerAuth)){
            res.writeHead(401, {"Content-Type": "text/plain"});
            res.end("You are not authorized to view this page");
            return;
        }
        User.find({email: req.body.loser}, function(err, loser) {
            var loser = loser[0];
            if (!authenticateReq(loser.password, req.body.loser, "/m", req.body.loserAuth)){
                res.writeHead(401, {"Content-Type": "text/plain"});
                res.end("You are not authorized to view this page");
                return;
            }
            var ratings = updateRatings(winner.rating, loser.rating);
            winner.rating = ratings[0];
            loser.rating = ratings[1];
            winner.save();
            loser.save();
            
            res.end(JSON.stringify({error: 0, msg: "Successfully entered match"})); // this is going to say it was a success even when it was not, we should probbably fix that.
        });
    });
});

// we should probbably create a schema.js file for these or something
var Schema = mongoose.Schema,
    ObjectId = Schema.ObjectId;
var User = new Schema({
  email     : {type: String, validate: [validatePresenceOf, 'an email is required'], index: { unique: true }},
  password  : {type: String, validate: [validatePresenceOf, 'a password is required']},
  firstName : String,
  lastName  : String,
  rating    : {type: Number, default: 1000}, 
  user_id   : ObjectId
});

app.get("/u", function(req, res){
  mongoose.connect(config.databaseURI);
  
  User = mongoose.model("User", User);
  User.find({}, {email: 1}, function(err, users){
    for(var i = 0; i < users.length; i++)
        users[i] = users[i].email;
    res.end(JSON.stringify(users));
  });
});
  
app.post("/u/:email", function(req, res){
  mongoose.connect(config.databaseURI);
  console.log(req.params, req.params.password);

  User = mongoose.model("User", User);
  var user = new User({
    email:      req.body.email,
    password:   req.body.password,
    firstName:  req.body.firstName,
    lastName:   req.body.lastName
  });
  user.save();
  
  res.end(JSON.stringify({error: 0, msg: "Successfully created user"})); // this is going to say it was a success even when it was not, we should probbably fix that.
});

app.get("/u/:email", function(req, res){
  console.log(config.databaseURI);
  console.log("getting account, " + req.header("Authentication"));
  mongoose.connect(config.databaseURI);
  User = mongoose.model("User", User);

  User.find({email: req.params.email}, {firstName: 1, lastName: 1, rating: 1}, function(err, user){
    var user = user[0];
    res.writeHead(200, {"Content-Type": "text/plain"});
    res.end(JSON.stringify(user));
  });
});

function validatePresenceOf(value){
  return value && value.length;
}

function authenticateReq(password, email, uri, hash){
  console.log(password, email, uri);
  var authHash = hashlib.sha256(password + email + uri);
  console.log(authHash); 
  return authHash == hash;
}

app.get("/*", function(req, res){
  var filename = path.join(process.cwd(), req.url);  
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
});

var port = process.env.PORT || 3000;
app.listen(port, function(){
  console.log(port);
});