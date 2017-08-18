# Speech Enabled Bot Trading System Powered By IBM Watson 

### How the code works

Here is a brief explanation of various scripts included in the app. This will help you understand how the app works.

##### Configuration and customization
The [Configuration file](./stocks.json) holds the stock names and upper / lower limits to check for. This configuration tells our bot trading program details about the stocks to simulate. We use a json data structure to populate this data. See file stockdata.json. You can also customize this file with your favourite stocks. Here is a brief about various fields in this data structure.

* _Name_: Name of the stock
* _Upper_limit_: When the stock goes higher than this limit, a message is triggered.
* _Lower_limit_: When the stock price goes lower than this limit, a message is triggered.
* _Max_change_: Maximum change in the stock price at a time while simulating the price movement.

##### Stock Exchange simulation
Using data from stocks.json, the code in script stockexchange.js simulates a trading environment and publishes messages to PubNub network.
First, it sets an initial price for every stock using a random value between upper limit and lower limit.
It then publishes a welcome text message to PubNub. Note that this message uses expressive SSML to express the speech as a good news. 
Then, every 20 seconds, it picks any random stock and changes its price by a random percent between 0 to max_change (read from stock data), in either upward or downward direction. For e.g. if Apple stock gets chosen to be manipulated and the max_change is 8 then the price will be changed by any value between -7% to +7% of the existing price.
After the price is changed for a stock, it compares the new price with the upper and lower thresholds. If either of the limits is crossed, a message is then published to PubNub.
The messages consists of the event type which is either ‘upper limit crossed’ or ‘lower limit crossed’ along with a text message to be converted into speech. In addition, another field ‘speaker_voice added to the message indicates which voice should be used for speaking by IBM Text to Speech service.

##### Text to Speech conversion with PubNub Function
Once a message is published to the PubNub network, it gets passed to the function block which contains code for IBM Text to Speech conversion. 
This code makes a http request using the xhr module to IBM Watson API for Text to Speech.
The API call returns a URL of the audio file on IBM platform.
The URL then gets added to the JSON payload published earlier and the PubNub network then passes on this message to all subscriber devices.

##### Playing back audio
The script tradebot.js takes care of receiving the messages.
It subscribes to PubNub’s channel ‘TradeBot_Channel’ and keeps listening to messages on this channel.
Whenever a message arrives, it extracts the URL of the speech message, downloads the audio file with a http request.
The downloaded file is then played back using Node.js play-sound library.
