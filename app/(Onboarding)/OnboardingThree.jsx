import React from 'react'
import { View, Text, Image, TouchableOpacity } from "react-native";
import { images, icons } from "../../constants";
import { router } from "expo-router";
const OnboardingThree = () => {
    return (
        <View className="w-100 bg-primary w-full h-full justify-center px-6">
            <View className="justify-center items-center bg-surface border border-line rounded-[28px] py-8">
                <Image
                    className="w-[319px] h-[305px]"
                    resizeMode="contain"
                    source={images.onboarding3} />
            </View>
            <View className="w-100">
                <Text className="text-center text-navy text-3xl font-pbold mt-12 mb-3">
                    Budgeting Made Simple
                </Text>
                <Text className="mx-1 text-muted font-pmedium text-lg text-center leading-6">
                    Take control of your finances with our intuitive budgeting tool.                </Text>
            </View>
            <View className="mt-12">
                <TouchableOpacity
                    onPress={() => router.replace("/Register")}
                    className="bg-secondary flex-row items-center justify-center p-4 rounded-2xl ">
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
