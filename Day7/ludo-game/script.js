const gameBoard = document.getElementById("game-board");
const rollBtn = document.getElementById("roll-dice");
const diceText = document.getElementById("dice-value");
const currentPlayerText = document.getElementById("current-player");

const boardSize = 15;
const cellSize = 40;

const players = ["Red", "Green", "Yellow", "Blue"];
let currentPlayerIndex = 0;
let diceValue = 0;
let canMove = false;

const path = [
  [6,1],[6,2],[6,3],[6,4],[6,5],
  [5,6],[4,6],[3,6],[2,6],[1,6],[0,6],
  [0,7],[0,8],
  [1,8],[2,8],[3,8],[4,8],[5,8],
  [6,9],[6,10],[6,11],[6,12],[6,13],[6,14],
  [7,14],
  [8,14],[8,13],[8,12],[8,11],[8,10],[8,9],
  [9,8],[10,8],[11,8],[12,8],[13,8],[14,8],
  [14,7],[14,6],
  [13,6],[12,6],[11,6],[10,6],[9,6],
  [8,5],[8,4],[8,3],[8,2],[8,1],[8,0],
  [7,0]
];

const startIndexes = {
  Red: 0,
  Green: 13,
  Yellow: 26,
  Blue: 39
};

const homePositions = {
  Red: [[1,1],[1,3],[3,1],[3,3]],
  Green: [[1,11],[1,13],[3,11],[3,13]],
  Yellow: [[11,1],[11,3],[13,1],[13,3]],
  Blue: [[11,11],[11,13],[13,11],[13,13]]
};

const tokens = {};

players.forEach(player => {
  tokens[player] = [];

  for(let i=0;i<4;i++) {
    tokens[player].push({
      id: `${player[0]}${i+1}`,
      step: -1
    });
  }
});

function createBoard() {

  gameBoard.style.width = `${boardSize * cellSize}px`;
  gameBoard.style.height = `${boardSize * cellSize}px`;

  for(let r=0;r<boardSize;r++) {

    for(let c=0;c<boardSize;c++) {

      const cell = document.createElement("div");

      cell.classList.add("cell");

      if(r<6 && c<6) cell.classList.add("red-home");
      else if(r<6 && c>8) cell.classList.add("green-home");
      else if(r>8 && c<6) cell.classList.add("yellow-home");
      else if(r>8 && c>8) cell.classList.add("blue-home");
      else if(
        r===6 || r===8 ||
        c===6 || c===8 ||
        (r===7 && c>0 && c<14)
      ){
        cell.classList.add("path");
      }

      gameBoard.appendChild(cell);
    }
  }

  createTokens();
}

function createTokens() {

  players.forEach(player => {

    tokens[player].forEach((token,index)=>{

      const tokenDiv = document.createElement("div");

      tokenDiv.classList.add(
        "token",
        player.toLowerCase()
      );

      tokenDiv.id = token.id;

      tokenDiv.innerText = index+1;

      tokenDiv.addEventListener("click",()=>{
        moveToken(player,token);
      });

      gameBoard.appendChild(tokenDiv);

    });

  });

  updateTokens();
}

function updateTokens() {

  players.forEach(player => {

    tokens[player].forEach((token,index)=>{

      const tokenDiv = document.getElementById(token.id);

      let row,col;

      if(token.step === -1){

        [row,col] = homePositions[player][index];

      } else {

        const actualIndex =
          (startIndexes[player] + token.step) % path.length;

        [row,col] = path[actualIndex];
      }

      tokenDiv.style.left =
        `${col * cellSize + 5}px`;

      tokenDiv.style.top =
        `${row * cellSize + 5}px`;

    });

  });

}

function rollDice() {

  if(canMove) return;

  diceValue = Math.floor(Math.random()*6)+1;

  diceText.innerText = diceValue;

  canMove = true;
}

function moveToken(player,token) {

  if(!canMove) return;

  if(player !== players[currentPlayerIndex]) return;

  if(token.step === -1){

    if(diceValue !== 6) return;

    token.step = 0;

  } else {

    token.step += diceValue;

    if(token.step >= path.length){

      token.step = path.length - 1;

      alert(`${player} completed token!`);
    }
  }

  updateTokens();

  canMove = false;

  if(diceValue !== 6){
    nextTurn();
  }

  diceValue = 0;

  diceText.innerText = "-";
}

function nextTurn(){

  currentPlayerIndex++;

  if(currentPlayerIndex >= players.length){
    currentPlayerIndex = 0;
  }

  currentPlayerText.innerText =
    players[currentPlayerIndex];
}

rollBtn.addEventListener("click",rollDice);

createBoard();

currentPlayerText.innerText =
  players[currentPlayerIndex];