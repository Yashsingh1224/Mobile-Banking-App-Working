import React from "react";
import { View, Text, Image } from "react-native";
import { images } from "../../constants";
const OnboardingOne = () => {
  return (
    <View className="bg-primary w-full h-full justify-center px-6">
      <View className="justify-center items-center bg-surface border border-line rounded-[28px] py-8">
        <Image
          className="w-[319px] h-[305px]"
          resizeMode="contain"
          source={images.onboarding1}
        />
      </View>
      <View className="w-100">
        <Text className="mx-1 text-center text-navy text-3xl font-pbold mt-12 mb-3">
          Secure Payment Solutions
        </Text>
        <Text className="text-muted font-pmedium text-lg text-center leading-6">
          Experience seamless and secure payments with our integrated payment
          solutions
        </Text>
      </View>
    </View>
  );
};
export default OnboardingOne;
