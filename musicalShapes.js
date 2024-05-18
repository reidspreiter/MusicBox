import { boxSynth, ballSynth } from './synths.js';

// Remove enable audio button if already enabled
const audioButton = document.getElementById("audioButton");
document.addEventListener('DOMContentLoaded', () => {
    if (Tone.context.state === "running") {
        audioButton.classList.add("hide");
    }
});

// Initialize Kaboom
kaboom({
    canvas: document.getElementById("homeCanvas"), 
    background: [255, 255, 255],
});

// Manage shape select buttons
let currShape = 2;
const squareButton = document.getElementById("square");
const circleButton = document.getElementById("circle");
const starButton = document.getElementById("star");
const header = document.getElementById("header");
const buttonDiv = document.getElementById("buttons");
squareButton.addEventListener("click", () => changeShape(1));
circleButton.addEventListener("click", () => changeShape(2));
starButton.addEventListener("click", () => changeShape(3));

function changeShape(shape) {
    if (currShape === shape) {
        return;
    }
    if (Tone.context.state === "running") {
        if (currShape == 1) {
            boxSynth.highSynth.triggerRelease();
            boxSynth.lowSynth.triggerRelease();
        } else if (currShape == 2) {
            ballSynth.synth.stop();
        }
    }
    
    squareButton.innerHTML = "&#128927;";
    circleButton.innerHTML = "&#128901;";
    starButton.innerHTML = "&#128949;";
    if (shape == 1) {
        go("musicBox");
        squareButton.innerHTML = "&#128915;";
        header.innerText = "Music Box";
    } else if (shape == 2) {
        go("musicBall");
        circleButton.innerHTML = "&#128905;";
        header.innerText = "Music Ball";
    } else {
        go("musicStar");
        starButton.innerHTML = "&#128954;";
        header.innerText = "Music Star";
    }
    currShape = shape;
}

// Initialize Tone.js
audioButton.addEventListener("click", () => {
    Tone.start();
    audioButton.classList.add("hide");

    if (currShape == 2) {
        ballSynth.synth.start();
    }
});

// Align percentages to a specific scale exponentially
function eScale(min, max, percent) {
    return min + Math.pow(percent, 2) * (max - min);
}

// Align percentages to a specific scale linearly
function lScale(min, max, percent) {
    return min + percent * (max - min);
}

// Restrict values to a min and max
function clamp(value, min, max) {
    return Math.min(max, Math.max(value, min));
}

// Calculate percentage of range
function percify(value, min, max) {
    return (value - min) / (max - min);
}

