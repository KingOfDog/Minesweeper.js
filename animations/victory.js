const overlay2Canvas = document.getElementById('minesweeper-overlay2');
const overlay2Ctx = overlay2Canvas.getContext('2d');

let W = window.innerWidth,
    H = window.innerHeight,
    circles = [];

overlay2Canvas.width = W;
overlay2Canvas.height = H;

//Random Circles creator
function Create() {
    //Place the circles at the center
    this.x = W/2;
    this.y = H/2;

    //Random radius between 2 and 6
    this.radius = 2 + Math.random()*3;

    //Random velocities
    this.vx = -5 + Math.random()*10;
    this.vy = -5 + Math.random()*10;

    //Random colors
    this.r = Math.round(Math.random())*255;
    this.g = Math.round(Math.random())*255;
    this.b = Math.round(Math.random())*255;
}

function initBalls() {
    circles = [];
    for (let i = 0; i < 500; i++) {
        circles.push(new Create());
    }
}

function drawVictory() {
    //Fill overlay2Canvas with black color
    overlayCtx.globalCompositeOperation = "source-over";
    overlayCtx.fillStyle = "rgba(0,0,0,0.15)";
    overlayCtx.fillRect(0, 0, W, H);

    //Fill the overlay2Canvas with circles
    for(let j = 0; j < circles.length; j++){
        const c = circles[j];

        //Create the circles
        overlayCtx.beginPath();
        overlayCtx.arc(c.x, c.y, c.radius, 0, Math.PI*2, false);
        overlayCtx.fillStyle = "rgba("+c.r+", "+c.g+", "+c.b+", 0.5)";
        overlayCtx.fill();

        c.x += c.vx;
        c.y += c.vy;
        c.radius -= .02;

        if(c.radius < 0)
            circles[j] = new Create();
    }
}

function animate() {
    requestAnimFrame(animate);
    drawVictory();
}
