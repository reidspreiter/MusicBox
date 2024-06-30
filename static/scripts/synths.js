import { choose, eScale, lScale, fScale, percify } from "./utils.js";

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
        frequency: 20000,
        Q: 4,
    }).connect(reverb.e),
    min: 180,
    max: 20000,
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
        filter.e.frequency.rampTo(fScale(filter.min, filter.max, perc), 0.1);
    },
    setVerbWet: (perc) => {
        reverb.e.wet.value = eScale(reverb.min, reverb.max, perc);
    },
    playHigh: (duration) => {
        highSynth.triggerAttackRelease(choose(highPitches), `${duration}n`, "+0.05");
    },
    playLow: (duration) => {
        lowSynth.triggerAttackRelease(choose(lowPitches), `${duration}n`, "+0.05");
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
        frequency: 20000,
        Q: 7,
    }).connect(reverb2.e),
    min: 180,
    max: 20000,
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
        maxPolyphony: 3,
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
        filter2.e.frequency.rampTo(fScale(filter2.min, filter2.max, perc), 0.1);
    },
    setDist: (perc) => {
        distortion2.e.distortion = lScale(distortion2.min, distortion2.max, perc);
    },
    setVerbWet: (perc) => {
        reverb2.e.wet.value = eScale(reverb2.min, reverb2.max, perc);
    },
    playNotes: (time) => {
        powerSynth.e.triggerAttackRelease(["C2", "B2", "E3"], "8m");
    },
    stop: () => {
        powerSynth.e.triggerRelease(["C2", "B2", "E3"]);
    },
};

//
// Music Star synths and effects
//

const tempo = {
    min: 40,
    max: 1000,
    init: 200,
}

const topPitches = ["F4", "G4", "Ab4", "Bb4", "C5", "D5", "Eb5", "F5", "G5", "Bb5", "Ab5", "C6"];
const botPitches = ["F2", "Bb2", "C3", "Eb3", "F3", "Bb3", "C4", "D4", "Eb4", "D4", "C4", "G3"];

export const starSequencer = {
    matchTempo: true,
    matchFreq: true,
    0: {
        skip: false,
        reverse: false,
        restart: false,
        arp: false,
        tempo: tempo.init,
        freq: 100,
        activeSteps: 0,
        lowestStep: 0,
        highestStep: 0,
        0: Array(12).fill(false),
    },
    1: {
        skip: false,
        reverse: false,
        restart: false,
        arp: false,
        tempo: tempo.init,
        freq: 100,
        activeSteps: 0,
        lowestStep: 0,
        highestStep: 0,
        1: Array(12).fill(false),
    },
    toggle: function(i, j) {
        this[i][i][j] = !this[i][i][j];
        this[i].activeSteps += (this[i][i][j] ? 1 : - 1);
    },
    get: function(i, j) {
        return this[i][i][j];
    },
    updateTempo: function(i, perc) {
        this[i].tempo = lScale(tempo.min, tempo.max, perc);
    },
    getTempoPercent: function(i) {
        return percify(tempo.min, tempo.max, this[i].tempo);
    },
    getFreqPercent: function(i) {
        return 0;
    }
};
starSequencer.toggle(0, 0);
starSequencer.toggle(1, 6);

const starReverb = new Tone.Reverb({
    wet: 0.3,
    roomSize: 1,
    preDelay: 0.1,
    decay: 2,
}).toDestination();

const topFilter = {
    e: new Tone.Filter({
        type: "lowpass",
        frequency: 300,
        Q: 10,
    }).connect(starReverb),
    min: 180,
    max: 20000,
};

const botFilter = {
    e: new Tone.Filter({
        type: "lowpass",
        frequency: 300,
        Q: 10,
    }).connect(starReverb),
    min: 180,
    max: 20000,
};


const topSynth = new Tone.Synth({
    oscillator: {
        type: "sawtooth",
    },
    volume: -17,
    maxPolyphony: 4,
    envelope: {
        attack: 0.01,
        decay: 0,
        sustain: 0.1,
        release: 0.1,
    },
}).connect(topFilter.e);

const botSynth = new Tone.Synth({
    oscillator: {
        type: "sawtooth",
    },
    volume: -12,
    maxPolyphony: 4,
    envelope: {
        attack: 0.01,
        decay: 0,
        sustain: 0.1,
        release: 0.1,
    },
}).connect(botFilter.e);

export const starSynth = {
    play: (level, step) => {
        if (level == 0) {
            topSynth.triggerAttackRelease(topPitches[step], "32n");
        } else {
            botSynth.triggerAttackRelease(botPitches[step], "32n");
        }
    },
    updateFreq: (level, perc) => {
        if (level == 0) {
            topFilter.e.frequency.rampTo(fScale(topFilter.min, topFilter.max, perc))
        } else {
            botFilter.e.frequency.rampTo(fScale(botFilter.min, botFilter.max, perc))
        }
    }
}