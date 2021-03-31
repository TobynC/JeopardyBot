import { jeopardyApiUrl, states } from './constants';
import axios from 'axios';

export function showLeaderboard(client, channel, userState, self) {

}

export function showCategories(client, channel, userState, self, date, userStates) { 
   axios.get(`${jeopardyApiUrl}/${date}`).then(response => {
        const questions = formatQuestions(response.data);
        const categories = [...new Set(questions.map(question => question.category))];
        console.log(categories);

        let output = '';
        let counter = 1;
        for(const category of categories) {
            output = `${output}${counter === 1 ? '' : ', '}${counter}.) ${category.toLowerCase()}`;

            counter++;
        }
        
        client.say(channel, `@${userState.username} ${output}`);
        console.log(output);

        userStates.push({
            user: userState.username,
            state: states.AskedQuestion,
            jeopardyDay: date
        });

        console.log(userStates);
    }).catch(error => console.log(error));
}

export function showQuestion(client, channel, userState, self) {

}

export function checkAnswer(client, channel, userState, self) {

}

function formatQuestions(data) {
    const jeopardy = data.jeopardy.filter(question => question.value !== 'Daily Double');
    const doubleJeopardy = data["double jeopardy"].filter(question => question.value !== 'Daily Double');

    //normalize value for double jeopardy
    for(const question of doubleJeopardy) 
        question.value = question.value / 2;

    return [...jeopardy, ...doubleJeopardy];
}