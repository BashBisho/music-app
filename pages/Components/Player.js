import FontAwesome6 from '@react-native-vector-icons/fontawesome6';
import { AudioProvider, useAudio } from '../Components/AudioContext';
import { useAudioPlayerStatus } from 'expo-audio';
import { StyleSheet, Text, View, Button, TouchableOpacity} from 'react-native';
import { ImageBackground, Image } from 'expo-image';
import getImage from '../../assets/defaultImage';
import {useEffect, useState} from 'react';
import { getType } from '../Helpers/AsyncManager';

export default function Player({navigation}) {

    const { player, songs, playSong, currentSong, togglePlay, currentArtwork, remoteStatus} = useAudio();
    const [status, setStatus] = useState(useAudioPlayerStatus(player));

    const play = (currentArtwork ?? getImage());
    useEffect(() => {
        async function gt() {
            const type = getType();
            if(type) setStatus(remoteStatus);
        }

        gt();
    })
    return (
        <TouchableOpacity activeOpacity={0.9} onPress={() => { navigation.navigate("MusicPlayer")}} style={{position: "absolute", height: 100, opacity: 1, width: "100%", backgroundColor: "#444", bottom: 0, display: "flex", flexDirection: "row", gap: 10, padding: 10}}> 
            <Image source={play} style={{width: 60, height: 60, borderRadius: 10}}/>
            <View  style={{display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexDirection: "column", paddingBottom: 30}}>
                <View style={{display: "flex", justifyContent: "space-between", alignItems: "center", flexDirection: "row", width: "90%"}}>
                    <View>
                        <Text style={{fontSize: 16, color: "#FFF", fontFamily: "SF-Bold"}}>{currentSong?.name}</Text>
                        <Text style={{fontSize: 12, color: "#FFF", fontFamily: "SF-Medium"}}>{currentSong?.artist}</Text>
                    </View>
                    <TouchableOpacity onPress={() => togglePlay()}>
                        {!status.playing && <FontAwesome6 name={"play"} size={24} color={"#fff"} iconStyle='solid' style={{marginRight: 10}}/> }
                        {status.playing && <FontAwesome6 name={"pause"} size={24} color={"#fff"} iconStyle='solid' style={{marginRight: 10}} /> }
                    </TouchableOpacity>
                </View>
                <View style={{position: "relative", width: "89%"}}>
                    <View style={{width: `${(status.currentTime/status.duration)*100}%`, height: 5, backgroundColor: "#fff", borderRadius: 1.5, position: "absolute"}}></View>
                    <View style={{width: `100%`, height: 5, backgroundColor: "#ffffff55", borderRadius: 1.5}}></View>
                </View>
            </View>
        </TouchableOpacity>
    )

}