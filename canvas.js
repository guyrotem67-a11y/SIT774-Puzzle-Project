// here i am pulling the canvas element defined in the index.html file
const canvas = document.getElementById('Canvas');
// this is important as it is bringing in the new Canvas API tool
// this allows for me to draw on a 2D scale
const ctx = canvas.getContext('2d');
// defining the submit and clear button to determine its logic below
const submitBtn = document.getElementById('submitBtn');
const clearBtn = document.getElementById('clearBtn');

let drawing = false; // here i define a current state variable type that recognises if the mouse is pressed or not

// ctx is the command used for the canvas API, linewidth determines the thickness of the line drawn
ctx.lineWidth = 4;
// lineCap - round allows for the line ends to be round not squared 
ctx.lineCap = 'round';
// stroke style allows me to define the colour, for now just using black to showcase in the demo
ctx.strokeStyle = '#000';

canvas.onmousedown = function (event) {
    // by setting drawing to true, it tells the server that when the mouse is pressed down, begin to draw
    drawing = true;

    // this starts the drawing as soon as the mouse down function is determined true
    ctx.beginPath();

    // using this calculation, it gets the dot to appear where the mouse is clicked
    const canvasPosition = canvas.getBoundingClientRect();
    ctx.moveTo(event.clientX - canvasPosition.left, event.clientY - canvasPosition.top);
};

// using window instead of canvas here ensures that the server knows I want to stop drawing when the mouse button is not being pressed
// even if the mouse is outside of the canvas while is pressed and unpressed 
window.onmouseup = function () {
    // false tells the server to stop drawing
    drawing = false;
};

// we are creating another function to allow for the user to draw within the canvas
canvas.onmousemove = function (event) {

    // making sure the server knows only to draw when this is true, like the block above
    if (drawing === true) {

        // here i use a new tool from the Canvas API
        // the getBoundingClientRect tool is used here to locate the exact location of the canvas on the screen
        // this is used to ensure the mouse positioning can be defined and recognised within the canvas parameteres
        const canvasPosition = canvas.getBoundingClientRect();

        // here i calculated the X and Y coordinates of the mouse
        // by subtracting it from the canvas position left and top it allowed for
        // the local co-ordinates of the mouse to be considered within the canvas space, not the entire window
        // this is done to enable me to use those co-ordinates to complete this function and have the line follow
        // the mouse
        const mouseX = event.clientX - canvasPosition.left;
        const mouseY = event.clientY - canvasPosition.top;

        // after i defined the coordinants of the mouse, i use canvas API lineTo to draw the line where the new coordinates are
        ctx.lineTo(mouseX, mouseY);

        // ctx.stroke tells server to draw the line (whatever colour it is, i chose black for this example)
        ctx.stroke();

        // begin path starts the new stroke, and moveTo tells the line to follow where the mouse moves around the canvas
        ctx.beginPath();
        ctx.moveTo(mouseX, mouseY);
    }
};


clearBtn.onclick = function () {
    // clearRect is another new canvas API tool that allows for the (0, 0, 400, 400) space of the canvas to be cleared back to empty
    ctx.clearRect(0, 0, 400, 400);
};

// bellow is really important as it allows for the image the user draws on the canvas to be saved
// and sent back to the server under the defined image label and drawingFile name 'drawing.png'

