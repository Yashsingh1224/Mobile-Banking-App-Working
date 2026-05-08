import React from 'react'
import { View, Text } from "react-native";

const Budget = () => {
    return (
        <View className="flex-1 bg-primary px-5 pt-16">
            <Text className="text-3xl font-pbold text-navy">Budget planner</Text>
            <View className="bg-surface border border-line rounded-[28px] p-5 mt-5">
                <Text className="text-lg font-pbold text-navy">Monthly overview</Text>
                <Text className="text-muted font-pmedium mt-2">Track spending categories and keep your financial goals visible.</Text>
                <View className="mt-4 rounded-2xl bg-primary border border-line p-4">
                    <Text className="text-muted font-pmedium">Spent this month</Text>
                    <Text className="text-2xl font-pbold text-navy mt-1">$2,450</Text>
                </View>
                <View className="mt-3 rounded-2xl bg-[#EAF2FF] border border-[#CFE0FF] p-4">
                    <Text className="text-muted font-pmedium">Budget health</Text>
                    <Text className="text-lg font-pbold text-navy mt-1">On track (72% used)</Text>
                </View>
            </View>
        </View>
    )
}
export default Budget
