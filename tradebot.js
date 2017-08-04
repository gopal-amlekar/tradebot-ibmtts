'use strict';
require('dotenv').load();

const PUB_NUB_CHANNEL_KEY = process.env.PUB_NUB_CHANNEL_KEY;
const PUB_NUB_SUBSCRIBE_KEY = process.env.PUB_NUB_SUBSCRIBE_KEY;	

var request = require('request');
const fs = require('fs');
var playerOpts={};
var player = require('play-sound')(playerOpts);
var PN = require('pubnub');


try
{
	var pn = new PN
	({
		subscribeKey: PUB_NUB_SUBSCRIBE_KEY,
		ssl: true
	});
	
	pn.addListener
	({
		message: function (msg)
		{
			var message = msg.message;
			
			console.log ("Message recd for ", message['event']);
			//console.log (message);
			/*
			var Event = message.Event;
			var Limit_Type = message['Limit_Type'];
			var Limit_Value = message['Limit_Value'];
			var Scrip_Name = message['Scrip_Name'];
			var Scrip_Price = message['Scrip_Price'];
			*/
			var Speech_File_Path = message['speech'];
			var speechFile = 'tts.wav';
			//console.log (Event, Limit_Type, Limit_Value, Scrip_Name, Scrip_Price);
			
			//console.log (Speech_File_Path);			
			let getSpeechPromise = new Promise((resolve, reject) => {
				
				var rq = request(Speech_File_Path);
				
				var streamRequest = rq.pipe(fs.createWriteStream(speechFile));
				
				rq.on('response', function(resp){
					//console.log(resp.headers);
					//console.log(resp.statusCode);
				});
				
				streamRequest.on('finish', function(){
					//console.log ("Stream finished");
					resolve(speechFile);
				});
				
			});	
			//console.log("Request done");	
			getSpeechPromise.then((speechFile) => {
			  // successMessage is whatever we passed in the resolve(...) function above.
			  // It doesn't have to be a string, but if it is only a succeed message, it probably will be.
			  //console.log("Yay! " + successMessage);
					//var exec = require('child_process').exec;
					//var cmd = 'aplay test.wav';
					
						player.play(speechFile, function (err) {
						   if (err) throw err;
						   console.log("Audio finished");
						});
					/*
					exec(cmd, function(error, stdout, stderr) {
					  // command output is in stdout
					  //console.log ("playing");
					});
					* */
			});
		} //end message function
	});
	
	pn.subscribe
	({
		channels: [PUB_NUB_CHANNEL_KEY]
	});
	
	console.log ("Subscribed to channel.. Waiting for messages");
}

catch (err)
{
	console.log ("Exception occured", err);
}