// funciton for the submit button
submitBtn.onclick = function () {

    // here i use the canvas API tool toDataURL to turn the drawing into a Base64 String which is a 
    // text only representation that allows for JSON to read it
    const drawingAsText = canvas.toDataURL('image/png');

    const userTitle = document.getElementById('puzzleTitle').value;

    // because i added a feature to name your drawing, i created a JSON object that holds the data
    // this allows me to send the metadata of the drawing with the Base64 image String
    const drawingPackage = {
        title: userTitle || "My Drawing",
        image: drawingAsText,
        createdAt: new Date().toISOString(), // toISOString convers the date to a universal string format allowing any database or computer to understand it without other time zones affecting it
        bookmarks: 0
    };

    // i use the '/api/puzzles' route here with the fetch function to send this JSON to the server
    fetch('/api/puzzles', {
        method: 'POST',
        headers: {
            // the server needs to know i am sending JSON data otherwise it will not read it
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(drawingPackage) // the JSON objected created above is now turned into a string that can be read by the server
    })
        // .then continues the flow of this sequence of events
        .then(function (response) {
            return response.json(); // i wait for the server to give a JSON response
        })
        .then(function (data) {
            // the server sends back a unique ID for the drawing after it saved it into the database
            console.log("drawing sent from database successfuly for id:", data._id);

            // to ensure the user gets the drawing they just submitted as the puzzle they need to put together in the next page
            // i use the window.location.href to call the puzzle.html page and + data._id to ensure it brings that drawing from the database
            window.location.href = "puzzle.html?id=" + data._id;
        })
        .catch(function (error) {
            // throwing a catch that returns an error if the above sequence failed to work so i know if my logic is wrong, this
            // helped me when writing this because i wasnt getting the data to return properly so i made a error for myself
            // i was going to remove this but thought it shows my progress so i kept it
            console.error(error);
            alert("failed to save to the database");
        });
};

// for the bookmark logic
// This function runs when the home page opens
window.onload = function () {
    // 1. Get all the data from the server
    fetch('/api/puzzles')
        .then(function (res) { return res.json(); })
        .then(function (data) {
            // Call our helper function to show the bookmarks
            showBookmarks(data);
        });
    // fetching the number of puzzles in the database to showcase in index.html
    fetch('/api/stats')
        .then(function (response) {
            return response.json();
        })
        .then(function (data) {
            // updating the number in index.html with countspan
            const totalCount = document.getElementById('puzzle-count');
            totalCount.innerHTML = data.totalPuzzles;
        });
    // this function turns the disconnected grey text to green server is running text once the server is connceted
    //i wanted to add this to indicate that the sever is up and running
    fetch('/connectedServer')
        .then(function (response) {
            return response.text();
        })
        .then(function (message) {
            let connectionStatus = document.getElementById('server-message');
            connectionStatus.innerHTML = message;
            connectionStatus.style.color = "green";
        });
};

// here i create a function to build the bookmark list from the saved book mark on the puzzle page, this will appear on the index page
function showBookmarks(allPuzzles) {
    const list = document.getElementById('bookmark-list');

    // Clear the list first so it doesn't double up every time the page loads
    list.innerHTML = '';

    // using a for loop because it makes it easy to add more bookmarks using the same logic
    for (let i = 0; i < allPuzzles.length; i++) {
        let p = allPuzzles[i];

        // this if statement makes sure that its only shown if at least 1 bookmark is saved
        if (p.bookmarks > 0) {
            const item = document.createElement('div');
            item.className = "p-2 border bg-white shadow-sm"; // Added shadow for a better look
            item.style.width = "150px";

            // creating the div styling and img source if the bookmark card created
            item.innerHTML = '<img src="' + p.image + '" style="width:100%">' +
                '<p class="small mb-1">' + p.title + '</p>' +
                '<button class="btn btn-sm btn-primary" onclick="goToPuzzle(\'' + p._id + '\')">Play</button>' +
                '<button class="btn btn-sm btn-danger" onclick="deleteBookmark(\'' + p._id + '\')">Remove</button>';

            // appendChild allows for the bookmark list to add more bookmark cards
            list.appendChild(item);
        }
    }
}

// i added this function to allow for the server to delete the bookmark when the button is pressed
function deleteBookmark(id) {
    // i added a confirmation pop up in case a user accidently clicks delete and they didnt want to actually delete it
    const confirmDeleted = confirm("Do you want to delete this bookmark?");

    if (confirmDeleted === true) {
        // using delete method from server.js
        fetch('/api/puzzles/' + id, {
            method: 'DELETE'
        })
            .then(function () {
                // Once the server finishes deleting, I refresh the page to update the gallery
                window.location.reload();
            });
    }
}

// takes user to the puzzle page
function goToPuzzle(id) {
    window.location.href = 'puzzle.html?id=' + id;
}

