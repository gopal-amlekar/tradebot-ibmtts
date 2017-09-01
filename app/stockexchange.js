'use strict';

// dotenv module uses local file named '.env' to load the environment variables for this script
require('dotenv').load();
const PUB_NUB_CHANNEL_KEY = process.env.PUB_NUB_CHANNEL_KEY;
const PUB_NUB_PUBLISH_KEY= process.env.PUB_NUB_PUBLISH_KEY;		
const PUB_NUB_SUBSCRIBE_KEY = process.env.PUB_NUB_SUBSCRIBE_KEY;	

var PN = require("pubnub");					// Used for receiving published messages
var chance = require('chance').Chance();	// Used for generating random numbers

// Put in a try-catch block
try
{
	// Read configuration for stocks and their thresholds to be checked for
	var stocks  = require('./stocks.json');
	var StockData=[];

	// Populate data in a list and set an initial price for the stock randomly between upper and lower threshold
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
	// Send an initial message to indicate starting of stock market
	//For expressive SSML (express-as), only en-US_AllisonVoice is supported
	var message =
	{
		"event": "Welcome Event",
		"text": "<speak><express-as type='GoodNews'>The stock market is started. Have a nice Day!</express-as></speak>",
		"Speaker_Voice": 'en-US_AllisonVoice'
	}
	console.log ("Welcome message: The stock market is started. Have a nice Day!");
	sendPNCommand(message);
}
catch (err)
{
	console.log ("Exception in sending welcome message", err);
}

var simulation_interval = 10000;	// Start with a lower simulation frequency

try
{
	//setInterval(StockSimulate, simulation_interval);
	setTimeout (StockSimulate, simulation_interval);
}
catch (err)
{
	console.log ("Exception in Simulating stock function", err);
}

function StockSimulate()
{
	simulation_interval = 5000;		// Simulate every 5 seconds normally (20 seconds if threshold crossed)
	// Randomly pick up a stock to manipulate
	var StockIndex = chance.natural({min: 0, max:StockData.length-1});
	StockData[StockIndex].prev_price = StockData[StockIndex].price;
	//console.log (StockData[StockIndex].name);
	//console.log (StockData[StockIndex].price);

	// Randomly update the price in either direction (up or down)
	var ChangeFactor = chance.natural({min:0, max:StockData[StockIndex].maxChange});
	var dir = chance.bool();
	if (dir === false)
		ChangeFactor *= -1;
		
	var PriceChange = (StockData[StockIndex].price*ChangeFactor) / 100;
	//console.log (PriceChange);

	StockData[StockIndex].price = StockData[StockIndex].price + PriceChange;

	console.log (StockData[StockIndex].name + ": " + StockData[StockIndex].price.toFixed(2) + " Change: " + ChangeFactor + "%");
	
	//Guard against too high / too low spikes
	if (StockData[StockIndex].price < StockData[StockIndex].min_price)
		StockData[StockIndex].price = StockData[StockIndex].min_price;
	else if (StockData[StockIndex].price > StockData[StockIndex].max_price)
		StockData[StockIndex].price = StockData[StockIndex].max_price;
	
	if (StockData[StockIndex].price < StockData[StockIndex].lower_limit) 
	{
		console.log ("ALERT: Lower limit crossed for stock: ", StockData[StockIndex].name);
		
		var TextToSpeak = "<speak>";
		TextToSpeak += StockData[StockIndex].name + " crossed lower limit. It is trading at: ";
		TextToSpeak += "<say-as interpret-as='number'>" + StockData[StockIndex].price.toFixed(2) + "</say-as>.";
		TextToSpeak += "</speak>";
		
		
		var message =
		{
		"event": "Crossed Lower Limit",
		"text": TextToSpeak,
		"Speaker_Voice": 'en-US_MichaelVoice',
		"Limit_Type": "LIMIT_LOWER",
		"Limit_Value": StockData[StockIndex].lower_limit,
		"Scrip_Name": StockData[StockIndex].name,
		"Scrip_Price": StockData[StockIndex].price
		}
		
		simulation_interval = 20000;	// Delay for audio conversion and playback
		
		sendPNCommand(message);
	}
	else if (StockData[StockIndex].price > StockData[StockIndex].upper_limit)
	{
		console.log ("ALERT: Upper limit crossed for stock: ", StockData[StockIndex].name);

		var TextToSpeak = "<speak>";
		TextToSpeak += StockData[StockIndex].name + " crossed upper limit. It is trading at: ";
		TextToSpeak += "<say-as interpret-as='number'>" + StockData[StockIndex].price.toFixed(2) + "</say-as>.";
		TextToSpeak += "</speak>";

		var message =
		{
		"event": "Crossed Upper Limit",
		//"text": StockData[StockIndex].name + " crossed upper limit. It is trading at: " + StockData[StockIndex].price.toFixed(2),
		"text": TextToSpeak,
		"Speaker_Voice": 'en-US_AllisonVoice',
		"Limit_Type": "LIMIT_UPPER",
		"Limit_Value": StockData[StockIndex].upper_limit,
		"Scrip_Name": StockData[StockIndex].name,
		"Scrip_Price": StockData[StockIndex].price
		}
		
		simulation_interval = 20000;	// Delay for audio conversion and playback
		
		sendPNCommand(message);
	}	
	setTimeout (StockSimulate, simulation_interval);
}


function sendPNCommand (message)
{
	// Instantiate a new PubNub object
	// Both publish and subscribe key are needed as we are publishing from this object. Subscribe key is mandatory
	var pn = new PN
	({
		ssl           : true,
		publish_key   : PUB_NUB_PUBLISH_KEY,
		subscribe_key : PUB_NUB_SUBSCRIBE_KEY
	});
	
	var output = message['message'];
	//console.log ("Sending text message: ", message.text);
	
	pn.publish
	({
		channel   : PUB_NUB_CHANNEL_KEY,
		message   : message
	},
	// Callback when publish operation is finished
	function (status, response)
	{
		if (status.error)
		{
			console.log("Failed publish", status, response);
		}
		else
		{
			console.log("Published text message");
		}
	});
}
