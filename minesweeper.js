const canvas = document.getElementById('minesweeper-game');
const ctx = canvas.getContext('2d');

const fieldSize = {x: 21, y: 13};
let tileSize;
const bombCount = 30;
const field = [];
let gameOver = false;
let victory = false;
const scaleFactor = .5;
let isFirstClick = true;

ctx.scale(canvas.width / fieldSize.x * scaleFactor, canvas.height / fieldSize.y * scaleFactor);

/**
 * Initializes game by creating the game field and setting bombs
 */
function initGame() {
    for(let x = 0; x < fieldSize.x; x++) {
        field.push([]);
        for(let y = 0; y < fieldSize.y; y++) {
            field[x].push({tileValue: 0, clicked: false, flagged: false});
        }
    }

    scaleCanvas();
}

function initBombs(startX, startY) {
    for(let i = 0; i < bombCount; i++) {
        const ranX = Math.floor(Math.random() * fieldSize.x);
        const ranY = Math.floor(Math.random() * fieldSize.y);

        if (ranX === startX || ranX === startX - 1 || ranX === startX + 1 || ranY === startY || ranY === startY - 1 || ranY === startY + 1 || field[ranX][ranY].tileValue === true) {
            i--;
            continue;
        }

        field[ranX][ranY].tileValue = true;
    }

    for(let x = 0; x < fieldSize.x; x++) {
        for (let y = 0; y < fieldSize.y; y++) {
            if (field[x][y].tileValue !== true) {
                field[x][y].tileValue = countBombs(x, y);
            }
        }
    }
}

function drawGrid() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for(let x = 0; x < fieldSize.x; x++) {
        for (let y = 0; y < fieldSize.y; y++) {
            ctx.strokeRect(x * tileSize.x, y * tileSize.y, tileSize.x, tileSize.y);
            if(field[x][y].clicked)
                drawText(x, y);
        }
    }
}

function getSurroundingTiles(x, y) {
    const tiles = {};
    if(x > 0) {
        tiles["left"] = { tileValue: field[x - 1][y], x: x - 1, y: y };
        if(y > 0) {
            tiles["left-top"] = { tileValue: field[x - 1][y - 1], x: x - 1, y: y - 1 };
        }
        if(y < fieldSize.y - 1) {
            tiles["left-bottom"] = { tileValue: field[x - 1][y + 1], x: x - 1, y: y + 1 };
        }
    }
    if(x < fieldSize.x - 1) {
        tiles["right"] = { tileValue: field[x + 1][y], x: x + 1, y: y};
        if(y > 0)
            tiles["right-top"] = { tileValue: field[x + 1][y - 1], x: x + 1, y: y - 1 };
        if(y < fieldSize.y - 1)
            tiles["right-bottom"] = { tileValue: field[x + 1][y + 1], x: x + 1, y: y + 1 };
    }
    if(y > 0)
        tiles["top"] = { tileValue: field[x][y - 1], x: x, y: y - 1 };
    if(y < fieldSize.y - 1)
        tiles["bottom"] = { tileValue: field[x][y + 1], x: x, y: y + 1 };
    return tiles;
}

function countBombs(x, y) {
    const tiles = getSurroundingTiles(x, y);
    return tiles.count(true);
}

function countFlaggedBombs(x, y) {
    const tiles = getSurroundingTiles(x, y);
    return tiles.countFlagged(true);
}

Object.prototype.count = function (val) {
    let counter = 0;
    for(let el in this) {
        if(this.hasOwnProperty(el)) {
            if (val === this[el].tileValue.tileValue) {
                counter++;
            }
        }
    }
    return counter;
};

Object.prototype.countFlagged = function (val) {
    let counter = 0;
    for(let el in this) {
        if(this.hasOwnProperty(el)) {
            if(this[el].tileValue.flagged === val) {
                counter++;
            }
        }
    }
    return counter;
};

function tileClickEvent(x, y) {
    if(gameOver)
        return;
    uncoverTile(x, y);
    if(!field[x][y].flagged && field[x][y].tileValue === true) {
        gameOver = true;
        gameOverEvent();
    }
}

function tileDoubleClick(x, y) {
    if(gameOver)
        return;
    if(field[x][y].clicked && !field[x][y].flagged && countFlaggedBombs(x, y) === field[x][y].tileValue) {
        uncoverSurroundings(x, y);
    }
}

function tileFlag(x, y) {
    if(gameOver)
        return;
    if(field[x][y].clicked && !field[x][y].flagged)
        return;
    field[x][y].flagged = !field[x][y].flagged;
    field[x][y].clicked = field[x][y].flagged;
    ctx.clearRect(x * tileSize.x + (1 / scaleFactor), y * tileSize.y + (1 / scaleFactor), tileSize.x - (2 / scaleFactor), tileSize.y - (2 / scaleFactor));
    drawText(x, y);
}


overlay2Canvas.addEventListener("click", (e) => {
    const pos = getPositon(e);

    if(isFirstClick) {
        initBombs(pos.x, pos.y);
        isFirstClick = false;
    }

    tileClickEvent(pos.x, pos.y);

    victoryCheck();

    clicked(e);
});

