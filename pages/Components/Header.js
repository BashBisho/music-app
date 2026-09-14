import { StatusBar } from 'expo-status-bar'
import {View, Text, Image, TouchableOpacity } from 'react-native'
import constants from 'expo-constants'
import Feather from '@react-native-vector-icons/feather' 
import FontAwesome6 from '@react-native-vector-icons/fontawesome6'

export default function Header({name, right, left, onSettingsPress}) {

    return (
        <>
            <View style={{height: 100, width: "100%", background: "none", flexDirection: "row", display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: constants.statusBarHeight, paddingHorizontal: 17, position: "absolute", top: 0}}> 
                <View style={{flexDirection: "row", display: "flex", justifyContent: "flex-start", alignItems: "center", gap: 10}}>
                    {left &&
                    <TouchableOpacity activeOpacity={.8} style={{width: 30, height: 30, borderRadius: 10, backgroundColor: left.backgroundColor, display: "flex", justifyContent: "center", alignItems: "center"}} onPress={() => left.onPress()}>
                        <FontAwesome6 name={left.name} size={left.iconSize ?? 24} color={left.color} iconStyle='solid'/>
                    </TouchableOpacity>
                    }
                    <Text style={{fontSize: 30, color: "#DDD", marginBottom: 3, fontFamily: "SF-Bold"}}>{name}</Text>
                </View>
                {right &&
                    <TouchableOpacity activeOpacity={.8} style={{width: 30, height: 30, borderRadius: 10, backgroundColor: right.backgroundColor, display: "flex", justifyContent: "center", alignItems: "center", marginTop: 5}} onPress={() => right.onPress()}>
                        <FontAwesome6 name={right.name} size={right.iconSize ?? 16} color={right.color} iconStyle='solid'/>
                    </TouchableOpacity>
                }
            </View>
            <View style={{height: 100, width: 100}}></View>
        </>
    )


}