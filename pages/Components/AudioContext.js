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
  useAudioPlaylist,
  useAudioPlaylistStatus,
  requestNotificationPermissionsAsync,
  setAudioModeAsync,
  preload
} from 'expo-audio';

import { File } from 'expo-file-system';

import {
    startBackgroundServer,
    stopBackgroundServer
} from '../Helpers/BackgroundService';

import {
  getType
} from '../Helpers/AsyncManager';


import { getAllSongs } from '../Helpers/SongManager';
import {
    setCommandCallback,
    sendState,
    sendArtwork,
    queueArtwork
} from '../Helpers/RemoteServer';

import {
  connectToPhone,
  sendCommand
} from '../Helpers/RemoteClient';

import getImage from '../../assets/defaultImage';
import AsyncStorage from '@react-native-async-storage/async-storage';
import backgroundTasks from 'react-native-background-actions'
const AudioContext = createContext(null);

export function AudioProvider({ children }) {
  const player = useAudioPlaylist({updateInterval: 1000});
  const realStatus = useAudioPlaylistStatus(player);

  const [songs, setSongs] = useState([]);
  const [originalSongs, setOriginalSongs] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [currentSong, setCurrentSong] = useState({});
  const [currentArtwork, setCurrentArtwork] = useState(null);
  const [lockScreenActive, setLockScreenActive] = useState(false);
  const [isSource, setIsSource] = useState(true);
  const [allSongs, setAllSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isShuffle, setShuffle] = useState(false);
  const [loop, setLoop] = useState('all');
  
  const [remoteStatus, setRemoteStatus] = useState({
    playing: false,
    currentTime: 0,
    duration: 0,
    isShuffle: false,
    isLoop: false
  });


  const songsRef = useRef([]);
  const originalSongsRef = useRef([]);

  const currentIndexRef = useRef(-1);
  const playingRef = useRef(false);
  const statusRef = useRef(realStatus);
  const playerRef = useRef(null);
  const isShuffleRef = useRef(false);
  const loopRef = useRef("all");
  const artworkIndexRef = useRef(-1);

  useEffect(() => {
    player.loop = loop;
  }, [loop]);
  useEffect(() => {
      playingRef.current = realStatus.playing;
  }, [realStatus.playing]);
  useEffect(() => {
    isShuffleRef.current = isShuffle;
  }, [isShuffle])
  useEffect(() => {
    loopRef.current = loop;
  }, [loop])

  const status = isSource ? realStatus : remoteStatus;

  useEffect(() => {
      playerRef.current = player;
  }, [player]);

  useEffect(() => {
    songsRef.current = songs;
  }, [songs]);

  useEffect(() => {
    originalSongsRef.current = originalSongs;
  }, [originalSongs]);
  
  useEffect(() => {
    statusRef.current = realStatus;
  }, [realStatus]);

  useEffect(() => {
    currentIndexRef.current = currentIndex;
  }, [currentIndex]);

  useEffect(() => {
    if (!isSource) return;
    console.log("JUST finished ", realStatus.currentIndex);

    setCurrentSong(songsRef.current[realStatus.currentIndex] ?? {});
    const song  = songsRef.current[realStatus.currentIndex];
    updateLockScreen(song ? {
      title: song.name,
      artist: song.artist,
      albumTitle: song.album,
      artworkUrl: song.artwork,
    } : undefined);

  }, [realStatus.currentIndex]);


 useEffect(() => {
    if (!isSource) return;

    const listener = player.addListener("playlistStatusUpdate", async status => {
        const song = songsRef.current[status.currentIndex];

        if (!song) return;

        sendState({
            type: "state",
            index: status.currentIndex,
            song: {
                ...song,
                artwork: song.artwork ? true : null
            },
            playing: status.playing,
            position: status.currentTime,
            duration: status.duration,
            isShuffle: isShuffleRef.current,
            isLoop: loopRef.current === "single"
        });

        if (artworkIndexRef.current !== status.currentIndex) {
            artworkIndexRef.current = status.currentIndex;

            const artwork = song.artwork
                ? await getArtworkBase64(song.artwork)
                : getImage();

            setCurrentArtwork(artwork);

            if (artwork) {
              console.log("Sending artwork ", artwork.substring(0, 40));
                queueArtwork(artwork);
            }
        }
    });

    return () => listener.remove();
}, [player, isSource]);

  /*useEffect(() => {
    if (!isSource) return;

    const interval = setInterval(() => {
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
        duration: status.duration,
        isShuffle: isShuffleRef.current,
        isLoop: loopRef.current == "single"
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isSource, currentSong]);*/

  useEffect(() => {
  
    if(realStatus.duration - realStatus.currentTime < 10) {
      const nxt = (currentIndexRef.current + 1)%songsRef.current.length;
      songs[nxt] && preload(songs[nxt].uri, {preferredForwardBuffrDuration: 10});
    }
  }, [realStatus.currentTime])

  useEffect(() => {
    async function gt() {
      const type = await getType();
      setIsSource(!type);
      if (type == 0) {

         setCommandCallback(cmd => {
          console.log("Command: ", cmd);

          if (cmd.type === "play") {
              playerRef.current?.play();
          }

          if (cmd.type === "pause") {
              playerRef.current?.pause();
          }

          if (cmd.type === "toggle") {
              if (playingRef.current) {
                  playerRef.current?.pause();
              } else {
                  playerRef.current?.play();
              }
          }

          if (cmd.type === "toggleShuffle") {
              toggleShuffle();
          }

          if (cmd.type === "toggleLoop") {
              toggleLoop();
          }

          if (cmd.type === "next") {
              nextSong();
          }

          if (cmd.type === "previous") {
              prevSong();
          }

          if (cmd.type === "seek") {
              playerRef.current?.seekTo(cmd.position);
          }

          if (cmd.type === "playSong") {
              playSong(cmd.index);
          }
      });

      startBackgroundServer();

       
      } else {
        const ip = await AsyncStorage.getItem("@ip");
        console.log("IP: ", ip)
        connectToPhone(ip ?? "10.198.59.84", (state) => {
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
            duration: state.duration,
            isShuffle: state.isShuffle,
            isLoop: state.isLoop
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

  /*useEffect(() => {
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
  }, [currentSong, isSource]);*/
  
  
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
      duration: realStatus.duration,
      isShuffle: isShuffleRef.current,
      isLoop: loopRef.current == "single"
    });
  }, [
    currentSong,
    currentIndex,
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
      duration: realStatus.duration,
      isShuffle: isShuffleRef.current,
      isLoop: loopRef.current == "single"
    });
  }, [
    realStatus.playing
  ]);


  async function getSongs() {
    const items = await getAllSongs();
    setLoading(false);
    setAllSongs(items);
  }

  useEffect(() => {
    async function setupAudio() {
      await registerForPushNotificationsAsync();
      await requestNotificationPermissionsAsync();

      await setAudioModeAsync({
        playsInSilentMode: true,
        shouldPlayInBackground: true,
        shouldRouteThroughEarpiece: false,
        interruptionMode: "doNotMix",
      });
    }

  
    setupAudio();
    getSongs();
  }, []);

  const updateLockScreen = (metadata) => {
    if(!metadata) return;

    if (lockScreenActive) {
      playerRef.current.updateLockScreenMetadata(metadata);
    } else {
      playerRef.current.setActiveForLockScreen(true, metadata, {
        showNextTrack: true,
        showPreviousTrack: true,
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

    playerRef.current.skipTo(index);

    currentIndexRef.current = index;
    setCurrentIndex(index);
    setCurrentSong(song);

    updateLockScreen({
      title: song.name,
      artist: song.artist,
      albumTitle: song.album,
      artworkUrl: song.artwork,
    });

    playerRef.current.play();
  }

  function setAndPlay(newPlaylist, index, original = false) {
    setSongs(newPlaylist);
    songsRef.current = newPlaylist;
    playerRef.current.clear();
    if(original) setOriginalSongs(newPlaylist);
    if(original) setShuffle(false);

    newPlaylist.forEach(song => playerRef.current.add({uri: song.uri, name: `${song.name} - ${song.artist}`}));
    playSong(index);
  }

  function playShuffle(songs) {
    setOriginalSongs(songs);
    setShuffle(true);

    const newSongs = shuffle(songs);
    setAndPlay(newSongs, 0);

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
    if (!isSource) {
      sendCommand({
        type: "next"
      });
      return;
    }

    playerRef.current.next();
    if(!realStatus.playing) playerRef.current.play();

    setCurrentSong(songsRef.current[playerRef.current.currentIndex]);

  }

  function prevSong() {
    if (!isSource) {
      sendCommand({
        type: "previous"
      });
      return;
    }

    playerRef.current.previous();
    if(!realStatus.playing) playerRef.current.play();

    setCurrentSong(songsRef.current[playerRef.current.currentIndex]);

  }

  function shuffle(array) {
    const result = [...array];

    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }

    return result;
  }

  function toggleShuffle() {
    if (!isSource) {
      sendCommand({
        type: "toggleShuffle"
      });
      return;
    }

    
    const currentSong = songsRef.current[playerRef.current.currentIndex];
    console.log("SHUFFLING: ", currentSong)
    if(isShuffleRef.current) {

      const currT = playerRef.current.currentTime;
      setAndPlay(originalSongsRef.current, originalSongsRef.current.findIndex(song => song.uri == currentSong.uri));
      seekTo(currT);

    } else {
      const currT = playerRef.current.currentTime;
      const newSongs = shuffle(originalSongsRef.current);
      
      setAndPlay(newSongs, newSongs.findIndex(song => song.uri == currentSong.uri));
      seekTo(currT);
    }

    setShuffle(s => !s);
  }

  


   function toggleLoop() {
    if (!isSource) {
      sendCommand({
        type: "toggleLoop"
      });
      return;
    }
    
    setLoop(prev => prev === 'all' ? 'single' : 'all');
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
        toggleLoop,
        toggleShuffle,
        isSource, 
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
        getSongs,
        isShuffle,
        playShuffle,
      }}
    >
      {children}
    </AudioContext.Provider>
  );
}

export function useAudio() {
  return useContext(AudioContext);
}