overlay2Canvas.addEventListener("dblclick", (e) => {
    const pos = getPositon(e);

    tileDoubleClick(pos.x, pos.y);

    victoryCheck();
});

overlay2Canvas.addEventListener("contextmenu", (e) => {
    e.preventDefault();
    console.log(e);

    const pos = getPositon(e);

    tileFlag(pos.x, pos.y);
});

function getPositon(e) {
    const x = e.x - canvas.offsetLeft;
    const y = e.y - canvas.offsetTop;
    const fieldX = Math.floor(x / tileSize.x);
    const fieldY = Math.floor(y / tileSize.y);

    return {x: fieldX, y: fieldY};
}

function scaleCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    overlayCanvas.width = window.innerWidth;
    overlayCanvas.height = window.innerHeight;

    W = window.innerWidth;
    H = window.innerHeight;

    // tileSize = {x: canvas.width / fieldSize.x, y: canvas.height / fieldSize.y};
    tileSize = {x: 100, y: 100};
    drawGrid();
    if(gameOver) {
        gameOverEvent();
    }
}

function uncoverTile(x, y) {
    if(field[x][y].clicked || field[x][y].flagged) {
        return;
    }
    field[x][y].clicked = true;
    drawText(x, y);
    if(field[x][y].tileValue === true) {
        gameOverEvent();
    }
    if(field[x][y].tileValue === 0) {
        uncoverSurroundings(x, y);
    }
}

function uncoverSurroundings(x, y) {
    const surrounding = getSurroundingTiles(x, y);
    for(let tile in surrounding) {
        if(surrounding.hasOwnProperty(tile)) {
            uncoverTile(surrounding[tile].x, surrounding[tile].y);
        }
    }
}

const colors = {
    1: "blue",
    2: "green",
    3: "red",
    4: "purple",
    5: "yellow",
    6: "pink"
};

function drawText(x, y) {
    ctx.font = "bold 50px Roboto";
    ctx.textAlign = "center";
    if(!field[x][y].flagged && field[x][y].clicked) {
        ctx.fillStyle = "#ddd";
        ctx.fillRect(x * tileSize.x + 1, y * tileSize.y + 1, tileSize.x - 2, tileSize.y - 2);
        if (field[x][y].tileValue !== 0) {
            ctx.fillStyle = colors[field[x][y].tileValue];
            ctx.fillText(field[x][y].tileValue, (x + .5) * tileSize.x, (y + .5) * tileSize.y + 15);
        }
    } else if(field[x][y].flagged) {
        ctx.fillStyle = "red";
        ctx.fillRect(x * tileSize.x + 5 / scaleFactor, y * tileSize.y + 5 / scaleFactor, tileSize.x - 10 / scaleFactor, tileSize.y - 10 / scaleFactor);

        ctx.font = "bold 50px FontAwesome";
        ctx.fillStyle = "white";
        ctx.fillText("", (x + .5) * tileSize.x, (y + .5) * tileSize.y + 15);
    }
}

window.addEventListener("resize", () => {
    scaleCanvas();
});

function gameOverEvent() {
    console.log("Game Over");
    ctx.fillStyle = "orange";
    ctx.fillText("Game Over", canvas.width / 2, canvas.height / 2);
    animateBackground({r: 0, g: 0, b: 0, a: 0}, 0, 0, canvas.width, canvas.height, .75, new Date().getTime(), 2);
    animateText("Game Over", canvas.width / 2, canvas.height / 2, 0, 100, new Date().getTime(), 200);
}

function animateText(text, x, y, curFontSize, finalFontSize, startTime, speed) {
    const time = (new Date()).getTime() - startTime;

    const newFontSize = speed * time / 1000;

    if(newFontSize < finalFontSize) {
        curFontSize = newFontSize;
    } else {
        curFontSize = finalFontSize;
    }

    // drawGrid();
    ctx.fillStyle = "orange";
    ctx.font = "bold " + curFontSize + "px Roboto";
    ctx.fillText(text, x, y);

    requestAnimFrame(function () {
        animateText(text, x, y, curFontSize, finalFontSize, startTime, speed);
    })
}

function animateBackground(color, x, y, width, height, maxOpacity, startTime, speed) {
    const time = (new Date()).getTime() - startTime;

    const newOpacity = speed * time / 1000;

    if(newOpacity <= maxOpacity) color.a = newOpacity;

    drawGrid();
    ctx.fillStyle = "rgba(" + color.r + "," + color.g + "," + color.b + "," + color.a + ")";
    ctx.fillRect(x, y, width, height);

    requestAnimFrame(function () {
        animateBackground(color, x, y, width, height, maxOpacity, startTime, speed);
    });
}

function countClickedTiles() {
    let count = 0;
    for(let x = 0; x < fieldSize.x; x++) {
        for(let y = 0; y < fieldSize.y; y++) {
            if(field[x][y].clicked && !field[x][y].flagged)
                count++;
        }
    }
    return count;
}

function victoryCheck() {
    if(!victory && countClickedTiles() === fieldSize.x * fieldSize.y - bombCount) {
        victory = true;
        victoryEvent();
    }
}

function victoryEvent() {
    console.log("Win!");
    animate();
}

initGame();