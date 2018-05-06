const canvas = document.getElementById('minesweeper-game');
const ctx = canvas.getContext('2d');

const fieldSize = {x: 15, y: 10};
let tileSize;
const bombCount = 25;
const field = [];
let gameOver = false;
let victory = false;
const scaleFactor = .5;
let isFirstClick = true;

/**
 * Defines all possible colors for the tile numbers
 * @type {{ 1: string, 2: string, 3: string, 4: string, 6: string }}
 */
const colors = {
    1: "blue",
    2: "green",
    3: "red",
    4: "purple",
    5: "yellow",
    6: "pink"
};

ctx.scale(canvas.width / fieldSize.x * scaleFactor, canvas.height / fieldSize.y * scaleFactor);

function animateBackground(x, y, width, height, curOpacity, finalOpacity, startTime, duration, color) {
    const time = (new Date()).getTime() - startTime;

    if (curOpacity >= finalOpacity)
        return;

    const newOpacity = easeInOutCubic(time, 0, finalOpacity, duration);

    console.log(newOpacity, finalOpacity, color);

    if (newOpacity <= finalOpacity)
        curOpacity = newOpacity;
    else
        curOpacity = finalOpacity;

    color.a = curOpacity;

    overlay2Ctx.clearRect(x, y, width, height);
    overlay2Ctx.fillStyle = "rgba(" + color.r + "," + color.g + "," + color.b + "," + color.a + ")";
    overlay2Ctx.fillRect(x, y, width, height);

    requestAnimFrame(function () {
        animateBackground(x, y, width, height, curOpacity, finalOpacity, startTime, duration, color);
    });
}

function animateTile(x, y, curWidth, curHeight, finalWidth, finalHeight, curRadius, finalRadius, startTime, duration, color) {
    const time = (new Date()).getTime() - startTime;

    if (curWidth === finalWidth && curHeight === finalHeight && curRadius === finalRadius)
        return;

    const newWidth = easeInOutCubic(time, 0, finalWidth, duration);
    const newHeight = easeInOutCubic(time, 0, finalHeight, duration);
    const newRadius = easeInOutCubic(time, 0, finalRadius, duration);

    if (newWidth < finalWidth)
        curWidth = newWidth;
    else
        curWidth = finalWidth;

    if (newHeight < finalHeight)
        curHeight = newHeight;
    else
        curHeight = finalHeight;

    if (newRadius < finalRadius)
        curRadius = newRadius;
    else
        curRadius = finalRadius;

    drawRoundedRect(ctx, x + 1, y + 1, finalWidth - 2, finalHeight - 2, finalRadius, "#2e8cdd");

    drawRoundedRect(ctx, x + (finalWidth - curWidth) / 2, y + (finalHeight - curHeight) / 2, curWidth, curHeight, curRadius, color);

    requestAnimFrame(() => {
        animateTile(x, y, curWidth, curHeight, finalWidth, finalHeight, curRadius, finalRadius, startTime, duration, color);
    });
}

function animateText(text, x, y, curFontSize, finalFontSize, startTime, duration, color, font, context) {
    const time = (new Date()).getTime() - startTime;

    if (context === undefined)
        context = ctx;

    if (curFontSize === finalFontSize)
        return;

    const newFontSize = easeInOutCubic(time, 0, finalFontSize, duration);

    if (newFontSize < finalFontSize) {
        curFontSize = newFontSize;
    } else {
        curFontSize = finalFontSize;
    }

    if (font === undefined)
        font = "Roboto";

    context.fillStyle = color;
    context.font = "bold " + curFontSize + "px " + font;
    context.textAlign = "center";
    context.fillText(text, x, y + tileSize.y * .5 + curFontSize * .33);

    requestAnimFrame(function () {
        animateText(text, x, y, curFontSize, finalFontSize, startTime, duration, color, font, context);
    });
}