//
// Music Box
//
scene("musicBox", () => {
    const {x: cWidth, y: cHeight} = center();

    // Display html content after loading
    onLoad(() => {
        header.classList.remove("hide");
        buttonDiv.classList.remove("hide");
    });

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
        loadSprite(note, `./notation/${note}.png`);
    });

    // Black center box
    const boxSize = Math.max(width() / 8, height() / 8);
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
        color(BLACK),
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
    const sliderParams = {
        rate: 0.5,
        freq: 0.7,
        verb: 0.7,
        delay: 0.7,
    };
    const yStart = height() - height() / 5;

    Object.entries(sliderParams).forEach(([name, percent], i) => {
        add([
            rect(boxSize, 2),
            color(BLACK),
            anchor("center"),
            pos(cWidth, yStart + 30 * i),
        ]);

        const sliderBox = add([
            rect(boxSize / 8, 15),
            color(BLACK),
            anchor("center"),
            pos(boxSides.left + percent * boxSize, yStart + 30 * i),
            area(),
            sliderDrag(),
            "slider",
            `${name}`
        ]);
        sliderBox.onHover(() => {
            setCursor("move");
        });
    });

    // Recursively spawn notes based on slider values
    const rate = {
        l: {
            min: 0.05,
            max: 1,
        },
        u: {
            min: 0.1,
            max: 2,
        },
    };
    rate.lVal = eScale(rate.l.min, rate.l.max, 0.5);
    rate.uVal = eScale(rate.u.min, rate.u.max, 0.5);

    const offset = {
        min: 10,
        max: cHeight - 10,
    };
    offset.val = eScale(offset.min, offset.max, 0.7);

    const size = {
        l: {
            min: 0.015,
            max: 0.027,
        },
        u: {
            min: 0.025,
            max: 0.046,
        },
    };
    size.lVal = eScale(size.l.min, size.l.max, 0.7);
    size.uVal = eScale(size.u.min, size.u.max, 0.7);

    const angle = {
        l: {
            min: -110,
            max: -25,
        },
        u: {
            min: -55,
            max: 25,
        },
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
        const rectSize = boxHalf / duration;
        const rectHalf = rectSize / 2;
        add([
            rect(rectSize, rectSize),
            anchor("center"),
            pos(
                rand(boxSides.left + rectHalf + 2, boxSides.right - rectHalf - 2),
                rand(boxSides.top + rectHalf + 2, boxSides.bottom - rectHalf - 2),
            ),
            lifespan(1 / (duration + 1) + 0.1),
            color(WHITE),
            outline(1, BLACK),
        ]);

        if (Tone.context.state === "running") {
            if (duration < 4) {
                boxSynth.lowSynth.triggerAttackRelease(choose(boxSynth.lowPitches), `${duration}n`);
            } else {
                boxSynth.highSynth.triggerAttackRelease(choose(boxSynth.highPitches), `${duration}n`);
            }
        }
    }

    // Handle slider box drag
    let currDrag = null;
    function sliderDrag() {
        let xOffset = 0;
        return {
            id: "drag",
            require: ["pos", "area"],
            pick() {
                currDrag = this;
                xOffset = mousePos().x - this.pos.x;
            },
            update() {
                if (currDrag !== this) {
                    return;
                }
                const newXPos = clamp(mousePos().x - xOffset, boxSides.left, boxSides.right);
                const perc = (newXPos - boxSides.left) / boxSize;
                this.pos.x = newXPos;

                if (this.is("rate")) {
                    rate.lVal = eScale(rate.l.min, rate.l.max, 1 - perc);
                    rate.uVal = eScale(rate.u.min, rate.u.max, 1 - perc);
                } else if (this.is("freq")) {
                    const newFreq = eScale(boxSynth.filter.min, boxSynth.filter.max, perc);
                    boxSynth.filter.e.frequency.rampTo(newFreq, 0.1);
                    if (perc <= 0.6) {
                        const newPerc = map(perc, 0, 0.6, 0, 1);
                        angle.lVal = lScale(angle.l.min, angle.l.max, newPerc);
                        angle.uVal = lScale(angle.u.min, angle.u.max, newPerc);
                    }
                } else if (this.is("verb")) {
                    boxSynth.reverb.e.wet.value = eScale(boxSynth.reverb.min, boxSynth.reverb.max, perc);
                    size.lVal = eScale(size.l.min, size.l.max, 1 - perc);
                    size.uVal = eScale(size.u.min, size.u.max, 1 - perc);
                } else {
                    boxSynth.delay.e.wet.value = eScale(boxSynth.delay.min, boxSynth.delay.max, perc);
                    offset.val = eScale(offset.min, offset.max, perc);
                }
            },
        }
    }

    // Pick dragged objects
    onMousePress(() => {
        if (!currDrag) {
            for (const obj of get("slider")) {
                if (obj.isHovering()) {
                    obj.pick();
                    return;
                }
            }
        }
    });

    // Drop dragged objects
    onMouseRelease(() => {
        if (currDrag) {
            currDrag = null;
            setCursor("default");
        }
    });
});

