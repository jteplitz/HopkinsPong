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
config   = require("./config/config"),
express  = require("express");

var app = express.createServer(express.logger());
app.use(express.bodyParser());

app.post("/m", function(req, res){
    console.log("adding match between " + req.body.winner + " and " + req.body.loser);
    mongoose.connect(config.databaseURI);
    User = mongoose.model("User", User);
    Match = mongoose.model("Match", Match);
    User.find({email: req.body.winner}, function(err, winner) {
        if (winner.length == 0){
          res.writeHead(400, {"Content-Type": "text/plain"});
          res.end("Invalid winner email");
          return;
        }
        var winner = winner[0];
        if (!authenticateReq(winner.password, req.body.winner, "/m", req.body.winnerAuth)){
            res.writeHead(401, {"Content-Type": "text/plain"});
            res.end("You are not authorized to view this page");
            return;
        }
        User.find({email: req.body.loser}, function(err, loser) {
            if (loser.length == 0){
              res.writeHead(400, {"Content-Type": "text/plain"});
              res.end("Invalid losser email");
              return;
            }
            var loser = loser[0];
            if (!authenticateReq(loser.password, req.body.loser, "/m", req.body.loserAuth)){
                res.writeHead(401, {"Content-Type": "text/plain"});
                res.end("You are not authorized to view this page");
                return;
            }
            var ratings = updateRatings(winner.rating, loser.rating);
            winner.rating = ratings[0];
            loser.rating = ratings[1];
            winner.wins++;
            loser.losses++;
            match = new Match({
                winner: req.body.winner,
                loser: req.body.loser,
                new_winner_rating: winner.rating,
                new_loser_rating: loser.rating
            });
            winner.save();
            loser.save();
            match.save();
            
            res.end(JSON.stringify({error: 0, msg: "Successfully entered match"})); // this is going to say it was a success even when it was not, we should probbably fix that.
        });
    });
});

app.get("/m/:email", function(req, res){
    mongoose.connect(config.databaseURI);
    User = mongoose.model("User", User);
    Match = mongoose.model("Match", Match);
    User.find({email: req.params.email}, {password: 1}, function(err, user) {
        user = user[0];
        if(!authenticateReq(user.password, req.params.email, "/u/" + req.params.email, req.header("Authentication"))){
            res.writeHead(401, {"Content-Type": "text/plain"});
            res.end("You are not authorized to view this page");
            return;
        }
        var query = Match.find({$or: [{winner: req.params.email}, {loser: req.params.email}]});
        query.sort("date", -1)
        query.exec(function(err, matches) {
            var outputs = [];
            for(var i = 0; i < matches.length; i++) {
                var output = {
                    date: matches[i].date
                };
                if(matches[i].winner == req.params.email) {
                    output.against = matches[i].loser;
                    output.won = true;
                    output.new_rating = matches[i].new_winner_rating;
                } else {
                    output.against = matches[i].winner;
                    output.won = false;
                    output.new_rating = matches[i].new_loser_rating;
                }
                outputs.push(output);
            }
            res.end(JSON.stringify(outputs));
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
  wins : {type: Number, default: 0},
  losses : {type: Number, default: 0},
  user_id   : ObjectId
}); //need better email validation
var Match = new Schema({
    winner: String,
    loser: String,
    new_winner_rating: Number,
    new_loser_rating: Number,
    date: {type: Date, default: Date.now}
});
app.get("/u", function(req, res){
  mongoose.connect(config.databaseURI);
  
  User = mongoose.model("User", User);
  var query = User.find();
  query.sort("rating", -1);
  query.exec(function(err, users){
    for(var i = 0; i < users.length; i++){
        users[i] = {
          email: users[i].email,
          wins: users[i].wins,
          losses: users[i].losses,
          firstName: users[i].firstName,
          lastName: users[i].lastName,
          rating: i
        }
    }
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

  User.find({email: req.params.email}, {firstName: 1, lastName: 1, rating: 1, wins: 1, losses: 1}, function(err, user){
    if (user.length == 0){
      res.writeHead(400, {"Content-Type": "text/plain"});
      res.end("Invalid email");
      return;
    }
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

app.get("/*?", function(req, res){
  if (req.url == "/"){
    req.url = "/index.html";
  }
  console.log(req.url);
  var filename = path.join(process.cwd(), "www/", req.url);  
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
