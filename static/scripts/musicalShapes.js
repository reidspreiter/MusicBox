import { boxSynth, ballSynth, starSynth } from "./synths.js";
import { eScale, lScale, clamp, percify, choose, getTheme } from "./utils.js";

const audioButton = document.getElementById("audio-button");
const squareButton = document.getElementById("square");
const circleButton = document.getElementById("circle");
const starButton = document.getElementById("star");
const header = document.getElementById("header");
const buttonDiv = document.getElementById("buttons");
const themeButton = document.getElementById("theme-toggle");
let currShape = "square";

// Remove enable audio button if already enabled
document.addEventListener('DOMContentLoaded', () => {
    if (Tone.context.state === "running") {
        audioButton.classList.add("hide");
    }
    updateScene(false);
});

// Initialize Kaboom
kaboom({
    canvas: document.getElementById("home-canvas"), 
    background: [255, 255, 255],
});

// Initialize Tone.js
audioButton.addEventListener("click", () => {
    Tone.start();
    audioButton.classList.add("hide");

    if (currShape == 2) {
        ballSynth.synth.start();
    }
});

// Manage shape select and theme buttons
squareButton.addEventListener("click", () => changeShape("square"));
circleButton.addEventListener("click", () => changeShape("circle"));
starButton.addEventListener("click", () => changeShape("star"));
themeButton.addEventListener("click", () => updateScene());

function changeShape(shape) {
    if (currShape == shape) {
        return;
    }
    currShape = shape;
    updateScene();
}

function updateScene(refreshScene = true) {
    const theme = getTheme();
    themeButton.innerHTML = `<img src="./static/graphics/shapes/${currShape}${theme}.svg"></img>`;
    squareButton.innerHTML = `<img src="./static/graphics/shapes/squareoutline${theme}.svg"></img>`;
    circleButton.innerHTML = `<img src="./static/graphics/shapes/circleoutline${theme}.svg"></img>`;
    starButton.innerHTML = `<img src="./static/graphics/shapes/staroutline${theme}.svg"></img>`;

    if (currShape == "square") {
        squareButton.innerHTML = `<img src="./static/graphics/shapes/square${theme}.svg"></img>`;
        header.innerText = "Music Box";
        refreshScene? go("musicBox") : 0;
    } else if (currShape == "circle") {
        circleButton.innerHTML = `<img src="./static/graphics/shapes/circle${theme}.svg"></img>`;
        header.innerText = "Music Ball";
        refreshScene? go("musicBall") : 0;
    } else {
        starButton.innerHTML = `<img src="./static/graphics/shapes/star${theme}.svg"></img>`;
        header.innerText = "Music Star";
        refreshScene? go("musicStar") : 0;
    }
}

function displayContent() {
    header.classList.remove("hide");
    buttonDiv.classList.remove("hide");
    themeButton.classList.remove("hide");
}

function drawBackground(theme) {
    if (theme == "dark") {
        add([
            rect(width(), height()),
            pos(0, 0),
            color(BLACK),
            z(-2),
        ]);
    }
}

// Pick and release dragged objects
function mousePress(currDrag, objName) {
    if (!currDrag) {
        for (const obj of get(objName)) {
            if (obj.isHovering()) {
                setCursor("move");
                obj.pick();
                return;
            }
        }
    }
}

function mouseRelease(currDrag) {
    if (currDrag) {
        currDrag.drop();
        setCursor("default");
    }
}

function baseShapeSize() {
    return Math.max(width() / 8, height() / 8);
}

