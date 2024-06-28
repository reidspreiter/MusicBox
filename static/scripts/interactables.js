import { clamp, percify } from "./utils.js";

let currDrag = null;

export function grab(objName) {
    if (!currDrag) {
        for (const obj of get(objName)) {
            if (obj.isHovering()) {
                obj.pick();
            }
        }
    }
}

export function release() {
    if (currDrag) {
        currDrag.drop(currDrag);
    }
}

export function grow(obj, cursorType = undefined) {
    if (currDrag == null) {
        obj.scale = vec2(obj.originalScale * 1.1);
    }
    if (cursorType != undefined) {
        if (currDrag == null) {
            setCursor(cursorType);
        }
    }
}

export function shrink(obj, cursorType = undefined) {
    if (currDrag == null) {
        obj.scale = vec2(obj.originalScale);
    }
    if (cursorType != undefined) {
        if (currDrag == null) {
            setCursor(cursorType);
        }
    }
}

export function moveSlider() {
    let xOffset = 0;
    return {
        id: "drag",
        require: ["pos", "area"],
        pick() {
            currDrag = this;
            setCursor("grabbing");
            xOffset = mousePos().x - this.pos.x;
        },
        drop() {
            currDrag = null;
            if (!this.isHovering()) {
                shrink(this);
                setCursor("default");
            } else {
                setCursor("grab");
            }
        },
        update() {
            if (currDrag !== this) {
                return;
            }
            const newXPos = clamp(this.min, this.max, mousePos().x - xOffset);
            if (this.pos.x != newXPos) {
                const perc = percify(this.min, this.max, newXPos);
                this.pos.x = newXPos;
                this.currVal = newXPos;
                this.sliderAction(perc);
            }
        },
    }
}

const sensitivity = 3;
export function moveKnob() {
    let yOffset = 0;
    return {
        id: "rotate",
        require: ["pos", "area"],
        pick() {
            currDrag = this;
            setCursor("grabbing");
            yOffset = -(mousePos().y * sensitivity) - this.currVal;
        },
        drop() {
            currDrag = null;
            if (!this.isHovering()) {
                shrink(this);
                setCursor("default");
            } else {
                setCursor("grab");
            }
        },
        update() {
            if (currDrag !== this) {
                return;
            }
            const newAngle = clamp(this.min, this.max, -(mousePos().y * sensitivity) - yOffset);
            if (this.angle != newAngle) {
                this.angle = newAngle;
                this.currVal = newAngle;
                const perc = percify(this.min, this.max, newAngle);
                this.knobAction(perc);
            }
        },
    }
}

export function fill(obj) {
        add([
            sprite(obj.fillSprite),
            anchor("center"),
            pos(obj.pos),
            scale(obj.originalScale),
            `${obj.i}${obj.j}`,
        ]);
    }

function hollow(obj) {
    const filling = get(`${obj.i}${obj.j}`);
    destroy(filling[0]);
}

export function fillOrHollow(obj) {
    if (obj.active) {
        hollow(obj);
    } else {
        fill(obj);
    }
    obj.active = !obj.active;
    if ("onStateChange" in obj) {
        obj.onStateChange();
    }
}

export function flip(obj) {
    if (obj.active) {
        obj.angle = -90;
    } else {
        obj.angle = 90;
    }
    obj.active = !obj.active;
    if ("onStateChange" in obj) {
        obj.onStateChange();
    }
}