import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';

import { registerForPushNotificationsAsync } from '../Helpers/Notifications'

import {
  useAudioPlayer,
  useAudioPlayerStatus,
  requestNotificationPermissionsAsync,
  setAudioModeAsync,
  preload
} from 'expo-audio';

import { File } from 'expo-file-system';

import {
  getType
} from '../Helpers/AsyncManager';

import { getAllSongs } from '../Helpers/SongManager';
import {
  startServer,
  sendState,
  sendArtwork
} from '../Helpers/RemoteServer';

import {
  connectToPhone,
  sendCommand
} from '../Helpers/RemoteClient';

import getImage from '../../assets/defaultImage';

const AudioContext = createContext(null);

export function AudioProvider({ children }) {
  const player = useAudioPlayer(null);
  const realStatus = useAudioPlayerStatus(player);

  const [songs, setSongs] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [currentSong, setCurrentSong] = useState({});
  const [currentArtwork, setCurrentArtwork] = useState(null);
  const [lockScreenActive, setLockScreenActive] = useState(false);
  const [isSource, setIsSource] = useState(true);
  const [allSongs, setAllSongs] = useState([]);
  const [loading, setLoading] = useState(true);

  const [remoteStatus, setRemoteStatus] = useState({
    playing: false,
    currentTime: 0,
    duration: 0
  });

  const songsRef = useRef([]);

  const currentIndexRef = useRef(-1);
  const playingRef = useRef(false);
  const statusRef = useRef(realStatus);
  const playerRef = useRef(null);

  useEffect(() => {
      playingRef.current = realStatus.playing;
  }, [realStatus.playing]);
  
  const status = isSource ? realStatus : remoteStatus;


  useEffect(() => {
      playerRef.current = player;
  }, [player]);

  useEffect(() => {
    songsRef.current = songs;
  }, [songs]);
  
  useEffect(() => {
    statusRef.current = realStatus;
  }, [realStatus]);

  useEffect(() => {
    currentIndexRef.current = currentIndex;
  }, [currentIndex]);

  useEffect(() => {
    if (!isSource) return;
    if (!realStatus.didJustFinish) return;

    if (currentIndex + 1 < songs.length) {
      playSong(currentIndex + 1);
    }
  }, [realStatus.didJustFinish]);

  useEffect(() => {
    if (!isSource) return;
    console.log("INNNNNNNNNNNNNNNNNNNN: ", songs.length, songsRef.length)
    const interval = setInterval(() => {
      console.log("STILL");

      const status = statusRef.current;

      sendState({
        type: "state",
        index: currentIndexRef.current,
        song: {
          ...currentSong,
          artwork: currentSong.artwork ? true : null
        },
        playing: status.playing,
        position: status.currentTime,
        duration: status.duration
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isSource, currentSong]);

  useEffect(() => {
  
    if(realStatus.duration - realStatus.currentTime < 10) {
      console.log("ENDINIGNIGNIGNG");
      const nxt = (currentIndexRef.current + 1)%songsRef.current.length;
      songs[nxt] && preload(songs[nxt].uri, {preferredForwardBuffrDuration: 10});
    }
  }, [realStatus.currentTime])

  useEffect(() => {
    async function gt() {
      const type = await getType();
      setIsSource(!type);

      if (type == 0) {
        startServer((cmd) => {
          console.log("Command: ", cmd);
          console.log("type: ", cmd.type);

          if (cmd.type === "play") {
            playerRef.current.play();
          }

          if (cmd.type === "pause") {
            playerRef.current.pause();
          }

         // console.log(playerRef.current.currentStatus)
          if (cmd.type === "toggle") {
            if(playingRef.current) {
              playerRef.current.pause();
            } else playerRef.current.play();
          }

          if (cmd.type === "next") {
            console.log("what");
            nextSong();
          }

          if (cmd.type === "previous") {
            prevSong();
          }

          if (cmd.type === "seek") {
            playerRef.current.seekTo(cmd.position);
          }

          if (cmd.type === "playSong") {
            playSong(cmd.index);
          }
        });
      } else {
        connectToPhone("192.168.1.20", (state) => {
          console.log("State: ", state);

          if (state.type === "artwork") {
            if (state.artwork)
              setCurrentArtwork(state.artwork);
            return;
          }

          if (state.type !== "state") return;

          setCurrentSong(state.song);

          if (state.index !== undefined) {
            setCurrentIndex(state.index);
            currentIndexRef.current = state.index;
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
      if (!isSource) {
        //setCurrentArtwork(null);
        return;
      }

      const artwork = currentSong.artwork
        ? await getArtworkBase64(currentSong.artwork)
        : getImage();

      setCurrentArtwork(artwork);

      if (artwork) {
        sendArtwork(artwork);
      }
    }

    loadArtwork();
  }, [currentSong, isSource]);

  useEffect(() => {
    console.log("song changed, ", isSource, " and ", currentSong)
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
    const items = await getAllSongs();
    setLoading(false);
    console.log("ONonodasdsoajd ");
    setAllSongs(items);
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

  
    setupAudio();
    getSongs();
  }, []);

  const updateLockScreen = (metadata) => {
    if (lockScreenActive) {
      playerRef.current.updateLockScreenMetadata(metadata);
    } else {
      playerRef.current.setActiveForLockScreen(true, metadata, {
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

    if (!songsRef.current[index]) return;

    const song = songsRef.current[index];
    console.log("PLAYING: ", song);

    playerRef.current.replace(song.uri);

    currentIndexRef.current = index;
    setCurrentIndex(index);
    setCurrentSong(song);
    setCurrentArtwork(null);


    updateLockScreen({
      title: song.name,
      artist: song.artist,
      albumTitle: song.album,
      artworkUrl: song.artwork,
    });

    playerRef.current.play();
  }

  function setAndPlay(newPlaylist, index) {
    setSongs(newPlaylist);
    songsRef.current = newPlaylist;
    playSong(index);
  }

  function seekTo(time) {
    if (!isSource) {
      sendCommand({
        type: "seek",
        position: time
      });
      return;
    }

    playerRef.current.seekTo(time);
  }

  function pause() {
    if (!isSource) {
      sendCommand({
        type: "pause"
      });
      return;
    }

    playerRef.current.pause();
  }

  function play() {
    if (!isSource) {
      sendCommand({
        type: "play"
      });
      return;
    }

    playerRef.current.play();
  }

  function togglePlay() {
    if (!isSource) {
      sendCommand({
        type: "toggle"
      });
      return;
    }

    if (realStatus.playing) {
      playerRef.current.pause();
    } else {
      playerRef.current.play();
    }
  }

  function nextSong() {
    console.log("in: ", isSource);

    if (!isSource) {
      sendCommand({
        type: "next"
      });
      return;
    }

    console.log("Ref ", songsRef.current.length);
    console.log("Current index ref ", currentIndexRef.current);

    if (songsRef.current.length === 0) return;

    const nextIndex =
      (currentIndexRef.current + 1) % songsRef.current.length;

    playSong(nextIndex);
  }

  function prevSong() {
    if (!isSource) {
      sendCommand({
        type: "previous"
      });
      return;
    }

    if (songsRef.current.length === 0) return;

    const previousIndex =
      (currentIndexRef.current - 1 + songsRef.current.length) % songsRef.current.length;

    playSong(previousIndex);
  }

  return (
    <AudioContext.Provider
      value={{
        player,
        status,
        songs,
        allSongs,
        setSongs,
        currentSong,
        currentIndex,
        currentArtwork,
        remoteStatus,

        loading,
        isSource,
        playSong,
        play,
        pause,
        seekTo,
        togglePlay,
        setAndPlay,
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