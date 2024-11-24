const express = require("express");
const session = require("express-session");
const path = require("path");
const bodyParser = require("body-parser");
const {MongoClient, ServerApiVersion, ObjectId} = require("mongodb");
const cors = require("cors");
const morgan = require("morgan");

const app = express();
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

let database;

app.use(bodyParser.json());
app.use(morgan("dev"));
app.use(express.static(path.join(__dirname)));
app.use('/images', express.static(path.join(__dirname, 'images')));
app.use(cors({
    origin: "https://taranb27.github.io",
}));

client.connect()
    .then(() => {
        console.log("connected to mongodb");
        database=client.db("CST3144");

        if (!database) {
            console.error("Database is not initialized correctly");
            return;
        }
        courses_details();

    })
    .catch(err => {
        console.error("error connecting to mongodb", err);
        process.exit(1);
    });


// The function added courses to the database, if the courses exists, nothing is added
async function courses_details(){
    const collection = database.collection("course_details");
    if (!collection) {
        console.error("Collection 'course_details' is not found in the database");
        return;
    }
    const courseDetails = [
        {Subject: "Maths", Location: "London", Price: "£100", Spaces: 5, Image: "backend/images/maths.jpeg"},
        {Subject: "English", Location: "Bristol", Price: "£80", Spaces: 5, Image: "backend/images/english.jpg"},
        {Subject: "French", Location: "York", Price: "£90", Spaces: 5, Image: "backend/images/french.jpg"},
        {Subject: "Science", Location: "London", Price: "£120", Spaces: 5, Image: "backend/images/science.avif"},
        {Subject: "Maths", Location: "York", Price: "£100", Spaces: 5, Image: "backend/images/maths.jpeg"},
        {Subject: "Music", Location: "Bristol", Price: "£80", Spaces: 5, Image: "backend/images/music.jpeg"},
        {Subject: "English", Location: "London", Price: "£80", Spaces: 5, Image: "backend/images/english.jpg"},
        {Subject: "Maths", Location: "York", Price: "£1020", Spaces: 5, Image: "backend/images/maths.jpeg"},
        {Subject: "Science", Location: "Liverpool", Price: "£85", Spaces: 5, Image: "backend/images/science.avif"},
        {Subject: "French", Location: "Manchester", Price: "£86", Spaces: 5, Image: "backend/images/french.jpg"}
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
}


// Sends the course details from MongoDB to the frontend
app.get('/courses', async (req, res) => {
    try {
        const coursesCollection = await database.collection("course_details").find().toArray();
        res.json(coursesCollection)
    } catch (err) {
        console.error("Failed", err);
        res.status(500).send("Error fetching courses");
    }
});

// POST method for order (after checkout)
app.post('/orders', async(req, res) => {
    try {
        const orderData =req.body;
        const result = await database.collection("orders").insertOne(orderData);
        res.status(201).send({insertedId: result.insertedId});
    } catch (error) {
        console.error('error saving order:', error);
        res.status(500).send('error placing order');
    }
});

// PUT method to update spaces for course bought
app.put('/courses/:id/spaces', async (req, res) => {
    const courseId = req.params.id;
    const {spacesToReduce} = req.body;
    console.log(`Updating spaces for course ID: ${courseId}, Spaces to reduce: ${spacesToReduce}`);

        if (typeof spacesToReduce !== 'number' || spacesToReduce <= 0) {
            return res.status(400).send('Invalid spaces to reduce');
        }

    try {
        const result = await database.collection("course_details").updateOne(
            {_id: new ObjectId(courseId)},
            {$inc: {Spaces: -spacesToReduce}}
        );
        const updatedCourse = await database.collection("course_details").findOne({ _id: new ObjectId(courseId) });
        res.status(200).send(updatedCourse);
         
    } catch(error) {
        console.error(`Error updating spaces for course ID: ${courseId}`, error);
        res.status(500).send('Internal server error');     
    }
});

// GET method for search functionality (search as you type)
app.get('/search', async(req, res) => {
    const {query} = req.query;
    
    if (!query) {
        return res.status(400).json({ error: 'Search query is required' });
    }

    try {                
        const results = await database.collection("course_details").find({
            $or: [
                {Subject: {$regex: query, $options: 'i'}},
                {Location: {$regex: query, $options: 'i'}},
                {Price: {$regex: query, $options: 'i'}},
            ]
        }).toArray();
        res.json(results);
    } catch (error) {
        console.error("Error fetching search results: ", error);
        res.status(500).json({error: "internal server error"});
    }
});

// global error handling middleware
app.use((err, req, res, next) => {
    console.error("error:", err.message);
    res.status(500).json({error:"internal server error"});
}); 

app.listen(PORT, () => console.log('server running'));