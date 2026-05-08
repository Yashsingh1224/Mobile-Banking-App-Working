import React from 'react'
import { Link } from "expo-router";
import { Text, View } from "react-native";

const Profile = () => {

    return (
        <>
            <View className="flex-1 bg-primary px-5 pt-16">
                <Text className="text-3xl font-pbold text-navy">Profile</Text>
                <View className="w-full justify-center items-center mt-5 bg-surface border border-line rounded-[28px] p-6">
                    <Text className="text-muted font-pmedium mb-4">Manage your account access.</Text>
                    <Link href="/Login" className="text-lg text-secondary font-pbold mx-2">Logout</Link>
                </View>
            </View>
        </>
    )
}
export default Profile
