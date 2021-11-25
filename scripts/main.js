'use strict'

// Game elements :
const EMPTY = ' ';
const MINE = '💣';
const FLAG = '🚩';

// Timer settings :
var gTimer = null;
var gTimerId = null;
var gStartingTime = null;

var gBoard;

var gLevel = {
    SIZE: 4,
    MINES: 2,
    LIVES: 2
}


var gGame = {
    isOn: false,
    isOver: false,
    shownCount: 0,
    markedCount: 0,
    secsPassed: 0,
    livesCount: 2,
    hintState: false,
    hintsCount: 3
}


function init() {
    resetGame()
    gBoard = buildBoard(gLevel.SIZE);
    renderBoard();
    updateLives();
    updateHints();
}


// Changes the difficulty of the game.
function changeLevel(size, mines, lives) {
    gLevel = {
        SIZE: size,
        MINES: mines,
        LIVES: lives
    }
    init();
}


// Resets the necessary data to start a new game from scratch.
function resetGame() {
    gGame.isOn = false;
    gGame.isOver = false;
    gGame.shownCount = 0;
    gGame.markedCount = 0;
    gGame.secsPassed = 0;
    gGame.livesCount = gLevel.LIVES;
    gGame.hintState = false;
    gGame.hintsCount = 3;
    resetTimer();
    document.querySelector('.restart-btn').innerText = '🙂';
}


// Updates the DOM
function updateHints() {
    var strTEXT = '';
    var elHintsSpan = document.querySelector('.hints-left span');

    if (gGame.hintsCount) {
        for (var i = 0; i < gGame.hintsCount; i++) {
            strTEXT += '💡';
            elHintsSpan.innerText = strTEXT;
        }
    } else elHintsSpan.innerText = '';

}


// Expands all neighbor cells on a click for a few seconds (only when gGame.hintState is true).
function expandShownHint(board, cellRowIdx, cellColIdx) {
    if (!gGame.isOn) return;
    var shownCells = [];
    var shownCellPos = null;

    for (var i = cellRowIdx - 1; i <= cellRowIdx + 1; i++) {
        if (i < 0 || i > board.length - 1) continue;
        for (var j = cellColIdx - 1; j <= cellColIdx + 1; j++) {
            if (j < 0 || j > board[i].length - 1) continue;
            var negCell = board[i][j];
            if (!negCell.isShown) {
                shownCellPos = { i, j };
                shownCells.push(shownCellPos);
                // Update the DOM :
                var className = getClassName({ i, j });
                var elCell = document.querySelector(`.${className}`);
                elCell.classList.remove('hidden');
                elCell.classList.add('shown');
            }
        }
    }
    gGame.hintState = false;
    gGame.isOver = true;
    setTimeout(() => {
        for (var k = 0; k < shownCells.length; k++) {
            var currCellPos = shownCells[k];
            className = getClassName(currCellPos);
            elCell = document.querySelector(`.${className}`);
            elCell.classList.remove('shown');
            elCell.classList.add('hidden');
            gGame.isOver = false;
        }
    }, 1000);
}


// Turns the 'hint state' on, so the next click on a cell will let expandShownHint function run.
function turnHintStateOn() {
    if (!gGame.isOn) return;
    if (gGame.isOver) return;
    if (!gGame.hintsCount) return;
    gGame.hintState = true;
    gGame.hintsCount--;
    updateHints();
}


// Checks how many lives are left for the user and updates DOM accordingly.
function updateLives() {
    var strTEXT = '';
    var elLivesSpan = document.querySelector('.lives-left span');

    if (gGame.livesCount) {
        for (var i = 0; i < gGame.livesCount; i++) {
            strTEXT += '💘';
            elLivesSpan.innerText = strTEXT;
        }
    } else elLivesSpan.innerText = '';

}


// Checks the conditions for finishing the game (both win or loss situations).
function checkGameOver() {
    var elRestartBtn = document.querySelector('.restart-btn');

    // Loss :
    if (gGame.livesCount === 0) {
        // Update the Model :
        gGame.isOver = true;
        // Update the DOM :
        showMines();
        elRestartBtn.innerText = '🤯'
        // Stop the Timer :
        clearInterval(gTimerId);
        console.log('gGame', gGame);
        return;
    }

    // Win :
    if ((gGame.markedCount === gLevel.MINES) && (gGame.shownCount >= (Math.pow(gLevel.SIZE, 2) - gLevel.MINES))) {
        // Update the Model :
        gGame.isOver = true;
        // Update the DOM :
        elRestartBtn.innerText = '😎'
        // Stop the Timer :
        clearInterval(gTimerId);
        console.log('gGame', gGame);
        return;
    }
}


