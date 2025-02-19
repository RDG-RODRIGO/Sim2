const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

app.set('json spaces', 2);
app.use(bodyParser.json());

let taughtPhrases = {};

const jsonFilePath = path.join(__dirname, 'rajib/Teach.json');


fs.readFile(jsonFilePath, 'utf8', (err, data) => {
  if (!err) {
    taughtPhrases = JSON.parse(data);
    console.log('Loaded taught phrases from teach.json');
  }
});


function saveTaughtPhrases() {
  fs.writeFile(jsonFilePath, JSON.stringify(taughtPhrases, null, 2), 'utf8', (err) => {
    if (err) {
      console.log('Error saving taught phrases to teach.json');
    } else {
      console.log('Saved taught phrases to teach.json');
    }
  });
}

app.get('/sim', (req, res) => {
  const teachQuery = req.query.teach;
  const replyQuery = req.query.reply;
  const ansQuery = req.query.ans;
  const userLang = req.query.lang; 

  if (teachQuery) {
    taughtPhrases[teachQuery] = ansQuery || 'Default response for ' + teachQuery;
    saveTaughtPhrases(); 
    const teachingResponse = {
      author: 'Islamick Chat',
      message: 'Successful Teaching Islamick Chat server'
    };
    res.json(teachingResponse);
    console.log(teachingResponse);
  } else if (replyQuery) {
    const response = taughtPhrases[replyQuery];
    if (response) {
      const responseObj = {
        author: 'Islamick Chat',
        message: response
      };
      res.json(responseObj);
      console.log(responseObj);
    } else {
      const notFoundResponse = {
        author: 'Islamick Chat',
        message: 'No response found for the given me teach'
      };
      res.json(notFoundResponse);
      console.log(notFoundResponse);
    }
  } else {
    if (userLang) {

    }
    res.status(400).json({ error: 'Invalid query parameters. You can use "teach" to teach and "reply" to get a response.' });
    console.log('Invalid query parameters');
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});