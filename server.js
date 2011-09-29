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
fs = require('fs');

http.createServer(function(req, res) {
	var uri = url.parse(req.url).pathname;
	switch(uri) {
		case '/names':
			res.writeHead(200, { "Content-Type": "application/json" });
			res.end(JSON.stringify(names));
			break;
		case '/ratings':
			res.writeHead(200, { "Content-Type": "application/json" });
			res.end(JSON.stringify(ratings));
			break;
		case '/rankings':
			res.writeHead(200, { "Content-Type": "application/json" });
			res.end(JSON.stringify(rankings));
			break;
		case '/enterMatch':
			var query = url.parse(req.url, true).query;
			updateRatings(parseInt(query.winner), parseInt(query.loser));
			res.writeHead(204, { "Content-Type": "text/plain" });
			res.end();
			break;
		default:
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
	}
}).listen(8080);