// Shows all mines on the board if the game is over (called inside function checkGameOver()).
function showMines() {
    for (var i = 0; i < gBoard.length; i++) {
        for (var j = 0; j < gBoard.length; j++) {
            var currCell = gBoard[i][j];
            if (currCell.isMine || (currCell.isMine && currCell.isMarked)) {
                // Update the Model :
                currCell.isShown = true;
                // Update the DOM :
                var className = getClassName({ i, j });
                var elCell = document.querySelector(`.${className}`);
                elCell.innerHTML = MINE;
                elCell.classList.remove('hidden');
                elCell.classList.add('shown');
            }
        }
    }
}


// Runs the necessary code on a right-mouse click on a certain cell.
function cellRightClicked(ev, elCell, cellI, cellJ) {
    ev.preventDefault();
    if (gGame.isOver) return;
    if (gGame.hintState) return;
    var currCell = gBoard[cellI][cellJ];
    if (!gGame.isOn) return;
    if (currCell.isShown) return;
    markUnmarkCell(elCell, cellI, cellJ);
    checkGameOver();
}


// Marks or Unmarks a cell.
function markUnmarkCell(elCell, cellI, cellJ) {

    if (!gBoard[cellI][cellJ].isMarked) {
        // Update the Model :
        gBoard[cellI][cellJ].isMarked = true;
        if (gBoard[cellI][cellJ].isMine) gGame.markedCount++;
        // Update the DOM :
        elCell.innerHTML = FLAG;
        elCell.classList.remove('hidden');
    } else {
        // Update the Model :
        gBoard[cellI][cellJ].isMarked = false;
        if (gBoard[cellI][cellJ].isMine) gGame.markedCount--;
        // Update the DOM :
        if (gBoard[cellI][cellJ].isMine) {
            elCell.innerHTML = MINE;
        } else if (gBoard[cellI][cellJ].minesAroundCount) {
            elCell.innerHTML = gBoard[cellI][cellJ].minesAroundCount;
        } else {
            elCell.innerHTML = EMPTY;
        }
        elCell.classList.add('hidden');
    }
}


// Runs the necessary code on a left-mouse click on a certain cell.
function cellClicked(elCell, cellI, cellJ) {
    if (gGame.isOver) return;

    // Initiate game
    var currCell = gBoard[cellI][cellJ];
    if (!gGame.isOn && !currCell.isMarked) gameOn(cellI, cellJ);
    
    if (gGame.hintState) {
        expandShownHint(gBoard, cellI, cellJ);
        return
    }

    // Show cells
    if (!gBoard[cellI][cellJ].isShown && !gBoard[cellI][cellJ].isMarked) {
        // Update the Model:
        currCell.isShown = true;
        gGame.shownCount++;
        // Update the DOM:
        elCell.classList.remove('hidden');
        elCell.classList.add('shown');

        if (currCell.isMine) {
            // Update the Model:
            gGame.livesCount--
            currCell.isMarked = true;
            gGame.markedCount++;
            updateLives();
            checkGameOver();
        }

        if (!currCell.minesAroundCount && !currCell.isMine && !currCell.isMarked) {
            expandShown(gBoard, cellI, cellJ);
            checkGameOver();
        }

        checkGameOver();
    }
}


// Starts the game on the first click.
function gameOn(cellI, cellJ) {
    var firstCell = gBoard[cellI][cellJ];
    // Update the Model :
    gGame.isOn = true;
    firstCell.isShown = true;
    gGame.shownCount++;
    addMines(gBoard, gLevel.MINES, cellI, cellJ);
    setMinesNegsCount(gBoard);
    if (!firstCell.minesAroundCount) expandShown(gBoard, cellI, cellJ);
    // Update the DOM :
    renderBoard();
    // Start the Timer :
    gStartingTime = new Date().getTime();
    gTimerId = setInterval(setTimerUp, 1000);
}


// Expands neighbor cells if the cell that was clicked is empty.
function expandShown(board, cellRowIdx, cellColIdx) {
    for (var i = cellRowIdx - 1; i <= cellRowIdx + 1; i++) {
        if (i < 0 || i > board.length - 1) continue;
        for (var j = cellColIdx - 1; j <= cellColIdx + 1; j++) {
            if (j < 0 || j > board[i].length - 1) continue;
            if (i === cellRowIdx && j === cellColIdx) continue;
            var negCell = board[i][j];
            if (negCell.isMine) continue;
            // Update the Model :
            if (!negCell.isShown) {
                negCell.isShown = true;
                gGame.shownCount++;
                // Update the DOM :
                var className = getClassName({ i, j });
                var elCell = document.querySelector(`.${className}`);
                elCell.classList.remove('hidden');
                elCell.classList.add('shown');
            }
        }
    }
}


