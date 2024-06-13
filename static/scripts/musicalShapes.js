import { boxSynth, ballSynth, starSynth } from "./synths.js";
import { lScale, clamp, percify, choose, getTheme } from "./utils.js";
import { dragSlider, rotateKnob, grab, release, grow, shrink } from "./interactables.js";
import { boxParams, ballParams } from "./params.js";

let currShape = "square";
let audioEnabled = false;

const elems = {
    audioBtn: document.getElementById("audio-button"),
    squareBtn: document.getElementById("square"),
    circleBtn: document.getElementById("circle"),
    starBtn: document.getElementById("star"),
    header: document.getElementById("header"),
    btnDiv: document.getElementById("buttons"),
    themeBtn: document.getElementById("theme-toggle"),
}

elems.squareBtn.addEventListener("click", () => changeShape("square"));
elems.circleBtn.addEventListener("click", () => changeShape("circle"));
elems.starBtn.addEventListener("click", () => changeShape("star"));
elems.themeBtn.addEventListener("click", () => updateScene());

elems.audioBtn.addEventListener("click", () => {
    Tone.start();
    elems.audioBtn.classList.add("hide");
    audioEnabled = true;

    if (currShape == 2) {
        ballSynth.synth.start();
    }
});

document.addEventListener('DOMContentLoaded', () => {
    if (Tone.context.state === "running") {
        elems.audioBtn.classList.add("hide");
        audioEnabled = true;
    }
    updateScene(false);
});

kaboom({
    canvas: document.getElementById("home-canvas"), 
    background: [255, 255, 255],
});

function changeShape(shape) {
    if (currShape == shape) {
        return;
    }
    currShape = shape;
    updateScene();
}

function updateScene(refreshScene = true) {
    const theme = getTheme();
    elems.themeBtn.innerHTML = `<img src="./static/graphics/shapes/${currShape}${theme}.svg"></img>`;
    elems.squareBtn.innerHTML = `<img src="./static/graphics/shapes/squareoutline${theme}.svg"></img>`;
    elems.circleBtn.innerHTML = `<img src="./static/graphics/shapes/circleoutline${theme}.svg"></img>`;
    elems.starBtn.innerHTML = `<img src="./static/graphics/shapes/staroutline${theme}.svg"></img>`;

    if (currShape == "square") {
        elems.squareBtn.innerHTML = `<img src="./static/graphics/shapes/square${theme}.svg"></img>`;
        elems.header.innerText = "Music Box";
        if (refreshScene) go("musicBox");
    } else if (currShape == "circle") {
        elems.circleBtn.innerHTML = `<img src="./static/graphics/shapes/circle${theme}.svg"></img>`;
        elems.header.innerText = "Music Ball";
        if (refreshScene) go("musicBall");
    } else {
        elems.starBtn.innerHTML = `<img src="./static/graphics/shapes/star${theme}.svg"></img>`;
        elems.header.innerText = "Music Star";
        if (refreshScene) go("musicStar");
    }
}

