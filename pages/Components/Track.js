import { StatusBar } from 'expo-status-bar'
import {View, Text, Image, TouchableOpacity } from 'react-native'
import constants from 'expo-constants'
import Feather from '@react-native-vector-icons/feather' 
import { useAudio } from './AudioContext'
import getImage from '../../assets/defaultImage'
import { getFontSize } from '../Helpers/HelperFunctions'

export default function Track({song, showImage=true, index, onPress}) {

    const img = getImage();

    return (
        <TouchableOpacity onPress={() => onPress()} activeOpacity={0.6} style={{width: "100%", height: 60, backgroundColor: "#FFFFFF11", display: "flex", paddingHorizontal: 5, borderRadius: 3, justifyContent: "flex-start", alignItems: "center", flexDirection: "row", gap: 10}}>
            {showImage&&<Image style={{width: 50, height: 50, borderRadius: 5}} src={song.artwork ?? img}/>}
            {!showImage&&
                <View style={{width: 50, height: 50, borderRadius: 10, justifyContent: "center", alignItems: "center"}}>
                    <Text style={{fontSize: 20, fontFamily: "SF-Bold", color: "#FFF"}}>{song.track}</Text>
                </View>
            }

            <View style={{display: "flex", height: 50, justifyContent: "flex-start", alignItems: "flex-start", flexDirection: "column"}}>
                <Text style={{fontSize: getFontSize(song.name, 18, 20, 8), lineHeight: 20, color: "#DDD", fontFamily: "SF-Bold"}}>{song.name}</Text>
                <Text style={{fontSize: getFontSize(song.artist, 12, 20, 14), lineHeight: 14, color: "#DDD", fontFamily: "SF-Reg"}}>{song.artist}</Text>
            </View>
        </TouchableOpacity>
    )


}