import React, { useState } from "react";
import { View, Button, Alert, ActivityIndicator } from "react-native";
import { Audio } from "expo-av";


const API_URL = "http://172.191.13.178:5000/authenticate";

const AuthVoice = ({ onSuccess }) => {
    const [recording, setRecording] = useState(null);
    const [isRecording, setIsRecording] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const startRecording = async () => {
        try {
            const { status } = await Audio.requestPermissionsAsync();
            if (status !== "granted") {
                Alert.alert("Permission denied", "We need mic permission to authenticate.");
                return;
            }

            await Audio.setAudioModeAsync({
                allowsRecordingIOS: true,
                playsInSilentModeIOS: true,
            });

            const { recording } = await Audio.Recording.createAsync(
                Audio.RecordingOptionsPresets.HIGH_QUALITY
            );

            setRecording(recording);
            setIsRecording(true);
        } catch (error) {
            console.error("Start recording error:", error);
        }
    };

    const stopRecording = async () => {
        setIsLoading(true);
        try {
            await recording.stopAndUnloadAsync();
            const uri = recording.getURI();
            setRecording(null);
            setIsRecording(false);

            const formData = new FormData();
            formData.append("file", {
                uri,
                name: "audio.m4a",
                type: "audio/x-m4a",
            });
            formData.append("user", "rishita");

            const res = await fetch(API_URL, {
                method: "POST",
                body: formData,
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            });

            const data = await res.json();
            setIsLoading(false);
            onSuccess(data);
        } catch (error) {
            console.error("Upload error:", error);
            setIsLoading(false);
            Alert.alert("Error", "Something went wrong. Try again.");
        }
    };

    return (
        <View>
            <Button title="Start Recording" onPress={startRecording} disabled={isRecording} />
            <Button title="Stop Recording" onPress={stopRecording} disabled={!isRecording} />
            {isLoading && <ActivityIndicator size="large" />}
        </View>
    );
};

export default AuthVoice;
