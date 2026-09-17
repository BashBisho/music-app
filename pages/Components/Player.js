import FontAwesome6 from '@react-native-vector-icons/fontawesome6';
import { AudioProvider, useAudio } from '../Components/AudioContext';
import { useAudioPlaylistStatus } from 'expo-audio';
import { StyleSheet, Text, View, Button, TouchableOpacity, Dimensions} from 'react-native';
import { ImageBackground, Image } from 'expo-image';
import getImage from '../../assets/defaultImage';
import {useEffect, useState} from 'react';
import { getType } from '../Helpers/AsyncManager';
import {getFontSize} from '../Helpers/HelperFunctions'

export default function Player({navigation}) {

    const { player, songs, playSong, currentSong, togglePlay, currentArtwork, remoteStatus} = useAudio();
    const [type, setType] = useState(0);

    const status = useAudioPlaylistStatus(player);
    const { width } = Dimensions.get("screen");

    const play = (currentArtwork ?? getImage());
    useEffect(() => {
        async function gt() {
            const type = await getType();
            setType(type);
        }

        gt();
    }, [])


    function getStatus() {
        return !type ? status : remoteStatus;
    }

    const songUse = currentSong.name ? currentSong :  {
        artist: "No audio playing",
        name: "N/A",
        artwork: getImage()
    }

    const isFromAlbum = (currentSong?.album && currentSong.album != "Unknown" && currentSong?.album != currentSong?.name);

    const pre = getStatus().currentTime/getStatus().duration;
    const thickness = 2;
    const len = 60;
    const color = "#FFFFFFaa";
    return (
        <TouchableOpacity activeOpacity={0.9} onPress={() => { navigation.navigate("MusicPlayer")}} style={{position: "absolute", height: 90, opacity: 1, width: "100%", backgroundColor: "#FFFFFF11", bottom: 0, display: "flex",alignItems: "center", borderRadius: 10, flexDirection: "row", gap: 10, padding: 10}}> 
            <View style={{width: 60, height: 60, marginBottom: 10}}>
                <Image source={play} style={{width: 60, height: 60, borderRadius: 5}}/>
            </View>
            <View  style={{display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexDirection: "row",  height: 60, marginBottom: 10, gap: 5, flex: 10}}>
                <View style={{display: "flex", justifyContent: "space-between", padding: 0, alignItems: "flex-start", flexDirection: "column", height: 60, width: width - 90 - 20*2 - 20*2 - 10, gap: 10}}>
                    <View>
                        <Text style={{fontSize: getFontSize(songUse.name, 16, 10, 12), color: "#FFF", fontFamily: "SF-Bold"}}>{songUse.name}</Text>
                        <Text style={{fontSize:  getFontSize(songUse.artist, 12, 10, 9), color: "#FFF", fontFamily: "SF-Medium"}}>{`${songUse.artist}${isFromAlbum ? ` - ${songUse.album}` : ''}`}</Text>
                    </View>
                    <View style={{position: "relative", width: "100%", height: 5, justifyContent: "center", flex: 1}}>
                        <View style={{width: `${(getStatus().currentTime/getStatus().duration)*100}%`, height: 5, backgroundColor: "#fff", borderRadius: 1.5, position: "absolute"}}></View>
                        <View style={{width: `100%`, height: 5, backgroundColor: "#ffffff55", borderRadius: 1.5}}></View>
                    </View>
                    
                </View>
                <View style={{display: "flex", justifyContent: "center", alignItems: "flex-start", flexDirection: "row",  height: 60,  gap: 5, flex: 10, }}>
                    <TouchableOpacity style={{width: 20, height: 60, justifyContent: "center", alignItems: "center", overflow: "hidden", borderRadius: 2, flex: 1, marginBottom: 10}} onPress={() => togglePlay()}>
                        <FontAwesome6 name={"bars"} size={24} color={"#fff"} iconStyle='solid' /> 
                    </TouchableOpacity>
                    <TouchableOpacity style={{width: 20, height: 60, justifyContent: "center", alignItems: "center", overflow: "hidden", borderRadius: 2, flex: 1}} onPress={() => togglePlay()}>
                        {!getStatus().playing && <FontAwesome6 name={"play"} size={24} color={"#fff"} iconStyle='solid' /> }
                        {getStatus().playing && <FontAwesome6 name={"pause"} size={24} color={"#fff"} iconStyle='solid' /> }
                    </TouchableOpacity>
                   
                </View>
            </View>
        </TouchableOpacity>
    )

}