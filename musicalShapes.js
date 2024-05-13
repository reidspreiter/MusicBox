// Remove enable audio button if already enabled
document.addEventListener('DOMContentLoaded', () => {
    if (Tone.context.state === "running") {
        document.getElementById("audioButton").classList.add("hide");
    }
});

// Initialize Kaboom
kaboom({
    canvas: document.getElementById("homeCanvas"), 
    background: [255, 255, 255],
});

// Manage shape select buttons
let currShape = 1;
function changeShape(shape) {
    if (currShape === shape) {
        return;
    }
    const header = document.getElementById("header");
    const squareButton = document.getElementById("square");
    const circleButton = document.getElementById("circle");
    const starButton = document.getElementById("star");
    squareButton.innerHTML = "&#128927;";
    circleButton.innerHTML = "&#128901;";
    starButton.innerHTML = "&#128949;";
    if (shape === 1) {
        go("musicBox");
        squareButton.innerHTML = "&#128915;";
        header.innerText = "Music Box";
        currShape = shape;
    } else if (shape === 2) {
        go("musicBall");
        circleButton.innerHTML = "&#128905;";
        header.innerText = "Music Ball";
        currShape = shape;
    } else {
        go("musicStar");
        starButton.innerHTML = "&#128954;";
        header.innerText = "Music Star";
        currShape = shape;
    }
}

// Initialize Tone
function startAudio() {
    Tone.start();
    document.getElementById("audioButton").classList.add("hide");
}

// Align percentages to a specific scale exponentially
function expRangeAdjust(min, max, percentage) {
    return min + Math.pow(percentage, 2) * (max - min);
}

// Align percentages to a specific scale linearly
function linearRangeAdjust(min, max, percentage) {
    return min + percentage * (max - min);
}

// Restrict values to a min and max
function clamp(value, min, max) {
    return Math.min(max, Math.max(value, min));
}

// Center height and width values
const cWidth = width() / 2;
const cHeight = height() / 2;

