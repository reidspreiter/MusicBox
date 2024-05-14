//
// Music box synths and effects
//
const reverb = new Tone.Reverb({
    wet: 0.7,
    roomSize: 2,
    preDelay: 0.1,
    decay: 8,
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
const highPitches = [ 
    "B3", 
    "C4", "D4", "E4", "G4", "B4",
    "D5", "E5", "F#5", "G5", "A5", "B5", 
    "D6", "E6", "F#6", "A6",
];

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
const lowPitches = [
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
        min: 300,
        max: 12000,
    },
    reverb: {
        e: reverb,
        min: 0.001,
        max: 0.99,
    },
}