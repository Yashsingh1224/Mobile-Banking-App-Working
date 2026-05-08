import React from 'react'
import {View, Text, Image, TouchableOpacity} from "react-native";
import {icons} from "../constants"


const QuickLink = () => {
    return (
        <View className="w-full mt-4 px-4">
            <View className="flex-row items-center justify-between mb-3">
                <Text className="text-lg font-pbold text-navy">Quick actions</Text>
                <Text className="text-xs font-pmedium text-muted">Everyday banking</Text>
            </View>

            <View className="flex-row bg-surface border border-line rounded-3xl py-4">
                <TouchableOpacity className="items-center flex-1">
                    <View className="bg-[#EAF2FF] w-12 h-12 rounded-2xl items-center justify-center">
                        <Image className="w-6 h-6" source={icons.phone2} resizeMode="contain"/>
                    </View>
                    <Text className="font-pmedium mt-2 text-navy text-xs">Airtime</Text>
                </TouchableOpacity>

                <TouchableOpacity  className="items-center flex-1">
                    <View className="bg-[#E8FBF6] w-12 h-12 rounded-2xl items-center justify-center">
                        <Image className="w-6 h-6" source={icons.lightbulb} resizeMode="contain"/>
                    </View>
                    <Text className="font-pmedium mt-2 text-navy text-xs">Electricity</Text>
                </TouchableOpacity>

                <TouchableOpacity  className="items-center flex-1">
                    <View className="bg-[#EFF6FF] w-12 h-12 rounded-2xl items-center justify-center">
                        <Image className="w-6 h-6" source={icons.wifiIcon} resizeMode="contain"/>
                    </View>
                    <Text className="font-pmedium mt-2 text-navy text-xs">Data</Text>
                </TouchableOpacity>

                <TouchableOpacity  className="items-center flex-1">
                    <View className="bg-[#F8FAFC] w-12 h-12 rounded-2xl items-center justify-center">
                        <Image className="w-6 h-6" source={icons.menu} resizeMode="contain"/>
                    </View>
                    <Text className="font-pmedium mt-2 text-navy text-xs">Others</Text>
                </TouchableOpacity>
            </View>
        </View>
    )
}
export default QuickLink
