const express = require("express")
const session = require("express-session")
const path = require("path")
const bodyParser = require("body-parser")
const {MongoClient, ServerApiVersion} = require("mongodb");
const app = express()
app.use(bodyParser.json())

const PORT = process.env.PORT || 8080;

const server = "cluster0.2ior5mc.mongodb.net";

const encodedusername = encodeURIComponent("tb848");
const encodedpwd = encodeURIComponent("CST3144");

const URI = `mongodb+srv://${encodedusername}:${encodedpwd}@${server}/?retryWrites=true&w=majority&appName=Cluster0;`;

const client = new MongoClient(URI, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: false,
        deprecationErrors: true,
    }
});

client.connect()
    .then(() => {
        console.log("connected to db");
        const database = client.db("CST3144");
        const collection = database.collection("course_details");

        app.use(express.static(path.join(__dirname)));

        app.get('/', (req, res) => {
            res.sendFile(path.join(__dirname, 'index.html'));
        });
        
        app.use(express.json());

        app.listen(PORT, () => console.log('server running'));
    })
    .catch(err => console.error("error connecting to db", err));




