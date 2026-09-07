// AudioContext.js

import {
  createContext,
  useContext,
  useEffect,
  useState,
} from 'react';

import {
  useAudioPlayer,
  useAudioPlayerStatus,
} from 'expo-audio';

const AudioContext = createContext(null);

export function AudioProvider({ children }) {
  // ONE player for the entire application
  const player = useAudioPlayer(null);

  // Player's live state
  const status = useAudioPlayerStatus(player);

  // Your music library
  const [songs, setSongs] = useState([]);

  // Currently playing song
  const [currentIndex, setCurrentIndex] = useState(-1);

  // Everything you want to preserve about the track
  const currentSong =
    currentIndex >= 0
      ? songs[currentIndex]
      : null;


  function playSong(index) {
    if (!songs[index]) return;

    const song = songs[index];

    setCurrentIndex(index);

    player.replace(song.uri);

    player.setActiveForLockScreen(true, {
      title: song.name,
      artist: song.artist,
      albumTitle: song.album,
      artworkUrl: song.artworkUri,
    });

    player.play();
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


  function previousSong() {
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
        togglePlay,
        nextSong,
        previousSong,
      }}
    >
      {children}
    </AudioContext.Provider>
  );
}


export function useAudio() {
  return useContext(AudioContext);
}