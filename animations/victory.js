let circles = [];

//Random Circles creator
function create() {
    //Place the circles at the center
    this.x = game.width / 2;
    this.y = game.height / 2;

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
        circles.push(new create());
    }
}

function drawVictory() {
    //Fill overlay2Canvas with black color
    game.layer1.globalCompositeOperation = "source-over";
    game.layer1.fillStyle = "rgba(0,0,0,0.15)";
    game.layer1.fillRect(0, 0, game.width, game.height);

    //Fill the overlay2Canvas with circles
    for(let j = 0; j < circles.length; j++){
        const c = circles[j];

        //create the circles
        game.layer1.beginPath();
        game.layer1.arc(c.x, c.y, c.radius, 0, Math.PI*2, false);
        game.layer1.fillStyle = "rgba("+c.r+", "+c.g+", "+c.b+", 0.5)";
        game.layer1.fill();

        c.x += c.vx;
        c.y += c.vy;
        c.radius -= .02;

        if(c.radius < 0)
            circles[j] = new create();
    }
}

function animateVictory() {
    requestAnimFrame(animateVictory);
    drawVictory();
}