function countClickedTiles() {
    let count = 0;
    for (let x = 0; x < fieldSize.x; x++) {
        for (let y = 0; y < fieldSize.y; y++) {
            if (field[x][y].clicked && !field[x][y].flagged)
                count++;
        }
    }
    return count;
}

function countBombs(x, y) {
    const tiles = getSurroundingTiles(x, y);
    return tiles.count(true);
}

function countFlaggedBombs(x, y) {
    const tiles = getSurroundingTiles(x, y);
    return tiles.countFlagged(true);
}

function drawGrid(animations = true) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let x = 0; x < fieldSize.x; x++) {
        for (let y = 0; y < fieldSize.y; y++) {
            drawTile(x, y, animations);
        }
    }
}

function drawRoundedRect(context, x, y, w, h, r, color) {
    context.fillStyle = color;
    context.beginPath();
    context.moveTo(x + r, y);

    context.arcTo(x + w, y, x + w, y + h, r);
    context.arcTo(x + w, y + h, x, y + h, r);
    context.arcTo(x, y + h, x, y, r);
    context.arcTo(x, y, x + w, y, r);

    context.closePath();
    context.fill();
}

function drawTile(x, y, animations = true) {
    const fontSize = tileSize.y * scaleFactor;
    ctx.textAlign = "center";
    let duration = 150;
    if (!animations)
        duration = 0;

    if (!field[x][y].flagged && field[x][y].clicked) {
        animateTile(x * tileSize.x + .1 * tileSize.x, y * tileSize.y + .1 * tileSize.y,
            0, 0,
            tileSize.x - (.2 * tileSize.x), tileSize.y - (.2 * tileSize.y),
            0, tileSize.x * .1,
            new Date().getTime(), duration, "#ddd");
        if (field[x][y].tileValue !== 0) {
            animateText(field[x][y].tileValue, (x + .5) * tileSize.x, y * tileSize.y, 0, fontSize, new Date().getTime(), duration, colors[field[x][y].tileValue]);
        }
    } else if (field[x][y].flagged) {
        animateTile(x * tileSize.x + .1 * tileSize.x, y * tileSize.y + .1 * tileSize.y,
            0, 0,
            tileSize.x - (.2 * tileSize.x), tileSize.y - (.2 * tileSize.y),
            0, tileSize.x * .1,
            new Date().getTime(), duration, "#ff0000");

        animateText("", (x + .5) * tileSize.x, y * tileSize.y, 0, fontSize, new Date().getTime(), duration, "white", "FontAwesome");
    } else {
        drawRoundedRect(ctx, x * tileSize.x + (.1 * tileSize.x), y * tileSize.y + (.1 * tileSize.y), tileSize.x - (.2 * tileSize.x), tileSize.y - (.2 * tileSize.y), tileSize.x * .1, "#2e8cdd");
    }
}

function easeInOutCubic(t, b, c, d) {
    t /= d;
    t--;
    return c * (Math.pow(t, 3) + 1) + b;
}

function gameOverEvent() {
    console.log("Game Over");
    animateBackground(0, 0, canvas.width, canvas.height, 0, .75, new Date().getTime(), 200, {r: 0, g: 0, b: 0, a: 0});
    animateText("Game Over", canvas.width / 2, canvas.height / 2, 0, tileSize.y * 1.33, new Date().getTime(), 200, "orange", "Roboto", overlay2Ctx);
}

function getPositon(e) {
    const x = e.x - canvas.offsetLeft - offsetX * scaleFactor;
    const y = e.y - canvas.offsetTop - offsetY * scaleFactor;
    console.log(x, y);
    const fieldX = Math.floor(x / tileSize.x);
    const fieldY = Math.floor(y / tileSize.y);
    console.log(fieldX, fieldY);

    return {x: fieldX, y: fieldY};
}

