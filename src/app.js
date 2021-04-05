import tmi from 'tmi.js';
import { nodeCache, lastWipe } from './state';
import { checkAnswer, showCategories, showLeaderBoard, showQuestion, showMoney } from './jeopardy';
import { botName, oAuthToken, channelName, timeLimit, states, commands } from './constants';

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
    if(self) return;
    
    //wipe scores after a week
    if(new Date().getDate() - lastWipe.getDate() > 7) {
        nodeCache.flushAll();
        lastWipe = currentDate;
    }

    message = message.trim().toLowerCase();

    //register a user
    if(commands.includes(message.split(' ')[0]))
        registerUser(userState.username);

    if (message === '!help')
        client.say(channel, `@${userState.username} Type !jeopardy to start. !category {category number} {dollar amount} to select a category. !whatis {answer} to submit the answer. !weekly to see the leader board. !money to see how much money you have this week.`);

    if(message === '!money') 
        showMoney(client, channel, userState, self);
    

    else if (message === '!weekly') 
        showLeaderBoard(client, channel, userState, self);
    

    else if (message === '!jeopardy' && (nodeCache.get(userState.username).state === states.Registered || nodeCache.get(userState.username).state === states.AskedQuestion)) {
        client.say(channel, `@${userState.username} Loading categories, this might take some time...`)
        showCategories(client, channel, userState, self);
    }

    else if (message.startsWith('!category') && nodeCache.get(userState.username).state === states.AskedQuestion) {
        //remove command
        message = message.replace('!category', '').trim();

        //get responses from string
        const responses = message.split(' ');

        if (responses.length === 2 && responses.every(x => !isNaN(parseInt(x)))) {
            showQuestion(client, channel, userState, self, responses);
        }
        else
            client.say(channel, `invalid parameters ${responses.join(',')}`);
    }

    else if (message.startsWith('!whatis') && nodeCache.get(userState.username).state === states.SelectedCategory) {
        console.log('what is was called by', userState.username);
        //remove command
        message = message.replace('!whatis', '').trim();

        checkAnswer(client, channel, userState, self, message);
    }
});

function registerUser(username) {
    const user = nodeCache.get(username);

    if(user === undefined) {
        nodeCache.set(username, {
            username: username,
            state: states.Registered,
            money: 0
        });
    }
}