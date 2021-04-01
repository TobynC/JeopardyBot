import tmi from 'tmi.js';
import { nodeCache, lastWipe } from './state';
import { checkAnswer, showCategories, showLeaderBoard, showQuestion } from './jeopardy';
import { botName, oAuthToken, channelName, timeLimit, states } from './constants';

const options = {
	options: { debug: true, messagesLogLevel: "info" },
	connection: {
		reconnect: true,
		secure: true
	},
	identity: {
		username: botName,
		password: `oauth:${oAuthToken}`
	},
	channels: [ channelName ]
};

const client = new tmi.Client(options);

client.connect().catch(console.error);

client.on('message', (channel, userState, message, self) => {
    //wipe scores after a week
    // const currentDate = new Date();

    // if(currentDate.getTime() > (lastWipe.getDate() + 7)) {
    //     userStates = [];
    //     lastWipe = currentDate;
    // }

	if(self) return;

    message = message.trim().toLowerCase();

    if(message === '!weekly') {
        showLeaderBoard(client, channel, userState, self);
    }

    else if (message === '!jeopardy') {
        client.say(channel, `@${userState.username} Loading categories, this might take some time...`)
        showCategories(client, channel, userState, self);
    }

    else if (nodeCache.get(userState.username) !== undefined) {
        if (message.startsWith('!category') && nodeCache.get(userState.username).state === states.AskedQuestion) {
            //remove command
            message = message.replace('!category', '').trim();

            //get responses from string
            const responses = message.split(' ');

            if(responses.length === 2 && responses.every(x => !isNaN(parseInt(x)))) {
                showQuestion(client, channel, userState, self, responses);
            }       
            else 
                client.say(channel, `invalid parameters ${responses.join(',')}`); 
        }
        
    }

    //FUCKED
    else if (nodeCache.get(userState.username) != undefined) {
        if (message.startsWith('!whatis') && nodeCache.get(userState.username).state === states.SelectedCategory) {
            console.log('what is was called by', userState.username);
            //remove command
            message = message.replace('!whatis', '').trim();

            checkAnswer(client, channel, userState, self, message);
        }        
    }    
});