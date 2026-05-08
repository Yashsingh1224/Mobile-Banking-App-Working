import React from 'react'
import { Link } from "expo-router";
import { Text, View } from "react-native";

const Profile = () => {

    return (
        <>
            <View className="flex-1 bg-primary px-5 pt-16">
                <Text className="text-3xl font-pbold text-navy">Profile</Text>
                <View className="w-full justify-center mt-5 bg-surface border border-line rounded-[28px] p-6">
                    <Text className="text-muted font-pmedium mb-4">Manage your account and security settings.</Text>
                    <View className="rounded-2xl border border-line bg-primary p-4 mb-4">
                        <Text className="text-muted font-pmedium">KYC status</Text>
                        <Text className="text-navy font-pbold mt-1">Pending verification</Text>
                    </View>
                    <Link href="/Login" className="text-lg text-secondary font-pbold">Logout</Link>
                </View>
            </View>
        </>
    )
}
export default Profile
