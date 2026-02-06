// after doing some research on how i would be able to have my server identify each drawing, i learned about the 
// javascript split method, i realised this is perfect for my website as i can use it to isolate the drawings by id numbers
// which appear in the url and then split that url to get the id and put it in an array so i can easily use the fetch function
// to get the server to return it back to me. i learnt how to build this block through this youtube tutorial - https://www.youtube.com/watch?v=OxyGb107KFg
// i also looked through https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/split and https://www.w3schools.com/jsref/jsref_split.asp
// to understand better what it can do to ensure i can use it for my task
const URL = window.location.href;
const splitURL = URL.split('id=');
const drawingID = splitURL[1];

const container = document.getElementById('puzzle-container');

// to break the drawing into pieces like i inteded so it makes the puzzle i used the following logic
// i created an object array to defined each section of the puzzle into where it will sit in the puzzle (4 piece puzzle for now)
// then i worked on doing the maths to decide where it will lock in, making it 4 pieces enabled for me to 
// continue with the other parts as the math became confusing when more pieces are added, esspecially uneven numbers 
// and i didnt want to waste time on this step for too long. the confusing part was working out the drawview 
// coordinates which made sure the piece that is placed, matches the drawing
const piecesOfPuzzle = [
    { id: 'top-left', lockinX: 0, lockinY: 0, drawingViewX: '0px', drawingViewY: '0px' },
    { id: 'top-right', lockinX: 200, lockinY: 0, drawingViewX: '-200px', drawingViewY: '0px' },
    { id: 'bottom-left', lockinX: 0, lockinY: 200, drawingViewX: '0px', drawingViewY: '-200px' },
    { id: 'bottom-right', lockinX: 200, lockinY: 200, drawingViewX: '-200px', drawingViewY: '-200px' }
];

// i used a the fetch API because it works perfectly for requesting the drawingID i created above with the split url function
// i noticed how good the fetch .then flow works to have the server request the id and then have the server respond using the json call
// resources i used to build this logic - https://developer.mozilla.org/en-US/docs/Web/API/Window/fetch and https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch
fetch('/api/puzzles/' + drawingID)
    .then(function (serverResponse) {
        return serverResponse.json();
    })
    .then(function (submittedDrawing) {
        // taking the data of the submitted drawing by calling image (this takes the Base64 string) to turn it into the function for creating the puzzle
        createPuzzlePieces(submittedDrawing.image);
    })
    .catch(function (error) {
        console.log("drawing didnt load:", error);
    }); // using for reference if this doesnt work

// building the puzzle pieces now
function createPuzzlePieces(drawing) {
    // i use a foreach loop here because it enables me to define the universal logic for the puzzle pieces array without needing to write it 
    // for each individual piece, i learned this concept and method in my SIT771 object oriented development class and it proved really useful here
    container.innerHTML = '';

    piecesOfPuzzle.forEach(function (puzzlePieceData) {
        const piece = document.createElement('div');
        piece.className = 'piece';
        piece.id = puzzlePieceData.id;

        // to effectivly be able to break up each part of the drawing to showcase the part it represents like the top left piece or top right, 
        // i call the drawing to the url so it knows to draw the submitted drawing that was fetched by the fetch method above
        piece.style.backgroundImage = 'url(' + drawing + ')';
        piece.style.backgroundPosition = puzzlePieceData.drawingViewX + ' ' + puzzlePieceData.drawingViewY; // by using string computation here i can get the specific piece to 
        // be defined by the drawing view which pushes the full drawing outside of the window view to show only the area i defined in the object array

        // i use math.random to randomise the position for the pieces to be spread around the screen to ensure it splits them up and doesnt just make them apear already as the full drawing
        let startX = Math.random() * (window.innerWidth - 500); // subtracting 250 because that is the size of the piece, otherwise it might spawn outside the right edge of web page
        let startY = Math.random() * (window.innerHeight - 500); // subtracting 250 because that is the size of the piece, otherwise it might spawn outside the bottom edge of web page

        startX = Math.max(50, startX);
        startY = Math.max(100, startY);

        piece.style.transform = 'translate(' + startX + 'px, ' + startY + 'px)'; // using the CSS inline transform method to randomise the initial piece positioning on the web page
        // i used mozilla for reference on how to actually do this - https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/transform-function/translate
        piece.setAttribute('puzzlePiecePositionX', startX);
        piece.setAttribute('puzzlePiecePositionY', startY);

        container.appendChild(piece); // renders the piece onto the web page
    });
}

// to create the logic for the mouse to be able to actually drag and drop the puzzle pieces anywhere on the page, i used the interact.js because it gives better performance 
// for this task, this is what i mentioned when explaining my idea for the new features to use
interact('.piece').draggable({
    listeners: {
        move: function (mouseDrag) {
            const selectedPuzzlePiece = mouseDrag.target;

            // here i use maths to enable the puzzle piece to be dragged, by using selectedpuzzlepiece.getattribute i am locating the current position of the puzzle piece
            // then i use + mousedrag.dx and mousedrag.dy to update the movement of the piece from its original position since being created or since i moved it last
            let x = (parseFloat(selectedPuzzlePiece.getAttribute('puzzlePiecePositionX')) || 0) + mouseDrag.dx;
            let y = (parseFloat(selectedPuzzlePiece.getAttribute('puzzlePiecePositionY')) || 0) + mouseDrag.dy;

            // here i am using the transform translate to actually update the new position based off the above calculations
            selectedPuzzlePiece.style.transform = 'translate(' + x + 'px, ' + y + 'px)';
            selectedPuzzlePiece.setAttribute('puzzlePiecePositionX', x);
            selectedPuzzlePiece.setAttribute('puzzlePiecePositionY', y);

            // this is the trigger for the piece lock in logic i define below when the piece goes within the radius of its intended location it will lock into place
            pieceLockIn(selectedPuzzlePiece, x, y);
        }
    }
});

function pieceLockIn(piece, x, y) {
    // I use let here because I need to assign the correct data to this variable later
    let targetLocation = null;

    // i use a for loop here because it makes it easy to cycle through the object array of the puzzle pieces so that i can define the logic for them using the below maths
    for (let i = 0; i < piecesOfPuzzle.length; i++) {
        if (piecesOfPuzzle[i].id === piece.id) {
            targetLocation = piecesOfPuzzle[i];
        }
    }

    // using the pythagorean therom maths to determine the distance of the piece from the correct space i defined in the object array
    const distance = Math.sqrt(Math.pow(x - targetLocation.lockinX, 2) + Math.pow(y - targetLocation.lockinY, 2));

    // i wanted to give some distance from the specific correct destination for the piece otherwise it wuold be very hard to actually get it to snap into place
    // i gave it a distance of 25 pixels as the radius for the snapping to work
    if (distance < 25) {
        piece.style.transform = 'translate(' + targetLocation.lockinX + 'px, ' + targetLocation.lockinY + 'px)';
        piece.style.border = "none";

        piece.setAttribute('puzzlePiecePositionX', targetLocation.lockinX);
        piece.setAttribute('puzzlePiecePositionY', targetLocation.lockinY);

        // this locks the piece into its position and stops it from being draggable
        interact(piece).unset();
    }
}


// here i call the route for bookmarks
function saveToBookmarks() {
    fetch('/api/puzzles/' + drawingID + '/bookmark', { 
        method: 'PATCH' 
    })
    .then(function(response) {
        return response.json();
    })
}