function getSurroundingTiles(x, y) {
    const tiles = {};
    if (x > 0) {
        tiles["left"] = {tileValue: field[x - 1][y], x: x - 1, y: y};
        if (y > 0) {
            tiles["left-top"] = {tileValue: field[x - 1][y - 1], x: x - 1, y: y - 1};
        }
        if (y < fieldSize.y - 1) {
            tiles["left-bottom"] = {tileValue: field[x - 1][y + 1], x: x - 1, y: y + 1};
        }
    }
    if (x < fieldSize.x - 1) {
        tiles["right"] = {tileValue: field[x + 1][y], x: x + 1, y: y};
        if (y > 0)
            tiles["right-top"] = {tileValue: field[x + 1][y - 1], x: x + 1, y: y - 1};
        if (y < fieldSize.y - 1)
            tiles["right-bottom"] = {tileValue: field[x + 1][y + 1], x: x + 1, y: y + 1};
    }
    if (y > 0)
        tiles["top"] = {tileValue: field[x][y - 1], x: x, y: y - 1};
    if (y < fieldSize.y - 1)
        tiles["bottom"] = {tileValue: field[x][y + 1], x: x, y: y + 1};
    return tiles;
}

/**
 * Initializes game by creating the game field and setting bombs
 */
function initGame() {
    for (let x = 0; x < fieldSize.x; x++) {
        field.push([]);
        for (let y = 0; y < fieldSize.y; y++) {
            field[x].push({tileValue: 0, clicked: false, flagged: false});
        }
    }

    scaleCanvas();
}

function initBombs(startX, startY) {
    for (let i = 0; i < bombCount; i++) {
        const ranX = Math.floor(Math.random() * fieldSize.x);
        const ranY = Math.floor(Math.random() * fieldSize.y);

        if (ranX === startX || ranX === startX - 1 || ranX === startX + 1 || ranY === startY || ranY === startY - 1 || ranY === startY + 1 || field[ranX][ranY].tileValue === true) {
            i--;
            continue;
        }

        field[ranX][ranY].tileValue = true;
    }

    for (let x = 0; x < fieldSize.x; x++) {
        for (let y = 0; y < fieldSize.y; y++) {
            if (field[x][y].tileValue !== true) {
                field[x][y].tileValue = countBombs(x, y);
            }
        }
    }
}

function scaleCanvas() {
    tileSize = {x: window.innerWidth / fieldSize.x * .9 / scale, y: window.innerWidth / fieldSize.x * .9 / scale};

    W = fieldSize.x * tileSize.x;
    H = fieldSize.y * tileSize.y;

    console.log(canvas);

    canvas.width = W;
    canvas.height = H;
    overlayCanvas.width = W;
    overlayCanvas.height = H;
    overlay2Canvas.width = W;
    overlay2Canvas.height = H;

    offsetX = -W * scale * 10;
    offsetY = -H * scale * 10;

    initBalls();

    drawGrid(false);
    applyScaling();
    if (gameOver) {
        gameOverEvent();
    } else if (victory) {
        victoryEvent();
    }
}

function tileClickEvent(x, y) {
    if (gameOver)
        return;
    uncoverTile(x, y);
    if (!field[x][y].flagged && field[x][y].tileValue === true) {
        gameOver = true;
        gameOverEvent();
    }
}

function tileDoubleClick(x, y) {
    if (gameOver)
        return;
    if (field[x][y].clicked && !field[x][y].flagged && countFlaggedBombs(x, y) === field[x][y].tileValue) {
        uncoverSurroundings(x, y);
    }
}

function tileFlag(x, y) {
    if (gameOver)
        return;
    if (field[x][y].clicked && !field[x][y].flagged)
        return;
    field[x][y].flagged = !field[x][y].flagged;
    field[x][y].clicked = field[x][y].flagged;
    ctx.clearRect(x * tileSize.x + (1 / scaleFactor), y * tileSize.y + (1 / scaleFactor), tileSize.x - (2 / scaleFactor), tileSize.y - (2 / scaleFactor));
    drawTile(x, y);
}