//
// Music Ball
//
scene("musicBall", () => {
    const {x: cWidth, y: cHeight} = center();

    // Display html content after loading
    onLoad(() => {
        header.classList.remove("hide");
        buttonDiv.classList.remove("hide");
    });

    // Resize elements on screen size change
    onResize(() => {
        go("musicBall");
    });

    // Black center circle
    const ball = add([
        circle(Math.max(width() / 16, height() / 16)),
        anchor("center"),
        pos(center()),
        color(BLACK),
        area(),
        "musicBall",
    ]);

    // Knobs
    loadSprite("knob", `./knobs/knob.png`);
    const knobParams = {
        pitch: 0,
        freq: 0.7,
        dist: 0.3,
        vib: 0.1,
        verb: 0.5,
        vol: 0.95,
    };
    const numParams = Object.keys(knobParams).length;
    const knob = {
        spriteDiameter: 605,
        min: -120,
        max: 120,
    };
    knob.diameter = Math.min(width() / (numParams * 1.5), (cHeight - ball.radius) / 2.5);
    knob.scale = knob.diameter / knob.spriteDiameter;
    knob.y = height() - knob.diameter;
    knob.xStart = cWidth - knob.diameter * 3 - knob.diameter / 8;

    Object.entries(knobParams).forEach(([name, percent], i) => {
        const k = add([
            sprite("knob"),
            anchor("center"),
            pos(knob.xStart + knob.diameter * 1.25 * i, knob.y),
            rotate(lScale(knob.min, knob.max, percent)),
            scale(knob.scale),
            knobDrag(),
            area(),
            {
                yOffset: lScale(knob.min, knob.max, percent),
            },
            "knob",
            `${name}`,
        ]);
        k.onHover(() => {
            setCursor("move");
        });
    });

    if (Tone.context.state === "running") {
        ballSynth.synth.start();
    }

    // Handle knob rotation
    let currDrag = null;
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
            update() {
                if (currDrag !== this) {
                    return;
                }
                const newAngle = clamp(-(mousePos().y * sensitivity) - yOffset, knob.min, knob.max);
                this.angle = newAngle;
                this.yOffset = newAngle;
                const perc = percify(newAngle, knob.min, knob.max);

                if (this.is("pitch")) {
                    ballSynth.pitcher.e.pitch = lScale(ballSynth.pitcher.min, ballSynth.pitcher.max, perc);
                } else if (this.is("freq")) {
                    const newFreq = eScale(ballSynth.filter.min, ballSynth.filter.max, perc);
                    ballSynth.filter.e.frequency.rampTo(newFreq, 0.1);
                } else if (this.is("dist")) {
                    ballSynth.distortion.e.distortion = lScale(ballSynth.distortion.min, ballSynth.distortion.max, perc);
                } else if (this.is("vib")) {
                    ballSynth.vibrato.e.frequency.value = eScale(ballSynth.vibrato.minFreq, ballSynth.vibrato.maxFreq, perc);
                    ballSynth.vibrato.e.depth.value = eScale(ballSynth.vibrato.minDepth, ballSynth.vibrato.maxDepth, perc);
                } else if (this.is("verb")) {
                    ballSynth.reverb.e.wet.value = eScale(ballSynth.reverb.min, ballSynth.reverb.max, perc);
                } else {
                    ballSynth.synth.e.volume.value = lScale(ballSynth.synth.minVol, ballSynth.synth.maxVol, perc);
                }
            },
        }
    }

    // Pick dragged objects
    onMousePress(() => {
        if (!currDrag) {
            for (const obj of get("knob")) {
                if (obj.isHovering()) {
                    obj.pick();
                    return;
                }
            }
        }
    });

    // Drop dragged objects
    onMouseRelease(() => {
        if (currDrag) {
            currDrag = null;
            setCursor("default");
        }
    });
});

//
// Music Star
//
scene("musicStar", () => {
    const {x: cWidth, y: cHeight} = center();

    // Resize elements on screen size change
    onResize(() => {
        go("musicStar");
    });

    // Draw a 6 pointed asterisk
    function drawStar(size, xPos, yPos) {
        const starWeight = size / 6;
        for (let angle = 0; angle <= 120; angle += 60) {
            add([
                anchor("center"),
                rect(starWeight, size),
                pos(xPos, yPos),
                color(BLACK),
                rotate(angle),
            ]);
        }
    }

    // Black center star
    const musicStarSize = width() > height() ? width() / 8 : height() / 8;
    drawStar(musicStarSize, width() / 2, height() / 2);
});

go("musicBall");