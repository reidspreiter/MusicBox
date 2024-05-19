// Align percentages to a specific scale exponentially
export function eScale(min, max, percent) {
    return min + Math.pow(percent, 2) * (max - min);
}

// Align percentages to a specific scale linearly
export function lScale(min, max, percent) {
    return min + percent * (max - min);
}

// Restrict values to a min and max
export function clamp(value, min, max) {
    return Math.min(max, Math.max(value, min));
}

// Calculate percentage of range
export function percify(value, min, max) {
    return (value - min) / (max - min);
}

// Choose random item from list
export function choose(list) {
    return list[Math.floor((Math.random() * list.length))];
}