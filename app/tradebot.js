'use strict';

// dotenv module uses local file named '.env' to load the environment variables for this script
require('dotenv').load();
const PUB_NUB_CHANNEL_KEY = process.env.PUB_NUB_CHANNEL_KEY;
const PUB_NUB_SUBSCRIBE_KEY = process.env.PUB_NUB_SUBSCRIBE_KEY;	

// Code to check presence of .env file  or validity of the keys in that file may be added here.

var request = require('request');	// Used to stream audio from IBM Watson
const fs = require('fs');			// Used to create an audio file locally

var playerOpts={};
var player = require('play-sound')(playerOpts);	// Used to play back the downloaded audio file
var PN = require('pubnub');			// Used for receiving published messages

// Put the code in a try-catch block
try
{
	// Instantiate a new PubNub object. Subscribe key is mandatory. 
	// Publish key is not required in this script as we are not publishing any messages
	var pn = new PN
	({
		subscribeKey: PUB_NUB_SUBSCRIBE_KEY,
		ssl: true
	});
	
	// A listener is added for various events happening with PubNub object such as presence, join etc.
	// Here we process only receipt of a message on subscribed channels
	pn.addListener
	({
		message: function (msg)
		{
			var message = msg.message;	// msg.message is the json object received
			
			console.log ("Speech Message recd for event: ", message['event']);
			//console.log (message);
			var Speech_File_Path = message['speech'];	// The URL of speech file returned by IBM Watson TTS API
			var speechFile = 'tts.wav';					// Filename for local storage and download. Gets overwritten every time

			// We use javascript promise to play the audio file when it has been completely downloaded
			
			let getSpeechPromise = new Promise((resolve, reject) => {
				
				var rq = request(Speech_File_Path);
				
				var streamRequest = rq.pipe(fs.createWriteStream(speechFile));
				
				rq.on('response', function(resp){
					//console.log(resp.statusCode);
					// Various responses may be handled here such as if the file is not present etc.
				});
				
				streamRequest.on('finish', function(){
					//console.log ("Stream finished");
					// Any other housekeeping when the file has been downloaded may be added here.
					resolve(speechFile);
				});
				
			});	

			getSpeechPromise.then((speechFile) => {					
						player.play(speechFile, function (err) {
						   if (err) throw err;
						   //console.log("Audio finished");
						   // Delete the file if required or move it somewhere else if required. Playback has been done.
						});
			});
		} //end message function
	});
	
	// Subscribe to the channel
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

