import { choose, eScale, lScale } from "./utils.js";

//
// Music box synths and effects
//
const reverb = {
    e: new Tone.Reverb({
        wet: 0.7,
        roomSize: 8,
        preDelay: 0.1,
        decay: 16,
    }).toDestination(),
    min: 0.001,
    max: 0.99,
};

const filter = {
    e: new Tone.Filter({
        type: "lowpass",
        frequency: 12000,
    }).connect(reverb.e),
    min: 180,
    max: 12000,
};

const delay = {
    e: new Tone.PingPongDelay({
        delayTime: "4n",
        feedback: 0.6,
        wet: 0.7,
    }).connect(filter.e),
    min: 0.001,
    max: 0.99,
};

const distortion = new Tone.Distortion({
    distortion: 0.3,
}).connect(filter.e);

const highSynth = new Tone.PolySynth(Tone.Synth, {
    oscillator: {
        type: "sine",
    },
    volume: -16,
    maxPolyphony: 4,
    debug: false,
    envelope: {
        attack: 0.01,
        decay: 0.5,
        sustain: 0.1,
        release: 0.3,
    },
}).connect(delay.e);
const highPitches = [ 
    "B3", 
    "C4", "D4", "E4", "G4", "B4",
    "D5", "E5", "F#5", "G5", "A5", "B5", 
    "D6", "E6", "F#6", "A6",
];

const lowSynth = new Tone.Synth({
    oscillator: {
        type: "triangle",
    },
    volume: -14,
    debug: false,
    envelope: {
        attack: 0.3,
        decay: 0.7,
        sustain: 0.12,
        release: 1,
    },
}).connect(distortion);
const lowPitches = [
    "C2", "F2", "G2", "A2", 
    "C3", "E3", "G3", 
    "C4",
];

export const boxSynth = {
    params: {
        rate: 0.5,
        freq: 0.7,
        verb: 0.7,
        delay: 0.7,
    },
    setDelWet: (perc) => {
        delay.e.wet.value = eScale(delay.min, delay.max, perc);
    },
    setFreq: (perc) => {
        filter.e.frequency.rampTo(eScale(filter.min, filter.max, perc), 0.1);
    },
    setVerbWet: (perc) => {
        reverb.e.wet.value = eScale(reverb.min, reverb.max, perc);
    },
    playHigh: (duration) => {
        highSynth.triggerAttackRelease(choose(highPitches), `${duration}n`);
    },
    playLow: (duration) => {
        lowSynth.triggerAttackRelease(choose(lowPitches), `${duration}n`);
    },
    stop: () => {
        highSynth.triggerRelease();
        lowSynth.triggerRelease();
    },
};

//
// Music ball synths and effects
//
const reverb2 = {
    e: new Tone.Reverb({
        wet: 0.5,
        roomSize: 8,
        preDelay: 0.1,
        decay: 16,
    }).toDestination(),
    min: 0.001,
    max: 0.99,
};

const filter2 = {
    e: new Tone.Filter({
        type: "lowpass",
        frequency: 12000,
    }).connect(reverb2.e),
    min: 200,
    max: 14000,
};

const distortion2 = {
    e: new Tone.Distortion({
        distortion: 0.01,
    }).connect(filter2.e),
    min: 0.01,
    max: 1,
};

const vibrato = {
    e: new Tone.Vibrato({
        frequency: 5,
        depth: 0.1,
    }).connect(distortion2.e),
    minFreq: 1,
    maxFreq: 100,
    minDepth: 0.1,
    maxDepth: 0.6,
};

const pitcher = {
    e: new Tone.PitchShift({
        pitch: 0,
        windowSize: 1,
        delayTime: 0,
    }).connect(vibrato.e),
    min: 0,
    max: 43,
};

const powerSynth = {
    e: new Tone.PolySynth(Tone.Synth, {
        oscillator: {
            type: "sawtooth4",
        },
        volume: -8,
        maxPolyphony: 4,
        debug: false,
        envelope: {
            attack: 1,
            decay: 0.1,
            sustain: 0.3,
            release: 1,
        },
    }).connect(pitcher.e),
    minVol: -38,
    maxVol: 0,
};

export const ballSynth = {
    params: {
        pitch: 0,
        freq: 0.8,
        dist: 0,
        vib: 0.1,
        verb: 0.5,
        vol: 0.95,
    },
    setVol: (perc) => {
        powerSynth.e.volume.value = lScale(powerSynth.minVol, powerSynth.maxVol, perc);
    },
    setPitch: (perc) => {
        pitcher.e.pitch = lScale(pitcher.min, pitcher.max, perc);
    },
    setVibFreq: (perc) => {
        vibrato.e.frequency.value = eScale(vibrato.minFreq, vibrato.maxFreq, perc);
    },
    setVibDepth: (perc) => {
        vibrato.e.depth.value = eScale(vibrato.minDepth, vibrato.maxDepth, perc);
    },
    setFreq: (perc) => {
        filter2.e.frequency.rampTo(eScale(filter2.min, filter2.max, perc), 0.1);
    },
    setDist: (perc) => {
        distortion2.e.distortion = lScale(distortion2.min, distortion2.max, perc);
    },
    setVerbWet: (perc) => {
        reverb2.e.wet.value = eScale(reverb2.min, reverb2.max, perc);
    },
    start: () => {
        powerSynth.e.triggerAttack(["C2", "G2", "E3", "B3"]);
    },
    stop: () => {
        powerSynth.e.triggerRelease(["C2", "G2", "E3", "B3"]);
    },
};

//
// Music Star synths and effects
//

const topPitches = ["F4", "G4", "Ab4", "Bb4", "C5", "D5", "Eb5", "F5", "G5", "Bb5", "Ab5", "C6"];
const bottomPitches = ["F2", "Bb2", "C3", "Eb3", "F3", "Bb3", "C4", "D4", "Eb4", "D4", "C4", "G3"];

const sequencer = [
    Array(12).fill(false),
    Array(12).fill(false),
];
sequencer[0][0] = true;
sequencer[1][5] = true;

const topSynth = new Tone.Synth({
    oscillator: {
        type: "sawtooth",
    },
    volume: -16,
    maxPolyphony: 4,
    envelope: {
        attack: 0.01,
        decay: 0.5,
        sustain: 0.1,
        release: 0.3,
    },
}).toDestination();

const bottomSynth = new Tone.Synth({
    oscillator: {
        type: "sawtooth",
    },
    volume: -16,
    maxPolyphony: 4,
    envelope: {
        attack: 0.01,
        decay: 0.5,
        sustain: 0.1,
        release: 0.3,
    },
}).toDestination();

export const starSynth = {
    sequencer: sequencer,
    playTop: (step) => {
        topSynth.triggerAttackRelease(topPitches[step], "4n");
    },
    playBottom: (step) => {
        bottomSynth.triggerAttackRelease(bottomPitches[step], "4n");
    },
}