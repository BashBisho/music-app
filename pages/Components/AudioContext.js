import {
  createContext,
  useContext,
  useEffect,
  useState,
} from 'react';

import { registerForPushNotificationsAsync } from '../Helpers/Notifications'

import {
  useAudioPlayer,
  useAudioPlayerStatus,
  requestNotificationPermissionsAsync,
  setAudioModeAsync,
} from 'expo-audio';

import { File } from 'expo-file-system';

import {
  getCachedSongs,
  cacheSongs,
  getCurrentSong,
  getType
} from '../Helpers/AsyncManager';

import {
  startServer,
  sendState,
  sendArtwork
} from '../Helpers/RemoteServer';

import {
  connectToPhone,
  sendCommand
} from '../Helpers/RemoteClient';

const AudioContext = createContext(null);

export function AudioProvider({ children }) {
  const player = useAudioPlayer(null);
  const realStatus = useAudioPlayerStatus(player);

  const [songs, setSongs] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [currentSong, setCurrentSong] = useState(null);
  const [currentArtwork, setCurrentArtwork] = useState(null);
  const [lockScreenActive, setLockScreenActive] = useState(false);
  const [isSource, setIsSource] = useState(true);

  const [remoteStatus, setRemoteStatus] = useState({
    playing: false,
    currentTime: 0,
    duration: 0
  });

  const status = isSource ? realStatus : remoteStatus;

  useEffect(() => {
    if (!isSource) return;
    if (!realStatus.didJustFinish) return;

    if (currentIndex + 1 < songs.length) {
      playSong(currentIndex + 1);
    }
  }, [realStatus.didJustFinish]);

  useEffect(() => {
    async function gt() {
      const type = await getType();

      setIsSource(!type);

      if (type == 0) {
        startServer((cmd) => {
          console.log("Command: ", cmd);

          if (cmd.type === "play") {
            player.play();
          }

          if (cmd.type === "pause") {
            player.pause();
          }

          if (cmd.type === "toggle") {
            if (realStatus.playing) {
              player.pause();
            } else {
              player.play();
            }
          }

          if (cmd.type === "next") {
            nextSong();
          }

          if (cmd.type === "previous") {
            prevSong();
          }

          if (cmd.type === "seek") {
            player.seekTo(cmd.position);
          }

          if (cmd.type === "playSong") {
            playSong(cmd.index);
          }
        });
      } else {
        connectToPhone("192.168.1.239", (state) => {
          console.log("State: ", state);

          if (state.type === "artwork") {
            setCurrentArtwork(state.artwork);
            return;
          }

          if (state.type !== "state") return;

          setCurrentSong(state.song);

          if (state.index !== undefined) {
            setCurrentIndex(state.index);
          }

          setRemoteStatus({
            playing: state.playing,
            currentTime: state.position,
            duration: state.duration
          });
        });
      }
    }

    gt();
  }, []);

  async function getArtworkBase64(path) {
    if (!path) return null;

    try {
      const file = new File(path);
      const base64 = await file.base64();

      const extension = path
        .split(".")
        .pop()
        .toLowerCase();

      let mime = "image/jpeg";

      if (extension === "png") {
        mime = "image/png";
      } else if (extension === "webp") {
        mime = "image/webp";
      } else if (extension === "gif") {
        mime = "image/gif";
      }

      return `data:${mime};base64,${base64}`;
    } catch (e) {
      console.log("Artwork error:", e);
      return null;
    }
  }

  useEffect(() => {
    async function loadArtwork() {
      if (!isSource || !currentSong?.artwork) {
        setCurrentArtwork(null);
        return;
      }

      const artwork = await getArtworkBase64(currentSong.artwork);

      setCurrentArtwork(artwork);

      if (artwork) {
        sendArtwork(artwork);
      }
    }

    loadArtwork();
  }, [currentSong, isSource]);

  useEffect(() => {
    if (!isSource) return;
    if (!currentSong) return;

    sendState({
      type: "state",
      index: currentIndex,
      song: {
        ...currentSong,
        artwork: currentSong.artwork ? true : null
      },
      playing: realStatus.playing,
      position: realStatus.currentTime,
      duration: realStatus.duration
    });
  }, [
    currentSong,
    currentIndex
  ]);

  useEffect(() => {
    if (!isSource) return;
    if (!currentSong) return;

    sendState({
      type: "state",
      index: currentIndex,
      song: {
        ...currentSong,
        artwork: currentSong.artwork ? true : null
      },
      playing: realStatus.playing,
      position: realStatus.currentTime,
      duration: realStatus.duration
    });
  }, [
    realStatus.playing
  ]);

  async function getSongs() {
    const items = await getCachedSongs();

    setSongs(items);

    const nw = await cacheSongs();

    setSongs(nw);
  }

  useEffect(() => {
    async function setupAudio() {
      await registerForPushNotificationsAsync();
      await requestNotificationPermissionsAsync();

      await setAudioModeAsync({
        playsInSilentMode: true,
        shouldPlayInBackground: true,
        shouldRouteThroughEarpiece: true,
        interruptionMode: "doNotMix",
      });
    }

    async function getSong() {
      const curr = await getCurrentSong();
      playSong(curr);
    }

    getSong();
    setupAudio();
    getSongs();
  }, []);

  const updateLockScreen = (metadata) => {
    if (lockScreenActive) {
      player.updateLockScreenMetadata(metadata);
    } else {
      player.setActiveForLockScreen(true, metadata, {
        showSeekBackward: true,
        showSeekForward: true,
      });

      setLockScreenActive(true);
    }
  };

  function playSong(index) {
    if (!isSource) {
      sendCommand({
        type: "playSong",
        index: index
      });

      return;
    }

    if (!songs[index]) return;

    const song = songs[index];

    setCurrentIndex(index);
    setCurrentSong(song);
    setCurrentArtwork(null);

    player.replace(song.uri);

    updateLockScreen({
      title: song.name,
      artist: song.artist,
      albumTitle: song.album,
      artworkUrl: song.artwork,
    });

    player.play();
  }

  function seekTo(time) {
    if (!isSource) {
      sendCommand({
        type: "seek",
        position: time
      });

      return;
    }

    player.seekTo(time);
  }

  function pause() {
    if (!isSource) {
      sendCommand({
        type: "pause"
      });

      return;
    }

    player.pause();
  }

  function play() {
    if (!isSource) {
      sendCommand({
        type: "play"
      });

      return;
    }

    player.play();
  }

  function togglePlay() {
    if (!isSource) {
      sendCommand({
        type: "toggle"
      });

      return;
    }

    if (realStatus.playing) {
      player.pause();
    } else {
      player.play();
    }
  }

  function nextSong() {
    if (!isSource) {
      sendCommand({
        type: "next"
      });

      return;
    }

    if (songs.length === 0) return;

    const nextIndex =
      (currentIndex + 1) % songs.length;

    playSong(nextIndex);
  }

  function prevSong() {
    if (!isSource) {
      sendCommand({
        type: "previous"
      });

      return;
    }

    if (songs.length === 0) return;

    const previousIndex =
      (currentIndex - 1 + songs.length) % songs.length;

    playSong(previousIndex);
  }

  return (
    <AudioContext.Provider
      value={{
        player,
        status,
        songs,
        setSongs,
        currentSong,
        currentIndex,
        currentArtwork,
        isSource,
        playSong,
        play,
        pause,
        seekTo,
        togglePlay,
        nextSong,
        prevSong,
        getSongs
      }}
    >
      {children}
    </AudioContext.Provider>
  );
}

export function useAudio() {
  return useContext(AudioContext);
}
