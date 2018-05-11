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

function animateTile(ctx, x, y, curWidth, curHeight, finalWidth, finalHeight, curRadius, finalRadius, startTime, duration, color) {
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
        animateTile(ctx, x, y, curWidth, curHeight, finalWidth, finalHeight, curRadius, finalRadius, startTime, duration, color);
    });
}

function animateText(ctx, renderingConfig, text, x, y, curFontSize, finalFontSize, startTime, duration, color, font) {
    const time = (new Date()).getTime() - startTime;

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

    ctx.fillStyle = color;
    ctx.font = "bold " + curFontSize + "px " + font;
    ctx.textAlign = "center";
    ctx.fillText(text, textDrawX, textDrawY);

    requestAnimFrame(function () {
        animateText(ctx, renderingConfig, text, x, y, curFontSize, finalFontSize, startTime, duration, color, font);
    });
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

function easeInOutCubic(t, b, c, d) {
    t /= d;
    t--;
    return c * (Math.pow(t, 3) + 1) + b;
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

String.prototype.toDOM=function(){
    let d=document
        ,i
        ,a=d.createElement("div")
        ,b=d.createDocumentFragment();
    a.innerHTML=this;
    while(i=a.firstChild)b.appendChild(i);
    return b;
};


const game = new Game();
game.initGame();