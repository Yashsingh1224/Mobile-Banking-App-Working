import React, { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Alert, NativeModules, Text, TouchableOpacity, View } from "react-native";
import { Asset } from "expo-asset";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as ImageManipulator from "expo-image-manipulator";
import * as Speech from "expo-speech";
import jpeg from "jpeg-js";
import { router } from "expo-router";

const MODEL_ASSET = require("../../assets/models/currency_detector.onnx");
const SCAN_INTERVAL_MS = 1800;
const CONF_THRESHOLD = 0.8;

const CLASSES = [
    "fake_50",
    "fake_10",
    "fake_20",
    "fake_200",
    "fake_500",
    "fake_2000",
    "fake_100",
    "real_50",
    "real_10",
    "real_20",
    "real_200",
    "real_500",
    "real_2000",
    "real_100",
];

const MEAN = [0.485, 0.456, 0.406];
const STD = [0.229, 0.224, 0.225];

const softmax = (values) => {
    const max = Math.max(...values);
    const exps = values.map((value) => Math.exp(value - max));
    const sum = exps.reduce((total, value) => total + value, 0);
    return exps.map((value) => value / sum);
};

const getStablePrediction = (buffer) => {
    const counts = buffer.reduce((acc, item) => {
        acc[item] = (acc[item] || 0) + 1;
        return acc;
    }, {});

    return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || "";
};

const formatNote = (label) => {
    if (!label || label === "NO_NOTE") return "";
    const [, denom] = label.split("_");
    return `${denom} rupee note`;
};

const imageBase64ToTensor = (base64, ort) => {
    const rawImageData = jpeg.decode(Buffer.from(base64, "base64"), { useTArray: true });
    const { data, width, height } = rawImageData;
    const floatData = new Float32Array(1 * 3 * width * height);
    const planeSize = width * height;

    for (let y = 0; y < height; y += 1) {
        for (let x = 0; x < width; x += 1) {
            const pixelIndex = (y * width + x) * 4;
            const tensorIndex = y * width + x;

            floatData[tensorIndex] = (data[pixelIndex] / 255 - MEAN[0]) / STD[0];
            floatData[planeSize + tensorIndex] = (data[pixelIndex + 1] / 255 - MEAN[1]) / STD[1];
            floatData[planeSize * 2 + tensorIndex] = (data[pixelIndex + 2] / 255 - MEAN[2]) / STD[2];
        }
    }

    return new ort.Tensor("float32", floatData, [1, 3, height, width]);
};

