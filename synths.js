import { choose, eScale, lScale } from "./utils.js";

//
// Music box synths and effects
//
const reverb = new Tone.Reverb({
    wet: 0.7,
    roomSize: 8,
    preDelay: 0.1,
    decay: 16,
}).toDestination();

const filter = new Tone.Filter({
    type: "lowpass",
    frequency: 12000,
}).connect(reverb);

const delay = new Tone.PingPongDelay({
    delayTime: "4n",
    feedback: 0.6,
    wet: 0.7,
}).connect(filter);

const distortion = new Tone.Distortion({
    distortion: 0.3,
}).connect(filter);

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
}).connect(delay);
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
    delay: {
        min: 0.001,
        max: 0.99,
        setWet: (val) => {
            delay.wet.value = val;
        },
    },
    filter: {
        min: 180,
        max: 12000,
        setFreq: (val) => {
            filter.frequency.rampTo(val, 0.1);
        },
    },
    reverb: {
        min: 0.001,
        max: 0.99,
        setWet: (val) => {
            reverb.wet.value = val;
        },
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
    reset: () => {
        filter.frequency.rampTo(12000, 0.1);
        reverb.wet.value = 0.7;
        delay.wet.value = 0.7;
    },
}

//
// Music ball synths and effects
//
const reverb2 = new Tone.Reverb({
    wet: 0.5,
    roomSize: 8,
    preDelay: 0.1,
    decay: 16,
}).toDestination();

const filter2 = new Tone.Filter({
    type: "lowpass",
    frequency: 12000,
}).connect(reverb2);

const distortion2 = new Tone.Distortion({
    distortion: 0.01,
}).connect(filter2);

const vibrato = new Tone.Vibrato({
    frequency: 5,
    depth: 0.1,
}).connect(distortion2);

const pitcher = new Tone.PitchShift({
    pitch: 0,
    windowSize: 1,
    delayTime: 0,
}).connect(vibrato);

const powerSynth = new Tone.PolySynth(Tone.Synth, {
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
}).connect(pitcher);

export const ballSynth = {
    synth: {
        e: powerSynth,
        minVol: -38,
        maxVol: 0,
    },
    pitcher: {
        min: 0,
        max: 43,
        setPitch: (val) => {
            pitcher.pitch = val;
        },
    },
    vibrato: {
        e: vibrato,
        minFreq: 1,
        maxFreq: 100,
        minDepth: 0.1,
        maxDepth: 0.6,
    },
    filter: {
        min: 200,
        max: 14000,
        setFreq: (val) => {
            filter2.frequency.rampTo(val, 0.1);
        },
    },
    distortion: {
        e: distortion2,
        min: 0.01,
        max: 1,
    },
    reverb: {
        e: reverb2,
        min: 0.001,
        max: 0.99,
    },
    start: () => {
        powerSynth.triggerAttack(["F2", "C3", "A3", "E4"]);
    },
    stop: () => {
        powerSynth.triggerRelease(["F2", "C3", "A3", "E4"]);
    },
    reset: () => {
        distortion2.distortion = 0.01;
        powerSynth.volume.value = -8;
        pitcher.pitch = 0;
        vibrato.frequency.value = 5;
        vibrato.depth.value = 0.1;
        filter2.frequency.rampTo(12000, 0.1);
        reverb2.wet.value = 0.5;
    },
}