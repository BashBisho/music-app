// AudioContext.js

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
  preload,

} from 'expo-audio';

import {getAllSongs} from '../Helpers/SongManager'
import { getCachedSongs, cacheSongs, getCurrentSong } from '../Helpers/AsyncManager';

const AudioContext = createContext(null);

export function AudioProvider({ children }) {

  const player = useAudioPlayer(null);
  const status = useAudioPlayerStatus(player);
  const [songs, setSongs] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [lockScreenActive, setLockScreenActive] = useState(false);
  
  useEffect(() => {
    if (!status.didJustFinish) return;

    if (currentIndex + 1 < songs.length) {
        playSong(currentIndex + 1);
    }
  }, [status.didJustFinish]);

  const currentSong =
    currentIndex >= 0
      ? songs[currentIndex]
      : null;

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
  }, [])


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
    console.log("what");

    if (!songs[index]) return;

    const song = songs[index];
    console.log("WANT TO: ", index, " ", song);

    setCurrentIndex(index);

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
    player.seekTo(time);
  }

  function pause() {
    player.pause();
  }


  function play() {
    player.play();
  }


  function togglePlay() {
    if (status.playing) {
      player.pause();
    } else {
      player.play();
    }
  }


  function nextSong() {
    if (songs.length === 0) return;

    const nextIndex =
      (currentIndex + 1) % songs.length;

    playSong(nextIndex);
  }


  function prevSong() {
    if (songs.length === 0) return;

    const previousIndex =
      (currentIndex - 1 + songs.length) % songs.length;

    playSong(previousIndex);
  }


  return (
    <AudioContext.Provider
      value={{
        // Player itself
        player,

        // Live player information
        status,

        // Library
        songs,
        setSongs,

        // Current track
        currentSong,
        currentIndex,

        // Controls
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