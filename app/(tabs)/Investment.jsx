import React from 'react'
import { View, Text } from "react-native";
import FingerprintAuth from '../components/FingerprintAuth';

const Investment = () => {
    const handleAuthSuccess = () => {
        console.log("User authenticated!");
        // Navigate to Home screen or perform any action
    };
    return (
        <View className="flex-1">
            <FingerprintAuth onSuccess={handleAuthSuccess} />
        </View>
    )
}
export default Investment
