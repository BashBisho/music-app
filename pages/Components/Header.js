import { StatusBar } from 'expo-status-bar'
import {View, Text, Image, TouchableOpacity } from 'react-native'
import constants from 'expo-constants'
import Feather from '@react-native-vector-icons/feather' 

export default function Header({name, right, onSettingsPress }) {

    return (
        <>
            <View style={{height: 100, width: "100%", background: "none", flexDirection: "row", display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: constants.statusBarHeight, paddingHorizontal: 17, position: "absolute", top: 0}}> 
                <Text style={{fontSize: 30, color: "#DDD", marginBottom: 7}}>{name}</Text>
                {right &&
                    <TouchableOpacity activeOpacity={.8} style={{width: 30, height: 30, borderRadius: 10, backgroundColor: right.backgroundColor, display: "flex", justifyContent: "center", alignItems: "center"}} onPress={() => right.onPress()}>
                        <Feather name={right.name} size={16} color={right.color}/>
                    </TouchableOpacity>
                }
            </View>
            <View style={{height: 100, width: 100}}></View>
        </>
    )


}