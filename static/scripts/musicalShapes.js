import {
    boxSynth, ballSynth, starSynth, starSequencer,
} from "./synths.js";
import {
    choose, getTheme, randBipolar, saveToContainer, knobify,
} from "./utils.js";
import {
    moveSlider, moveKnob, grab, release, grow, shrink, fill, hollow, fillOrHollow, flip, pressButton,
} from "./interactables.js";
import {
    boxParams, ballParams,
} from "./params.js";

let currShape = "square";
let audioEnabled = false;

const elems = {
    audioBtn: document.getElementById("audio-button"),
    squareBtn: document.getElementById("square"),
    circleBtn: document.getElementById("circle"),
    starBtn: document.getElementById("star"),
    themeBtn: document.getElementById("theme-toggle"),
}

elems.squareBtn.addEventListener("click", () => changeShape("square"));
elems.circleBtn.addEventListener("click", () => changeShape("circle"));
elems.starBtn.addEventListener("click", () => changeShape("star"));
elems.themeBtn.addEventListener("click", () => updateScene());

elems.audioBtn.addEventListener("click", () => {
    const theme = getTheme();
    if (!audioEnabled) {
        Tone.start();
        elems.audioBtn.innerHTML = `<img src="./static/graphics/icons/volume${theme}.svg"></img>`;
        audioEnabled = true;
    } else {
        elems.audioBtn.innerHTML = `<img src="./static/graphics/icons/novolume${theme}.svg"></img>`;
        audioEnabled = false;
        Tone.Transport.stop();
    }
});

