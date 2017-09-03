//declaring dependencies
var express = require ("express");
var expressHandlebars = require("express-handlebars");
var mongoose = require("mongoose");
var bodyParser = require("body-parser");
var cheerio = require("cheerio");
var request = require("request");

var Article = require("./models/Article.js");
var Note = require("./models/Notes.js");

var app = express();
var port = process.env.PORT || 3002;

app.use(bodyParser.urlencoded({
	extended: false
}));

app.use(express.static("public"));

mongoose.connect("mongodb://heroku_h6f54dbk:dr04cts0kqqtekan34i9b2mq4b@ds121014.mlab.com:21014/heroku_h6f54dbk");
var db = mongoose.connection;

db.on("error", function(error){
	console.log("mongoose Error: ", error);
});

db.once("open", function(){
	console.log("Mongoose connection successful.")
});



app.get("/scrape", function(req, res){
	request("http://nymag.com/tags/sex-diaries/", function(error, response, html){
		var $ = cheerio.load(html);

		$("article.thumb").each(function(i, element){
			var result = {};

			result.title = $(this).children().eq(2).text()

			result.title = result.title.replace(/\n/g, "").trim();
			result.link = $(this).children().eq(0).attr("href")

			// console.log(result)
			var entry = new Article(result);

			entry.save(function(err, doc){
				if (err) {
					console.log(err);
				}
				else {
					console.log(doc);
				}
			});
		});

	});

	res.send("Scrape Complete");
});

app.get("/articles", function(req, res){
	Article.find({}, function(error, doc){
		if (error) {
			console.log(error);
		}
		else {
			res.json(doc);
		}
	});
});

app.get("/articles/:id", function(req, res){
	Article.findOne({"_id": req.params.id})
	.populate("note")
	.exec(function(error, doc){
		if (error) {
			console.log(error);
		}
		else {
			res.json(doc);
		}
	});
});

app.post("/articles/:id", function(req, res){
	var newNote = new Note(req.body);

	newNote.save(function(error, doc){
		if (error) {
			console.log(error);
		}
		else {
			Article.findOneAndUpdate({ "_id" : req.params.id}, {"note": doc._id}).exec(function(err, doc){
				if (err) {
					console.log(err);
				}
				else {
					res.send(doc);
				}
			});
		}
	});
});

app.get("/", function(req, res) {
	console.log("Hitting the home route");
	res.sendFile("public/index.html")
})

// Port 
app.listen(port, function(){
	console.log("App running on port: " + port)
})