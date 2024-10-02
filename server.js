const express = require("express")
const session = require("express-session")
const path = require("path")
const bodyParser = require("body-parser")

const app = express()
app.use(bodyParser.json())

const PORT = process.env.PORT || 8080;

app.use(express.static(path.join(__dirname)));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.use(express.json());

app.listen(PORT, () => console.log('server running'));