import tmi from 'tmi.js';
import { checkAnswer, showCategories, showLeaderboard, showQuestion } from './jeopardy';
import { botName, oAuthToken, channelName, startDate, timeLimit } from './constants';

//state variables
const userStates = [];
let lastWipe = Date.now();

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

    switch(message.trim().toLowerCase()) {
        case '!weekly':
            showLeaderboard(client, channel, userState, self);
            break;
        case '!jeopardy':
            const randomDay = randomWeekday();            

            showCategories(client, channel, userState, self, randomDay, userStates);

            break;
        case '!category':
            showQuestion(client, channel, userState, self);
            break;
        case '!whatis':
            checkAnswer(client, channel, userState, self);
            break;
    }

	// if(message.toLowerCase() === '!hello') {
	// 	client.say(channel, `@${userstate.username}, heya!`);
	// }
});

function randomWeekday() {
    const start = new Date(startDate);

    let weekday = new Date(start.getTime() + Math.random() * (Date.now() - start.getTime()));

    while(weekday.getDay() === 0 || weekday.getDay() === 6)
        weekday = new Date(start.getTime() + Math.random() * (Date.now() - start.getTime()));

    return weekday.toLocaleString('en-US', {
        year: "numeric",
        month: "2-digit",
        day: "2-digit"
    }).split(',')[0];
}