function uncoverSurroundings(x, y) {
    const surrounding = getSurroundingTiles(x, y);
    for (let tile in surrounding) {
        if (surrounding.hasOwnProperty(tile)) {
            uncoverTile(surrounding[tile].x, surrounding[tile].y);
        }
    }
}

function uncoverTile(x, y) {
    if (field[x][y].clicked || field[x][y].flagged) {
        return;
    }
    field[x][y].clicked = true;
    drawTile(x, y);
    if (field[x][y].tileValue === true) {
        gameOverEvent();
    }
    if (field[x][y].tileValue === 0) {
        setTimeout(() => {
            uncoverSurroundings(x, y);
        }, 100);
    }
}

function victoryCheck() {
    if (!victory && countClickedTiles() === fieldSize.x * fieldSize.y - bombCount) {
        victory = true;
        victoryEvent();
    }
}

function victoryEvent() {
    console.log("Win!");
    animate();
    play = false;
    const fontSize = tileSize.y * 1.33;
    animateBackground(0, 0, canvas.width, canvas.height, 0, .01, new Date().getTime(), 200, {r: 0, g: 0, b: 0, a: 0});
    animateText("Victory!", canvas.width / 2, canvas.height / 2 - fontSize / 2, 0, fontSize, new Date().getTime(), 200, "green", "Roboto", overlay2Ctx);
}

Object.prototype.count = function (val) {
    let counter = 0;
    for (let el in this) {
        if (this.hasOwnProperty(el)) {
            if (val === this[el].tileValue.tileValue) {
                counter++;
            }
        }
    }
    return counter;
};

Object.prototype.countFlagged = function (val) {
    let counter = 0;
    for (let el in this) {
        if (this.hasOwnProperty(el)) {
            if (this[el].tileValue.flagged === val) {
                counter++;
            }
        }
    }
    return counter;
};

overlay2Canvas.addEventListener("click", (e) => {
    const pos = getPositon(e);

    if (isFirstClick) {
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

    const pos = getPositon(e);

    tileFlag(pos.x, pos.y);
});

let scale = 1;
let offsetX = 0;
let offsetY = 0;

window.addEventListener("keyup", (e) => {
    e.preventDefault();

    if(e.keyCode === 171) {
        scale += .2;
    } else if(e.keyCode === 173) {
        if(canvas.width * scale > window.innerWidth && canvas.height * scale > window.innerHeight)
            scale -= .2;
    }

    applyScaling();

    console.log("Test");
});

let startClientX = 0;
let startClientY = 0;

let isDragging = false;

document.addEventListener("mousedown", (e) => {
    console.log(e);
    if(e.button === 0) {
        isDragging = true;
        startClientX = e.clientX;
        startClientY = e.clientY;
    }
});

document.addEventListener("mouseup", (e) => {
    isDragging = false;
});

document.addEventListener("mousemove", (e) => {
    if(isDragging) {
        // console.log(e, e.clientX - startClientX, e.clientY - startClientY);
        offsetX += (e.clientX - startClientX);
        offsetY += (e.clientY - startClientY);
        startClientX = e.clientX;
        startClientY = e.clientY;
        applyScaling();
    }
});

// document.addEventListener("dragstart", (e) => {
//     console.log(e);
//     startClientX = e.clientX;
//     startClientY = e.clientY;
// });
//
// overlay2Canvas.addEventListener("drag", (e) => {
//     console.log(startClientX - e.clientX);
// });

function applyScaling() {
    canvas.style.transform = "scale(" + scale + ") translate(" + offsetX + "px, " + offsetY + "px)";
    overlayCanvas.style.transform = "scale(" + scale + ") translate(" + offsetX + "px, " + offsetY + "px)";
    overlay2Canvas.style.transform = "scale(" + scale + ") translate(" + offsetX + "px, " + offsetY + "px)";
    console.log("scale(" + scale + ") translate(" + offsetX + "px, " + offsetY + "px)");
}

window.addEventListener("resize", () => {
    scaleCanvas();
});

initGame();