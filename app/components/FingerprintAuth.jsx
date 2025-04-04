import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, Alert, StyleSheet } from "react-native";
import * as LocalAuthentication from "expo-local-authentication";
import * as Animatable from "react-native-animatable";
import Icon from "react-native-vector-icons/MaterialCommunityIcons"; // ✅ Replaced lucide-react-native

const FingerprintAuth = ({ onSuccess }) => {
    const [isBiometricSupported, setIsBiometricSupported] = useState(false);

    const fallBackToDefaultAuth = () => {
        console.log("Fallback to password authentication");
    };

    const alertComponent = (title, message, btnTxt, btnFunc) => {
        Alert.alert(title, message, [{ text: btnTxt, onPress: btnFunc }]);
    };

    const handleBiometricAuth = async () => {
        try {
            const isBiometricAvailable = await LocalAuthentication.hasHardwareAsync();
            if (!isBiometricAvailable) {
                return alertComponent(
                    "Biometric authentication not supported",
                    "Please enter your password",
                    "OK",
                    fallBackToDefaultAuth
                );
            }

            const savedBiometrics = await LocalAuthentication.isEnrolledAsync();
            if (!savedBiometrics) {
                return alertComponent(
                    "No biometric data found",
                    "Please login with your password",
                    "OK",
                    fallBackToDefaultAuth
                );
            }

            const biometricAuth = await LocalAuthentication.authenticateAsync({
                promptMessage: "Login using Biometrics",
                cancelLabel: "Cancel",
                disableDeviceFallback: true,
            });

            if (biometricAuth.success) {
                Alert.alert(
                    "You are logged in!",
                    "Authentication successful.",
                    [
                        { text: "Cancel", onPress: () => console.log("Cancel Pressed"), style: "cancel" },
                        { text: "Proceed", onPress: () => console.log("Ok Pressed") },
                    ]
                );
                if (onSuccess) onSuccess(); // ✅ Trigger callback if provided
            } else {
                alertComponent("Authentication Failed", "Try again", "OK", () => { });
            }
        } catch (error) {
            console.error("Biometric authentication error:", error);
        }
    };

    useEffect(() => {
        const checkBiometricSupport = async () => {
            try {
                const compatible = await LocalAuthentication.hasHardwareAsync();
                setIsBiometricSupported(compatible);
            } catch (error) {
                console.error("Error checking biometric support:", error);
            }
        };
        checkBiometricSupport();
    }, []);

    return (
        <View style={styles.container}>
            <Animatable.View animation="fadeInDown" delay={500}>
                <Icon name="lock" size={60} color="#fff" />
            </Animatable.View>

            <Text style={styles.title}>Secure Login</Text>

            <Animatable.View animation="pulse" iterationCount="infinite" style={styles.authButtonContainer}>
                <TouchableOpacity onPress={handleBiometricAuth} style={styles.authButton}>
                    <Icon name="fingerprint" size={50} color="white" />
                </TouchableOpacity>
            </Animatable.View>

            <Text style={styles.instructions}>Tap to authenticate</Text>
        </View>
    );
};

// ✅ Moved styles to a separate StyleSheet for better readability
const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#111",
        paddingHorizontal: 24,
    },
    title: {
        fontSize: 22,
        color: "white",
        marginTop: 16,
        fontWeight: "600",
    },
    authButtonContainer: {
        marginTop: 24,
    },
    authButton: {
        padding: 16,
        backgroundColor: "#2563eb",
        borderRadius: 100,
        alignItems: "center",
        justifyContent: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 8, // ✅ Adds a shadow on Android
    },
    instructions: {
        color: "#9CA3AF",
        marginTop: 16,
    },
});

export default FingerprintAuth;
