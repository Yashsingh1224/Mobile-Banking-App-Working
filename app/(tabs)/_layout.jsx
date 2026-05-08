import React from 'react'
import {icons} from "../../constants"
import {Tabs} from "expo-router";
import {Image, Text, View} from "react-native";


const TabIcon = ({icon, color, name, focused}) => {
    return (
        <View className={`flex items-center justify-center ${focused ? "bg-[#ECFDF5] px-3 py-2 rounded-2xl" : "px-3 py-2"}`}>
            <Image
                source={icon}
                resizeMode="contain"
                tintColor={color}
                className="w-5 h-5"
            />
            <Text className={`${focused ? "font-pbold" : "font-pregular"} text-xs `}
                  style={{color: color}}>
                {name}
            </Text>
        </View>
    )
}


const TabLayout = () => {
    return (
        <>
            <Tabs
                screenOptions={{
                    tabBarActiveTintColor: "#0F2742",
                    tabBarInactiveTintColor: "#94A3B8",
                    tabBarShowLabel: false,
                    tabBarStyle: {
                        backgroundColor: "#FFFFFF",
                        borderTopWidth: 1,
                        borderTopColor: "#E2E8F0",
                        height: 78,
                        paddingTop: 8,
                        paddingBottom: 10,
                        elevation: 12,
                        shadowColor: "#0F2742",
                        shadowOpacity: 0.08,
                        shadowRadius: 16,
                        shadowOffset: { width: 0, height: -6 },
                    }
                }}>

                <Tabs.Screen
                    name="Home"
                    options={{
                        title: "Home",
                        headerShown: false,
                        tabBarIcon: ({color, focused}) => (
                            <TabIcon
                                icon={icons.home}
                                color={color}
                                name="Home"
                                focused={focused}
                            />
                        ),
                    }}
                />

                <Tabs.Screen
                    name="Budget"
                    options={{
                        title: "Budget",
                        headerShown: false,
                        tabBarIcon: ({color, focused}) => (
                            <TabIcon
                                icon={icons.chartPie}
                                color={color}
                                name="Budget"
                                focused={focused}
                            />
                        ),
                    }}
                />

                <Tabs.Screen
                    name="Investment"
                    options={{
                        title: "Investment",
                        headerShown: false,
                        tabBarIcon: ({color, focused}) => (
                            <TabIcon
                                icon={icons.investment}
                                color={color}
                                name="Investment"
                                focused={focused}
                            />
                        ),
                    }}
                />

                <Tabs.Screen
                    name="CurrencyDetector"
                    options={{
                        title: "Detect",
                        headerShown: false,
                        tabBarIcon: ({color, focused}) => (
                            <TabIcon
                                icon={icons.scan}
                                color={color}
                                name="Detect"
                                focused={focused}
                            />
                        ),
                    }}
                />

                <Tabs.Screen
                    name="Profile"
                    options={{
                        title: "Profile",
                        headerShown: false,
                        tabBarIcon: ({color, focused}) => (
                            <TabIcon
                                icon={icons.profile}
                                color={color}
                                name="Profile"
                                focused={focused}
                            />
                        ),
                    }}
                />
            </Tabs>
        </>
    )
}
export default TabLayout
