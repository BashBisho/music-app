import TcpSocket from "react-native-tcp-socket";

let socket;
let artworkBuffer = "";
export function getPort() {
    return 8080;
}

let callback = null;
let currIp = null;
export function connectToPhone(ip, onState) {
    currIp = ip;
    callback = onState;
    console.log(currIp, callback);

    socket = TcpSocket.createConnection({
        host: ip,
        port: getPort()
    }, () => {
        console.log("Connected to phone");
    });

    let buffer = "";

    socket.on("data", data => {
        buffer += data.toString();

        let newlineIndex;

        while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
            const message = buffer.slice(0, newlineIndex);
            buffer = buffer.slice(newlineIndex + 1);

            if (!message) continue;

            try {
                const data = JSON.parse(message);

                if (data.type === "artwork-start") {
                    artworkBuffer = "";
                    continue;
                }

                if (data.type === "artwork-chunk") {
                    artworkBuffer += data.data;
                    continue;
                }

                if (data.type === "artwork-end") {
                    onState({
                        type: "artwork",
                        artwork: artworkBuffer
                    });

                    artworkBuffer = "";
                    continue;
                }

                onState(data);
            } catch (e) {
                console.log("Invalid state:", e);
            }
        }
    });

    socket.on("error", error => {
        scheduleReconnect();
        console.log("Connection error:", error);
    });

    socket.on("close", () => {
        scheduleReconnect();
        console.log("Disconnected");
        socket = null;
    });
}

function scheduleReconnect() {
    console.log("Scheduling ");
    setTimeout(() => {
        connectToPhone(currIp, callback);
    }, 2000)

}


export function sendCommand(command) {
    if (!socket) return;

    try {
        socket.write(JSON.stringify(command) + "\n");
    } catch (e) {
        console.log("Command write error:", e);
    }
}
