import React, { useState } from "react";
import { View, Button, Text, ActivityIndicator, Alert } from "react-native";
import { Audio } from "expo-av";
import * as Speech from "expo-speech";

const API_KEY = "3374c0b1d2344366a5632fe080533b45"; // Replace with your actual key

const VoiceRecorder = () => {
    const [recording, setRecording] = useState(null);
    const [transcribedText, setTranscribedText] = useState("");
    const [loading, setLoading] = useState(false);

    // Start Recording
    const startRecording = async () => {
        try {
            setTranscribedText("");
            const { granted } = await Audio.requestPermissionsAsync();
            if (!granted) {
                Alert.alert("Permission required", "Please grant microphone access.");
                return;
            }

            await Audio.setAudioModeAsync({
                allowsRecordingIOS: true,
                playsInSilentModeIOS: true,
            });

            const recordingObj = new Audio.Recording();
            await recordingObj.prepareToRecordAsync(
                Audio.RECORDING_OPTIONS_PRESET_HIGH_QUALITY
            );
            await recordingObj.startAsync();
            setRecording(recordingObj);
        } catch (err) {
            console.error("Failed to start recording", err);
        }
    };

    // Stop Recording
    const stopRecording = async () => {
        try {
            setLoading(true);
            if (!recording) return;

            await recording.stopAndUnloadAsync();
            const uri = recording.getURI();
            setRecording(null);

            console.log("Audio recorded at:", uri);
            await processAudio(uri);
        } catch (err) {
            console.error("Failed to stop recording", err);
            setLoading(false);
        }
    };

    // Convert local file to FormData
    const uploadAudio = async (uri) => {
        try {
            const response = await fetch(uri);
            const blob = await response.blob();

            const formData = new FormData();
            formData.append("file", {
                uri,
                name: "audio.wav",
                type: "audio/wav",
            });

            const uploadResponse = await fetch("https://api.assemblyai.com/v2/upload", {
                method: "POST",
                headers: {
                    authorization: API_KEY,
                },
                body: formData,
            });

            if (!uploadResponse.ok) throw new Error("Failed to upload audio");

            const uploadResult = await uploadResponse.json();
            return uploadResult.upload_url;
        } catch (err) {
            console.error("Error uploading audio", err);
            throw err;
        }
    };

    // Transcribe Audio
    const transcribeAudio = async (audioUrl) => {
        const response = await fetch("https://api.assemblyai.com/v2/transcript", {
            method: "POST",
            headers: {
                authorization: API_KEY,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ audio_url: audioUrl }),
        });

        if (!response.ok) throw new Error("Failed to start transcription");

        const result = await response.json();
        return result.id;
    };

    // Poll for Transcription Result
    const checkTranscription = async (transcriptionId) => {
        while (true) {
            const response = await fetch(`https://api.assemblyai.com/v2/transcript/${transcriptionId}`, {
                headers: { authorization: API_KEY },
            });

            const result = await response.json();
            if (result.status === "completed") {
                return result.text;
            } else if (result.status === "failed") {
                throw new Error("Transcription failed");
            }

            await new Promise((resolve) => setTimeout(resolve, 5000));
        }
    };

    // Process Audio (Upload → Transcribe → Get Text)
    const processAudio = async (uri) => {
        try {
            console.log("Uploading audio...");
            const audioUrl = await uploadAudio(uri);
            console.log("Audio uploaded:", audioUrl);

            console.log("Starting transcription...");
            const transcriptionId = await transcribeAudio(audioUrl);
            console.log("Transcription ID:", transcriptionId);

            console.log("Fetching results...");
            const text = await checkTranscription(transcriptionId);
            console.log("Transcribed Text:", text);

            setTranscribedText(text);
            Speech.speak(text); // Read out the text

            if (text.toLowerCase().includes("login")) {
                console.log("Logged in");
            }

            setLoading(false);
        } catch (err) {
            console.error("Error processing audio", err);
            setLoading(false);
        }
    };

    return (
        <View style={{ padding: 20 }}>
            <Button title="Start Recording" onPress={startRecording} disabled={!!recording} />
            <Button title="Stop Recording" onPress={stopRecording} disabled={!recording} />
            {loading && <ActivityIndicator size="large" color="blue" />}
            {transcribedText ? <Text>Transcription: {transcribedText}</Text> : null}
        </View>
    );
};

export default VoiceRecorder;
