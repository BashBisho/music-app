import TcpSocket from "react-native-tcp-socket";
import { getPort } from "./RemoteClient";

let server;
let client;
let isSendingArtwork = false;

export function startServer(onCommand) {
    if (server) return;

    server = TcpSocket.createServer(socket => {
        console.log("Tablet connected");

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

            if (client === socket) {
                client = null;
            }
        });

        socket.on("close", () => {
            console.log("Tablet disconnected");

            if (client === socket) {
                client = null;
            }
        });
    });

    server.listen({
        port: getPort(),
        host: "0.0.0.0"
    });
}

export function sendState(state) {
    if (!client || isSendingArtwork) return;

    try {
        client.write(JSON.stringify(state) + "\n");
    } catch (e) {
        console.log("State write error:", e);
    }
}

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export async function sendArtwork(artwork) {
    if (!client || !artwork) return;

    isSendingArtwork = true;
    const chunkSize = 4000;

    try {
        client.write(JSON.stringify({
            type: "artwork-start"
        }) + "\n");
        
        await sleep(10);

        for (let i = 0; i < artwork.length; i += chunkSize) {
            client.write(JSON.stringify({
                type: "artwork-chunk",
                data: artwork.slice(i, i + chunkSize)
            }) + "\n");
            
            //await sleep(5);
        }

        client.write(JSON.stringify({
            type: "artwork-end"
        }) + "\n");
    } catch (e) {
        console.log("Artwork write error:", e);
    } finally {
        isSendingArtwork = false;
    }
}