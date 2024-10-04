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

        // The function added courses to the database, if the courses exists, nothing is added
        async function courses_details(){
            const courseDetails = [
                {Subject: "Maths", Location: "London", Price: "£100"},
                {Subject: "English", Location: "Bristol", Price: "£80"},
                {Subject: "French", Location: "York", Price: "£90"},
                {Subject: "Science", Location: "London", Price: "£120"},
                {Subject: "Maths", Location: "York", Price: "£100"},
                {Subject: "Music", Location: "Bristol", Price: "£80"},
                {Subject: "English", Location: "London", Price: "£80"}
            ];

            for (let course of courseDetails) {
                const existingCourse = await collection.findOne({
                    Subject: course.Subject,
                    Location: course.Location,
                    Price: course.Price
                });
                if(!existingCourse) {
                    await collection.insertOne(course);
                    console.log("New course added");
                } else {
                    console.log("courses already exists");
                }
            }
            await client.close();
        }

        courses_details();

        app.use(express.static(path.join(__dirname)));

        app.get('/', (req, res) => {
            res.sendFile(path.join(__dirname, 'index.html'));
        });

        // Sends the course details from MongoDB to the frontend
        app.get('/courses', async (req, res) => {
            try {
                const courses = await collection.find({}).toArray();
                res.json(courses);
            } catch (err) {
                console.log("Failed");
                res.status(500).send("Error fetching courses");
            }
        });
        
        app.use(express.json());

        app.listen(PORT, () => console.log('server running'));
    })
    .catch(err => console.error("error connecting to db", err));




