import TcpSocket from "react-native-tcp-socket";
import AsyncStorage from "@react-native-async-storage/async-storage";

let socket = null;
let reconnectTimer = null;
let callback = null;
let currIp = null;
let connecting = false;
let artworkBuffer = "";

export async function getPort() {
    const port = parseFloat(await AsyncStorage.getItem("@port"));
    return port ?? 5555;
}

export async function connectToPhone(ip, onState) {
    currIp = ip;
    callback = onState;

    if (socket || connecting) return;

    connecting = true;

    const port = await getPort();
    console.log("POTRT CLEINT: ", port);
    const newSocket = TcpSocket.createConnection({
        host: ip,
        port
    }, () => {
        connecting = false;
        console.log("Connected to phone");
    });

    socket = newSocket;

    let buffer = "";

    newSocket.on("data", data => {
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
                    callback?.({
                        type: "artwork",
                        artwork: artworkBuffer
                    });

                    artworkBuffer = "";
                    continue;
                }

                callback?.(data);
            } catch (e) {
                console.log("Invalid state:", e);
            }
        }
    });

    newSocket.on("error", error => {
        console.log("Connection error:", error);

        if (socket === newSocket) {
            socket = null;
            connecting = false;
        }

        scheduleReconnect();
    });

    newSocket.on("close", () => {
        console.log("Disconnected");

        if (socket === newSocket) {
            socket = null;
            connecting = false;
            scheduleReconnect();
        }
    });
}

function scheduleReconnect() {
    if (reconnectTimer) return;

    console.log("Scheduling reconnect");

    reconnectTimer = setTimeout(() => {
        reconnectTimer = null;

        if (!socket && currIp && callback) {
            connectToPhone(currIp, callback);
        }
    }, 2000);
}

export function sendCommand(command) {
    if (!socket) return;

    try {
        socket.write(JSON.stringify(command) + "\n");
    } catch (e) {
        console.log("Command write error:", e);

        if (socket) {
            socket.destroy();
            socket = null;
        }
    }
}
