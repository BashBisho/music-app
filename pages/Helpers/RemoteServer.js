import TcpSocket from "react-native-tcp-socket";
import { NetworkInfo } from "react-native-network-info";
import { getPort } from "./RemoteClient";

let server = null;
let client = null;
let isSendingArtwork = false;

export async function startServer(onCommand) {
    if (server) return;

    NetworkInfo.getIPAddress().then(async ip => {
        console.log("Server IP:", ip);
        console.log("Server address:", `${ip}:${await getPort()}`);
    }).catch(e => {
        console.log("Could not get server IP:", e);
    });

    const port = await getPort();
    server = TcpSocket.createServer(socket => {
        console.log("Tablet connected");

        if (client) {
            client.destroy();
            client = null;
        }

        client = socket;

        let buffer = "";

        socket.on("data", data => {
            buffer += data.toString();

            let newlineIndex;

            while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
                const message = buffer.slice(0, newlineIndex);
                buffer = buffer.slice(newlineIndex + 1);

                if (!message) continue;

                try {
                    const command = JSON.parse(message);
                    onCommand(command);
                } catch (e) {
                    console.log("Invalid command:", e);
                }
            }
        });

        socket.on("error", error => {
            console.log("Socket error:", error);
            isSendingArtwork = false;

            if (client === socket) {
                client = null;
            }
        });

        socket.on("close", () => {
            console.log("Tablet disconnected");
            isSendingArtwork = false;

            if (client === socket) {
                client = null;
            }
        });
    });

    server.on("error", error => {
        console.log("Server error:", error);
        server = null;
    });

    server.listen({
        port,
        host: "0.0.0.0"
    });
}

export function sendState(state) {
    if (!client || isSendingArtwork) return;

    try {
        client.write(JSON.stringify(state) + "\n");
    } catch (e) {
        console.log("State write error:", e);
        client = null;
    }
}

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

export async function sendArtwork(artwork) {
    if (!client || !artwork || isSendingArtwork) return;

    const currentClient = client;
    isSendingArtwork = true;

    const chunkSize = 4000;

    try {
        currentClient.write(JSON.stringify({
            type: "artwork-start"
        }) + "\n");

        await sleep(10);

        for (let i = 0; i < artwork.length; i += chunkSize) {
            currentClient.write(JSON.stringify({
                type: "artwork-chunk",
                data: artwork.slice(i, i + chunkSize)
            }) + "\n");
        }

        currentClient.write(JSON.stringify({
            type: "artwork-end"
        }) + "\n");
    } catch (e) {
        console.log("Artwork write error:", e);

        if (client === currentClient) {
            client = null;
        }
    } finally {
        isSendingArtwork = false;
    }
}

export function stopServer() {
    if (client) {
        client.destroy();
        client = null;
    }

    if (server) {
        server.close();
        server = null;
    }

    isSendingArtwork = false;
}