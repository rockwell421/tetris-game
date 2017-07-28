//create the data structure for pieces in a 2 dimensional matrix

//accesses the canvas
const canvas = document.getElementById('tetris');

//get the context to draw
const context = canvas.getContext('2d');

//scales the canvas objects
context.scale(20,20);

//calls the Tetris theme to play
var audio = new Audio('Tetris.mp3');
audio.play();

//this doesn't work right now, but I'm trying to get this SFX to activate when pieces collide
var sfx = new Audio('sfx_sounds_button7.wav');


//Function that checks if any rows are full

function arenaSweep (){
  let rowCount = 1;

  outer: for (let y = arena.length - 1; y > 0; --y) {
    for (let x = 0; x < arena[y].length; ++x) {
      //check if the rows have a 0 in it, if it does, it's not fully populated
      if (arena[y][x] === 0) {
        continue outer;         //JS trick
      }
    }
    const row = arena.splice(y, 1)[0].fill(0);    //takes area row out at index y, fills with 0's, saves the row
    arena.unshift(row);      //puts it on top of the arena
    ++y;

    player.score += rowCount * 10;
    rowCount *= 2;
  }
}

//collision detection function

function collide (arena, player) {

  const [m, o] = [player.matrix, player.pos];   //m is matrix and o is offset
  for (let y = 0; y < m.length; ++y) {          //these iterate over the player
    for (let x = 0; x < m[y].length; ++x) {
      if (m[y][x] !== 0 &&
          (arena[y + o.y] &&
            arena[y + o.y][x + o.x]) !== 0) {
              return true;
            }
        }
    }
    return false;
}


//Add a matrix where you save all of the pieces when they stop

function createMatrix(w, h) {
  const matrix = [];
  while (h--) {                       //height is not 0, decrease height by 1
    matrix.push(new Array(w).fill(0));
  }
  return matrix;
}

//creates the 7 Tetris pieces via the matrix

function createPiece (type) {
  if (type === 'T'){
    return [
      [0, 0, 0],
      [1, 1, 1],
      [0, 1, 0],
    ];
  } else if (type === 'O') {
    return [
      [2, 2],
      [2, 2],
    ];
  } else if (type === 'L') {
    return [
      [0, 3, 0],
      [0, 3, 0],
      [0, 3, 3],
    ];
  } else if (type === 'J') {
    return [
      [0, 4, 0],
      [0, 4, 0],
      [4, 4, 4],
    ];
  } else if (type === 'I') {
    return [
      [0, 5, 0, 0],
      [0, 5, 0, 0],
      [0, 5, 0, 0],
    ];
  } else if (type === 'S') {
    return [
      [0, 6, 6],
      [6, 6, 0],
      [0, 0, 0],
    ];
  } else if (type === 'Z') {
    return [
      [7, 7, 0],
      [0, 7, 7],
      [0, 0, 0],
    ];
  }
}


//function draws the canvas
function draw() {
  context.fillStyle = '#000';
  context.fillRect(0,0,canvas.width,canvas.height);

  drawMatrix(arena, {x: 0, y: 0});
  drawMatrix(player.matrix, player.pos);
}

function drawMatrix(matrix, offset) {
      matrix.forEach((row,y) => {
      row.forEach((value, x) => {
        if (value !== 0) {        //values of 0 are to be skipped
          context.fillStyle= colors[value];
          //offset parameter allows you to move the piece later
          context.fillRect(x + offset.x,
                            y + offset.y,
                            1, 1);
        }
      });
    })
}

//copies all of the values of the player in the arena at the correct position

function merge(arena, player) {
  player.matrix.forEach((row, y) => {
    row.forEach((value, x) => {
      if (value !== 0) {
        arena[y + player.pos.y][x + player.pos.x] = value;
      }
    });
  });
}


//these functions move the pieces down

function playerDrop() {
  player.pos.y++;
  if (collide(arena, player)) { //it means that the player is touching the ground or another piece
    player.pos.y--;
    merge(arena, player);
    playerReset();
    arenaSweep();
    updateScore();
  }
  dropCounter = 0;
}

//moves the player and sets the directions and constrains your moves to inside the canvas

function playerMove(dir) {
  player.pos.x += dir;
  if (collide(arena, player)) {
    player.pos.x -= dir;         //this allows us to move back
  }
}

//randomly sets the new pieces and assigns them to the middle of the arena when resetting

function playerReset () {
  const pieces = 'ILJOTSZ';
  player.matrix = createPiece(pieces[pieces.length * Math.random() | 0]);
  player.pos.y = 0;
  player.pos.x = (arena[0].length / 2 | 0) -
                  (player.matrix[0].length / 2 | 0);

  if(collide(arena, player)) {
    arena.forEach(row => row.fill(0));         //clears the arena if it gets filled with pieces
    player.score = 0;
    updateScore();
  }
}


//sets up the rotation and the offsets that keep the player rotation within the arena- it adds or subtracts an offset in order to do this

function playerRotate(dir) {
  const pos = player.pos.x;
  let offset = 1;

  rotate(player.matrix, dir);
  while (collide(arena, player)) {
    player.pos.x += offset;
    offset = -(offset + (offset > 0 ? 1 : -1));

    if (offset > player.matrix[0].length) {  //this cancels the offset if it's not needed
      rotate(player.matrix, -dir);          //rotates back
      player.pos.x = pos;                   //resets the offset
      return;
    }
  }
}


/*Rotation function ; this will switch the index positions of our matrix and reverse them in order to enable a full 360 rotation
*/
function rotate(matrix, dir) {
  for (let y = 0; y < matrix.length; ++y) {
    for (let x = 0; x < y; ++x) {
      [
        matrix[x][y],
        matrix[y][x],
      ] = [
        matrix[y][x],
        matrix[x][y],
      ];
    }
  }
  // condition for direction if it's -1 or 1
  if(dir > 0) {
    matrix.forEach(row => row.reverse());
  } else {
    matrix.reverse();
  }
}

let dropCounter = 0;
let dropInterval = 1000; //milliseconds

let lastTime = 0;

function update (time = 0) {
  const deltaTime = time - lastTime;
  lastTime = time;

  dropCounter += deltaTime;
  if (dropCounter > dropInterval) {
    playerDrop();
  }
      draw();
      requestAnimationFrame(update);
    }

function updateScore () {
  document.getElementById('score').innerText = player.score;
}

const colors = [
  null,
  '#FF0D72',
  '#0DC2FF',
  '#0DFF72',
  '#F538FF',
  '#FF8E0D',
  '#FFE138',
  '#3877FF',
];

const arena = createMatrix(12,20);

const player = {
  pos: {x: 0, y: 0},
  matrix: null,
  score: 0,
}

//keyboard controls

document.addEventListener('keydown', event => {
  if (event.keyCode === 37) {
    playerMove(-1);
  } else if (event.keyCode === 39) {
    playerMove(1);
  } else if (event.keyCode === 40) {
    playerDrop();
  } else if (event.keyCode === 81) {
    playerRotate(-1);
  } else if (event.keyCode === 87) {
    playerRotate(1);
  }
});


playerReset();
updateScore();
update();