// Renders the board according to the model.
function renderBoard() {
    var strHTML = '';

    strHTML += `\n<table>`
    for (var i = 0; i < gBoard.length; i++) {
        strHTML += `\n\t<tr>\n\t`
        for (var j = 0; j < gBoard.length; j++) {
            var cell = gBoard[i][j];
            var cellClass = getClassName({ i, j });
            var cellContent;
            var cellVisibilityClass = (!cell.isShown) ? 'hidden' : 'shown';

            if (cell.isMine) {
                cellContent = MINE;
            } else if (cell.minesAroundCount) {
                cellContent = cell.minesAroundCount;
            } else {
                cellContent = EMPTY;
            }

            strHTML += `<td class="cell ${cellClass} ${cellVisibilityClass}" onclick="cellClicked(this, ${i}, ${j})"  oncontextmenu="cellRightClicked(event, this, ${i}, ${j})">${cellContent}</td>\n`
        }
        strHTML += `</tr>`
    }
    strHTML += `</table>`

    var elBoardContainer = document.querySelector('.board-container');
    elBoardContainer.innerHTML = strHTML;
}


// Returns the class name for a specific cell. location = object like this { i: number, j: number }.
function getClassName(location) {
    var cellClass = 'cell-' + location.i + '-' + location.j;
    return cellClass;
}


// Returns a square matrix with cells of 3 types to render : (1) Mine (2) Integer (3) Empty.
function buildBoard(size) {
    var mat = [];

    for (var i = 0; i < size; i++) {
        mat[i] = [];
        for (var j = 0; j < size; j++) {
            var cell = {
                minesAroundCount: 0,
                isShown: false,
                isMine: false,
                isMarked: false
            }
            mat[i][j] = cell;
        }
    }

    return mat;
}


// Places numbers in the board in cells that have mines as part of their neighbors.
function setMinesNegsCount(mat) {

    for (var i = 0; i < mat.length; i++) {
        for (var j = 0; j < mat.length; j++) {
            var currCell = mat[i][j];
            if (!currCell.isMine) {
                var mineNegsCount = countMineNegs(mat, i, j, true);
                if (mineNegsCount) {
                    mat[i][j].minesAroundCount = mineNegsCount;
                }
            }
        }
    }
}


// Counts how many neighbors a cell has of that neg parameter type (in our case, the argument will be 'true').
function countMineNegs(mat, cellRowIdx, cellColIdx, valueToCheck) {
    var mineNegsCount = 0;

    for (var i = cellRowIdx - 1; i <= cellRowIdx + 1; i++) {
        if (i < 0 || i > mat.length - 1) continue;
        for (var j = cellColIdx - 1; j <= cellColIdx + 1; j++) {
            if (j < 0 || j > mat[i].length - 1) continue;
            if (i === cellRowIdx && j === cellColIdx) continue;
            var negCell = mat[i][j].isMine;
            if (negCell === valueToCheck) {
                mineNegsCount++
            }
        }
    }

    return mineNegsCount;
}


// Places (minesCount) mines at random locations on a mat.
function addMines(mat, minesCount, cellI, cellJ) {
    for (var i = 0; i < minesCount; i++) {
        var emptyCell = getRandomEmptyCell(gBoard, cellI, cellJ);
        mat[emptyCell.i][emptyCell.j].isMine = true;
    }
}


// Returns a random empty cell in a mat as a location object { i, j }.
function getRandomEmptyCell(board, cellI, cellJ) {
    var emptyCells = [];

    for (var i = 0; i < board.length; i++) {
        for (var j = 0; j < board[0].length; j++) {
            if (i === cellI && j === cellJ) continue;
            if (board[i][j].isMine) continue;
            var emptyCellPos = { i, j };
            emptyCells.push(emptyCellPos)
        }
    }
    var randomIdx = getRandomInt(0, emptyCells.length)
    var emptyCell = emptyCells[randomIdx];
    return emptyCell
}


// Stops the timer and resets the necessary variables to be ready for the next run.
function resetTimer() {
    clearInterval(gTimerId);
    // Update the Model :
    gTimer = null;
    gTimerId = null;
    gStartingTime = null;
    // Update the DOM :
    var elTimer = document.querySelector('.timer');
    elTimer.innerHTML = '0';
}


// Sets up and counts the time up in seconds + shows it in the DOM.
function setTimerUp() {
    var now = new Date().getTime();
    gTimer = now - gStartingTime;
    // Update the Model :
    gGame.secsPassed++;
    // Update the DOM :
    var elTimer = document.querySelector('.timer');
    elTimer.innerHTML = `${gGame.secsPassed}`;
}


// Returns a random integer between the min - max range (maximum is exclusive).
function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min) + min);
}