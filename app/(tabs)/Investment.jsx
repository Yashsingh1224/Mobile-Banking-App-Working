import React from 'react'
import { View, Text } from "react-native";
import AuthVoice from '../components/AuthVoice'


const Investment = () => {
    return (
        <View className="flex-1 bg-primary px-5 pt-16">
            <Text className="text-3xl font-pbold text-navy">Investment vault</Text>
            <Text className="text-muted font-pmedium mt-2">Authenticate with voice to access your portfolio.</Text>
            <View className="bg-surface border border-line rounded-[28px] p-5 mt-5">
                <Text className="text-lg font-pbold text-navy mb-3">Secure access</Text>
                <AuthVoice />
            </View>
        </View>
    )
}
export default Investment
