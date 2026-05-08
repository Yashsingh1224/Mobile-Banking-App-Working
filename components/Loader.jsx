import React from 'react'
import {View, Text, ActivityIndicator} from "react-native";

const Loader = () => {
    return (
        <View className="w-full absolute z-10 h-[100vh] justify-center items-center bg-navy/90" >
            <ActivityIndicator size="large" color="#0A84FF" className="fix"/>
            <Text className="font-pbold text-lg text-white mt-3">Securing your session...</Text>
        </View>
    )
}
export default Loader