//
// Music Box
//
scene("musicBox", () => {
    const {x: cWidth, y: cHeight} = center();
    let currDrag = null;

    onLoad(() => displayContent());

    // Draw black background if dark mode enabled
    const theme = getTheme();
    const bgColor = theme == "dark" ? BLACK : WHITE;
    const fgColor = theme == "dark" ? WHITE : BLACK;
    drawBackground(theme);

    // Load notation sprites
    const notation = [
        "1n1",
        "2n1", "2n2",
        "4n1", "4n2",
        "8n1", "8n2", "8n3", "8n4",
        "16n1", "16n2", "16n3",
        "32n1", "32n2",
    ];
    notation.forEach((note) => {
        loadSprite(note, `./static/graphics/notation/${note}${theme}.png`);
    });

    // Center box
    const boxSize = baseShapeSize();
    const boxHalf = boxSize / 2;
    const boxSides = {
        left: cWidth - boxHalf,
        right: cWidth + boxHalf,
        top: cHeight - boxHalf,
        bottom: cHeight + boxHalf,
    };
    const box = add([
        rect(boxSize, boxSize),
        anchor("center"),
        pos(center()),
        color(fgColor),
        area(),
        "musicBox"
    ]);
    box.onCollide("note", (note) => {
        playNote(note.dur);
    });

    // Destroy notes off screen
    const leftBound = add([
        rect(1, height()),
        pos(-30, 0),
        area(),
        color(BLACK),
    ]);
    leftBound.onCollide("note", (note) => {
        destroy(note);
    });

    // Sliders
    const availableSliderSpace = cHeight + boxSize * 1.6 < height() ? boxSize : cHeight - boxHalf - 20;
    const slider = {
        size: availableSliderSpace / 8,
    }
    const bottomMargin = (availableSliderSpace - slider.size * 4) / 3;
    slider.spacing = bottomMargin + slider.size;
    slider.yStart = cHeight + boxHalf + (cHeight - boxHalf - availableSliderSpace) / 2 + slider.size / 2;
    slider.left = boxSides.left + slider.size / 2;
    slider.right = boxSides.right - slider.size / 2;
    slider.range = slider.right - slider.left;
    
    Object.entries(boxSynth.params).forEach(([name, percent], i) => {
        add([
            rect(slider.range, 2),
            color(fgColor),
            anchor("center"),
            pos(cWidth, slider.yStart + slider.spacing * i),
        ]);

        const sliderBox = add([
            rect(slider.size, slider.size),
            color(fgColor),
            anchor("center"),
            pos(slider.left + percent * slider.range, slider.yStart + slider.spacing * i),
            area(),
            sliderDrag(),
            scale(1),
            "slider",
            `${name}`
        ]);
        sliderBox.onHover(() => {
            if (currDrag == null) {
                sliderBox.scale = vec2(1.2);
            }
        });
        sliderBox.onHoverEnd(() => {
            if (currDrag == null) {
                sliderBox.scale = vec2(1);
            }
        });
    });

    // Recursively spawn notes based on slider values
    const rate = {
        lMin: 0.05,
        lMax: 1,
        uMin: 0.1,
        uMax: 2,
    };
    rate.lVal = eScale(rate.lMin, rate.lMax, 0.5);
    rate.uVal = eScale(rate.uMin, rate.uMax, 0.5);

    const offset = {
        min: 10,
        max: cHeight - 10,
    };
    offset.val = eScale(offset.min, offset.max, 0.7);

    const size = {
        lMin: 0.015,
        lMax: 0.027,
        uMin: 0.025,
        uMax: 0.046,
    };
    size.lVal = eScale(size.lMin, size.lMax, 0.7);
    size.uVal = eScale(size.uMin, size.uMax, 0.7);

    const angle = {
        lMin: -110,
        lMax: -25,
        uMin: -55,
        uMax: 25,
        lVal: -25,
        uVal: 25,
    };

    const xPos = width() + 30;
    function spawnNote() {
        const noteType = choose(notation);
        const duration = Number(noteType.substring(0, noteType.length - 2));
        const speed = rand(20, 31) * duration;
        const yPos = rand(cHeight - offset.val, cHeight + offset.val + 1);

        add([
            pos(xPos, yPos),
            sprite(noteType),
            anchor("center"),
            scale(rand(size.lVal, size.uVal)),
            rotate(rand(angle.lVal, angle.uVal)),
            area(),
            move(box.pos.angle(xPos, yPos), speed),
            "note",
            {
                dur: duration,
            },
        ]);
        wait(rand(rate.lVal, rate.uVal), spawnNote);
    }
    spawnNote();

    // Update music box and play note
    function playNote(duration) {
        const durationSize = boxHalf / duration;
        const rectSize =  durationSize < 2 ? 2 : durationSize;
        const rectHalf = rectSize / 2;
        add([
            rect(rectSize, rectSize),
            anchor("center"),
            pos(
                rand(boxSides.left + rectHalf + 2, boxSides.right - rectHalf - 2),
                rand(boxSides.top + rectHalf + 2, boxSides.bottom - rectHalf - 2),
            ),
            lifespan(1 / (duration + 1) + 0.1),
            color(bgColor),
            outline(1, fgColor),
        ]);

        if (Tone.context.state === "running") {
            if (duration < 4) {
                boxSynth.playLow(duration);
            } else {
                boxSynth.playHigh(duration);
            }
        }
    }

    // Handle slider box drag
    function sliderDrag() {
        let xOffset = 0;
        return {
            id: "drag",
            require: ["pos", "area"],
            pick() {
                currDrag = this;
                xOffset = mousePos().x - this.pos.x;
            },
            drop() {
                if (!this.isHovering()) {
                    this.scale = vec2(1);
                }
                currDrag = null;
            },
            update() {
                if (currDrag !== this) {
                    return;
                }
                const newXPos = clamp(slider.left, slider.right, mousePos().x - xOffset);
                const perc = (newXPos - slider.left) / slider.range;
                this.pos.x = newXPos;

                if (this.is("rate")) {
                    rate.lVal = eScale(rate.lMin, rate.lMax, 1 - perc);
                    rate.uVal = eScale(rate.uMin, rate.uMax, 1 - perc);
                } else if (this.is("freq")) {
                    boxSynth.setFreq(perc);
                    if (perc <= 0.6) {
                        const newPerc = map(perc, 0, 0.6, 0, 1);
                        angle.lVal = lScale(angle.lMin, angle.lMax, newPerc);
                        angle.uVal = lScale(angle.uMin, angle.uMax, newPerc);
                    }
                } else if (this.is("verb")) {
                    boxSynth.setVerbWet(perc);
                    size.lVal = eScale(size.lMin, size.lMax, 1 - perc);
                    size.uVal = eScale(size.uMin, size.uMax, 1 - perc);
                } else {
                    boxSynth.setDelWet(perc);
                    offset.val = eScale(offset.min, offset.max, perc);
                }
            },
        }
    }

    onMousePress(() => mousePress(currDrag, "slider"));
    onMouseRelease(() => mouseRelease(currDrag));

    // Save slider data
    onSceneLeave(() => {
        if (Tone.context.state === "running") {
            boxSynth.stop();
        }
        const sliders = get("slider");
        sliders.forEach(obj => {
            if (obj.is("rate")) {
                boxSynth.params.rate = percify(slider.left, slider.right, obj.pos.x);
            } else if (obj.is("freq")) {
                boxSynth.params.freq = percify(slider.left, slider.right, obj.pos.x);
            } else if (obj.is("verb")) {
                boxSynth.params.verb = percify(slider.left, slider.right, obj.pos.x);
            } else {
                boxSynth.params.delay = percify(slider.left, slider.right, obj.pos.x);
            }
        });
    });
});

