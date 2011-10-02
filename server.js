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
pg = require("pg"),
express = require("express");

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

app.post("/u/:email", function(req, res){
  pg.connect(process.env.DATABASE_URL, function(err, client){
    var query = client.query("CREATE TABLE  `pong`.`users` (" +
    "`id` INT NOT NULL AUTO_INCREMENT ," + 
    "`email` TEXT NOT NULL ," + 
    "`first_name` TEXT NOT NULL ," + 
    "`last_name` TEXT NOT NULL ," +
    "PRIMARY KEY (  `id` ) ," +
    "UNIQUE (" +
    "`id`"
    );
  });
});


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
