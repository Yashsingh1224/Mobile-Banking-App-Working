import React from 'react'
import { View, Text, Image } from "react-native";
import { images } from "../../constants";
const OnboardingTwo = () => {
    return (
        <View className="bg-primary w-full h-full justify-center px-6">
            <View className="justify-center items-center bg-surface border border-line rounded-[28px] py-8">
                <Image
                    className="w-[319px] h-[305px]"
                    resizeMode="contain"
                    source={images.onboarding2} />
            </View>
            <View className="w-100">
                <Text className="mx-1 text-center text-navy text-3xl font-pbold mt-12 mb-3">
                    Smart Investing Opportunities
                </Text>
                <Text className="mx-1 text-muted font-pmedium text-lg text-center leading-6">
                    Explore a world of investment possibilities with our smart investing feature.
                </Text>
            </View>
        </View>
    )
}
export default OnboardingTwo
