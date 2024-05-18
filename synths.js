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
    volume: 4,
    debug: false,
    envelope: {
        attack: 0.3,
        decay: 0.7,
        sustain: 0.12,
        release: 1,
    },
}).connect(distortion);
const lowPitches = [
    "C1", "G1",
    "C2", "G2", 
    "C3", "E3", "G3", 
    "C4",
];

export const boxSynth = {
    highSynth: highSynth,
    highPitches: highPitches,
    lowSynth: lowSynth,
    lowPitches: lowPitches,
    delay: {
        e: delay,
        min: 0.001,
        max: 0.99,
    },
    filter: {
        e: filter,
        min: 180,
        max: 12000,
    },
    reverb: {
        e: reverb,
        min: 0.001,
        max: 0.99,
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
    distortion: 0.3,
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
        start: () => {
            powerSynth.triggerAttack(["F2", "C3", "A3", "E4"]);
            powerSynth.trigger
        },
        stop: () => {
            powerSynth.triggerRelease(["F2", "C3", "A3", "E4"]);
        },
    },
    pitcher: {
        e: pitcher,
        min: 0,
        max: 43,
    },
    vibrato: {
        e: vibrato,
        minFreq: 1,
        maxFreq: 100,
        minDepth: 0.1,
        maxDepth: 1,
    },
    filter: {
        e: filter2,
        min: 200,
        max: 14000,
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
}