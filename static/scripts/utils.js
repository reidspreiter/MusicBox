// Align percentages to a specific scale exponentially
export function eScale(min, max, percent) {
    return min + Math.pow(percent, 2) * (max - min);
}

// Align percentages to a specific scale linearly
export function lScale(min, max, percent) {
    return min + percent * (max - min);
}

// Restrict values to a min and max
export function clamp(min, max, value) {
    return Math.min(max, Math.max(value, min));
}

// calculate percentage of range
export function percify(min, max, value) {
    return (value - min) / (max - min);
}

// Choose random item from list
export function choose(list) {
    return list[Math.floor((Math.random() * list.length))];
}

// Get the current theme of the document
export function getTheme() {
    return document.documentElement.getAttribute("data-theme");
}

export function randBipolar(center, offset) {
    return rand(center - offset, center + offset);
}

export function saveToContainer(container, objs) {
    objs.forEach(obj => {
        if (obj.param in container) {
            container[obj.param] = percify(obj.min, obj.max, obj.currVal);
        }
    });
}

export function knobify(perc) {
    return lScale(-120, 120, perc);
}