//
// Music Box
//
scene("musicBox", () => {

    // Initialize Effects
    const reverbMin = 0.001;
    const reverbMax = 0.99;
    const reverb = new Tone.Reverb({
        wet: 0.7,
        roomSize: 2,
        preDelay: 0.1,
        decay: 8,
    }).toDestination();

    const filterMin = 300;
    const filterMax = 12000;
    const filter = new Tone.Filter({
        type: "lowpass",
        frequency: 12000,
    }).connect(reverb);

    const delayMin = 0.001;
    const delayMax = 0.99;
    const delay = new Tone.PingPongDelay({
        delayTime: "4n",
        feedback: 0.6,
        wet: 0.7,
    }).connect(filter);

    const distortion = new Tone.Distortion({
        distortion: 0.3,
    }).connect(filter);

    // Initialize synths
    const highSynth = new Tone.PolySynth(Tone.Synth, {
        oscillator: "sin",
        volume: -16,
        maxPolyphony: 4,
        debug: false,
        envelope: {
            attack: 0.01,
            decay: 0.5,
            sustain: 0.1,
            release: 0.3,
        },
    }).connect(delay);

    const lowSynth = new Tone.Synth({
        oscillator: "sawtooth",
        volume: -20,
        debug: false,
        envelope: {
            attack: 0.3,
            decay: 0.7,
            sustain: 0.12,
            release: 1,
        },
    }).connect(distortion);

    // Playable pitches for each note duration
    const shortPitches = [ 
        "B3", 
        "C4", "D4", "E4", "G4", "B4",
        "D5", "E5", "F#5", "G5", "A5", "B5", 
        "D6", "E6", "F#6", "A6",
    ];
    const longPitches = [
        "C2", "G2", 
        "C3", "E3", "G3", 
        "C4",
    ];

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
    const musicBoxSize = width() > height() ? width() / 8 : height() / 8;
    const boxHalf = musicBoxSize / 2;
    const boxLeft = cWidth - boxHalf;
    const boxRight = cWidth + boxHalf;
    const boxTop = cHeight - boxHalf;
    const boxBottom = cHeight + boxHalf;
    const musicBox = add([
        rect(musicBoxSize, musicBoxSize),
        anchor("center"),
        pos(center()),
        color(0, 0, 0),
        area(),
        "musicBox"
    ]);
    musicBox.onCollide("note", (note) => {
        playNote(note.dur);
    });

    // Destroy notes off screen
    const leftBound = add([
        rect(1, height()),
        pos(-30, 0),
        area(),
        color(0, 0, 0)
    ]);
    leftBound.onCollide("note", (note) => {
        destroy(note);
    });

    // Recursively spawn notes based on slider values
    const lowSpawnMin = 0.05;
    const lowSpawnMax = 1;
    const highSpawnMin = 0.1;
    const highSpawnMax = 2;
    let minWait = expRangeAdjust(lowSpawnMin, lowSpawnMax, 0.5);
    let maxWait = expRangeAdjust(highSpawnMin, highSpawnMax, 0.5)

    const yOffsetMin = 10;
    const yOffsetMax = cHeight - 10;
    let yOffset = expRangeAdjust(yOffsetMin, yOffsetMax, 0.7);

    const lowScaleMin = 0.015;
    const lowScaleMax = 0.027;
    const highScaleMin = 0.025;
    const highScaleMax = 0.046;
    let minScale = expRangeAdjust(lowScaleMin, lowScaleMax, 0.3);
    let maxScale = expRangeAdjust(highScaleMin, highScaleMax, 0.3);

    const lowRotMin = -110;
    const lowRotMax = -25;
    const highRotMin = -55;
    const highRotMax = 25;
    let minRot = -25;
    let maxRot = 25;

    const xPos = width() + 30;
    function spawnNote() {
        const noteType = choose(notation);
        const duration = Number(noteType.substring(0, noteType.length - 2));
        const speed = rand(20, 31) * duration;
        const yPos = rand(cHeight - yOffset, cHeight + yOffset + 1);

        add([
            pos(xPos, yPos),
            sprite(noteType),
            anchor("center"),
            scale(rand(minScale, maxScale)),
            rotate(rand(minRot, maxRot)),
            area(),
            move(musicBox.pos.angle(xPos, yPos), speed),
            "note",
            {
                dur: duration,
            },
        ]);
        wait(rand(minWait, maxWait), spawnNote);
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
                rand(boxLeft + rectHalf + 2, boxRight - rectHalf - 2),
                rand(boxTop + rectHalf + 2, boxBottom - rectHalf - 2),
            ),
            lifespan(1 / (duration + 1) + 0.1),
            z(1),
            color(255, 255, 255),
            outline(1, (0, 0, 0)),
        ]);

        if (Tone.context.state === "running") {
            if (duration < 4) {
                lowSynth.triggerAttackRelease(choose(longPitches), `${duration}n`);
            } else {
                highSynth.triggerAttackRelease(choose(shortPitches), `${duration}n`);
            }
        }
    }

    // Slider slides
    const sliderLeftEdge = cWidth - (musicBoxSize / 1.5) / 2;
    const sliderRightEdge = cWidth + (musicBoxSize / 1.5) / 2;
    const sliderRange = sliderRightEdge - sliderLeftEdge;
    const sliderStartY = height() - height() / 5;

    for (let i = 0; i < 4; i++) {
        add([
            rect(musicBoxSize / 1.5, 2),
            color(0, 0, 0),
            anchor("center"),
            pos(cWidth, sliderStartY + 30 * i),
        ]);
    }

    // Spawn slider boxes
    const sliderParams = [
        {type: "rate", initPerc: 0.5},
        {type: "freq", initPerc: 0.7},
        {type: "verb", initPerc: 0.7},
        {type: "delay", initPerc: 0.7},
    ];
    for (let i = 0; i < sliderParams.length; i++) {
        const sliderBox = add([
            rect(musicBoxSize / 1.5 / 8, 15),
            color(0, 0, 0),
            anchor("center"),
            pos(sliderLeftEdge + sliderParams[i].initPerc * sliderRange, sliderStartY + 30 * i),
            area(),
            sliderDrag(),
            "slider",
            `${sliderParams[i].type}`
        ]);
        sliderBox.onHover(() => {
            setCursor("move");
        });
    }

    // Handle slider box drag
    let curDraggin = null;
    function sliderDrag() {
        let xOffset = 0;
        return {
            id: "drag",
            require: ["pos", "area"],
            pick() {
                curDraggin = this;
                xOffset = mousePos().x - this.pos.x;
            },
            update() {
                if (curDraggin === this) {
                    const newXPos = clamp(mousePos().x - xOffset, sliderLeftEdge, sliderRightEdge);
                    const perc = (newXPos - sliderLeftEdge) / sliderRange;
                    this.pos.x = newXPos;

                    if (this.is("rate")) {
                        minWait = expRangeAdjust(lowSpawnMin, lowSpawnMax, 1 - perc);
                        maxWait = expRangeAdjust(highSpawnMin, highSpawnMax, 1 - perc);
                    } else if (this.is("freq")) {
                        const newFreq = expRangeAdjust(filterMin, filterMax, perc);
                        filter.frequency.rampTo(newFreq, 0.1);
                        if (perc < 0.5) {
                            minRot = expRangeAdjust(lowRotMin, lowRotMax, perc);
                            maxRot = expRangeAdjust(highRotMin, highRotMax, perc);
                        } else {
                            minRot = -25;
                            maxRot = 25;
                        }
                    } else if (this.is("verb")) {
                        reverb.wet.value = expRangeAdjust(reverbMin, reverbMax, perc);
                        minScale = expRangeAdjust(lowScaleMin, lowScaleMax, 1 - perc);
                        maxScale = expRangeAdjust(highScaleMin, highScaleMax, 1 - perc);
                    } else {
                        delay.wet.value = expRangeAdjust(delayMin, delayMax, perc);
                        yOffset = expRangeAdjust(yOffsetMin, yOffsetMax, perc);
                    }
                }
            },
        }
    }

    // Grab slider to drag if hovered
    onMousePress(() => {
        if (!curDraggin) {
            for (const obj of get("slider")) {
                if (obj.isHovering()) {
                    obj.pick();
                    break;
                }
            }
        }
    });

    // Drop slider on mouse release
    onMouseRelease(() => {
        if (curDraggin) {
            curDraggin = null;
            setCursor("default");
        }
    });
});