document.addEventListener('DOMContentLoaded', () => {
    const theme = getTheme();
    if (Tone.context.state === "running") {
        elems.audioBtn.innerHTML = `<img src="./static/graphics/icons/volume${theme}.svg"></img>`;
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
    elems.themeBtn.innerHTML = `<img src="./static/graphics/icons/${theme}.svg"></img>`;
    elems.squareBtn.innerHTML = `<img src="./static/graphics/shapes/squareoutline${theme}.svg"></img>`;
    elems.circleBtn.innerHTML = `<img src="./static/graphics/shapes/circleoutline${theme}.svg"></img>`;
    elems.starBtn.innerHTML = `<img src="./static/graphics/shapes/staroutline${theme}.svg"></img>`;
    elems.audioBtn.innerHTML = `<img src="./static/graphics/icons/${audioEnabled ? "" : "no"}volume${theme}.svg"></img>`;

    if (currShape == "square") {
        elems.squareBtn.innerHTML = `<img src="./static/graphics/shapes/square${theme}.svg"></img>`;
        if (refreshScene) go("musicBox");
    } else if (currShape == "circle") {
        elems.circleBtn.innerHTML = `<img src="./static/graphics/shapes/circle${theme}.svg"></img>`;
        if (refreshScene) go("musicBall");
    } else {
        elems.starBtn.innerHTML = `<img src="./static/graphics/shapes/star${theme}.svg"></img>`;
        if (refreshScene) go("musicStar");
    }
}

const notation = [
    "1n1",
    "2n1", "2n2",
    "4n1", "4n2",
    "8n1", "8n2", "8n3", "8n4",
    "16n1", "16n2", "16n3",
    "32n1", "32n2",
];
function loadNotationSprites(theme) {
    notation.forEach((note) => {
        loadSprite(note, `./static/graphics/notation/${note}${theme}.png`);
    });
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

    onMousePress(() => grab("slider"));
    onMouseRelease(() => release());

    // Draw black background if dark mode enabled
    const theme = getTheme();
    const bgColor = theme == "dark" ? BLACK : WHITE;
    const fgColor = theme == "dark" ? WHITE : BLACK;
    drawBackground(theme);
    loadNotationSprites(theme);

    boxParams.setup(cHeight);

    // Center box
    const boxSize = baseShapeSize();
    const boxHalf = boxSize / 2;
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
    slider.left = cWidth - boxHalf + slider.size / 2;
    slider.right = cWidth + boxHalf - slider.size / 2;
    slider.range = slider.right - slider.left;
    
    Object.entries(boxSynth.params).forEach(([param, percent], i) => {
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
            moveSlider(),
            "slider",
            {
                param: param,
                min: slider.left,
                max: slider.right,
                currVal: slider.left + percent * slider.range,
                originalScale: 1,
                sliderAction: updateParams,
            },
        ]);
        sliderBox.onHover(() => grow(sliderBox, "grab"));
        sliderBox.onHoverEnd(() => shrink(sliderBox, "default"));
    });

    function updateParams(perc) {
        switch (this.param) {
            case "rate":
                boxParams.rate.update(perc);
                break;
            case "freq":
                boxSynth.setFreq(perc);
                boxParams.angle.update(perc);
                break;
            case "verb":
                boxSynth.setVerbWet(perc);
                boxParams.size.update(perc);
                break;
            default:
                boxSynth.setDelWet(perc);
                boxParams.offset.update(perc);
        }
    }

    const xPos = width() + 30;
    function spawnNote() {
        const noteType = choose(notation);
        const duration = Number(noteType.substring(0, noteType.length - 2));
        const speed = rand(20, 31) * duration;
        const yPos = randBipolar(cHeight, boxParams.offset.val);

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
        let rectSize = boxHalf / duration;
        if (rectSize < 2) rectSize = 2;
        const rectHalf = rectSize / 2;
        add([
            rect(rectSize, rectSize),
            anchor("center"),
            pos(
                randBipolar(cWidth, boxHalf - rectHalf - 2),
                randBipolar(cHeight, boxHalf - rectHalf - 2),
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
        if (audioEnabled) {
            boxSynth.stop();
        }
        saveToContainer(boxSynth.params, get("slider"));
    });
});

//
// Music Ball
//
scene("musicBall", () => {
    const {x: cWidth, y: cHeight} = center();
    const twoPI = 2 * Math.PI;

    onMousePress(() => grab("knob"));
    onMouseRelease(() => release());

    // Draw black background if dark mode enabled
    const theme = getTheme();
    const fgColor = theme === "dark" ? WHITE : BLACK;
    drawBackground(theme);

    loadNotationSprites(theme);
    loadSprite("knob", `./static/graphics/misc/knob${theme}.svg`);
    loadSprite("ball", `./static/graphics/misc/ball${theme}.svg`);

    // Center circle
    const ball = add([
        circle(baseShapeSize() / 2),
        anchor("center"),
        pos(center()),
        color(fgColor),
        "musicBall",
    ]);
    
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

    Object.entries(ballSynth.params).forEach(([param, percent], i) => {
        const k = add([
            sprite("knob"),
            anchor("center"),
            pos(knob.xStart + knob.diameter * 1.25 * i, knob.y),
            scale(knob.scale),
            moveKnob(),
            area(),
            z(2),
            {
                param: param, 
                min: knob.min,
                max: knob.max,
                currVal: knobify(percent),
                originalScale: knob.scale,
                knobAction: updateParams,
            },
            "knob",
        ]);
        k.onHover(() => grow(k, "grab"));
        k.onHoverEnd(() => shrink(k, "default"));
        k.angle = knobify(percent);
    });

    // Spawn rotating ball sprites
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

    // Orbiting ball
    const b = add([
        sprite("ball"),
        anchor("center"),
        pos(cWidth - ballParams.radius.val, cHeight),
        scale(ballParams.size.val),
        rotate(0),
        z(1),
        {
            orbPos: Math.PI,
        },
    ]);
    b.onUpdate(() => {
        b.orbPos = (b.orbPos + dt() * ballParams.speed.val) % twoPI;
        b.pos = vec2(
            cWidth + ballParams.radius.val * Math.cos(b.orbPos) + randBipolar(0, ballParams.deviation.val),
            cHeight + (ballParams.radius.val - ballParams.oblong.val) * Math.sin(b.orbPos) + randBipolar(0, ballParams.deviation.val),
        );
        b.z = b.pos.y < cHeight ? -1 : 1;
        b.angle = (b.angle + ballParams.rotation.val * dt()) % 360;
    });

    const loop = new Tone.Loop(play, "8m").start(0);
    Tone.Transport.bpm.value = 60;
    Tone.Transport.start();

    function play(time) {
        ballSynth.playNotes(time);
        Tone.Draw.schedule((time) => {
            drawSpirallingNote();
        }, time);
    }

    function drawSpirallingNote() {
        const n = add([
            sprite(choose(notation)),
            pos(center()),
            anchor("center"),
            scale(0.034),
            z(2),
            rotate(0),
            lifespan(42),
            {
                orbPos: b.orbPos + Math.PI,
                radius: 0,
            },
        ]);
        n.onUpdate(() => {
            n.orbPos = (n.orbPos + dt() * ballParams.speed.val) % twoPI;
            n.pos = vec2(
                cWidth + n.radius * Math.cos(n.orbPos) + randBipolar(0, ballParams.deviation.val),
                cHeight + Math.max(n.radius - ballParams.oblong.val, 0) * Math.sin(n.orbPos) + randBipolar(0, ballParams.deviation.val),
            );
            n.radius += 0.05;
            n.z = n.pos.y < cHeight ? -2 : 2;
            n.angle = (n.angle + ballParams.rotation.val * dt()) % 360;
        });
    }

    function updateParams(perc) {
        switch (this.param) {
            case "pitch":
                ballSynth.setPitch(perc);
                ballParams.speed.update(perc);
                break;
            case "freq":
                ballSynth.setFreq(perc);
                ballParams.oblong.update(perc);
                break;
            case "dist":
                ballSynth.setDist(perc);
                ballParams.deviation.update(perc);
                break;
            case "vib":
                ballSynth.setVibFreq(perc);
                ballSynth.setVibDepth(perc);
                ballParams.rotation.update(perc);
                break;
            case "verb":
                ballSynth.setVerbWet(perc);
                ballParams.radius.update(perc);
                ballParams.coordinateOblongWithRadius(ball.radius);
                break;
            default:
                ballSynth.setVol(perc);
                ballParams.size.update(perc);
                b.scale = ballParams.size.val;
        }
    }

    // Stop synth and save knob data
    onSceneLeave(() => {
        if (audioEnabled) {
            ballSynth.stop();
            loop.stop();
            Tone.Transport.stop();
        }
        saveToContainer(ballSynth.params, get("knob"));
    });
});

//
// Music Star
//
scene("musicStar", () => {
    const {x: cWidth, y: cHeight} = center();
    const top = 0;
    const bot = 1;

    onMousePress(() => grab("knob"));
    onMouseRelease(() => release());

    const theme = getTheme();
    const fgColor = theme == "dark" ? WHITE : BLACK;
    drawBackground(theme);

    loadSprite("dodecagram", `./static/graphics/shapes/dodecagram${theme}.svg`);
    loadSprite("starOutline", `./static/graphics/shapes/staroutline${theme}.svg`);
    loadSprite("star", `./static/graphics/shapes/star${theme}.svg`);
    loadSprite("reverse", `./static/graphics/misc/arrow${theme}.svg`);
    loadSprite("reverseOutline", `./static/graphics/misc/arrowoutline${theme}.svg`);
    loadSprite("restart", `./static/graphics/misc/arrow${theme}.svg`);
    loadSprite("restartOutline", `./static/graphics/misc/arrowoutline${theme}.svg`);
    loadSprite("skip", `./static/graphics/misc/skip${theme}.svg`);
    loadSprite("skipOutline", `./static/graphics/misc/skipopen${theme}.svg`);
    loadSprite("arp", `./static/graphics/misc/doublearrow${theme}.svg`);
    loadSprite("arpOutline", `./static/graphics/misc/doublearrowoutline${theme}.svg`);
    loadSprite("knob", `./static/graphics/misc/knob${theme}.svg`);

    // Center star
    const starSprite = {
        size: 241.890,
        pointWidth: 49.135,
    };
    const musicStarSize = baseShapeSize();
    const starScale = musicStarSize / starSprite.size;
    add([
        sprite("dodecagram"),
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
    sequenceStar.stepSize = sequenceStar.size + sequenceStar.margin;
    sequenceStar.xStart = cWidth - sequenceStar.margin * 7.5 - sequenceStar.size * 7.5;
    sequenceStar.yStart = height() - sequenceStar.stepSize * 3;
    sequenceStar.scale = sequenceStar.size / starSprite.size;
    sequenceStar.playheadStart = sequenceStar.xStart + sequenceStar.size * 2 + sequenceStar.margin * 2;

    const knob = {
        min: -120,
        max: 120,
    }

    function drawMatchStar(x, y, type, i, j, onPress, currState) {
        const s = add([
            sprite("starOutline"),
            anchor("center"),
            pos(x, y),
            scale(sequenceStar.scale),
            area(),
            {
                originalScale: sequenceStar.scale,
                active: currState,
                name: "star",
                type: type,
                i: i,
                j: j,
                onPress: onPress,
            },
            `${type}${i}${j}`,
        ]);
        s.onHover(() => grow(s, "pointer"));
        s.onHoverEnd(() => shrink(s, "default"));
        s.onClick(() => pressButton(s, fillOrHollow));
        if (s.active) fill(s);
    }

    drawMatchStar(
        sequenceStar.xStart, sequenceStar.yStart - sequenceStar.stepSize * 1.5,
        "tempo", 3, 1,
        toggleMatchTempo, starSequencer.match.tempo,
    );
    drawMatchStar(
        sequenceStar.xStart + 15 * sequenceStar.stepSize, sequenceStar.yStart - sequenceStar.stepSize * 1.5,
        "freq", 3, 2,
        toggleMatchFreq, starSequencer.match.freq,
    );

    // Draw parameter knobs
    for (let i = 0; i < 2; i++) {
        let yPos = sequenceStar.yStart - (2 - i) * sequenceStar.stepSize;
        for (let j = 17; j < 19; j++) {
            const xPos = sequenceStar.xStart + sequenceStar.stepSize + (j - 17) * 13 * sequenceStar.stepSize;
            const angle = knobify(j == 17 ? starSequencer.getTempoPercent(i) : starSequencer.getFreqPercent(i));
            const k = add([
                sprite("knob"),
                anchor("center"),
                pos(xPos, yPos),
                scale(sequenceStar.scale),
                area(),
                moveKnob(),
                "knob",
                j == 17 ? `temp${i}` : `freq${i}`,
                {
                    min: knob.min,
                    max: knob.max,
                    i: i,
                    currVal: angle,
                    originalScale: sequenceStar.scale,
                    knobAction: j == 17 ? updateTempo : updateFreq,
                },
            ]);
            k.onHover(() => grow(k, "grab"));
            k.onHoverEnd(() => shrink(k, "default"));
            k.angle = angle;
        }
    }

    function getBaseSprite(j) {
        switch (j) {
            case -2:
                return "skip";
            case -1:
                return "restart";
            case 12:
                return "reverse";
            case 13:
                return "arp";
            default:
                return "star";
        }
    }

    function isActive(sprite, i, j) {
        return (sprite == "star" && starSequencer.get(i, j))
        || (sprite == "arp" && starSequencer[i].arp)
        || (sprite == "skip" && starSequencer[i].skip)
        || (sprite == "restart" && starSequencer[i].restart) 
        || (sprite == "reverse" && starSequencer[i].reverse);
    }

    // Draw sequencer buttons and step options
    for (let i = 0; i < 2; i++) {
        const yPos = sequenceStar.yStart + i * sequenceStar.stepSize;
        for (let j = -2; j < 14; j++) {
            const xPos = sequenceStar.xStart + (j + 2) * sequenceStar.stepSize;
            const baseSprite = getBaseSprite(j);
            const b = add([
                sprite(`${baseSprite}Outline`),
                anchor("center"),
                pos(xPos, yPos),
                scale(sequenceStar.scale),
                area(),
                {
                    originalScale: sequenceStar.scale,
                    name: baseSprite,
                    active: isActive(baseSprite, i, j),
                    i: i,
                    j: j,
                    onPress: updateSequencer,
                },
                `${baseSprite}${i}${j}`,
            ]);
            if (baseSprite == "reverse") b.angle = -90;
            b.onHover(() => grow(b, "pointer"));
            b.onHoverEnd(() => shrink(b, "default"));
            b.onClick(() => baseSprite == "reverse" ? pressButton(b, flip) : pressButton(b, fillOrHollow));
            if (b.active) baseSprite == "reverse" ? flip(b) : fill(b);

            // Draw match star for each step option pair
            if (i == 1 && (j < 0 || j > 11)) {
                drawMatchStar(
                    xPos, yPos + sequenceStar.stepSize,
                    baseSprite, 3, j,
                    toggleSequencerMatches, starSequencer.match[baseSprite],
                );
            }
        }
    }

    const topPlayhead = add([
        rect(sequenceStar.pointWidth, sequenceStar.pointWidth),
        anchor("center"),
        pos(sequenceStar.xStart + sequenceStar.size * 2 + sequenceStar.margin * 2, sequenceStar.yStart - sequenceStar.size * 0.8),
        color(fgColor),
        {
            i: top,
            elapsedTime: 0,
            step: 11,
            arp: false,
            prevStep: -1,
        }
    ]);
    topPlayhead.onUpdate(() => movePlayhead(topPlayhead));

    const botPlayhead = add([
        rect(sequenceStar.pointWidth, sequenceStar.pointWidth),
        anchor("center"),
        pos(sequenceStar.xStart + sequenceStar.size * 2 + sequenceStar.margin * 2, sequenceStar.yStart + sequenceStar.margin + sequenceStar.size * 1.8),
        color(fgColor),
        {
            i: bot,
            elapsedTime: 0,
            step: 11,
        }
    ]);
    botPlayhead.onUpdate(() => movePlayhead(botPlayhead));

    function iOp(i) {
        return i ^ 1;
    }

    function updateSequencer() {
        if (this.name == "star") {
            starSequencer.toggle(this.i, this.j);
        } else {
            starSequencer[this.i][this.name] = !starSequencer[this.i][this.name];
            if (starSequencer.match[this.name]) {
                matchSequencerButtons(this.name, this.i, this.j);
            }
        }
    }

    function toggleSequencerMatches() {
        starSequencer.match[this.type] = !starSequencer.match[this.type];
        matchSequencerButtons(this.type, top, this.j);
    }

    function matchSequencerButtons(type, i, j) {
        const iOther = iOp(i);
        const oldState = starSequencer[iOther][type];
        const newState = starSequencer[i][type];
        if (oldState != newState) {
            starSequencer[iOther][type] = newState;
            const otherButton = get(`${type}${iOther}${j}`)[0];
            type == "reverse" ? flip(otherButton) : fillOrHollow(otherButton);
        }
    }

    function updateTempo(perc) {
        starSequencer.updateTempo(this.i, perc);
        if (starSequencer.match.tempo) {
            matchTempo(this.i);
        }
    }

    function updateFreq(perc) {
        starSynth.updateFreq(this.i, perc);
        if (starSequencer.match.freq) {
            matchFreq(this.i);
        }
    }

    function toggleMatchTempo() {
        starSequencer.match.tempo = !starSequencer.match.tempo;
        matchTempo(top);
        matchTiming();
    }

    function toggleMatchFreq() {
        starSequencer.match.freq = !starSequencer.match.freq;
        matchFreq(top);
    }
    
    function matchTempo(i) {
        const iOther = iOp(i);
        starSequencer[iOther].tempo = starSequencer[i].tempo;
        const newAngle = get(`temp${i}`)[0].currVal;
        const otherKnob = get(`temp${iOther}`)[0];
        otherKnob.currVal = newAngle;
        otherKnob.angle = newAngle;
    }

    function matchFreq(i) {
        const iOther = iOp(i);
        starSynth.matchFreq(iOther);
        const newAngle = get(`freq${i}`)[0].currVal;
        const otherKnob = get(`freq${iOther}`)[0];
        otherKnob.currVal = newAngle;
        otherKnob.angle = newAngle;
    }

    function matchTiming() {
        botPlayhead.elapsedTime = topPlayhead.elapsedTime;
    }

    function adjustArpDir(level, step, dir) {
        if ((dir == -1 && step == 0) || (dir == 1 && step == 11)) {
            dir *= -1;
            starSequencer[level].reverse = dir == 1 ? false : true;
        }
        return dir;
    }

    function getNextStep(level, step) {
        const seq = starSequencer[level];
        let dir = seq.reverse ? -1 : 1;
        const arp = seq.arp;
        const skipReq = arp ? 1 : 0;
        if (seq.skip && seq.activeSteps > skipReq) {
            const prevStep = step;
            do {
                if (arp) {
                    dir = adjustArpDir(level, step, dir);
                }
                step = (step + dir + 12) % 12;
            } while (!starSequencer.get(level, step) || (arp && step == prevStep));
            return step;
        }
        if (arp) {
            dir = adjustArpDir(level, step, dir);
        }
        return (step + dir + 12) % 12;
    }

    function movePlayhead(ph) {
        ph.elapsedTime += dt();
        const interval = 60 / starSequencer[ph.i].tempo;
        if (ph.elapsedTime >= interval) {
            ph.elapsedTime -= interval;
            if (starSequencer[ph.i].restart) {
                ph.step = 11;
                starSequencer[ph.i].restart = false;
                hollow(get(`restart${ph.i}${-1}`)[0]);
            }
            ph.step = getNextStep(ph.i, ph.step);
            ph.pos.x = sequenceStar.playheadStart + (ph.step * sequenceStar.stepSize);
            if (starSequencer.get(ph.i, ph.step) && audioEnabled) {
                starSynth.play(ph.i, ph.step);
            }
        }
    }
});

go("musicBox");