//
// Music Ball
//
scene("musicBall", () => {
    const {x: cWidth, y: cHeight} = center();

    onLoad(() => displayContent());

    if (Tone.context.state === "running") {
        ballSynth.start();
    }

    // Draw black background if dark mode enabled
    const theme = getTheme();
    const fgColor = theme === "dark" ? WHITE : BLACK;
    drawBackground(theme);

    // Center circle
    const ball = add([
        circle(baseShapeSize() / 2),
        anchor("center"),
        pos(center()),
        color(fgColor),
        "musicBall",
    ]);

    // Knobs
    loadSprite("knob", `./static/graphics/misc/knob${theme}.svg`);
    
    const numParams = Object.keys(ballSynth.params).length;
    const knob = {
        spriteDiameter: 617,
        min: -120,
        max: 120,
    };
    knob.diameter = Math.min(width() / (numParams * 1.5), (cHeight - ball.radius) / 2.5);
    knob.scale = knob.diameter / knob.spriteDiameter;
    knob.y = height() - knob.diameter;
    knob.xStart = cWidth - knob.diameter * 3 - knob.diameter / 8;

    Object.entries(ballSynth.params).forEach(([name, percent], i) => {
        const k = add([
            sprite("knob"),
            anchor("center"),
            pos(knob.xStart + knob.diameter * 1.25 * i, knob.y),
            rotate(lScale(knob.min, knob.max, percent)),
            scale(knob.scale),
            knobDrag(),
            area(),
            z(2),
            {
                yOffset: lScale(knob.min, knob.max, percent),
            },
            "knob",
            `${name}`,
        ]);
        k.onHover(() => {
            if (currDrag == null) {
                k.scale = vec2(knob.scale * 1.2);
            }
        });
        k.onHoverEnd(() => {
            if (currDrag == null) {
                k.scale = vec2(knob.scale);
            }
        });
    });

    // Spawn rotating ball sprites
    loadSprite("ball", `./static/graphics/misc/ball${theme}.svg`);
    const ballSprite = {
        spriteDiameter: 1200,
        diameter: ball.radius,
    };
    ballSprite.scale = ballSprite.diameter / ballSprite.spriteDiameter;

    const size = {
        min: ballSprite.scale / 10,
        max: ballSprite.scale,
    };
    size.val = lScale(size.min, size.max, ballSynth.params.vol);

    const radius = {
        min: ball.radius + ballSprite.diameter / 1.5,
        max: Math.min(cHeight, cWidth) + 50,
    };
    radius.val = lScale(radius.min, radius.max, ballSynth.params.verb);

    const oblong = {
        min: 0,
        max: radius.val - ball.radius / 2,
    }
    oblong.val = lScale(oblong.min, oblong.max, 1 - ballSynth.params.freq);

    const speed = {
        min: 0.2,
        max: 20,
    };
    speed.val = lScale(speed.min, speed.max, ballSynth.params.pitch);

    const deviation = {
        min: 0, 
        max: ballSprite.diameter * 2,
    };
    deviation.val = eScale(deviation.min, deviation.max, ballSynth.params.dist);

    const rotation = {
        min: 40,
        max: 2000,
    };
    rotation.val = lScale(rotation.min, rotation.max, ballSynth.params.vib);

    for (let i = 0; i < 4; i++) {
        add([
            sprite("ball"),
            anchor("center"),
            pos(center().add(Vec2.fromAngle(90 * i).scale(radius.val))),
            opacity(opacity.val),
            scale(size.val),
            rotate(0),
            z(1),
            {
                orbPos: (90 * i) * (Math.PI / 180),
            },
            "ballSprite"
        ]);
    }

    // Orbit and rotate each sprite
    onUpdate("ballSprite", (ballSprite) => {
        ballSprite.orbPos += dt() * speed.val;
        const xPos = cWidth + radius.val * Math.cos(ballSprite.orbPos);
        const yPos = cHeight + (radius.val - oblong.val) * Math.sin(ballSprite.orbPos);

        if (ballSprite.pos.y < cHeight) {
            ballSprite.z = -1;
        } else {
            ballSprite.z = 1;
        }

        ballSprite.pos.x = xPos + rand(-deviation.val, deviation.val);
        ballSprite.pos.y = yPos + rand(-deviation.val, deviation.val);
        ballSprite.angle += rotation.val * dt();
    });

    // Handle knob rotation
    let currDrag = null;
    let currOblongPerc = 1 - ballSynth.params.freq;
    const sensitivity = 3;
    function knobDrag() {
        let yOffset = 0;
        return {
            id: "drag",
            require: ["pos", "area"],
            pick() {
                currDrag = this;
                yOffset = -(mousePos().y * sensitivity) - this.yOffset;
            },
            drop() {
                if (!this.isHovering()) {
                    this.scale = vec2(knob.scale);
                }
                currDrag = null;
            },
            update() {
                if (currDrag !== this) {
                    return;
                }
                const newAngle = clamp(knob.min, knob.max, -(mousePos().y * sensitivity) - yOffset);
                this.angle = newAngle;
                this.yOffset = newAngle;
                const perc = percify(knob.min, knob.max, newAngle);

                if (this.is("pitch")) {
                    ballSynth.setPitch(perc);
                    speed.val = lScale(speed.min, speed.max, perc);
                } else if (this.is("freq")) {
                    ballSynth.setFreq(perc);
                    currOblongPerc = 1 - perc;
                    oblong.val = lScale(oblong.min, oblong.max, currOblongPerc);
                } else if (this.is("dist")) {
                    ballSynth.setDist(perc);
                    deviation.val = eScale(deviation.min, deviation.max, perc);
                } else if (this.is("vib")) {
                    ballSynth.setVibFreq(perc);
                    ballSynth.setVibDepth(perc);
                    rotation.val = lScale(rotation.min, rotation.max, perc);
                } else if (this.is("verb")) {
                    ballSynth.setVerbWet(perc);
                    radius.val = lScale(radius.min, radius.max, perc);
                    oblong.max = radius.val - ball.radius / 2;
                    oblong.val = lScale(oblong.min, oblong.max, currOblongPerc);
                } else {
                    ballSynth.setVol(perc);
                    const newScale = lScale(size.min, size.max, perc);
                    const balls = get("ballSprite");
                    balls.forEach(orbitingBall => {
                        orbitingBall.scale = newScale;
                    });
                }
            },
        }
    }

    onMousePress(() => mousePress(currDrag, "knob"));
    onMouseRelease(() => mouseRelease(currDrag));

    // Stop synth and save knob data
    onSceneLeave(() => {
        if (Tone.context.state === "running") {
            ballSynth.stop();
        }
        const knobs = get("knob");
        knobs.forEach(obj => {
            if (obj.is("pitch")) {
                ballSynth.params.pitch = percify(knob.min, knob.max, obj.yOffset);
            } else if (obj.is("freq")) {
                ballSynth.params.freq = percify(knob.min, knob.max, obj.yOffset);
            } else if (obj.is("dist")) {
                ballSynth.params.dist = percify(knob.min, knob.max, obj.yOffset);
            } else if (obj.is("vib")) {
                ballSynth.params.vib = percify(knob.min, knob.max, obj.yOffset);
            } else if (obj.is("verb")) {
                ballSynth.params.verb = percify(knob.min, knob.max, obj.yOffset);
            } else {
                ballSynth.params.vol = percify(knob.min, knob.max, obj.yOffset);
            }
        });
    });
});

