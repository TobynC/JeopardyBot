import { nodeCache } from './state';
import { jeopardyApiUrl, states, startDate } from './constants';
import axios from 'axios';

export function showMoney(client, channel, userState, self) {
    const user = nodeCache.get(userState.username);

    client.say(channel, `@${userState.username} $${user.money}`)
}

export function showLeaderBoard(client, channel, userState, self) {
    const entries = [];

    for(const obj of nodeCache.keys()) {
        entries.push(nodeCache.get(obj));
    }

    const sortedList = entries.sort((a, b) => (a.money < b.money) ? 1 : -1).slice(0, 4);
    console.log(sortedList);

    //no one has played
    if(!sortedList.length) {
        client.say(channel, `@${userState.username} There are currently no scores.`)
        return;
    }

    let output = '';
    let counter = 1;
    for(const user of sortedList) {
        output = `${output}${counter === 1 ? '' : ', '}${counter}.) ${user.username} - $${user.money}`;
        counter++;
    }

    client.say(channel, `@${userState.username} ${output}`);
}

export function showCategories(client, channel, userState, self) { 
    const date = randomWeekday();

    axios.get(`${jeopardyApiUrl}/${date}`).then(response => {
        //couldn't find any data for the day
        if(response.data.message) {
            client.say(channel, `@${userState.username} Sorry, the day I was looking for did not have any data UwU.`);
            return;
        }

        const questions = formatQuestions(response.data);
        const categories = [...new Set(questions.map(question => question.category))].sort();

        let output = '';
        let counter = 1;
        for(const category of categories) {
            output = `${output}${counter === 1 ? '' : ', '}${counter}.) ${category.toLowerCase()}`;
            counter++;
        }
        
        client.say(channel, `@${userState.username} ${output}`);

        const user = nodeCache.get(userState.username);

        user.state = states.AskedQuestion;
        user.jeopardyDay = date;
        user.categories = categories;
        user.questions = questions;

        nodeCache.set(user.username, user);

        console.log('user:', user);
    }).catch(error => console.log(error));
}

export function showQuestion(client, channel, userState, self, responses) {
    const [categoryNumber, amount] = responses;

    const user = nodeCache.get(userState.username);

    //check for invalid entries
    if(parseInt(categoryNumber) > user.categories.length || parseInt(categoryNumber) < 1) {
        client.say(channel, `@${userState.username} The number you have entered is invalid.`);
        return;
    }

    const questions = user.questions;
    const categories = user.categories;

    const question = questions.find(x => x.category == categories[parseInt(categoryNumber)-1] && x.value === parseInt(amount));

    if(!question) {
        console.log('question not found');
        client.say(channel, `@${userState.username} Problem finding the question.`);

        return;
    }
            
    client.say(channel, `@${userState.username} ${question.clue}`);
    console.log(question);

    //update state
    user.state = states.SelectedCategory;
    user.chosenQuestion = question;

    nodeCache.set(userState.username, user);

    console.log(user);
}

export function checkAnswer(client, channel, userState, self, response) {
    console.log('response', response);
    const user = nodeCache.get(userState.username);

    if(similarity(response,user.chosenQuestion.answer) >= 0.70) {
        client.say(channel, `@${userState.username} That is correct!`);
        user.money += user.chosenQuestion.value;
    }
    else {
        client.say(channel, `@${userState.username} Sorry, the correct answer was ${user.chosenQuestion.answer}`);
    }

    //restart state
    user.state = states.Registered;
    user.response = response;

    nodeCache.set(userState.username, user);

    console.log(user);
}

function formatQuestions(data) {
    const jeopardy = data.jeopardy.filter(question => question.value !== 'Daily Double');
    const doubleJeopardy = data["double jeopardy"].filter(question => question.value !== 'Daily Double');

    //normalize value for double jeopardy
    for(const question of doubleJeopardy) 
        question.value = question.value / 2;

    return [...jeopardy, ...doubleJeopardy];
}


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

function similarity(s1, s2) {
    var longer = s1;
    var shorter = s2;
    if (s1.length < s2.length) {
        longer = s2;
        shorter = s1;
    }
    var longerLength = longer.length;
    if (longerLength == 0) {
        return 1.0;
    }
    return (longerLength - editDistance(longer, shorter)) / parseFloat(longerLength);
}

function editDistance(s1, s2) {
    s1 = s1.toLowerCase();
    s2 = s2.toLowerCase();

    var costs = new Array();
    for (var i = 0; i <= s1.length; i++) {
        var lastValue = i;
        for (var j = 0; j <= s2.length; j++) {
            if (i == 0)
                costs[j] = j;
            else {
                if (j > 0) {
                    var newValue = costs[j - 1];
                    if (s1.charAt(i - 1) != s2.charAt(j - 1))
                        newValue = Math.min(Math.min(newValue, lastValue),
                            costs[j]) + 1;
                    costs[j - 1] = lastValue;
                    lastValue = newValue;
                }
            }
        }
        if (i > 0)
            costs[s2.length] = lastValue;
    }
    return costs[s2.length];
}