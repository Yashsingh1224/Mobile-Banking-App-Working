import React, { useState } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Alert } from 'react-native';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import axios from 'axios';
import { Buffer } from 'buffer';
import { useRouter } from 'expo-router';
import { useGlobalStore } from "../../context/globalStore";
import * as Speech from 'expo-speech';

const VoiceToTextInput = () => {
    const [recording, setRecording] = useState(null);
    const [isRecording, setIsRecording] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();
    const { user, userData } = useGlobalStore();


    const startRecording = async () => {
        try {
            await Audio.requestPermissionsAsync();
            await Audio.setAudioModeAsync({
                allowsRecordingIOS: true,
                playsInSilentModeIOS: true,
            });

            const { recording } = await Audio.Recording.createAsync(
                Audio.RecordingOptionsPresets.HIGH_QUALITY
            );
            setRecording(recording);
            setIsRecording(true);
        } catch (err) {
            console.error('Failed to start recording', err);
            Alert.alert('Recording Error', 'Failed to start recording.');
        }
    };

    const stopRecording = async () => {
        try {
            setIsRecording(false);
            await recording.stopAndUnloadAsync();
            const uri = recording.getURI();
            console.log('Recording stopped at', uri);

            await sendToAssemblyAI(uri);
        } catch (err) {
            console.error('Failed to stop recording', err);
            Alert.alert('Recording Error', 'Failed to stop recording.');
        }
    };

    const sendToAssemblyAI = async (uri) => {
        setIsLoading(true);

        try {
            const fileData = await FileSystem.readAsStringAsync(uri, {
                encoding: FileSystem.EncodingType.Base64,
            });

            const binaryData = Buffer.from(fileData, 'base64');

            const uploadResponse = await axios.post(
                'https://api.assemblyai.com/v2/upload',
                binaryData,
                {
                    headers: {
                        authorization: '3374c0b1d2344366a5632fe080533b45', // <-- your API key
                        'Content-Type': 'application/octet-stream',
                    },
                }
            );

            const audioUrl = uploadResponse.data.upload_url;
            console.log('Uploaded to AssemblyAI. URL:', audioUrl);

            const transcriptResponse = await axios.post(
                'https://api.assemblyai.com/v2/transcript',
                {
                    audio_url: audioUrl,
                },
                {
                    headers: {
                        authorization: '3374c0b1d2344366a5632fe080533b45', // <-- your API key again
                        'Content-Type': 'application/json',
                    },
                }
            );

            const transcriptId = transcriptResponse.data.id;
            console.log('Transcript job started:', transcriptId);

            await pollTranscriptionStatus(transcriptId);
        } catch (error) {
            console.error('AssemblyAI error:', error.response?.data || error.message);
            setIsLoading(false);
        }
    };

    const pollTranscriptionStatus = async (transcriptId) => {
        try {
            let completed = false;
            let transcriptionText = '';

            while (!completed) {
                const pollingResponse = await axios.get(
                    `https://api.assemblyai.com/v2/transcript/${transcriptId}`,
                    {
                        headers: { authorization: '3374c0b1d2344366a5632fe080533b45' },
                    }
                );

                if (pollingResponse.data.status === 'completed') {
                    completed = true;
                    transcriptionText = pollingResponse.data.text;
                } else if (pollingResponse.data.status === 'failed') {
                    completed = true;
                    transcriptionText = '';
                } else {
                    console.log('Waiting for transcription...');
                    await new Promise(resolve => setTimeout(resolve, 3000));
                }
            }

            console.log('Final Transcribed Text:', transcriptionText);

            // Analyze transcription to trigger actions
            if (transcriptionText) {
                analyzeCommand(transcriptionText);
            }
        } catch (error) {
            console.error('Polling error:', error.response?.data || error.message);
        }
        setIsLoading(false);
    };

    // 🔥 This function checks for keywords and triggers actions
    const analyzeCommand = (text) => {
        const lowerText = text.toLowerCase();

        if (lowerText.includes('login')) {
            handleLogin();
        }
        if (lowerText.includes('transfer')) {
            handleTransfer();
        }
        if (lowerText.includes('balance')) {
            handleCheckBalance();
        }
        if (lowerText.includes('logout')) {
            handleLogout();
        }
        if (lowerText.includes('settings')) {
            handleOpenSettings();
        }

        if (lowerText.includes('currency')) {
            handleDetectPage();
        }
        // Add more commands as needed
    };

    // 🎯 Functions triggered based on detected keywords
    const handleLogin = () => {
        console.log('🔐 Login Function Triggered!');
        // Call your login functionality here
        router.push('/Login');

    };

    const handleTransfer = () => {
        console.log('💸 Transfer Function Triggered!');
        // Call your transfer functionality here
        router.push('/Transfer');
    };

    const handleCheckBalance = () => {
        console.log('💰 Check Balance Function Triggered!');
        // Call your check balance functionality here
        Speech.speak(`${userData?.accountBalance.toLocaleString()}`);

    };

    const handleDetectPage = () => {
        console.log('🔍 Detect Page Function Triggered!');
        router.push('/CurrencyDetector');
    };

    const handleLogout = () => {
        console.log('🚪 Logout Function Triggered!');
        // Call your logout functionality here
        Alert.alert('Voice Command', 'Logout triggered!');
    };

    const handleOpenSettings = () => {
        console.log('⚙️ Open Settings Function Triggered!');
        // Call your settings functionality here
        Alert.alert('Voice Command', 'Open Settings triggered!');
    };

    return (
        <View style={styles.container}>
            <TouchableOpacity
                style={styles.button}
                onPress={isRecording ? stopRecording : startRecording}
            >
                <Text style={styles.buttonText}>
                    {isRecording ? 'Stop Recording' : 'Start Recording'}
                </Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        paddingTop: 0,
        flex: 0,
        alignItems: 'center',
        backgroundColor: '#F5F8FB',
    },
    button: {
        backgroundColor: '#0A84FF',
        paddingVertical: 14,
        paddingHorizontal: 15,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        height: 54,
    },
    buttonText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '700',
    },
});


export default VoiceToTextInput;
