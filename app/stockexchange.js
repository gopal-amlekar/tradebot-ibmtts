'use strict';
require('dotenv').load();

const PUB_NUB_CHANNEL_KEY = process.env.PUB_NUB_CHANNEL_KEY;
const PUB_NUB_PUBLISH_KEY= process.env.PUB_NUB_PUBLISH_KEY;		
const PUB_NUB_SUBSCRIBE_KEY = process.env.PUB_NUB_SUBSCRIBE_KEY;	

var PN = require("pubnub");
var chance = require('chance').Chance();

try
{
	var stocks  = require('./stocks.json');
	var StockData=[];

	for (var counter = 0; counter < (stocks["StockData"].length); counter++)
	{
		StockData[counter] = stocks["StockData"][counter];
		StockData[counter].price = chance.natural({min:stocks["StockData"][counter].lower_limit, max: stocks["StockData"][counter].upper_limit});
		StockData[counter].prev_price = StockData[counter].price;
		StockData[counter].min_price = stocks["StockData"][counter].lower_limit - ( (stocks["StockData"][counter].lower_limit) * 0.5);
		StockData[counter].max_price = stocks["StockData"][counter].upper_limit + ( (stocks["StockData"][counter].upper_limit) * 0.2);
	}
}
catch (err)
{
	console.log ("Exception in reading json data", err);
}

try
{
	//For expressive SSML (express-as), only en-US_AllisonVoice is supported
	var message =
	{
		"event": "Other",
		"text": "<speak><express-as type='GoodNews'>The stock market is started. Have a nice Day!</express-as></speak>",
		"Speaker_Voice": 'en-US_AllisonVoice'
	}
	sendPNCommand(message);
}
catch (err)
{
	console.log ("Exception in sending welcome message", err);
}


try
{
	setInterval(StockSimulate, 20000);
}
catch (err)
{
	console.log ("Exception in Simulating stock function", err);
}
		
function StockSimulate()
{
	//setInterval(function(){

	var StockIndex = chance.natural({min: 0, max:StockData.length-1});
	//StockIndex = 0;
	//console.log (StockData[StockIndex].name);

	//console.log (StockData[StockIndex].price);
	StockData[StockIndex].prev_price = StockData[StockIndex].price;


	var ChangeFactor = chance.natural({min:0, max:StockData[StockIndex].maxChange});
	//console.log (ChangeFactor);
	//var PriceChange = (ChangeFactor)/100;
	var dir = chance.bool();
	if (dir === false)
		ChangeFactor *= -1;
		
	//console.log (ChangeFactor);

	var PriceChange = (StockData[StockIndex].price*ChangeFactor) / 100;
	//console.log (PriceChange);

	StockData[StockIndex].price = StockData[StockIndex].price + PriceChange;

	//StockData[StockIndex].price = chance.natural({min:StockData[StockIndex].min_price , max:StockData[StockIndex].max_price});
	console.log (StockData[StockIndex].name + ": " + StockData[StockIndex].price.toFixed(2) + " Change: " + ChangeFactor + "%");
	/*
		var TextToSpeak = "<speak><express-as type='Apology'>";
		TextToSpeak += StockData[StockIndex].name + " crossed lower limit. It is trading at: ";
		TextToSpeak += "<say-as interpret-as='number'>" + StockData[StockIndex].price.toFixed(2) + "/say-as>.";
		TextToSpeak += "</express-as></speak>";
		
		console.log (TextToSpeak);
	*/
	
	//Guard against too high / too low spikes
	if (StockData[StockIndex].price < StockData[StockIndex].min_price)
		StockData[StockIndex].price = StockData[StockIndex].min_price;
	else if (StockData[StockIndex].price > StockData[StockIndex].max_price)
		StockData[StockIndex].price = StockData[StockIndex].max_price;
	
	if (StockData[StockIndex].price < StockData[StockIndex].lower_limit) 
	{
		console.log ("PRICE CROSSED LOWER LIMIT");
		
		//var TextToSpeak = "<speak><express-as type='Apology'>";
		var TextToSpeak = "<speak>";
		TextToSpeak += StockData[StockIndex].name + " crossed lower limit. It is trading at: ";
		TextToSpeak += "<say-as interpret-as='number'>" + StockData[StockIndex].price.toFixed(2) + "</say-as>.";
		TextToSpeak += "</speak>";
		
		//console.log (TextToSpeak);
		
		var message =
		{
		"event": "Crossed limit",
		"text": TextToSpeak,
		"Speaker_Voice": 'en-US_MichaelVoice',
		"Limit_Type": "LIMIT_LOWER",
		"Limit_Value": StockData[StockIndex].lower_limit,
		"Scrip_Name": StockData[StockIndex].name,
		"Scrip_Price": StockData[StockIndex].price
		}
		sendPNCommand(message);
	}
	else if (StockData[StockIndex].price > StockData[StockIndex].upper_limit)
	{
		console.log ("PRICE CROSSED UPPER LIMIT");

		var message =
		{
		"event": "Crossed limit",
		"text": StockData[StockIndex].name + " crossed upper limit. It is trading at: " + StockData[StockIndex].price.toFixed(2),
		"Speaker_Voice": 'en-US_AllisonVoice',
		"Limit_Type": "LIMIT_UPPER",
		"Limit_Value": StockData[StockIndex].upper_limit,
		"Scrip_Name": StockData[StockIndex].name,
		"Scrip_Price": StockData[StockIndex].price
		}
		sendPNCommand(message);
	}
	
	//setTimeout (StockSimulate, 20000);	//Keep repeating periodically
}



function sendPNCommand (message)
{

	var pn = new PN
	({
		ssl           : true,  // <- enable TLS Tunneling over TCP
		publish_key   : PUB_NUB_PUBLISH_KEY,
		subscribe_key : PUB_NUB_SUBSCRIBE_KEY
	});
	
	var output = message['message'];
	//console.log ("Trying to send message");
	
	pn.publish
	({
		channel   : PUB_NUB_CHANNEL_KEY,
		message   : message
	},
	
	function (status, response)
	{
		//console.log ("Callback fired");
		if (status.error)
		{
			console.log("Failed publish", status, response);
		}
		else
		{
			console.log("Published message");
		}
	});
}
