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
            const result = await collection.drop();

            const courseDetails = [
                {Subject: "Maths", Location: "London", Price: "£100", Spaces: 10},
                {Subject: "English", Location: "Bristol", Price: "£80", Spaces: 10},
                {Subject: "French", Location: "York", Price: "£90", Spaces: 10},
                {Subject: "Science", Location: "London", Price: "£120", Spaces: 10},
                {Subject: "Maths", Location: "York", Price: "£100", Spaces: 10},
                {Subject: "Music", Location: "Bristol", Price: "£80", Spaces: 10},
                {Subject: "English", Location: "London", Price: "£80", Spaces: 10},
                {Subject: "Maths", Location: "York", Price: "£1020", Spaces: 10},
                {Subject: "Science", Location: "Liverpool", Price: "£85", Spaces: 10},
                {Subject: "French", Location: "Manchester", Price: "£86", Spaces: 10}
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
                        // console.log("working")
                        await client.connect();
                        const db1 = client.db("CST3144");
                        const coursesCollection = db1.collection("course_details");
        
                        const courses = await coursesCollection.find().toArray();
                        // console.log(courses)
                        res.json(courses)
                        await client.close();
                    } catch (err) {
                        console.error("Failed", err);
                        res.status(500).send("Error fetching courses");
                    } finally {
                        await client.close();
                    }
                });
        

        app.post('/orders', async(req, res) => {
            const orderData =req.body;
            try {
                await client.connect();
                const db2 = client.db("CST3144");
                const collection2  = db2.collection('orders');
                const result = await collection2.insertOne(orderData);
                res.status(201).send({insertedId: result.insertedId});
            } catch (error) {
                console.error('error saving order:', error);
                res.status(500).send('error placing order');
            } finally {
                await client.close();
            }
        });

            
        app.use(express.json());

        app.listen(PORT, () => console.log('server running'));
    })
    .catch(err => console.error("error connecting to db", err));