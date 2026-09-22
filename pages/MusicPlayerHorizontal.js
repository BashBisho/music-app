import { StyleSheet, Text, View, Button, TouchableOpacity, Dimensions, ScrollView} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useAudioPlaylistStatus } from 'expo-audio'
import { Directory,  File, Paths } from 'expo-file-system'; 
import { useState, useEffect, useRef } from 'react';

import { getAudioMetadata } from '@missingcore/audio-metadata';
import { ImageBackground, Image } from 'expo-image';
import { BlurView, BlurTargetView } from 'expo-blur';
import Header from './Components/HeaderModern';
import { AudioProvider, useAudio } from './Components/AudioContext';
import getImage from '../assets/defaultImage';
import FontAwesome6 from '@react-native-vector-icons/fontawesome6';
import { format , getFontSize } from './Helpers/HelperFunctions';
import { findSpotifyTrackId, getLyrics } from './Helpers/SpotifyScraper';

import Animated, {
    useSharedValue,
    useAnimatedStyle,
} from 'react-native-reanimated';

import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { scheduleOnRN } from 'react-native-worklets';
import getLyric from '../assets/defaultLyric';
import { lockAsync, OrientationLock}  from 'expo-screen-orientation'
import Lyrics from './Components/Lyrics'

export default function App({navigation}) {

    
    const { player, songs, playSong, currentSong, togglePlay, prevSong, nextSong, seekTo, currentArtwork, remoteStatus, isShuffle, toggleShuffle, toggleLoop} = useAudio();
    const [sender, setSender] = useState(false);
    const [showLyrics, setShowLyrics] = useState(false);
    const [lyrics, setLyrics] = useState("");
    ؤ
    const lyricsName = useRef("");

    useEffect(() => {
        lockAsync(OrientationLock.LANDSCAPE)
    }, [])

    const status = useAudioPlaylistStatus(player);

    const blurTargetRef = useRef(null);
    const {width, height} = Dimensions.get("screen");
    const play = (currentArtwork ?? getImage());

    const barWidth = width/1.5 * 0.8;
    const progress = useSharedValue(0);

    useEffect(() => {
        if (remoteStatus.duration > 0) {
            progress.value = remoteStatus.currentTime / remoteStatus.duration;
        }
    }, [remoteStatus.currentTime, remoteStatus.duration]);

     useEffect(() => {
        if(showLyrics) fetchLyrics();
     }, [currentSong]);

    async function fetchLyrics() {
        setLyrics("");

        const songID  = await findSpotifyTrackId(currentSong);
        console.log(currentSong.name, " => ", songID);
        const clyrics = await getLyrics(songID);
        console.log(clyrics);
        setLyrics(clyrics);
    }

    async function toggleLyrics() {

        if(showLyrics) {
            setShowLyrics(false);
            return;
        }

        setShowLyrics(true);
        const key = `${currentSong.artist} - ${currentSong.name}`.toLowerCase();

        if(lyricsName.current == key) return;
        lyricsName.current = key;

        fetchLyrics();
    }

    const seekAt = (x) => {
        const value = Math.max(0, Math.min(x / barWidth, 1));
        seekTo(value * remoteStatus.duration);
        progress.value = value;
    };

    const tap = Gesture.Tap()
        .onEnd((e) => {
            scheduleOnRN(seekAt, e.x);
        });

    const pan = Gesture.Pan()
        .onUpdate((e) => {
            progress.value = Math.max(0, Math.min(e.x / barWidth, 1));
        })
        .onEnd(() => {
            scheduleOnRN(seekAt, progress.value * barWidth);
        });

    const gesture = Gesture.Race(tap, pan);

    const progressStyle = useAnimatedStyle(() => ({
        transform: [{ scaleX: progress.value }],
    }));

    const h = 300;
    return (
        <View style={styles.container} >
            <BlurTargetView
                ref={blurTargetRef}
                style={{
                    position: 'absolute',
                    width: '100%',
                    height: '100%',
                    top: 0,
                }}
            >
                <Image
                    source={{ uri: play }}
                    style={{
                        width: '100%',
                        height: '100%',
                    }}
                />
            </BlurTargetView>

            <BlurView
                blurTarget={blurTargetRef}
                blurMethod="dimezisBlurViewSdk31Plus"
                intensity={100}
                tint='dark'
                style={{
                    position: 'absolute',
                    opacity: 0.9,
                    width: '100%',
                    height: '100%',
                    top: 0,
                }}
            />
            <StatusBar style='light'/>
            { // <Header name={"Now Playing Horizontal"} right={{name: "slash", backgroundColor: "#CC2936", color: "#FFF", onPress: () => clearMusicCache()}}  left={{name: "caret-left", backgroundColor: "#DDD", active: 0, color: "#222", onPress: () => { if(navigation.canGoBack() ) navigation.goBack()} }}/> 
            }


            <View style={{display: "flex", flex: 1, justifyContent: "center", alignItems: "center", flexDirection: "row", width: width/1.5, paddingTop: 40, height: h/1.2, gap: showLyrics*10}}>
                <Image style={{width: h/1.2, height: h/1.2, borderRadius: 10, marginBottom: 10}}source={play} /> 
                <View style={{display: "flex", justifyContent: (showLyrics ? "flex-start" : "center"), alignItems: "center", height: h/1.2, marginBottom: 10}}>
                   
                    <TouchableOpacity onPress={() => toggleLyrics()} style={{position: "absolute", top: 0, right: 0, width: 35, height: 35, borderRadius: 5, backgroundColor: showLyrics ? "#FFFFFF11" : "#FFFFFF00", display: "flex", justifyContent: "center", alignItems: "center"}}>
                            <FontAwesome6 size={16} color={"#fff"} name={"chalkboard"} iconStyle="solid" />
                    </TouchableOpacity>

                    {
                    showLyrics ? 
                    <View style={{width: 400, height: h/1.2, justifyContent: "flex-start", alignItems: "flex-start"}}>
                        {
                    !lyrics || lyrics.Body.type == "Static" ?
                        <ScrollView  nestedScrollEnabled style={{ height: h/1.2, width: 350, backgroundColor: "#FFFFFF11", borderRadius: 5}}>
                            <Text style={{fontSize: 24, fontFamily: "SF-Medium", color: "#FFFFFFAA", marginLeft: 10, marginVertical: 10}}>{lyrics ? getLyric().split("\n").join("\n\n") : "Loading"}</Text>
                        </ScrollView>
                
                    :
                        
                        <Lyrics lyrics={lyrics} status={remoteStatus} style={{width: 350}} />
                    }
                    </View>

                    :
                    <>
                     <Text style={{color: "#FFF", fontSize: getFontSize(currentSong?.name, 32, 10, 2.7), fontFamily: "SF-Bold", lineHeight: 36, textAlign: "center", width: "80%"}}>{currentSong?.name}</Text>
                    <Text style={{color: "#888", fontSize:  getFontSize(currentSong?.artist, 24, 10, 4), fontFamily: "SF-Reg", lineHeight: 28, marginBottom: 30, textAlign: "center", width: "80%"}} >{currentSong?.artist}</Text>
                    <View style={{display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "space-around", width: "70%", marginBottom: 20}}>
                        <TouchableOpacity onPress={() => toggleLoop()} style={{width: 35, height: 35, borderRadius: 5, backgroundColor: remoteStatus.isLoop ? "#FFFFFF11" : "#FFFFFF00", display: "flex", justifyContent: "center", alignItems: "center"}}>
                            <FontAwesome6 size={16} color={"#fff"} name={"repeat"} iconStyle="solid" />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => prevSong()} style={{width: 35, height: 35, borderRadius: 5, backgroundColor: "#FFFFFF11", display: "flex", justifyContent: "center", alignItems: "center"}}>
                            <FontAwesome6 size={24} color={"#fff"} name={"backward-step"} iconStyle="solid" />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => togglePlay()} style={{width: 50, height: 50, borderRadius: 5, backgroundColor: "#FFFFFF44", display: "flex", justifyContent: "center", alignItems: "center"}}>
                            {!remoteStatus.playing && <FontAwesome6 size={24} color={"#FFF"} name={"play"} iconStyle="solid" /> }
                            {remoteStatus.playing && <FontAwesome6 size={24} color={"#FFF"} name={"pause"} iconStyle="solid" /> }
                        </TouchableOpacity>
                        <TouchableOpacity  onPress={() => nextSong()} style={{width: 35, height: 35, borderRadius: 5, backgroundColor: "#FFFFFF11", display: "flex", justifyContent: "center", alignItems: "center"}}>
                            <FontAwesome6 size={24} color={"#fff"} name={"forward-step"} iconStyle="solid" />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => toggleShuffle()} style={{width: 35, height: 35, borderRadius: 5, backgroundColor:  remoteStatus.isShuffle ? "#FFFFFF11" : "#FFFFFF00", display: "flex", justifyContent: "center", alignItems: "center"}}>
                            <FontAwesome6 size={16} color={"#fff"} name={"shuffle"} iconStyle="solid" />
                        </TouchableOpacity>
                        
                    </View>
                    <GestureDetector gesture={gesture}>
                            <View style={{width: "80%", height: 30, justifyContent: "center"}}>
                                <View style={{
                                    width: "100%",
                                    height: 5,
                                    backgroundColor: "#ffffff55",
                                    borderRadius: 1.5,
                                    overflow: "hidden"
                                }}>
                                    <Animated.View style={[
                                        {
                                            width: "100%",
                                            height: "100%",
                                            backgroundColor: "#fff",
                                            borderRadius: 1.5,
                                            transformOrigin: "left",
                                        },
                                        progressStyle
                                    ]}/>
                                </View>
                            </View>
                        </GestureDetector>
                        <View style={{width: "80%", flexDirection: "row", justifyContent: "space-between"}}>
                            <Text style={{color: "#FFF", fontSize: 16, fontFamily: "SF-Bold"}}>
                                {format(remoteStatus.currentTime)}
                            </Text>

                            <Text style={{color: "#FFF", fontSize: 16, fontFamily: "SF-Bold"}}>
                                {format(remoteStatus.duration)}
                            </Text>
                        </View>
                        </>
                    }
                    
                </View>
            </View>

        </View>
    );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
