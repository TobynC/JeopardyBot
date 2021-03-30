import tmi from 'tmi.js';
import { botName, oAuthToken, channelName } from './constants';

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

client.on('message', (channel, userstate, message, self) => {
	if(self) return;
	if(message.toLowerCase() === '!hello') {
		client.say(channel, `@${userstate.username}, heya!`);
	}
});