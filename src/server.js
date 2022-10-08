/**
* MailReadChecker
* Author: Nigel Ticknor
* This app collects data about when an email 
* is opened and how many times it is opened.
* This is not yet refined, as I have not added
* any easy way to view analytics or send emails.
* I will be revisiting this project again.
**/

//imports
var express = require('express');
var nodemailer = require('nodemailer'); //you don't need this if you will send your emails externally
// var text2png = require('text2png'); //you don't need this if you will only use the invisible image
// var Maria = require('mariasql'); //swap for your DB tech, but should work with MySQL
const textToImage = require('text-to-image');
const mariadb = require('mariadb/callback');
var md5 = require('md5');
var fs = require('fs');
var request = require('request'); //you don't need this if you remove the notification sending
var globalconf = require('./config.json');


//globals
var app = express();
var server = globalconf.ssl ? require('https').createServer({key: fs.readFileSync(globalconf.sslConfig.privkey), cert: fs.readFileSync(globalconf.sslConfig.cert)},app) : require('http').Server(app);
// var sql = new Maria(globalconf.sqlConfig);
var sql = mariadb.createConnection(globalconf.sqlConfig);

let transporter = nodemailer.createTransport(globalconf.transportConfig);
var PORT = process.env.port || globalconf.PORT;


sql.connect(err => {
  if (err) {
    console.log("not connected due to error: " + err);
  } else {
    console.log("connected ! connection id is " + conn.threadId);
  }
});


//Express Routes
app.get('/',function(req,res){
	res.send('You\'ve reached the testing server for my mail read checker.');
});


/*
* The following two routes should be condensed into one 
* with an additional param for what type of image to show.
* I will return to this application later and fix that up.
*/

//This returns the image for count and increments the count
app.get('/email/:id/:usr',function(req,res){
	
	//uncomment the one that you want to use; the bottom one cache-busts GMail, but also could give extraneous read counts
//	res.set({'Content-Type': 'image/png'});
    res.set({'Content-Type': 'image/png','Cache-Control':'no-store, no-cache, must-revalidate, max-age=0,post-check=0, pre-check=0','Pragma':'no-cache'});
	
	sql.query("CALL incrementMailAndMD5('"+req.params.id+"','"+req.params.usr+"');",function(err,rows){
		if(err)
			console.log('Error incrementing '+req.params.id+' '+req.params.usr);
		
		sql.query("CALL getMailAndMD5('"+req.params.id+"','"+req.params.usr+"');", function(err, rows) {
			if (err){
				console.log(err);
				console.log('hit (error) for '+req.params.id+' '+req.params.usr);
			}
			else{
				var cnt = '0';
				console.log(rows.length > 0);
				if(rows[0][0].count)
					cnt = rows[0][0].count;
				console.log('hit ('+cnt+') for '+req.params.id+' '+req.params.usr);
				let imgtxt = text2png(''+cnt, getImageOptions(req.query));
				const im = imgtxt.replace('data:image/png;base64,','');
				const img = Buffer.from(im, 'base64');
				// console.log(img);
				res.writeHead(200, {
					 'Content-Type': 'image/png',
					 'Content-Length': img.length
				   });
			    res.end(img); 				
				// res.send(text2png('464', getImageOptions(req.query)));
				sql.query("CALL getEmailFromMD5('"+req.params.usr+"');",function(err,rows){
				if(!err&&rows[0][0]&&cnt==1) //so you don't get spammed
					//an example of something to do with the data; in regular use-case, the SQL update is probably enough
					sendPost({mid:req.params.id,user:rows[0][0].email,md5:req.params.usr,count:cnt});
				});
			}
		});
	});
});

//This returns a hidden image and increments the count
app.get('/secret/:id/:usr',function(req,res){
	
	//uncomment the one that you want to use; the bottom one cache-busts GMail, but also could give extraneous read counts
//	res.set({'Content-Type': 'image/png'});
    res.set({'Content-Type': 'image/png','Cache-Control':'no-store, no-cache, must-revalidate, max-age=0,post-check=0, pre-check=0','Pragma':'no-cache'});
	
	sql.query("CALL incrementMailAndMD5('"+req.params.id+"','"+req.params.usr+"');",function(err,rows){
		if(err)
			console.log('Error incrementing '+req.params.id+' '+req.params.usr);
		
		sql.query("CALL getMailAndMD5('"+req.params.id+"','"+req.params.usr+"');", function(err, rows) {
			if (err){
				console.log(err);
				console.log('hit (error) for '+req.params.id+' '+req.params.usr);
			}
			else{
				var cnt = '0';
				if(rows.length>0)
					cnt = rows[0][0].count;
				console.log('hit ('+cnt+') for '+req.params.id+' '+req.params.usr);
				res.sendFile(__dirname+'/invisible.png');
				sql.query("CALL getEmailFromMD5('"+req.params.usr+"');",function(err,rows){
				if(!err&&rows[0][0]&&cnt==1)
					//an example of something to do with the data; in regular use-case, the SQL update is probably enough
					sendPost({mid:req.params.id,user:rows[0][0].email,md5:req.params.usr,count:cnt});
				});
			}
		});
	});
});

//this returns the count as an image without incrementing
app.get('/count/:id/:usr',function(req,res){
	res.set({'Content-Type': 'image/png'});
	
	sql.query("CALL getMailAndUser('"+req.params.id+"','"+req.params.usr+"');", function(err, rows) {
		if (err){
			console.log(err);
			console.log('check (error) for '+req.params.id+' '+req.params.usr);
			res.send(text2png('error', getImageOptions(req.query)));
		}
		else{
			var cnt = '0';
			if(rows.length>0)
				cnt = rows[0][0].count;
			res.send(text2png(cnt, getImageOptions(req.query)));
		}
	});
});

//this sends a test email out
app.get('/send/:id/:to',function(req,res){
	let mailOptions = {
		from: globalconf.sender, // sender address
		to: req.params.to, // list of receivers
		subject: 'Number Update Test (Cache-Buster Edition)',
		html: 'This is a test email.<br>You will see this number reflect the number of times you\'ve opened this email. GMail traditionally caches the image, but I believe I have a workaround in place now.<br>Note that I am currently testing things, so the number may sometimes not display at all.<br>This is the number:<img src="'+globalconf.serverURL+'email/'+req.params.id+'/'+getEmailMD5(req.params.to)+'" alt="num" title="num" width="100" height="128">' // html body
	};
	transporter.sendMail(mailOptions, (error, info) => {
		if (error) {
			res.send(error);
			return console.log(error);
		}
		res.send('Success');
		//do a query here to attach the email with the md5 in the users table
	});
});

function text2png(txt, opts) {
	return textToImage.generateSync(txt, opts);
}

//MD5's an email in lowercase
function getEmailMD5(email){
	return md5(email.toLowerCase());
}

//sends me a notification
function sendPost(data){
	request.post(globalconf.notifURL, {form:{title:'Mail '+data.mid+' read',body:'Mail: '+data.mid+'\nUser: '+data.user+'\nMD5: '+data.md5+'\nCount: '+data.count}})
}

function getImageOptions(opts){
	return {
		fontSize: 200,
		fontFamily: 'sans-serif',
		textColor: opts.color ? '#' + opts.color : '#000',
		margin: 0,
		bgColor: '#00000000',
		textAlign: 'center',
		verticalAlign: 'center'
	};
}

//actually start the server
server.listen(PORT,function(){
 console.log('listening on *:'+PORT);
});
