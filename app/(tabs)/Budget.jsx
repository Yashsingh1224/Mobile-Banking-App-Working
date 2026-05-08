import React from 'react'
import { View, Text } from "react-native";

const Budget = () => {
    return (
        <View className="flex-1 bg-primary px-5 pt-16">
            <Text className="text-3xl font-pbold text-navy">Budget</Text>
            <View className="bg-surface border border-line rounded-[28px] p-5 mt-5">
                <Text className="text-lg font-pbold text-navy">Monthly overview</Text>
                <Text className="text-muted font-pmedium mt-2">Track spending categories and keep your financial goals visible.</Text>
            </View>
        </View>
    )
}
export default Budget
