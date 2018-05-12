class Game {
    constructor() {
        const elements = `
        <div class="main-container">
             <div id="game-stats" class="game-stats">
                <div class="stat-container">
                    <span id="bombs">
                        000
                    </span>
                </div>
                
                <div class="restart">
                    <button id="restart-btn">Restart</button>
                </div>

                <div class="stat-container right">
                    <span id="time">
                        00:00
                    </span>
                </div>
            </div>

            <div class="game-container">
                <canvas id="minesweeper-game" width="100" height="100"></canvas>
                <canvas class="overlay" id="minesweeper-overlay" width="100" height="100"></canvas>
                <canvas class="overlay" id="minesweeper-overlay2" width="100" height="100"></canvas>
            </div>
        </div>`.toDOM();
        document.body.appendChild(elements);

        this.container = document.getElementsByClassName('main-container')[0];

        this.canvas = document.getElementById('minesweeper-game');
        this.ctx = this.canvas.getContext('2d');

        this.layer1Canvas = document.getElementById('minesweeper-overlay');
        this.layer1 = this.layer1Canvas.getContext('2d');

        this.layer2Canvas = document.getElementById('minesweeper-overlay2');
        this.layer2 = this.layer2Canvas.getContext('2d');

        this.statsContainer = document.getElementById('game-stats');
        this.timeEl = document.getElementById('time');
        this.bombsEl = document.getElementById('bombs');
        this.restartButton = document.getElementById('restart-btn');

        this.fieldSize = {x: 16, y: 12};
        this.bombCount = 25;
        this.field = [];
        this.gameOver = false;
        this.scaleFactor = .5;
        this.isFirstClick = true;

        this.windowX = 0;
        this.windowY = 0;
        this.zoomFactor = 1;

        this.startTime = 0;

        this.startClientX = 0;
        this.startClientY = 0;
        this.startWindowX = 0;
        this.startWindowY = 0;

        this.hasClicked = false;
        this.isDragging = false;

        this.ctx.scale(this.canvas.width / this.fieldSize.x * this.scaleFactor, this.canvas.height / this.fieldSize.y * this.scaleFactor);
    }

    applyScaling() {
        this.renderingConfig = this.calcScaling();

        this.drawGrid(false);
    }

    cancelGame() {
        this.container.classList.add('popAway');
    }

    calcScaling() {
        const width = Math.ceil(this.fieldSize.x * this.zoomFactor) + 1;
        const height = Math.ceil(this.fieldSize.y * this.zoomFactor) + 1;

        const offsetX = Math.floor(this.windowX * this.fieldSize.x);
        const offsetY = Math.floor(this.windowY * this.fieldSize.y);

        const tiltX = this.windowX * this.fieldSize.x - offsetX;
        const tiltY = this.windowY * this.fieldSize.y - offsetY;

        const sizeX = this.tileSize.x / this.zoomFactor;
        const sizeY = this.tileSize.y / this.zoomFactor;

        return {
            width, height, offsetX, offsetY, tiltX, tiltY, sizeX, sizeY
        };
    }

    countBombs(x, y) {
        const tiles = this.getSurroundingTiles(x, y);
        return tiles.count(true);
    }

    countFlaggedBombs(x, y) {
        const tiles = this.getSurroundingTiles(x, y);
        return tiles.countFlagged(true);
    }

    countClickedTiles() {
        let count = 0;
        for (let x = 0; x < this.fieldSize.x; x++) {
            for (let y = 0; y < this.fieldSize.y; y++) {
                if (this.field[x][y].clicked && !this.field[x][y].flagged)
                    count++;
            }
        }
        return count;
    }

    countTotalFlags() {
        let count = 0;
        for (let x = 0; x < this.fieldSize.x; x++) {
            for (let y = 0; y < this.fieldSize.y; y++) {
                if (this.field[x][y].flagged)
                    count++;
            }
        }
        return count;
    }

    destroy() {
        this.container.remove();
    }

    drawGrid(animations = true) {
        this.ctx.clearRect(0, 0, this.width, this.height);

        for (let x = 0; x < this.renderingConfig.width; x++) {
            for (let y = 0; y < this.renderingConfig.height; y++) {
                this.drawTile(x, y, animations);
            }
        }
    }

    drawTile(x, y, animations = true) {
        const virtualX = this.renderingConfig.offsetX + x;
        const virtualY = this.renderingConfig.offsetY + y;

        if (virtualX >= this.fieldSize.x || virtualY >= this.fieldSize.y)
            return;

        const content = this.field[virtualX][virtualY];

        const width = .8 * this.renderingConfig.sizeX;
        const height = .8 * this.renderingConfig.sizeY;
        const drawX = (x + .1 - this.renderingConfig.tiltX) * this.renderingConfig.sizeX;
        const drawY = (y + .1 - this.renderingConfig.tiltY) * this.renderingConfig.sizeY;
        const radius = this.renderingConfig.sizeX * .1;

        let color = this.getColor(virtualX, virtualY);
        const fontSize = this.renderingConfig.sizeY * .5;
        let fontFamily = "Roboto";
        let textColor = "white";
        let text = "";

        this.ctx.textAlign = "center";
        let duration = 0;
        if (animations)
            duration = 150;

        if (!content.flagged && content.clicked) {
            color = "#ddd";
            if (content.tileValue === true) {
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

        animateTile(this.ctx, drawX, drawY, 0, 0, width, height, 0, radius, new Date().getTime(), duration, color);
        if (text !== "") {
            animateText(this.ctx, this.renderingConfig, text, x, y, 0, fontSize, new Date().getTime(), duration, textColor, fontFamily);
        }
    }

    gameOverEvent() {
        play = false;
        animateBackground(0, 0, this.width, this.height, 0, .75, new Date().getTime(), 200, {
            r: 0,
            g: 0,
            b: 0,
            a: 0
        });
        animateText(this.layer2, this.renderingConfig, "Game Over", this.fieldSize.x / 2 - .5, this.fieldSize.y / 2 - .5, 0, this.tileSize.y * 1.33, new Date().getTime(), 200, "orange", "Roboto");
    }

    getColor(x, y) {
        x++;
        y++;
        const pos = x * y;
        const limit = this.fieldSize.x * this.fieldSize.y;

        let percentage = pos / limit * 360;

        return `hsl(${percentage},100%,50%)`;
    }

    getPosition(e) {
        const x = (e.x - (window.innerWidth - this.width) / 2) / (this.width * this.zoomFactor) + this.windowX;
        const y = (e.y - (window.innerHeight - this.height) * .75) / (this.height * this.zoomFactor) + this.windowY;
        const fieldX = Math.floor(x * this.fieldSize.x);
        const fieldY = Math.floor(y * this.fieldSize.y);

        return {x: fieldX, y: fieldY};
    }

    getSurroundingTiles(x, y) {
        const tiles = {};
        if (x > 0) {
            tiles["left"] = {tileValue: this.field[x - 1][y], x: x - 1, y: y};
            if (y > 0) {
                tiles["left-top"] = {tileValue: this.field[x - 1][y - 1], x: x - 1, y: y - 1};
            }
            if (y < this.fieldSize.y - 1) {
                tiles["left-bottom"] = {tileValue: this.field[x - 1][y + 1], x: x - 1, y: y + 1};
            }
        }
        if (x < this.fieldSize.x - 1) {
            tiles["right"] = {tileValue: this.field[x + 1][y], x: x + 1, y: y};
            if (y > 0)
                tiles["right-top"] = {tileValue: this.field[x + 1][y - 1], x: x + 1, y: y - 1};
            if (y < this.fieldSize.y - 1)
                tiles["right-bottom"] = {tileValue: this.field[x + 1][y + 1], x: x + 1, y: y + 1};
        }
        if (y > 0)
            tiles["top"] = {tileValue: this.field[x][y - 1], x: x, y: y - 1};
        if (y < this.fieldSize.y - 1)
            tiles["bottom"] = {tileValue: this.field[x][y + 1], x: x, y: y + 1};
        return tiles;
    }

    initBombs(startX, startY) {
        for (let i = 0; i < this.bombCount; i++) {
            const ranX = Math.floor(Math.random() * this.fieldSize.x);
            const ranY = Math.floor(Math.random() * this.fieldSize.y);

            if (ranX === startX || ranX === startX - 1 || ranX === startX + 1 || ranY === startY || ranY === startY - 1 || ranY === startY + 1 || this.field[ranX][ranY].tileValue === true) {
                i--;
                continue;
            }

            this.field[ranX][ranY].tileValue = true;
        }

        for (let x = 0; x < this.fieldSize.x; x++) {
            for (let y = 0; y < this.fieldSize.y; y++) {
                if (this.field[x][y].tileValue !== true) {
                    this.field[x][y].tileValue = this.countBombs(x, y);
                }
            }
        }
    }

    initEventListeners() {
        this.layer2Canvas.addEventListener("click", (e) => {
            if (this.isDragging)
                return;

            const pos = this.getPosition(e);

            if (this.isFirstClick) {
                this.initBombs(pos.x, pos.y);
                this.initTime();
                this.isFirstClick = false;
            }

            this.tileClickEvent(pos.x, pos.y);

            this.victoryEvent();

            clicked(e);
        });

        this.layer2Canvas.addEventListener("dblclick", (e) => {
            if (this.isDragging)
                return;

            const pos = this.getPosition(e);

            this.tileDoubleClick(pos.x, pos.y);

            this.victoryEvent();
        });

        this.layer2Canvas.addEventListener("contextmenu", (e) => {
            if (this.isDragging)
                return;

            e.preventDefault();

            const pos = this.getPosition(e);

            this.tileFlag(pos.x, pos.y);

            this.updateBombs();

            this.victoryEvent();
        });

        window.addEventListener("keyup", (e) => {
            e.preventDefault();

            const changeRate = .05;

            let newZoomFactor = this.zoomFactor;
            let newWindowX = this.windowX;
            let newWindowY = this.windowY;

            if (e.code === "BracketRight") {
                newZoomFactor -= changeRate;
            } else if (e.code === "Slash") {
                newZoomFactor += changeRate;
            } else if (e.code === "ArrowLeft") {
                newWindowX -= changeRate;
            } else if (e.code === "ArrowRight") {
                newWindowX += changeRate;
            } else if (e.code === "ArrowUp") {
                newWindowY -= changeRate;
            } else if (e.code === "ArrowDown") {
                newWindowY += changeRate;
            } else {
                return;
            }

            newZoomFactor = Math.min(newZoomFactor, 1);
            newZoomFactor = Math.max(newZoomFactor, .1);

            newWindowX = Math.min(newWindowX, 1 - newZoomFactor);
            newWindowY = Math.min(newWindowY, 1 - newZoomFactor);
            newWindowX = Math.max(newWindowX, 0);
            newWindowY = Math.max(newWindowY, 0);

            if (newZoomFactor !== this.zoomFactor || newWindowX !== this.windowX || newWindowY !== this.windowY) {
                this.zoomFactor = newZoomFactor;
                this.windowX = newWindowX;
                this.windowY = newWindowY;
                this.applyScaling();
            }
        });


        document.addEventListener("mousedown", (e) => {
            if (e.button === 0) {
                this.hasClicked = true;
                this.startClientX = e.clientX;
                this.startClientY = e.clientY;
                this.startWindowX = this.windowX;
                this.startWindowY = this.windowY;
            }
        });

        document.addEventListener("mouseup", () => {
            this.hasClicked = false;
            if (this.isDragging) {
                setTimeout(() => {
                    this.isDragging = false;
                }, 10);
            }
        });

        document.addEventListener("mousemove", (e) => {
            if (this.hasClicked) {
                this.isDragging = true;

                const deltaX = e.clientX - this.startClientX;
                const deltaY = e.clientY - this.startClientY;

                this.windowX = this.startWindowX - deltaX / this.width;
                this.windowY = this.startWindowY - deltaY / this.height;

                this.windowX = Math.min(this.windowX, 1 - this.zoomFactor);
                this.windowY = Math.min(this.windowY, 1 - this.zoomFactor);
                this.windowX = Math.max(this.windowX, 0);
                this.windowY = Math.max(this.windowY, 0);

                this.applyScaling();
            }
        });

        window.addEventListener("resize", () => {
            this.scaleCanvas();
        });

        this.restartButton.addEventListener('click', () => {
            restartGame();
        });
    }

    /**
     * Initializes game by creating the game field and setting bombs
     */
    initGame() {
        for (let x = 0; x < this.fieldSize.x; x++) {
            this.field.push([]);
            for (let y = 0; y < this.fieldSize.y; y++) {
                this.field[x].push({tileValue: 0, clicked: false, flagged: false});
            }
        }

        this.scaleCanvas();
        this.updateBombs();
        drawClickAnimation();

        this.initEventListeners();
    }

    initTime() {
        this.startTime = new Date().getTime();
        this.timer = setInterval(() => {
            const duration = (new Date().getTime() - this.startTime) / 1000;
            const minutes = Math.floor(duration / 60);
            const seconds = Math.floor(duration % 60);

            this.timeEl.innerText = (minutes < 10 ? "0" : "") + minutes + ":" + (seconds < 10 ? "0" : "") + seconds;
        }, 1000);
    }

    scaleCanvas() {
        let size = window.innerWidth / this.fieldSize.x * .9;

        if (size * this.fieldSize.y > window.innerHeight) {
            size = window.innerHeight / this.fieldSize.y * .9;
        }

        this.tileSize = {x: size, y: size};

        this.width = this.canvas.width = this.layer1Canvas.width = this.layer2Canvas.width = this.fieldSize.x * size;
        this.height = this.canvas.height = this.layer1Canvas.height = this.layer2Canvas.height = this.fieldSize.y * size;

        this.statsContainer.style.width = this.width + "px";

        this.applyScaling();

        initBalls();

        if (this.gameOver) {
            this.gameOverEvent();
        } else if (this.victoryCheck()) {
            this.victoryEvent();
        }
    }

    testFlagPositions() {
        for (let x = 0; x < this.fieldSize.x; x++) {
            for (let y = 0; y < this.fieldSize.y; y++) {
                if (this.field[x][y].flagged && this.field[x][y].tileValue !== true)
                    return false;
            }
        }
        return true;
    }

    tileClickEvent(x, y) {
        if (this.gameOver || this.victoryCheck())
            return;
        this.uncoverTile(x, y);
        if (!this.field[x][y].flagged && this.field[x][y].tileValue === true) {
            this.gameOver = true;
            this.gameOverEvent();
        }
    }

    tileDoubleClick(x, y) {
        if (this.gameOver)
            return;
        if (this.field[x][y].clicked && !this.field[x][y].flagged && this.countFlaggedBombs(x, y) === this.field[x][y].tileValue) {
            this.uncoverSurroundings(x, y);
        }
    }

    tileFlag(x, y) {
        if (this.gameOver)
            return;
        if (this.field[x][y].clicked && !this.field[x][y].flagged)
            return;
        this.field[x][y].flagged = !this.field[x][y].flagged;
        this.field[x][y].clicked = this.field[x][y].flagged;

        x -= this.renderingConfig.offsetX;
        y -= this.renderingConfig.offsetY;

        const drawX = (x - this.renderingConfig.tiltX) * this.renderingConfig.sizeX;
        const drawY = (y - this.renderingConfig.tiltY) * this.renderingConfig.sizeY;

        this.ctx.clearRect(drawX, drawY, this.renderingConfig.sizeX, this.renderingConfig.sizeY);
        this.drawTile(x, y);
    }

    uncoverSurroundings(x, y) {
        const surrounding = this.getSurroundingTiles(x, y);
        for (let tile in surrounding) {
            if (surrounding.hasOwnProperty(tile)) {
                this.uncoverTile(surrounding[tile].x, surrounding[tile].y);
            }
        }
    }

    uncoverTile(x, y) {
        if (this.field[x][y].clicked || this.field[x][y].flagged) {
            return;
        }
        this.field[x][y].clicked = true;
        this.drawTile(x - this.renderingConfig.offsetX, y - this.renderingConfig.offsetY);
        if (this.field[x][y].tileValue === true) {
            this.gameOverEvent();
        }
        if (this.field[x][y].tileValue === 0) {
            setTimeout(() => {
                this.uncoverSurroundings(x, y);
            }, 100);
        }
    }

    updateBombs() {
        const remainingBombs = this.bombCount - this.countTotalFlags();
        this.bombsEl.innerText = (remainingBombs < 100 ? "0" : 0) + (remainingBombs < 10 ? "0" : "") + remainingBombs;
    }

    victoryCheck() {
        return !play && (this.countClickedTiles() === this.fieldSize.x * this.fieldSize.y - this.bombCount || (this.countTotalFlags() === this.bombCount && this.testFlagPositions()));

    }

    victoryEvent() {
        if (this.victoryCheck()) {
            animateVictory();
            play = false;
            const fontSize = this.tileSize.y * 1.33;
            animateBackground(0, 0, this.canvas.width, this.canvas.height, 0, .01, new Date().getTime(), 300, {
                r: 0,
                g: 0,
                b: 0,
                a: 0
            });
            animateText(this.layer2, this.renderingConfig, "Victory!", this.fieldSize.x / 2 - .5, this.fieldSize.y / 2 - .5, 0, fontSize, new Date().getTime(), 300, "green", "Roboto");
        }
    }
}