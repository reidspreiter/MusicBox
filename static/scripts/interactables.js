import { clamp, percify } from "./utils.js";

let currDrag = null;

export function grab(objName) {
    if (!currDrag) {
        for (const obj of get(objName)) {
            if (obj.isHovering()) {
                setCursor("move");
                obj.pick();
            }
        }
    }
}

export function release() {
    if (currDrag) {
        currDrag.drop(currDrag);
        setCursor("default");
    }
}

export function grow(obj) {
    if (currDrag == null) {
        obj.scale = vec2(obj.originalScale * 1.1);
    }
}

export function shrink(obj) {
    if (currDrag == null) {
        obj.scale = vec2(obj.originalScale);
    }
}

export function dragSlider() {
    let xOffset = 0;
    return {
        id: "drag",
        require: ["pos", "area"],
        pick() {
            currDrag = this;
            xOffset = mousePos().x - this.pos.x;
        },
        drop() {
            currDrag = null;
            if (!this.isHovering()) {
                shrink(this);
            }
        },
        update() {
            if (currDrag !== this) {
                return;
            }
            const newXPos = clamp(this.min, this.max, mousePos().x - xOffset);
            const perc = percify(this.min, this.max, newXPos);
            this.pos.x = newXPos;
            this.sliderAction(perc);
        },
    }
}

const sensitivity = 3;
export function rotateKnob() {
    let yOffset = 0;
    return {
        id: "rotate",
        require: ["pos", "area"],
        pick() {
            currDrag = this;
            yOffset = -(mousePos().y * sensitivity) - this.yOffset;
        },
        drop() {
            currDrag = null;
            if (!this.isHovering()) {
                shrink(this);
            }
        },
        update() {
            if (currDrag !== this) {
                return;
            }
            const newAngle = clamp(this.min, this.max, -(mousePos().y * sensitivity) - yOffset);
            this.angle = newAngle;
            this.yOffset = newAngle;
            const perc = percify(this.min, this.max, newAngle);
            this.knobAction(perc);
        },
    }
}