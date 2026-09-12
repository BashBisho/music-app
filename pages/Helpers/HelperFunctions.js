

export default function format(time) {
    return `${String(Math.floor(time/60)).padStart(2, "0")}:${String(Math.floor(time%60)).padStart(2, "0")}`
}