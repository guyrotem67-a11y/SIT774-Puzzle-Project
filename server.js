const express = require('express');
const path = require('path');
// I am importing the NeDB library to build the permanent storage system in the server by using the Datastore tool
// i used the seald-io version as it was more secure for my computer
const Datastore = require('@seald-io/nedb');

const app = express();
const PORT = 3000;

// here i use the express.json tool to allow the server to read the drawing data that gets sent from the front page of website
// i limited it to 5mb because it needed to be big enough to read the entire Base64 string of the image
app.use(express.json({ limit: '5mb' }));

// i createdd a database to strore each drawing that is submitted 
// for this database i use Datastore from the NeDB library to create the physical file named below
// this allows the drawing to be saved permanently
const db = new Datastore({ filename: 'puzzles.db', autoload: true });

// here i am creating the link between the public folder that holds all my static front end files
// allowing the browser to automatically load all of them
app.use(express.static('public'));

// app.use function here tells the server to go into the uploads folder when looking for its file
// __dirname is used to ensure no matter where this program is run, for example on a different
// computer with different folder stucture, it ensures the server knows to look at the current folder this file is in
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// this is the route that saves the data into the database so we can access the drawing in our puzzle page
app.post('/api/puzzles', function (request, response) {
    let newPuzzle = {
        image: request.body.image, 
        title: request.body.title || "My Drawing",
        date: new Date(),
        bookmarks: 0
    };

    // db.insert allows me to save the puzzle object in the database, this allows for me to start accessing it
    db.insert(newPuzzle, function (err, savedDoc) {
        if (err) {
            response.status(500).send("Could not save to database");
        } else {
            response.status(201).send(savedDoc);
        }
    });
});

// app.get route that finds all the puzzles within the database, i use this for being able to show the booklisted puzzles on the index.html page
app.get('/api/puzzles', function (request, response) {
    db.find({}, function (err, allPuzzles) { // using db.find because it lets me go into the database and find the puzzles
        if (err) {
            console.error("Database error:", err);
            response.status(500).send("no puzzles found!");
        } else {
            response.json(allPuzzles);
        }
    });
});

// using db findone to look for a specific puzzle by its ID to then be able to use it for the puzzle.html page
app.get('/api/puzzles/:id', function (req, res) {
    let puzzleId = req.params.id;
    db.findOne({ _id: puzzleId }, function (err, foundPuzzle) {
        res.json(foundPuzzle);
    });
});

// this route allows for a book mark to be created and displayed 
app.patch('/api/puzzles/:id/bookmark', function (req, res) {
    const puzzleId = req.params.id;
    // I use $inc to increase the bookmark count
    db.update({ _id: puzzleId }, { $inc: { bookmarks: 1 } }, {}, function () {
        res.json({ success: true, message: "puzzle bookmarked" });
    });
});

// creating a route for a counter of total puzzles in database
app.get('/api/stats', function (req, res) {
    db.count({}, function (err, total) {
        res.json({ totalPuzzles: total, status: "Active" });
    });
});

app.delete('/api/puzzles/:id', function (req, res) {
    // taking the ID from the url as arranged in puzzle.js
    const puzzleId = req.params.id;

    // to delete a puzzle we use puzzleID so it can effectivly get the correct puzzle
    db.remove({ _id: puzzleId }, {}, function (err, numRemoved) {
        if (err) {
            res.status(500).send("Could not delete from database");
        } else {
            // sending a message back to show browser the delete is successful
            res.json({ message: "Successfully deleted", count: numRemoved });
        }
    });
});

// a check 
app.get('/connectedServer', function (req, res) {
    res.send("Server is running!");
});


app.listen(PORT, function () {
    console.log("Server started on port http://localhost:3000");
});