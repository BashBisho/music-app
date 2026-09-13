import TcpSocket from "react-native-tcp-socket";

let socket;
let artworkBuffer = "";
export function getPort() {
    return 8080;
}

export function connectToPhone(ip, onState) {
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
        console.log("Connection error:", error);
    });

    socket.on("close", () => {
        console.log("Disconnected");
        socket = null;
    });
}

export function sendCommand(command) {
    if (!socket) return;

    try {
        socket.write(JSON.stringify(command) + "\n");
    } catch (e) {
        console.log("Command write error:", e);
    }
}
