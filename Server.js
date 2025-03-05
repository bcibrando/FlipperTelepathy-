const express = require('express');
const { exec } = require('child_process');
const { Notion } = require('@neurosity/notion');

const app = express();
const PORT = 3001;

const FOCUS_THRESHOLD = 0.4;
const LOW_FOCUS_THRESHOLD = 0.25;

const notion = new Notion();
let currentFocusScore = 0;

async function loginToNeurosity() {
    try {
        await notion.login({
            email: "EMAIL",
            password: "PASSWORD"
        });
        console.log("Logged in to Neurosity");
    } catch (error) {
        console.error("Error logging in:", error);
    }
}

loginToNeurosity();

notion.focus().subscribe(focusData => {
    console.log("Received focus data:", focusData);
    if (focusData && focusData.probability) {
        currentFocusScore = focusData.probability;
        console.log("Updated Focus score:", currentFocusScore);

        if (currentFocusScore > FOCUS_THRESHOLD) {
            console.log("Focus threshold crossed. Executing Flipper command.");
            exec(`osascript -e 'tell application "Terminal" to do script "vibro 1" in front window'`, (error, stdout, stderr) => {
                if (error) {
                    console.error(`Error executing Flipper vibrate command: ${error}`);
                    return;
                }
                console.log(`Flipper vibrate command output: ${stdout}`);
            });
        } else if (currentFocusScore <= LOW_FOCUS_THRESHOLD) {
            console.log("Low focus threshold reached. Stopping Flipper vibration.");
            exec(`osascript -e 'tell application "Terminal" to do script "vibro 0" in front window'`, (error, stdout, stderr) => {
                if (error) {
                    console.error(`Error executing Flipper stop vibrate command: ${error}`);
                    return;
                }
                console.log(`Flipper stop vibrate command output: ${stdout}`);
            });
        }
    } else {
        console.log("Focus score data not received or undefined.");
    }
});

app.get('/', (req, res) => {
    res.send('Neurosity Middleware Running');
});

app.get('/focus', (req, res) => {
    res.json({ focusScore: currentFocusScore });
});

app.listen(PORT, () => {
    console.log(`Middleware listening at http://localhost:${PORT}`);
});