//
// Music Ball
//
scene("musicBall", () => {
    // Black center circle
    const musicBallRadius = width() > height() ? width() / 16 : height() / 16;
    add([
        circle(musicBallRadius),
        anchor("center"),
        pos(center()),
        color(0, 0, 0),
        area(),
        "musicBall"
    ]);

    // Knobs
    loadSprite("knob", `./knobs/knob.png`);
    const knobSpriteHeightpx = 605;
    const knobWidthBasedDiameter = width() / 3 / 5;
    const knobDiameter = width() > height() * 1.3 ? knobWidthBasedDiameter : musicBallRadius * 2;
    const knobScaleVal = knobDiameter / knobSpriteHeightpx;
    const knobStartx = cWidth - knobDiameter / 8 - knobDiameter - knobDiameter / 4 - knobDiameter / 2;
    const knobStarty = height() - knobDiameter;

    const knobParams = [
        {type: "pitch", initPerc: 0},
        {type: "freq", initPerc: 0.7},
        {type: "distortion", initPerc: 0.3},
        {type: "bit", initPerc: 0.2},
    ];
    for (let i = 0; i < knobParams.length; i++) {
        const knob = add([
            sprite("knob"),
            anchor("center"),
            pos(knobStartx + (knobDiameter + knobDiameter / 4) * i, knobStarty),
            rotate(linearRangeAdjust(-120, 120, knobParams[i].initPerc)),
            scale(knobScaleVal),
            knobDrag(),
            area(),
            {
                yOffset: linearRangeAdjust(-120, 120, knobParams[i].initPerc),
            },
            "knob",
            `${knobParams[i].type}`,
        ]);
        knob.onHover(() => {
            setCursor("move");
        });
    }

    // Handle knob rotation
    let curDraggin = null;
    const sensitivity = 3;
    function knobDrag() {
        let yOffset = 0;
        return {
            id: "drag",
            require: ["pos", "area"],
            pick() {
                curDraggin = this;
                yOffset = -(mousePos().y * sensitivity) - this.yOffset;
            },
            update() {
                if (curDraggin === this) {
                    const newAngle = clamp(-(mousePos().y * sensitivity) - yOffset, -120, 120);
                    this.angle = newAngle;
                    this.yOffset = newAngle;
                }
            },
        }
    }

    // Grab knob to turn if hovered
    onMousePress(() => {
        if (!curDraggin) {
            for (const obj of get("knob")) {
                if (obj.isHovering()) {
                    obj.pick();
                    break;
                }
            }
        }
    });

    // Drop knob on mouse release
    onMouseRelease(() => {
        if (curDraggin) {
            curDraggin = null;
            setCursor("default");
        }
    });
});

//
// Music Star
//
scene("musicStar", () => {
    // Draw a 6 pointed asterisk
    function drawStar(size, xPos, yPos) {
        const starWeight = size / 6;
        for (let angle = 0; angle <= 120; angle += 60) {
            add([
                anchor("center"),
                rect(starWeight, size),
                pos(xPos, yPos),
                color(0, 0, 0),
                rotate(angle),
            ]);
        }
    }

    // Black center star
    const musicStarSize = width() > height() ? width() / 8 : height() / 8;
    drawStar(musicStarSize, width() / 2, height() / 2);
});

go("musicBox");