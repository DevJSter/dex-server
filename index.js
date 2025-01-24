const express = require('express');
const app = express();
const port = 3000;

app.use(express.json());

app.get('/buy-asset', (req, res) => {
    res.send('Hello World!');
    }
);

app.post('/sell-assets', (req, res) => {
    console.log(req.body);
    res.send('Post request received');
    }
);

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`);
    }
);