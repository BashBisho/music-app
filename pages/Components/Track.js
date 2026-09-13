import { StatusBar } from 'expo-status-bar'
import {View, Text, Image, TouchableOpacity } from 'react-native'
import constants from 'expo-constants'
import Feather from '@react-native-vector-icons/feather' 
import { useAudio } from './AudioContext'
import getImage from '../../assets/defaultImage'

export default function Track({song, index, onPress}) {

    const img = getImage();

    return (
        <TouchableOpacity onPress={() => onPress()} activeOpacity={0.6} style={{width: "100%", height: 50, backgroundColor: "#22222200", display: "flex", flexDirection: "row", gap: 10}}>
            <Image style={{width: 50, height: 50, borderRadius: 10}} src={song.artwork ?? img}/>
            <View style={{display: "flex", justifyContent: "center", alignItems: "flex-start", flexDirection: "column"}}>
                <Text style={{fontSize: 18, color: "#DDD", fontFamily: "SF-Bold"}}>{song.name}</Text>
                <Text style={{fontSize: 12, color: "#DDD", fontFamily: "SF-Reg"}}>{song.artist}</Text>
            </View>
        </TouchableOpacity>
    )


}