//
// Music Star
//
scene("musicStar", () => {
    const {x: cWidth, y: cHeight} = center();

    onLoad(() => displayContent());

    const theme = getTheme();
    const fgColor = theme == "dark" ? WHITE : BLACK;
    drawBackground(theme);

    loadSprite("starOutline", `./static/graphics/shapes/staroutline${theme}.svg`)
    loadSprite("star", `./static/graphics/shapes/star${theme}.svg`);

    // Center star
    const starSprite = {
        size: 241.890,
        pointWidth: 49.135,
    };
    const musicStarSize = baseShapeSize();
    const starScale = musicStarSize / starSprite.size;
    add([
        sprite("star"),
        anchor("center"),
        pos(center()),
        scale(starScale),
        "star",
    ]);

    // Sequencer
    const sequenceStar = {
        region: Math.min(height(), width()),
    }
    sequenceStar.size = sequenceStar.region / 14;
    sequenceStar.pointWidth = 49.135 / 241.890 * sequenceStar.size;
    sequenceStar.margin = sequenceStar.size * 2 / 11;
    sequenceStar.xStart = cWidth - sequenceStar.margin * 5.5 - sequenceStar.size * 5.5;
    sequenceStar.yStart = height() - 64 - sequenceStar.margin - sequenceStar.size;
    sequenceStar.scale = sequenceStar.size / starSprite.size;
    function fillSequenceStar(xPos, yPos, i, j) {
        starSynth.sequencer[i][j] = true;
        add([
            sprite("star"),
            anchor("center"),
            pos(xPos, yPos),
            scale(sequenceStar.scale),
            area(),
            `${i}${j}`,
        ]);
    }

    function hollowSequenceStar(i, j) {
        starSynth.sequencer[i][j] = false;
        const starFilling = get(`${i}${j}`);
        destroy(starFilling[0]);
    }

    // Draw sequence buttons
    for (let i = 0; i < 2; i++) {
        const yPos = sequenceStar.yStart + i * (sequenceStar.margin + sequenceStar.size)
        for (let j = 0; j < 12; j++) {
            const xPos = sequenceStar.xStart + j * (sequenceStar.size + sequenceStar.margin);
            starSynth.sequencer[i][j] ? fillSequenceStar(xPos, yPos, i, j) : 0;
            const s = add([
                sprite("starOutline"),
                anchor("center"),
                pos(xPos, yPos),
                scale(sequenceStar.scale),
                area(),
                {
                    x: xPos,
                    y: yPos,
                    active: starSynth.sequencer[i][j] ? true : false,
                    i: i,
                    j: j,
                }
            ]);
            s.onHover(() => {
                s.scale = vec2(sequenceStar.scale * 1.1);
                setCursor("pointer");
            });
            s.onHoverEnd(() => {
                s.scale = vec2(sequenceStar.scale);
                setCursor("default");
            });
            s.onClick(() => {
                if (s.active) {
                    hollowSequenceStar(s.i, s.j);
                } else {
                    fillSequenceStar(s.x, s.y, s.i, s.j);
                }
                s.active = !s.active;
            });
        }
    }

    // Playheads
    let topTempo = 500;
    let topStepTime = 60 / topTempo;
    let topStep = 11
    const topPlayhead = add([
        rect(sequenceStar.pointWidth, sequenceStar.pointWidth),
        anchor("center"),
        pos(sequenceStar.xStart, sequenceStar.yStart - sequenceStar.size * 0.8),
        color(fgColor),
    ]);

    let bottomTempo = 400;
    let bottomStepTime = 60 / bottomTempo;
    let bottomStep = 11;
    const bottomPlayhead = add([
        rect(sequenceStar.pointWidth, sequenceStar.pointWidth),
        anchor("center"),
        pos(sequenceStar.xStart, sequenceStar.yStart + sequenceStar.margin + sequenceStar.size * 1.8),
        color(fgColor),
    ]);

    //FIXME joint tempo button will allow both playbuttons to wait from the same function to guarantee they play together
    //when not joined, move separately
    function moveTopPlayhead() {
        topStep++;
        bottomStep++;
        if (topStep > 11) {
            topPlayhead.pos.x = sequenceStar.xStart;
            bottomPlayhead.pos.x = sequenceStar.xStart;
            topStep = 0;
            bottomStep = 0
        } else {
            topPlayhead.pos.x += sequenceStar.size + sequenceStar.margin;
            bottomPlayhead.pos.x += sequenceStar.size + sequenceStar.margin;
        }
        if (starSynth.sequencer[0][topStep]) {
            starSynth.playTop(topStep);
        }
        if (starSynth.sequencer[1][bottomStep]) {
            starSynth.playBottom(bottomStep);
        }
        wait(topStepTime, moveTopPlayhead);
    }

    function moveBottomPlayhead() {
        bottomStep++;
        if (bottomStep > 11) {
            bottomPlayhead.pos.x = sequenceStar.xStart;
            bottomStep = 0;
        } else {
            bottomPlayhead.pos.x += sequenceStar.size + sequenceStar.margin;
        }
        if (starSynth.sequencer[1][bottomStep]) {
            starSynth.playBottom(bottomStep);
        }
        wait(bottomStepTime, moveBottomPlayhead);
    }
    wait(bottomStepTime, () => {
        //moveBottomPlayhead();
        moveTopPlayhead();
    });
});

go("musicBox");