const console = require('console');         // require console module
const xhr = require('xhr');                 // require xhr
const store = require('kvstore');           // require state for storing watson token
const query = require('codec/query_string');
const auth = require('codec/auth');

export default (request) => {

    // watson api token
    const username = 'YOUR_IBM_TEXT_TO_SERVICE_CREDENTIAL_USERNAME';
    const password = 'YOUR_IBM_TEXT_TO_SERVICE_CREDENTIAL_PASSWORD';

    // translation api url
    const apiUrl =
        'https://stream.watsonplatform.net/text-to-speech/api/v1/synthesize';

    // token url
    const tokenUrl = 'https://stream.watsonplatform.net/authorization/api/v1/token?url=https://stream.watsonplatform.net/text-to-speech/api';

    //  Since this is a before publish event hanlder, we can modify the
    // message and subscribers will receive modified version.

    return store.get('watson_token').then((watsonToken) => {

        
        watsonToken = watsonToken || { token: null, timestamp: null };

        let response = request.ok();
        
        var speaker_voice = request.message.Speaker_Voice;
        
        if (watsonToken.token === null ||
                (Date.now() - watsonToken.timestamp) > 3000000) {

            const httpOptions = {
                as: 'json',
                headers: {
                    Authorization: auth.basic(username, password)
                }
            };


            response = xhr.fetch(tokenUrl, httpOptions).then(r => {

                watsonToken.token = decodeURIComponent(r.body);
                watsonToken.timestamp = Date.now();
                store.set('watson_token', watsonToken);
                if (watsonToken.token) {
                    const queryParams = {
                        accept: 'audio/wav',
                        voice: speaker_voice,
                        text: request.message.text,
                        'watson-token': watsonToken.token
                    };

                    request.message.speech =
                    apiUrl + '?' + query.stringify(queryParams);
                }
                console.log(request.message.speech);
                return request.ok();

            },
            e => console.error(e.body))
            .catch((e) => console.error(e));
        } else {

            const queryParams = {
                accept: 'audio/wav',
                voice: speaker_voice,
                text: request.message.text,
                'watson-token': watsonToken.token
            };

            request.message.speech = apiUrl + '?' + query.stringify(queryParams);

            console.log(request.message.speech);
        }

        return response;


    });

};
