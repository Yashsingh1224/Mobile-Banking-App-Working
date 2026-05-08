import React from 'react'
import { View, Text, Image, TouchableOpacity } from "react-native";
import { images, icons } from "../../constants";
import { router } from "expo-router";
const OnboardingThree = () => {
    return (
        <View className="w-100 bg-primary w-full h-full justify-center px-6">
            <View className="justify-center items-center bg-surface border border-line rounded-[30px] py-8 shadow-sm">
                <Image
                    className="w-[319px] h-[305px]"
                    resizeMode="contain"
                    source={images.onboarding3} />
            </View>
            <View className="w-100">
                <Text className="text-center text-navy text-3xl font-pbold mt-10 mb-3">
                    Budgeting Made Simple
                </Text>
                <Text className="mx-1 text-muted font-pmedium text-base text-center leading-6">
                    Take control of your finances with our intuitive budgeting tool.                </Text>
            </View>
            <View className="mt-10">
                <TouchableOpacity
                    onPress={() => router.replace("/Register")}
                    className="bg-secondary flex-row items-center justify-center p-4 rounded-2xl shadow-sm">
                    <Image
                        className="w-[15px] h-[15px]"
                        resizeMode="contain"
                        source={icons.vectorUpArrow} />
                    <Text className="ml-3 text-lg text-white font-pbold">
                        Get Started
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    )
}
export default OnboardingThree
