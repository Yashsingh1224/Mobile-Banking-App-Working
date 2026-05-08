import React, { useState } from 'react'
import { View, Text, ScrollView, TouchableOpacity, Image, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { icons } from "../../constants";
import { auth } from "../../utility/firebaseConfig"
import { router } from "expo-router";
import Loader from "../../components/Loader";
const EmailOTP = () => {
    const [loading, setLoading] = useState(false)
    const SendEmailOTP = async () => {
        setLoading(true)
        try {
            const user = auth.currentUser
            await user.reload()
            if (user.emailVerified) {
                router.replace("/Login")
            } else {
                Alert.alert('Error', 'Email not verified. Please check your inbox')
            }
        } catch (error) {
            Alert.alert('Error', error.message)
        } finally {
            setLoading(false)
        }
    }
    return (
        <SafeAreaView className="bg-primary h-full w-full justify-center">
            {loading &&
                <Loader />
            }
            <ScrollView
                showsVerticalScrollIndicator={false}
                className="mx-5 mb-2 mt-14"
                contentContainerStyle={{ minHeight: '100%', marginVertical: 70 }}
            >
                <View className="w-full justify-center items-center my-8 bg-surface border border-line rounded-3xl p-6">
                    <View className="w-14 h-14 rounded-2xl bg-[#EAF2FF] items-center justify-center mb-4">
                        <Image
                            className="w-7 h-7"
                            resizeMode="contain"
                            source={icons.mail}
                        />
                    </View>
                    <Text className="text-navy text-center text-xl font-pbold">Verify your email</Text>
                    <Text className="text-muted text-center mt-3 font-pregular">An email verification link has been sent to you.</Text>
                    <Text className="text-muted text-center mt-2 font-pregular">Click the button once you have verified your email.</Text>
                </View>
                <TouchableOpacity onPress={SendEmailOTP}
                    className="bg-secondary shadow-sm flex-row p-4 mt-3 rounded-2xl items-center justify-center">
                    <Text className="text-lg text-white font-pbold">Verify Email</Text>
                </TouchableOpacity>
                <View className="flex-row justify-between mt-5">
                    <View className="flex-row items-center">
                        <Image
                            className="w-4 h-4"
                            resizeMode="contain"
                            source={icons.vectorPhone}
                        />
                        <Text className="text-muted ml-1 font-pmedium">Get a call</Text>
                    </View>
                    <View className="flex-row items-center">
                        <Image
                            className="w-4 h-4"
                            resizeMode="contain"
                            source={icons.vectorEmail} />
                        <Text className="text-muted ml-1 font-pmedium">Receive as sms</Text>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    )
}
export default EmailOTP