function displayContent() {
    elems.header.classList.remove("hide");
    elems.btnDiv.classList.remove("hide");
    elems.themeBtn.classList.remove("hide");
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

function baseShapeSize() {
    return Math.max(width() / 8, height() / 8);
}

//
// Music Box
//
scene("musicBox", () => {
    const {x: cWidth, y: cHeight} = center();

    onLoad(() => displayContent());
    onMousePress(() => grab("slider"));
    onMouseRelease(() => release());

    // Draw black background if dark mode enabled
    const theme = getTheme();
    const bgColor = theme == "dark" ? BLACK : WHITE;
    const fgColor = theme == "dark" ? WHITE : BLACK;
    drawBackground(theme);

    boxParams.setup(cHeight);

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
            dragSlider(),
            scale(1),
            "slider",
            `${name}`,
            {
                min: slider.left,
                max: slider.right,
                originalScale: 1,
                sliderAction: action,
            },
        ]);
        sliderBox.onHover(() => grow(sliderBox, 1));
        sliderBox.onHoverEnd(() => shrink(sliderBox, 1));
    });

    function action(perc) {
        if (this.is("rate")) {
            boxParams.rate.update(perc);
        } else if (this.is("freq")) {
            boxSynth.setFreq(perc);
            boxParams.angle.update(perc);
        } else if (this.is("verb")) {
            boxSynth.setVerbWet(perc);
            boxParams.size.update(perc);
        } else {
            boxSynth.setDelWet(perc);
            boxParams.offset.update(perc);
        }
    }

    const xPos = width() + 30;
    function spawnNote() {
        const noteType = choose(notation);
        const duration = Number(noteType.substring(0, noteType.length - 2));
        const speed = rand(20, 31) * duration;
        const yPos = rand(cHeight - boxParams.offset.val, cHeight + boxParams.offset.val + 1);

        add([
            pos(xPos, yPos),
            sprite(noteType),
            anchor("center"),
            scale(boxParams.randof("size")),
            rotate(boxParams.randof("angle")),
            area(),
            move(box.pos.angle(xPos, yPos), speed),
            "note",
            {
                dur: duration,
            },
        ]);
        wait(boxParams.randof("rate"), spawnNote);
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

        if (audioEnabled) {
            if (duration < 4) {
                boxSynth.playLow(duration);
            } else {
                boxSynth.playHigh(duration);
            }
        }
    }

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
    let currDrag = null;

    onLoad(() => displayContent());
    onMousePress(() => grab("knob"));
    onMouseRelease(() => release());

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
        spriteDiameter: 241.890,
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
            rotateKnob(),
            area(),
            z(2),
            {
                min: knob.min,
                max: knob.max,
                originalScale: knob.scale,
                yOffset: lScale(knob.min, knob.max, percent),
                knobAction: action,
            },
            "knob",
            `${name}`,
        ]);
        k.onHover(() => grow(k, knob.scale));
        k.onHoverEnd(() => shrink(k, knob.scale));
    });

    // Spawn rotating ball sprites
    loadSprite("ball", `./static/graphics/misc/ball${theme}.svg`);
    const ballSprite = {
        spriteDiameter: 1200,
        diameter: ball.radius,
    };
    ballSprite.scale = ballSprite.diameter / ballSprite.spriteDiameter;

    ballParams.setup(
        ballSprite.scale, ballSynth.params.vol, ball.radius, ballSprite.diameter,
        cHeight, cWidth, ballSynth.params.verb, ballSynth.params.freq,
        ballSynth.params.pitch, ballSynth.params.dist, ballSynth.params.vib, 
    );

    for (let i = 0; i < 4; i++) {
        add([
            sprite("ball"),
            anchor("center"),
            pos(center().add(Vec2.fromAngle(90 * i).scale(ballParams.radius.val))),
            scale(ballParams.size.val),
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
        ballSprite.orbPos += dt() * ballParams.speed.val;
        const xPos = cWidth + ballParams.radius.val * Math.cos(ballSprite.orbPos);
        const yPos = cHeight + (ballParams.radius.val - ballParams.oblong.val) * Math.sin(ballSprite.orbPos);

        if (ballSprite.pos.y < cHeight) {
            ballSprite.z = -1;
        } else {
            ballSprite.z = 1;
        }

        ballSprite.pos.x = xPos + rand(-ballParams.deviation.val, ballParams.deviation.val);
        ballSprite.pos.y = yPos + rand(-ballParams.deviation.val, ballParams.deviation.val);
        ballSprite.angle += ballParams.rotation.val * dt();
    });

    function action(perc) {
        if (this.is("pitch")) {
            ballSynth.setPitch(perc);
            ballParams.speed.update(perc);
        } else if (this.is("freq")) {
            ballSynth.setFreq(perc);
            ballParams.oblong.update(perc);
        } else if (this.is("dist")) {
            ballSynth.setDist(perc);
            ballParams.deviation.update(perc);
        } else if (this.is("vib")) {
            ballSynth.setVibFreq(perc);
            ballSynth.setVibDepth(perc);
            ballParams.rotation.update(perc);
        } else if (this.is("verb")) {
            ballSynth.setVerbWet(perc);
            ballParams.radius.update(perc);
            ballParams.coordinateOblongWithRadius(ball.radius);
        } else {
            ballSynth.setVol(perc);
            ballParams.size.update(perc);
            const balls = get("ballSprite");
            balls.forEach(orbitingBall => {
                orbitingBall.scale = ballParams.size.val;
            });
        }
    }

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
    let currDrag = null;

    onLoad(() => displayContent());
    onMousePress(() => mousePress(currDrag, "knob"));
    onMouseRelease(() => mouseRelease(currDrag));

    const theme = getTheme();
    const fgColor = theme == "dark" ? WHITE : BLACK;
    drawBackground(theme);

    loadSprite("starOutline", `./static/graphics/shapes/staroutline${theme}.svg`);
    loadSprite("star", `./static/graphics/shapes/star${theme}.svg`);
    loadSprite("arrow", `./static/graphics/misc/arrow${theme}.svg`);
    loadSprite("arrowOutline", `./static/graphics/misc/arrowoutline${theme}.svg`);
    loadSprite("skip", `./static/graphics/misc/skip${theme}.svg`);
    loadSprite("skipOpen", `./static/graphics/misc/skipopen${theme}.svg`);
    loadSprite("knob", `./static/graphics/misc/knob${theme}.svg`);

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
        region: Math.min(height(), width()) - 20,
    }
    sequenceStar.size = sequenceStar.region / 18;
    sequenceStar.pointWidth = 49.135 / 241.890 * sequenceStar.size;
    sequenceStar.margin = sequenceStar.size * 2 / 15;
    sequenceStar.xStart = cWidth - sequenceStar.margin * 7.5 - sequenceStar.size * 7.5;
    sequenceStar.yStart = height() - 64 - sequenceStar.margin - sequenceStar.size;
    sequenceStar.scale = sequenceStar.size / starSprite.size;

    const knob = {
        min: -120,
        max: 120,
    }

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

    function fillArrow(xPos, yPos, i) {
        add([
            sprite("arrow"),
            anchor("center"),
            pos(xPos, yPos),
            scale(sequenceStar.scale),
            area(),
            `arrow${i}`,
        ]);
    }

    function fillSkip(xPos, yPos, i) {
        add([
            sprite("skip"),
            anchor("center"),
            pos(xPos, yPos),
            scale(sequenceStar.scale),
            area(),
            `skip${i}`,
        ]);
    }

    function hollowSequenceStar(i, j) {
        starSynth.sequencer[i][j] = false;
        const starFilling = get(`${i}${j}`);
        destroy(starFilling[0]);
    }

    function hollowArrow(i) {
        const arrowFilling = get(`arrow${i}`);
        destroy(arrowFilling[0]);
    }

    function hollowSkip(i) {
        const skipFilling = get(`skip${i}`);
        destroy(skipFilling[0]);
    }

    // Draw sequence buttons
    for (let i = 0; i < 2; i++) {
        const yPos = sequenceStar.yStart + i * (sequenceStar.margin + sequenceStar.size)
        for (let j = 0; j < 16; j++) {
            const xPos = sequenceStar.xStart + j * (sequenceStar.size + sequenceStar.margin);
            // spawn star buttons
            if (1 < j && j < 14) {
                if (starSynth.sequencer[i][j]) fillSequenceStar(xPos, yPos, i, j);
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
            } else if (j == 0) {
                // spawn tempo knobs
                const k = add([
                    sprite("knob"),
                    anchor("center"),
                    pos(xPos, yPos),
                    scale(sequenceStar.scale),
                    area(),
                    knobDrag(),
                    "knob",
                    `${i}`,
                    {
                        yOffset: 0,
                    }

                ]);
                k.onHover(() => {
                    if (currDrag == null) {
                        k.scale = vec2(sequenceStar.scale * 1.2);
                    }
                });
                k.onHoverEnd(() => {
                    if (currDrag == null) {
                        k.scale = vec2(sequenceStar.scale);
                    }
                });
            } else if (j == 1) {
                const a = add([
                    sprite("arrowOutline"),
                    anchor("center"),
                    pos(xPos, yPos),
                    scale(sequenceStar.scale),
                    area(),
                    "arrow",
                    {
                        x: xPos,
                        y: yPos,
                        active: false,
                        i: i,
                        j: j,
                    },
                ]);
                a.onHover(() => {
                    a.scale = vec2(sequenceStar.scale * 1.1);
                    setCursor("pointer");
                });
                a.onHoverEnd(() => {
                    a.scale = vec2(sequenceStar.scale);
                    setCursor("default");
                });
                a.onClick(() => {
                    if (a.active) {
                        hollowArrow(a.i);
                    } else {
                        fillArrow(a.x, a.y, a.i);
                    }
                    a.active = !a.active;
                });
            } else if (j == 14) {
                // spawn skip buttons
                const s = add([
                    sprite("skipOpen"),
                    anchor("center"),
                    pos(xPos, yPos),
                    scale(sequenceStar.scale),
                    area(),
                    "skip",
                    {
                        x: xPos,
                        y: yPos,
                        active: false,
                        i: i,
                        j: j,
                    },
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
                        hollowSkip(s.i);
                    } else {
                        fillSkip(s.x, s.y, s.i);
                    }
                    s.active = !s.active;
                });
            } else {
                // spawn direction arrows
                const a = add([
                    sprite("arrow"),
                    anchor("center"),
                    pos(xPos, yPos),
                    scale(sequenceStar.scale),
                    rotate(90),
                    area(),
                    "direction",
                    {
                        x: xPos,
                        y: yPos,
                        active: false,
                        i: i,
                        j: j,
                    },
                ]);
                a.onHover(() => {
                    a.scale = vec2(sequenceStar.scale * 1.1);
                    setCursor("pointer");
                });
                a.onHoverEnd(() => {
                    a.scale = vec2(sequenceStar.scale);
                    setCursor("default");
                });
                a.onClick(() => {
                    if (a.active) {
                        a.angle = 90;
                    } else {
                        a.angle = -90;
                    }
                    a.active = !a.active;
                });
            }
        }
    }

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
                    this.scale = vec2(sequenceStar.scale);
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
            },
        }
    }

    // Playheads
    let topTempo = 500;
    let topStepTime = 60 / topTempo;
    let topStep = 11
    const topPlayhead = add([
        rect(sequenceStar.pointWidth, sequenceStar.pointWidth),
        anchor("center"),
        pos(sequenceStar.xStart + sequenceStar.size * 2 + sequenceStar.margin * 2, sequenceStar.yStart - sequenceStar.size * 0.8),
        color(fgColor),
    ]);

    let bottomTempo = 400;
    let bottomStepTime = 60 / bottomTempo;
    let bottomStep = 11;
    const bottomPlayhead = add([
        rect(sequenceStar.pointWidth, sequenceStar.pointWidth),
        anchor("center"),
        pos(sequenceStar.xStart + sequenceStar.size * 2 + sequenceStar.margin * 2, sequenceStar.yStart + sequenceStar.margin + sequenceStar.size * 1.8),
        color(fgColor),
    ]);

    //FIXME joint tempo button will allow both playbuttons to wait from the same function to guarantee they play together
    //when not joined, move separately
    function moveTopPlayhead() {
        topStep++;
        bottomStep++;
        if (topStep > 11) {
            topPlayhead.pos.x = sequenceStar.xStart + sequenceStar.size * 2 + sequenceStar.margin * 2;
            bottomPlayhead.pos.x = sequenceStar.xStart + sequenceStar.size * 2 + sequenceStar.margin * 2;
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