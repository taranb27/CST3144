const express = require("express")
const session = require("express-session")
const path = require("path")
const bodyParser = require("body-parser")
const {MongoClient, ServerApiVersion, ObjectId} = require("mongodb");
// const serverless = require("serverless-http");
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

        app.use(express.static(path.join(__dirname)));
        app.use('/images', express.static(path.join(__dirname, 'images')))

        const database = client.db("CST3144");
        const collection = database.collection("course_details");


        // The function added courses to the database, if the courses exists, nothing is added
        async function courses_details(){

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
            await client.close();
        }

        courses_details();

        
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
        

        // POST method for order (after checkout)
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

        // PUT method to update spaces for course bought
        app.put('/courses/:id/spaces', async (req, res) => {
            const courseId = req.params.id;
            const {spacesToReduce} = req.body;
            console.log(`Updating spaces for course ID: ${courseId}, Spaces to reduce: ${spacesToReduce}`);

                if (typeof spacesToReduce !== 'number' || spacesToReduce <= 0) {
                    return res.status(400).send('Invalid spaces to reduce');
                }

            try {
                await client.connect();
                const db = client.db("CST3144");
                const coursesCollection = db.collection('course_details');

                const result = await coursesCollection.updateOne(
                    {_id: new ObjectId(courseId)},
                    {$inc: {Spaces: -spacesToReduce}}
                );

                console.log(`Update result:`, result);

                const updatedCourse = await coursesCollection.findOne({ _id: new ObjectId(courseId) });
                console.log(`Updated course details:`, updatedCourse);

                res.status(200).send(updatedCourse);
         
            } catch(error) {
                console.error(`Error updating spaces for course ID: ${courseId}`, error);
                res.status(500).send('Internal server error');
        
            }

        });

        // GET method for search functionality (search as you type)
        app.get('/search', async(req, res) => {
            try {
                console.log('Query parameter:', req.query.query);
                const {query} = req.query;            

                if (!query) {
                    return res.status(400).json({ error: 'Search query is required' });
                }

                await client.connect();
                const db = client.db("CST3144");
                const coursesCollection = db.collection('course_details');       
                
                const results = await coursesCollection.find({
                    $or: [
                        {Subject: {$regex: query, $options: 'i'}},
                        {Location: {$regex: query, $options: 'i'}},
                        {Price: {$regex: query, $options: 'i'}},
                        // {Spaces: {$regex: query, $options: 'i'}}
                    ]
                }).toArray();
                res.json(results);
            } catch (error) {
                console.error("Error fetching search results: ", error);
                res.status(500).json({error: "internal server error"});
            }
        });

            
        app.use(express.json());

        app.listen(PORT, () => console.log('server running'));

    })
    .catch(err => console.error("error connecting to db", err));