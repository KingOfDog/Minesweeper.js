const canvas = document.getElementById('minesweeper-game');
const ctx = canvas.getContext('2d');
const container = document.getElementById('game-container');
const timeEl = document.getElementById('time');

const fieldSize = {x: 16, y: 12};
let tileSize;
const bombCount = 25;
const field = [];
let gameOver = false;
let victory = false;
const scaleFactor = .5;
let isFirstClick = true;

let windowX = 0;
let windowY = 0;
let zoomFactor = 1;

let renderingConfig;

let startTime = 0;
let timer;

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

    const textDrawX = (x + .5 - renderingConfig.tiltX) * renderingConfig.sizeX;
    const textDrawY = (y + .5 - renderingConfig.tiltY) * renderingConfig.sizeY + curFontSize * .33;

    if (font === undefined)
        font = "Roboto";

    context.fillStyle = color;
    context.font = "bold " + curFontSize + "px " + font;
    context.textAlign = "center";
    context.fillText(text, textDrawX, textDrawY);

    requestAnimFrame(function () {
        animateText(text, x, y, curFontSize, finalFontSize, startTime, duration, color, font, context);
    });
}

function applyScaling() {
    renderingConfig = calcScaling();

    drawGrid(false);
}

function calcScaling(field = fieldSize, tile = tileSize, zoom = zoomFactor) {
    const width = Math.ceil(field.x * zoom) + 1;
    const height = Math.ceil(field.y * zoom) + 1;

    const offsetX = Math.floor(windowX * field.x);
    const offsetY = Math.floor(windowY * field.y);

    const tiltX = windowX * field.x - offsetX;
    const tiltY = windowY * field.y - offsetY;

    const sizeX = tile.x / zoom;
    const sizeY = tile.y / zoom;

    return {
        width, height, offsetX, offsetY, tiltX, tiltY, sizeX, sizeY
    };
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

    for (let x = 0; x < renderingConfig.width; x++) {
        for (let y = 0; y < renderingConfig.height; y++) {
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
    const virtualX = renderingConfig.offsetX + x;
    const virtualY = renderingConfig.offsetY + y;

    if(virtualX >= fieldSize.x || virtualY >= fieldSize.y)
        return;
    
    const content = field[virtualX][virtualY];

    const width = .8 * renderingConfig.sizeX;
    const height = .8 * renderingConfig.sizeY;
    const drawX = (x + .1 - renderingConfig.tiltX) * renderingConfig.sizeX;
    const drawY = (y + .1 - renderingConfig.tiltY) * renderingConfig.sizeY;
    const radius = renderingConfig.sizeX * .1;

    let color = getColor(virtualX, virtualY);
    const fontSize = renderingConfig.sizeY * .5;
    let fontFamily = "Roboto";
    let textColor = "white";
    let text = "";

    ctx.textAlign = "center";
    let duration = 0;
    if (animations)
        duration = 150;

    if (!content.flagged && content.clicked) {
        color = "#ddd";
        if(content.tileValue === true) {
            text = "";
            fontFamily = "FontAwesome";
            textColor = "#aa2211";
            color = "#333";
        } else if (content.tileValue !== 0) {
            text = content.tileValue;
            textColor = colors[content.tileValue];
        }
    } else if (content.flagged) {
        color = "#ff0000";
        fontFamily = "FontAwesome";
        text = "";
    }

    animateTile(drawX, drawY, 0, 0, width, height, 0, radius, new Date().getTime(), duration, color);
    if(text !== "") {
        animateText(text, x, y, 0, fontSize, new Date().getTime(), duration, textColor, fontFamily, ctx);
    }
}

function getColor(x, y) {
    x++;
    y++;
    const pos = x * y;
    const limit = fieldSize.x * fieldSize.y;

    let percentage = pos / limit * 360;

    return `hsl(${percentage},100%,50%)`;
}

function easeInOutCubic(t, b, c, d) {
    t /= d;
    t--;
    return c * (Math.pow(t, 3) + 1) + b;
}

function gameOverEvent() {
    play = false;
    animateBackground(0, 0, canvas.width, canvas.height, 0, .75, new Date().getTime(), 200, {r: 0, g: 0, b: 0, a: 0});
    animateText("Game Over", fieldSize.x / 2 - .5, fieldSize.y / 2 - .5, 0, tileSize.y * 1.33, new Date().getTime(), 200, "orange", "Roboto", overlay2Ctx);
}

function getPosition(e) {
    const x = (e.x - canvas.offsetLeft) / W * zoomFactor + windowX;
    const y = (e.y - canvas.offsetTop) / H * zoomFactor + windowY;
    const fieldX = Math.floor(x * fieldSize.x);
    const fieldY = Math.floor(y * fieldSize.y);

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

function initTime() {
    startTime = new Date().getTime();
    timer = setInterval(() => {
        const duration = (new Date().getTime() - startTime) / 1000;
        const minutes = Math.floor(duration / 60);
        const seconds = Math.floor(duration % 60);
        
        timeEl.innerText = (minutes < 10 ? "0" : "") + minutes + ":" + (seconds < 10 ? "0" : "") + seconds;
    }, 1000);
}

function scaleCanvas() {
    let size = window.innerWidth / fieldSize.x * .9;

    if(size * fieldSize.y > window.innerHeight) {
        size = window.innerHeight / fieldSize.y * .9;
    }

    tileSize = {x: size, y: size};

    W = fieldSize.x * size;
    H = fieldSize.y * size;

    canvas.width = W;
    canvas.height = H;
    overlayCanvas.width = W;
    overlayCanvas.height = H;
    overlay2Canvas.width = W;
    overlay2Canvas.height = H;

    initBalls();

    applyScaling();

    if (gameOver) {
        gameOverEvent();
    } else if (victory) {
        victoryEvent();
    }
}

function tileClickEvent(x, y) {
    if (gameOver || victory)
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

    x -= renderingConfig.offsetX;
    y -= renderingConfig.offsetY;
    
    const drawX = (x - renderingConfig.tiltX) * renderingConfig.sizeX;
    const drawY = (y - renderingConfig.tiltY) * renderingConfig.sizeY;

    ctx.clearRect(drawX, drawY, renderingConfig.sizeX, renderingConfig.sizeY);
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
    drawTile(x - renderingConfig.offsetX, y - renderingConfig.offsetY);
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
    if(victory) {
        animateVictory();
        play = false;
        const fontSize = tileSize.y * 1.33;
        animateBackground(0, 0, canvas.width, canvas.height, 0, .01, new Date().getTime(), 200, {r: 0, g: 0, b: 0, a: 0});
        animateText("Victory!", fieldSize.x / 2 - .5, fieldSize.y / 2 - .5, 0, fontSize, new Date().getTime(), 300, "green", "Roboto", overlay2Ctx);
    }
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
    if(isDragging)
        return;
    
    const pos = getPosition(e);

    if (isFirstClick) {
        initBombs(pos.x, pos.y);
        initTime();
        isFirstClick = false;
    }

    tileClickEvent(pos.x, pos.y);

    victoryCheck();

    clicked(e);
});

overlay2Canvas.addEventListener("dblclick", (e) => {
    if(isDragging)
        return;
    
    const pos = getPosition(e);

    tileDoubleClick(pos.x, pos.y);

    victoryCheck();
});

overlay2Canvas.addEventListener("contextmenu", (e) => {
    if(isDragging)
        return;
    
    e.preventDefault();

    const pos = getPosition(e);

    tileFlag(pos.x, pos.y);
});

window.addEventListener("keyup", (e) => {
    e.preventDefault();

    if (e.code === "BracketRight") {
        zoomFactor -= .1;
    } else if (e.code === "Slash") {
        zoomFactor += .1;
    } else if (e.code === "ArrowLeft") {
        windowX -= .1;
    } else if (e.code === "ArrowRight") {
        windowX += .1;
    } else if (e.code === "ArrowUp") {
        windowY -= .1;
    } else if (e.code === "ArrowDown") {
        windowY += .1;
    } else {
        return;
    }

    zoomFactor = Math.min(zoomFactor, 1);
    zoomFactor = Math.max(zoomFactor, .1);

    windowX = Math.min(windowX, 1 - zoomFactor);
    windowY = Math.min(windowY, 1 - zoomFactor);
    windowX = Math.max(windowX, 0);
    windowY = Math.max(windowY, 0);

    applyScaling();
});

let startClientX = 0;
let startClientY = 0;
let startWindowX = 0;
let startWindowY = 0;

let hasClicked = false;
let isDragging = false;

document.addEventListener("mousedown", (e) => {
    if(e.button === 0) {
        hasClicked = true;
        startClientX = e.clientX;
        startClientY = e.clientY;
        startWindowX = windowX;
        startWindowY = windowY;
    }
});

document.addEventListener("mouseup", () => {
    hasClicked = false;
    if(isDragging) {
        setTimeout(() => {
            isDragging = false;
        }, 10);
    }
});

document.addEventListener("mousemove", (e) => {
    if(hasClicked) {
        isDragging = true;

        const deltaX = e.clientX - startClientX;
        const deltaY = e.clientY - startClientY;

        windowX = startWindowX - deltaX / W;
        windowY = startWindowY - deltaY / H;

        windowX = Math.min(windowX, 1 - zoomFactor);
        windowY = Math.min(windowY, 1 - zoomFactor);
        windowX = Math.max(windowX, 0);
        windowY = Math.max(windowY, 0);

        applyScaling();
    }
});

window.addEventListener("resize", () => {
    scaleCanvas();
});

initGame();
