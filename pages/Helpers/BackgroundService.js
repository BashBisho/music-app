import BackgroundService from "react-native-background-actions";
import { startServer, stopServer, processArtwork } from "./RemoteServer";

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

const task = async () => {
    await startServer();

      while (BackgroundService.isRunning()) {
        console.log("BACKGROUND TASK ALIVE", new Date().toLocaleTimeString());
        await processArtwork();
        await sleep(100);
    }

    stopServer();
};

const options = {
    taskName: "MusicServer",
    taskTitle: "Music",
    taskDesc: "Music server is running",
    taskIcon: {
        name: "ic_launcher",
        type: "mipmap"
    },
    foregroundServiceType: ["mediaPlayback"]
};

export async function startBackgroundServer() {
    if (!BackgroundService.isRunning()) {
        await BackgroundService.start(task, options);
    }
}

export async function stopBackgroundServer() {
    if (BackgroundService.isRunning()) {
        await BackgroundService.stop();
    }
}