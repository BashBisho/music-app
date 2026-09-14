import { StatusBar } from 'expo-status-bar'
import {View, Text, Image, TouchableOpacity, Dimensions } from 'react-native'
import constants from 'expo-constants'
import Feather from '@react-native-vector-icons/feather' 
import { useAudio } from './AudioContext'
import getImage from '../../assets/defaultImage'

export default function Album({album, num = 2, index, onPress}) {

    const img = getImage();
    const { width } = Dimensions.get("screen");

    const len = ((width*0.9*0.98)/num);

    console.log(album)
    return (
        <TouchableOpacity onPress={() => onPress()} activeOpacity={0.6} style={{width: len, backgroundColor: "#22222200", display: "flex", flexDirection: "column", gap: 5}}>
            <Image style={{width: len, height: len, borderRadius: 10}} src={album.cover ?? img}/>
            <View style={{display: "flex", justifyContent: "center", alignItems: "center", flexDirection: "column"}}>
                <Text style={{fontSize: 14, color: "#DDD", fontFamily: "SF-Bold"}}>{album.name.substring(0, 30)}</Text>
                <Text style={{fontSize: 12, color: "#DDD", fontFamily: "SF-Reg"}}>{album.artist.split(',')[0]}</Text>
            </View>
        </TouchableOpacity>
    )
}