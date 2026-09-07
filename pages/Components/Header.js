import { StatusBar } from 'expo-status-bar'
import {View, Text, Image, TouchableOpacity } from 'react-native'
import constants from 'expo-constants'
import Feather from '@react-native-vector-icons/feather' 

export default function Header({name, onSettingsPress }) {

    console.log(constants.statusBarHeight)
    return (

        <View style={{height: 100, width: "100%", background: "none", flexDirection: "row", display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: constants.statusBarHeight, paddingHorizontal: 17, position: "absolute", top: 0}}> 
            <Text style={{fontSize: 30, color: "#DDD", marginBottom: 7}}>{name}</Text>
            <TouchableOpacity activeOpacity={.8} style={{width: 30, height: 30, borderRadius: 10, backgroundColor: "#DDD", display: "flex", justifyContent: "center", alignItems: "center"}} onPress={() => onSettingsPress&& onSettingsPress()}>
                <Feather name={"settings"} size={16} />
            </TouchableOpacity>
        </View>
    )


}