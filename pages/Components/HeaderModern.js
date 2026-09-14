import { StatusBar } from 'expo-status-bar'
import {View, Text, Image, TouchableOpacity } from 'react-native'
import constants from 'expo-constants'
import Feather from '@react-native-vector-icons/feather' 
import FontAwesome6 from '@react-native-vector-icons/fontawesome6'

export default function HeaderModern({name, right, left, onSettingsPress, fontSize=24}) {

    return (
        <>
            <View style={{height: 100, width: "100%", background: "none", flexDirection: "row", display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: constants.statusBarHeight, paddingHorizontal: 17, position: "absolute", top: 0}}> 
                <View style={{flexDirection: "row", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, width:"100%"}}>
                    <TouchableOpacity activeOpacity={.8} style={{ width: 30, height: 30, opacity: left?.active, borderRadius: 10, backgroundColor: left.backgroundColor, display: "flex", justifyContent: "center", alignItems: "center"}} onPress={() => left.onPress()}>
                        <FontAwesome6 name={left.name} size={18} color={left.color} iconStyle='solid'/>
                    </TouchableOpacity>
                    <Text style={{fontSize, color: "#DDD", fontFamily: "SF-Bold"}}>{name}</Text>
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