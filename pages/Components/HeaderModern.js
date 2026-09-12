import { StatusBar } from 'expo-status-bar'
import {View, Text, Image, TouchableOpacity } from 'react-native'
import constants from 'expo-constants'
import Feather from '@react-native-vector-icons/feather' 

export default function HeaderModern({name, right, left, onSettingsPress }) {

    return (
        <>
            <View style={{height: 100, width: "100%", background: "none", flexDirection: "row", display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: constants.statusBarHeight, paddingHorizontal: 17, position: "absolute", top: 0}}> 
                <View style={{flexDirection: "row", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, width:"100%"}}>
                    {left &&
                    <TouchableOpacity activeOpacity={.8} style={{width: 30, height: 30, borderRadius: 10, backgroundColor: left.backgroundColor, display: "flex", justifyContent: "center", alignItems: "center"}} onPress={() => left.onPress()}>
                        <Feather name={left.name} size={16} color={left.color}/>
                    </TouchableOpacity>
                    }
                    <Text style={{fontSize: 24, color: "#DDD", marginBottom: 3, fontFamily: "SF-Bold"}}>{name}</Text>
                    {right &&
                        <TouchableOpacity activeOpacity={.8} style={{width: 30, opacity: 0, height: 30, borderRadius: 10, backgroundColor: right.backgroundColor, display: "flex", justifyContent: "center", alignItems: "center"}} onPress={() => right.onPress()}>
                            <Feather name={right.name} size={16} color={right.color}/>
                        </TouchableOpacity>
                    }
                </View>
            </View>
            <View style={{height: 100, width: 100}}></View>
        </>
    )


}