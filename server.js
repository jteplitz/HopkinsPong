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
Templ8   = require("Templ8");

var app = express.createServer(express.logger());
app.use(express.bodyParser());

//mongoose stuff
mongoose.connect(config.databaseURI);
var Schema = mongoose.Schema,
    ObjectId = Schema.ObjectId;
var User = new Schema({
  email     : {type: String, validate: [validateEmail, 'an email is required'], index: { unique: true }},
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
User = mongoose.model("User", User);
Match = mongoose.model("Match", Match);

app.post("/m", function(req, res){
    console.log("adding match between " + req.body.winner + " and " + req.body.loser);
    mongoose.connect(config.databaseURI);
    User = mongoose.model("User", User);
    Match = mongoose.model("Match", Match);
    if (req.body.winner == req.body.loser){
      res.writeHead(400, {"Content-Type": "application/json"});
      res.end(JSON.stringify({
        error: 105,
        msg: "You can't beat yourself"
      }));
      return;
    }
    User.find({email: req.body.winner}, function(err, winner) {
        if (winner.length == 0){
          res.writeHead(401, {"Content-Type": "application/json"});
          res.end(JSON.stringify({
            error: 101,
            msg: "The winner's email is invalid"
          }));
          return;
        }
        var winner = winner[0];
        if (!authenticateReq(winner.password, req.body.winner, "/m", req.body.winnerAuth)){
            res.writeHead(401, {"Content-Type": "application/json"});
            res.end(JSON.stringify({
              error: 102,
              msg: "The winner's password is invalid"
            }));
            return;
        }
        User.find({email: req.body.loser}, function(err, loser) {
            if (loser.length == 0){
              res.writeHead(401, {"Content-Type": "application/json"});
              res.end(JSON.stringify({
                error: 103,
                msg: "The loser's email is invalid"
              }));
              return;
            }
            var loser = loser[0];
            if (!authenticateReq(loser.password, req.body.loser, "/m", req.body.loserAuth)){
                res.writeHead(401, {"Content-Type": "application/json"});
                res.end(JSON.stringify({
                  error: 104,
                  msg: "The loser's password is invalid"
                }));
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
            
            res.writeHead(200, {"Content-Type": "application/json"});
            res.end(JSON.stringify({error: 0, msg: "Successfully entered match"})); // this is going to say it was a success even when it was not, we should probbably fix that.
        });
    });
});

app.get("/m/:email", function(req, res){
    User.find({email: req.params.email}, {password: 1}, function(err, user) {
        if (!user){
          console.log("no user");
          return;
        }
        user = user[0];
        console.log("got user");
        var query = Match.find({$or: [{winner: req.params.email}, {loser: req.params.email}]});
        query.sort("date", -1)
        query.exec(function(err, matches) {
            var outputs = [];
            var history = {};
            for(var i = 0; i < matches.length; i++) {
                var output = {
                    date: matches[i].date
                };
                if(matches[i].winner == req.params.email) {
                    output.against = matches[i].loser;
                    output.won = true;
                    output.new_rating = matches[i].new_winner_rating;
                    if (!history[matches[i].loser]){
                      history[matches[i].loser] = {
                        wins: 1,
                        losses: 0
                      };
                    }else{
                      history[matches[i].loser].wins++;
                    }
                } else {
                    output.against = matches[i].winner;
                    output.won = false;
                    output.new_rating = matches[i].new_loser_rating;
                    if (!history[matches[i].winner]){
                      history[matches[i].winner] = {
                        wins: 0,
                        losses: 1
                      };
                    }else{
                      history[matches[i].winner].losses++;
                    }
                }
                outputs.push(output);
            }
            console.log("made outputs");
            for (i = 0; i < outputs.length; i++){
              outputs[i].history = history[outputs[i].against];
            }
            res.writeHead(200, {"Content-Type": "application/json"});
            res.end(JSON.stringify(outputs));
        });
    });
});

// we should probbably create a schema.js file for these or something
app.get("/u", function(req, res){
  
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
          rating: i,
          link: "/" + users[i].email + ".html"
        }
    }
    res.writeHead(200, {"Content-Type": "application/json"});
    res.end(JSON.stringify(users));
  });
});
  
app.post("/u/:email", function(req, res){
  console.log(req.params, req.params.password);

  var user = new User({
    email:      req.body.email,
    password:   req.body.password,
    firstName:  req.body.firstName,
    lastName:   req.body.lastName
  });
  user.save(function(err){
    if (err){
      res.writeHead(400, {"Content-Type": "application/json"});
      res.end(JSON.stringify({error: 210, msg: err.message}));
    }else{
      res.writeHead(200, {"Content-Type": "application/json"});
      res.end(JSON.stringify({error: 0, msg: "Successfully created user"}));
    }
  });
});

app.get("/u/:email", function(req, res){
  console.log(config.databaseURI);
  console.log("getting account, " + req.header("Authentication"));

  getUser(req.params.email, function(err, file){
    if (user.length == 0){
      res.writeHead(400, {"Content-Type": "text/plain"});
      res.end("Invalid email");
      return;
    }
    var user = user[0];
    res.writeHead(200, {"Content-Type": "application/json"});
    res.end(JSON.stringify(user));
  });
});

app.get(/^\/([a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4})\.html/, function(req, res){
  var email = req.params[0]
  console.log(req.params);
  getUser(email, function(err, user){
    console.log("got user");
    if (user.length == 0){
      res.writeHead(404, {"Content-Type": "text/plain"});
      res.end("We need a 404 page");
      return;
    }
    console.log("user exists");

    var user = user[0];
    fs.readFile(path.join(process.cwd(), "www/user_page.html.tmpl"), "binary", function(err, file){
      console.log("read the file");
      console.log(err);
      var ratio = Math.round((user.wins) / (user.wins + user.losses) * 100);

      var file = Templ8.gsub(file, {
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        ratio: (ratio) ? ratio : "0" 
      }, /\^\{([^\}]+)\}/g);

      res.writeHead(200);
      res.end(file, "binary");

    });
  });
});

function getUser(email, callback){
  User.find({email: email}, {email: 1, firstName: 1, lastName: 1, rating: 1, wins: 1, losses: 1}, callback);
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

function validatePresenceOf(value){
  return value && value.length;
}

function validateEmail(value){
  var emailRegex = new RegExp(/[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/);
  return emailRegex.test(value);
}

function authenticateReq(password, email, uri, hash){
  console.log(password, email, uri);
  var authHash = hashlib.sha256(password + email + uri);
  console.log(authHash); 
  return authHash == hash;
}

var port = process.env.PORT || 3000;
app.listen(port, function(){
  console.log(port);
});

process.on('uncaughtException', function (err) {
  console.log(err);
}); 
