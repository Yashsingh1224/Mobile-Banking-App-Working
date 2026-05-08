import React from 'react'
import {View, Text, ActivityIndicator} from "react-native";

const Loader = () => {
    return (
        <View className="w-full absolute z-10 h-[100vh] justify-center items-center bg-[#0F2742] opacity-90" >
            <ActivityIndicator size="large" color="#10B981" className="fix"/>
            <Text className="font-pbold text-lg text-white mt-3">Loading...</Text>
        </View>
    )
}
export default Loader
