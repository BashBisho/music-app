

export function format(time) {
    return `${String(Math.floor(time/60)).padStart(2, "0")}:${String(Math.floor(time%60)).padStart(2, "0")}`
}

export function getFontSize(text, fontSize = 24, startSize=10, multiplier=3.8) {

    return text.length > startSize ? fontSize - text.length/multiplier : fontSize;
}