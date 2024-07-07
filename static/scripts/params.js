import { eScale, lScale } from "./utils.js";

export const boxParams = {
    rate: {
        lMin: 0.05,
        lMax: 1,
        uMin: 0.1,
        uMax: 2,
        update: function(perc) {
            this.lVal = eScale(this.lMin, this.lMax, 1 - perc);
            this.uVal = eScale(this.uMin, this.uMax, 1 - perc);
        },
    },
    offset: {
        min: 10,
        max: 10,
        update: function(perc) {
            this.val = eScale(this.min, this.max, perc);
        },
    },
    size: {
        lMin: 0.015,
        lMax: 0.027,
        uMin: 0.025,
        uMax: 0.046,
        update: function(perc) {
            this.lVal = eScale(this.lMin, this.lMax, 1 - perc);
            this.uVal = eScale(this.uMin, this.uMax, 1 - perc);
        },
    },
    angle: {
        lMin: -110,
        lMax: -25,
        uMin: -55,
        uMax: 25,
        lVal: -25,
        uVal: 25,
        update: function(perc) {
            if (perc <= 0.6) {
                const newPerc = map(perc, 0, 0.6, 0, 1);
                this.lVal = lScale(this.lMin, this.lMax, newPerc);
                this.uVal = lScale(this.uMin, this.uMax, newPerc);
            }
        },
    },
    randof: function(param) {
        return rand(this[param].lVal, this[param].uVal);
    },
    setup: function(cHeight) {
        this.offset.max = cHeight - 10;
        this.rate.update(0.5);
        this.offset.update(0.7);
        this.size.update(0.3);
    },
};

export const ballParams = {
    size: {
        min: 0,
        max: 0,
        update: function(perc) {
            this.val = lScale(this.min, this.max, perc);
        },
    },
    radius: {
        min: 0,
        max: 0,
        update: function(perc) {
            this.val = lScale(this.min, this.max, perc);
        },
    },
    oblong: {
        min: 0,
        max: 0,
        perc: 0,
        update: function(perc) {
            this.perc = 1 - perc;
            this.val = lScale(this.min, this.max, this.perc);
        },
        reflectRadius: function(currRadius, ballRadius) {
            this.max = currRadius - ballRadius / 2;
            this.val = lScale(this.min, this.max, this.perc);
        },
    },
    coordinateOblongWithRadius: function(ballRadius) {
        this.oblong.reflectRadius(this.radius.val, ballRadius);
    },
    speed: {
        min: 0.2,
        max: 20,
        update: function(perc) {
            this.val = lScale(this.min, this.max, perc);
        },
    },
    deviation: {
        min: 0,
        max: 0,
        update: function(perc) {
            this.val = eScale(this.min, this.max, perc);
        },
    },
    rotation: {
        min: 40,
        max: 2000,
        update: function(perc) {
            this.val = lScale(this.min, this.max, perc);
        },
    },
    setup: function(spriteScale, currVol, ballRadius, spriteDiameter, cHeight, cWidth, currVerb, currFreq, currPitch, currDist, currVib) {
        this.size.min = spriteScale / 10;
        this.size.max = spriteScale;
        this.size.update(currVol);
        this.radius.min = ballRadius + spriteDiameter / 1.5;
        this.radius.max = Math.min(cHeight, cWidth) + 50;
        this.radius.update(currVerb);
        this.coordinateOblongWithRadius(ballRadius);
        this.oblong.update(currFreq);
        this.speed.update(currPitch);
        this.deviation.max = spriteDiameter * 2;
        this.deviation.update(currDist);
        this.rotation.update(currVib);
    },
}

export const starParams = {
    noteSpacing: {
        min: 0,
        max: 0,
        0: {
            perc: 0,
        },
        1: {
            perc: 0,
        },
        updatePerc: function(level, perc) {
            this[level].perc = perc;
        },
        getDist: function(level, max) {
            const trueDist = lScale(this.min, this.max, this[level].perc);
            if (trueDist > max - 35) {
                return max - 35;
            }
            return trueDist;
        },
    },
    setup: function(musicStarSize, cWidth, cHeight, topFreqPerc, botFreqPerc) {
        this.noteSpacing.min = musicStarSize / 2 + 35;
        this.noteSpacing.max = Math.max(cWidth, cHeight) - 35;
        this.noteSpacing.updatePerc(0, topFreqPerc);
        this.noteSpacing.updatePerc(1, botFreqPerc);
    },
}
