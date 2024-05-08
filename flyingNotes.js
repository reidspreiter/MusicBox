// Remove enable audio button if already enabled
document.addEventListener('DOMContentLoaded', () => {
    if (Tone.context.state === "running") {
        document.getElementById("audioButton").classList.add("hide");
    }
});

// Initialize Tone
function startAudio() {
    Tone.start();
    document.getElementById("audioButton").classList.add("hide");
}

// Clamp percentage to a given scale
function getSliderValue(min, max, percentage) {
    return min + Math.pow(percentage, 2) * (max - min);
}

// Initialize Kaboom
kaboom({
    canvas: document.getElementById("homeCanvas"), 
    background: [255, 255, 255],
});

// Home page scene
scene("flyingNotes", () => {
    const cWidth = width() / 2;
    const cHeight = height() / 2;

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
    const musicBox = add([
        rect(musicBoxSize, musicBoxSize),
        anchor("center"),
        pos(center()),
        color(0, 0, 0),
        area(),
        "musicBox"
    ]);

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

    // Recursively spawn notes
    const lowSpawnMin = 0.01;
    const lowSpawnMax = 1;
    const highSpawnMin = 0.05;
    const highSpawnMax = 2;
    let spawnSliderPerc = 0.5;

    const yOffsetMin = 10;
    const yOffsetMax = cHeight - 10;
    let yOffset = getSliderValue(yOffsetMin, yOffsetMax, 0.7);

    // FIXME somehow find a way to edit opacity
    const opacityMin = 0.1;
    const opacityMax = 1.0;
    let opacity = getSliderValue(opacityMin, opacityMax, 0.7);

    function spawnNote() {
        const noteType = choose(notation);
        const duration = noteType.substring(0, noteType.length - 2);
        const speed = rand(20, 31) * duration;
        const xPos = width() + 30;
        const yPos = rand(cHeight - yOffset, cHeight + yOffset + 1);

        const note = add([
            pos(xPos, yPos),
            sprite(noteType),
            anchor("center"),
            scale(rand(0.02, 0.041)),
            rotate(rand(-25, 26)),
            area(),
            move(musicBox.pos.angle(xPos, yPos), speed),
            "note",
        ]);

        note.onCollide("musicBox", () => {
            playNote(duration);
        });

        wait(rand(
            getSliderValue(lowSpawnMin, spawnSliderPerc, lowSpawnMax), 
            getSliderValue(highSpawnMin, spawnSliderPerc, highSpawnMax),  
        ), spawnNote);
    }
    spawnNote();

    // Update music box and play note
    function playNote(duration) {
        const boxHalf = musicBoxSize / 2;
        const rectSize = boxHalf / duration;
        const rectHalf = rectSize / 2;
        add([
            rect(rectSize, rectSize),
            anchor("center"),
            pos(cWidth + rand(-boxHalf + 2 + rectHalf, boxHalf - 2 - rectHalf), cHeight + rand(-boxHalf + 2 + rectHalf, boxHalf - 2 - rectHalf)),
            lifespan(1 / (duration + 1) + 0.2),
            z(1),
            color(255, 255, 255),
            outline(1, (0, 0, 0)),
        ]);

        if (Tone.context.state === "running") {
            if (Number(duration) < 4) {
                lowSynth.triggerAttackRelease(choose(longPitches), duration + "n");
            } else {
                highSynth.triggerAttackRelease(choose(shortPitches), duration + "n");
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

    // Handle slider box drag
    let curDraggin = null;
    function drag() {
        let offset = vec2(0);
        return {
            id: "drag",
            require: ["pos", "area"],
            pick() {
                curDraggin = this;
                offset = mousePos().sub(this.pos)
                this.trigger("drag")
            },
            update() {
                if (curDraggin === this) {
                    let newPos = mousePos().sub(offset);
                    newPos.x = Math.min(Math.max(newPos.x, sliderLeftEdge), sliderRightEdge);
                    newPos.y = this.pos.y;
                    const perc = (newPos.x - sliderLeftEdge) / sliderRange;
                    this.pos = newPos;

                    if (this.is("rate")) {
                        spawnSliderPerc = 1 - perc;
                    } else if (this.is("freq")) {
                        const newFreq = getSliderValue(filterMin, filterMax, perc);
                        filter.frequency.rampTo(newFreq, 0.1);
                    } else if (this.is("verb")) {
                        reverb.wet.value = getSliderValue(reverbMin, reverbMax, perc);
                    } else {
                        delay.wet.value = getSliderValue(delayMin, delayMax, perc);
                        yOffset = getSliderValue(yOffsetMin, yOffsetMax, perc);
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
            curDraggin.trigger("dragEnd");
            curDraggin = null;
            setCursor("default");
        }
    });
    
    // Spawn slider boxes
    const sliderParams = [
        {type: "rate", initPerc: 0.5},
        {type: "freq", initPerc: 0.7},
        {type: "verb", initPerc: 0.7},
        {type: "delay", initPerc: 0.7},
    ];
    for (let i = 0; i < 4; i++) {
        const sliderBox = add([
            rect(musicBoxSize / 1.5 / 8, 15),
            color(0, 0, 0),
            anchor("center"),
            pos(sliderLeftEdge + sliderParams[i].initPerc * sliderRange, sliderStartY + 30 * i),
            area(),
            drag(),
            "slider",
            `${sliderParams[i].type}`
        ]);
        sliderBox.onHover(() => {
            setCursor("move");
        });
    }
});

go("flyingNotes");