import { StyleSheet, Text, View, Button, TouchableOpacity, Dimensions, ScrollView} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useAudioPlaylistStatus } from 'expo-audio'
import { Directory, File, Paths } from 'expo-file-system'; 
import { useState, useEffect, useRef } from 'react';

import { getAudioMetadata } from '@missingcore/audio-metadata';
import { ImageBackground, Image } from 'expo-image';
import { BlurView, BlurTargetView } from 'expo-blur';
import Header from './Components/HeaderModern';
import { AudioProvider, useAudio } from './Components/AudioContext';
import getImage from '../assets/defaultImage';
import FontAwesome6 from '@react-native-vector-icons/fontawesome6';
import { format, getFontSize } from './Helpers/HelperFunctions';

import Animated, {
    useSharedValue,
    useAnimatedStyle,
} from 'react-native-reanimated';

import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { scheduleOnRN } from 'react-native-worklets';
import { getType } from './Helpers/AsyncManager';
import { lockAsync, OrientationLock}  from 'expo-screen-orientation'
import getLyric from '../assets/defaultLyric';
export default function App({navigation}) {

    
    const { player, songs, playSong, currentSong, togglePlay, prevSong, nextSong, seekTo, currentArtwork, isShuffle, toggleShuffle, toggleLoop} = useAudio();
    const [sender, setSender] = useState(false);

    useEffect(() => {
        async function gt() {
            const type = await getType();
            setSender(type);
            if(type) lockAsync(OrientationLock.LANDSCAPE)
        }

        gt();
    }, [])

    const status = useAudioPlaylistStatus(player);

    const blurTargetRef = useRef(null);
    const {width, height} = Dimensions.get("screen");

    const play = (currentArtwork ?? getImage());

    const barWidth = width * 0.8;
    const progress = useSharedValue(0);

    useEffect(() => {
        if (status.duration > 0) {
            progress.value = status.currentTime / status.duration;
        }
    }, [status.currentTime, status.duration]);

    const seekAt = (x) => {
        const value = Math.max(0, Math.min(x / barWidth, 1));
        player.seekTo(value * status.duration);
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

    const isFromAlbum = (currentSong?.album && currentSong.album != "Unknown" && currentSong?.album != currentSong?.name);
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
            <Header name={isFromAlbum ? currentSong.album : "Now Playing"} right={{name: "slash", backgroundColor: "#CC2936", color: "#FFF", onPress: () => clearMusicCache()}}  left={{name: "chevron-left", backgroundColor: "#FFFFFF00", color: "#FFF", iconSize: 24, onPress: () => { if(navigation.canGoBack() ) navigation.goBack()} }}/>
            <ScrollView nestedScrollEnabled contentContainerStyle={{justifyContent: "flex-start", alignItems: "center"}} showsVerticalScrollIndicator={false}  snapToOffsets={[0, 40 + width*0.7 + 36 + 28 + 100]} style={{display: "flex", flex: 1,  flexDirection: "column", width: "100%", paddingTop: 40}}>
                <Image style={{width: width*0.7, height: width*0.7, borderRadius: 10, marginBottom: 10}} source={play} /> 
                <Text style={{color: "#FFF", fontSize: getFontSize(currentSong?.name, 32, 10, 2.7), fontFamily: "SF-Bold", lineHeight: 36, textAlign: "center", width: "80%"}}>{currentSong?.name}</Text>
                <Text style={{color: "#888", fontSize: getFontSize(currentSong?.artist, 24, 10, 4), fontFamily: "SF-Reg", lineHeight: 28, marginBottom: 30, textAlign: "center", width: "80%"}} >{currentSong?.artist}</Text>

            
                <View style={{display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "space-around", width: "70%", marginBottom: 20}}>
                    <TouchableOpacity onPress={() => toggleLoop()} style={{width: 35, height: 35, borderRadius: 5, backgroundColor: status.loop == 'single' ? "#FFFFFF11" : "#FFFFFF00", display: "flex", justifyContent: "center", alignItems: "center"}}>
                        <FontAwesome6 size={16} color={"#fff"} name={"repeat"} iconStyle="solid" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => prevSong()} style={{width: 35, height: 35, borderRadius: 5, backgroundColor: "#FFFFFF00", display: "flex", justifyContent: "center", alignItems: "center"}}>
                        <FontAwesome6 size={24} color={"#fff"} name={"backward-step"} iconStyle="solid" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => togglePlay()} style={{width: 50, height: 50, borderRadius: 5, backgroundColor: "#FFFFFF44", display: "flex", justifyContent: "center", alignItems: "center"}}>
                        {!status.playing && <FontAwesome6 size={24} color={"#FFF"} name={"play"} iconStyle="solid" /> }
                        {status.playing && <FontAwesome6 size={24} color={"#FFF"} name={"pause"} iconStyle="solid" /> }
                    </TouchableOpacity>
                    <TouchableOpacity  onPress={() => nextSong()} style={{width: 35, height: 35, borderRadius: 5, backgroundColor: "#FFFFFF00", display: "flex", justifyContent: "center", alignItems: "center"}}>
                        <FontAwesome6 size={24} color={"#fff"} name={"forward-step"} iconStyle="solid" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => toggleShuffle()} style={{width: 35, height: 35, borderRadius: 5, backgroundColor: isShuffle ? "#FFFFFF11" : "#FFFFFF00", display: "flex", justifyContent: "center", alignItems: "center"}}>
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
                            {format(status.currentTime)}
                        </Text>
                        <Text style={{color: "#FFF", fontSize: 16, fontFamily: "SF-Bold"}}>
                            {format(status.duration)}
                        </Text>
                    </View>
                    <View style={{height: 80}}/>
                    <View style={{display: "flex", width: "80%", justifyContent: 'flex-start', alignItems: "flex-start", flexDirection: "column", gap: 10}}>
                        <Text style={{fontSize: 24, fontFamily: "SF-Bold", color: "#FFF"}}>Lyrics</Text>
                        <ScrollView  nestedScrollEnabled style={{height: 300, width: "100%", backgroundColor: "#FFFFFF11", borderRadius: 5, marginBottom: 100}}>
                            <Text style={{fontSize: 14, fontFamily: "SF-Medium", color: "#FFFFFFAA", marginLeft: 10, marginVertical: 10}}>{getLyric()}</Text>
                        </ScrollView>
                        
                    </View>
            </ScrollView>
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