const CurrencyDetector = () => {
    const cameraRef = useRef(null);
    const scanTimerRef = useRef(null);
    const lastSpokenRef = useRef("");
    const predictionBufferRef = useRef([]);
    const processingRef = useRef(false);
    const ortRef = useRef(null);

    const [permission, requestPermission] = useCameraPermissions();
    const [session, setSession] = useState(null);
    const [modelError, setModelError] = useState("");
    const [isScanning, setIsScanning] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [detectedNote, setDetectedNote] = useState("");
    const [confidence, setConfidence] = useState(null);
    const [statusText, setStatusText] = useState("Loading bundled model...");

    useEffect(() => {
        let mounted = true;

        Speech.speak("Welcome to the currency detector.");

        const loadModel = async () => {
            try {
                if (!NativeModules.Onnxruntime) {
                    throw new Error("ONNX Runtime native module is missing from this app build.");
                }

                const ort = require("onnxruntime-react-native");
                if (!ort?.InferenceSession || !ort?.Tensor) {
                    throw new Error("ONNX Runtime JavaScript API did not initialize.");
                }

                ortRef.current = ort;

                const asset = Asset.fromModule(MODEL_ASSET);
                if (!asset.localUri) {
                    await asset.downloadAsync();
                }

                const nextSession = await ort.InferenceSession.create(asset.localUri);
                if (mounted) {
                    setSession(nextSession);
                    setStatusText("Point the camera at a note");
                }
            } catch (error) {
                if (mounted) {
                    setModelError(
                        error.message.includes("native module is missing")
                            ? "ONNX Runtime is not included in this installed app. Create and install a fresh development or release build."
                            : `ONNX model load failed: ${error.message}`
                    );
                    setStatusText("Model is not ready");
                }
            }
        };

        loadModel();

        return () => {
            mounted = false;
            if (scanTimerRef.current) {
                clearInterval(scanTimerRef.current);
            }
        };
    }, []);

    const speakNote = (note) => {
        if (!note || note === lastSpokenRef.current) return;

        lastSpokenRef.current = note;
        Speech.speak(note);
    };

    const scanFrame = async () => {
        if (!cameraRef.current || !session || processingRef.current) return;

        try {
            processingRef.current = true;
            setIsProcessing(true);

            const photo = await cameraRef.current.takePictureAsync({
                quality: 0.6,
                skipProcessing: true,
            });

            const resized = await ImageManipulator.manipulateAsync(
                photo.uri,
                [{ resize: { width: 224, height: 224 } }],
                {
                    base64: true,
                    compress: 0.9,
                    format: ImageManipulator.SaveFormat.JPEG,
                }
            );

            const inputTensor = imageBase64ToTensor(resized.base64, ortRef.current);
            const inputName = session.inputNames[0];
            const outputName = session.outputNames[0];
            const results = await session.run({ [inputName]: inputTensor });
            const output = Array.from(results[outputName].data);
            const probabilities = softmax(output);
            const maxConfidence = Math.max(...probabilities);
            const predIndex = probabilities.indexOf(maxConfidence);
            const label = maxConfidence < CONF_THRESHOLD ? "NO_NOTE" : CLASSES[predIndex];

            predictionBufferRef.current = [...predictionBufferRef.current, label].slice(-6);
            const stableLabel = getStablePrediction(predictionBufferRef.current);
            const note = formatNote(stableLabel);

            setConfidence(maxConfidence);

            if (!note) {
                setDetectedNote("");
                setStatusText("No note detected");
                return;
            }

            setDetectedNote(note);
            setStatusText("Detected");
            speakNote(note);
        } catch (error) {
            console.error("Currency inference failed:", error);
            setStatusText("Inference failed");
        } finally {
            processingRef.current = false;
            setIsProcessing(false);
        }
    };

    const startScanning = () => {
        if (!session) {
            Alert.alert(
                "Model not ready",
                modelError || "Add a valid currency_detector.onnx model and rebuild the app."
            );
            return;
        }

        setIsScanning(true);
        setStatusText("Scanning...");
        scanFrame();
        scanTimerRef.current = setInterval(scanFrame, SCAN_INTERVAL_MS);
    };

    const stopScanning = () => {
        setIsScanning(false);
        setStatusText("Paused");
        if (scanTimerRef.current) {
            clearInterval(scanTimerRef.current);
            scanTimerRef.current = null;
        }
    };

    if (!permission) {
        return (
            <View className="flex-1 bg-black items-center justify-center">
                <ActivityIndicator size="large" color="#0A84FF" />
            </View>
        );
    }

    if (!permission.granted) {
        return (
            <View className="flex-1 bg-primary px-6 items-center justify-center">
                <View className="bg-surface border border-line rounded-[28px] p-6 w-full items-center">
                    <Text className="text-2xl font-pbold text-navy text-center">Currency Detector</Text>
                    <Text className="text-muted text-center mt-3 font-pmedium">
                        Camera access is required to detect currency notes.
                    </Text>
                    <TouchableOpacity
                        className="bg-secondary rounded-2xl px-6 py-4 mt-6"
                        onPress={requestPermission}
                    >
                        <Text className="text-white font-pbold">Allow Camera</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    return (
        <View className="flex-1 bg-black">
            <CameraView
                ref={cameraRef}
                facing="back"
                style={{ flex: 1 }}
            >
                <View className="flex-1 justify-between">
                    <View className="px-5 pt-14">
                        <Text className="text-white text-2xl font-pbold">Currency Detector</Text>
                        <Text className="text-gray-100 mt-1 font-pmedium">
                            Hold the note inside the frame
                        </Text>
                    </View>

                    <View className="mx-8 h-[240px] border-4 border-secondary rounded-2xl bg-black/10" />

                    <View className="bg-white rounded-t-[30px] px-5 pt-5 pb-8">
                        <View className="flex-row items-center justify-between">
                            <Text className="text-muted text-sm font-pmedium">{statusText}</Text>
                            {isProcessing && <ActivityIndicator size="small" color="#0A84FF" />}
                        </View>
                        <Text className="text-navy text-3xl font-pbold mt-1">
                            {detectedNote || "No note"}
                        </Text>
                        <Text className="text-muted mt-1 font-pmedium">
                            {confidence === null ? "Confidence unavailable" : `Confidence ${(confidence * 100).toFixed(1)}%`}
                        </Text>

                        <TouchableOpacity
                            className={`mt-5 rounded-2xl py-4 items-center ${isScanning ? "bg-danger" : "bg-secondary"}`}
                            onPress={isScanning ? stopScanning : startScanning}
                        >
                            <Text className="text-white text-lg font-pbold">
                                {isScanning ? "Stop Scanning" : "Start Scanning"}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </CameraView>
        </View>
    );
};

export default CurrencyDetector;
