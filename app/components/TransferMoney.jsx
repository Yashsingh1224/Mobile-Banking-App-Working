import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { collection, query, where, getDocs, doc, updateDoc } from "firebase/firestore";
import { auth, db } from "../../utility/firebaseConfig";
import Loader from "../../components/Loader";
import FingerprintAuth from "./FingerprintAuth";
import AuthVoice from "./AuthVoice";  // Import AuthVoice component

const TransferMoney = () => {
    const [loading, setLoading] = useState(false);
    const [recipientAccount, setRecipientAccount] = useState("");
    const [amount, setAmount] = useState("");
    const [pin, setPin] = useState("");
    const [isPinVerified, setIsPinVerified] = useState(false);
    const [isFingerprintVerified, setIsFingerprintVerified] = useState(false);

    const validatePinAndAuthenticate = async () => {
        if (!recipientAccount || !amount || !pin) {
            Alert.alert("Error", "Please fill in all fields");
            return;
        }

        const transferAmount = parseFloat(amount);
        if (isNaN(transferAmount) || transferAmount <= 0) {
            Alert.alert("Error", "Enter a valid amount");
            return;
        }

        try {
            setLoading(true);
            const sender = auth.currentUser;
            if (!sender) {
                Alert.alert("Error", "User not authenticated");
                return;
            }

            const senderQuery = query(collection(db, "users"), where("displayName", "==", sender.displayName));
            const senderSnapshot = await getDocs(senderQuery);
            if (senderSnapshot.empty) {
                Alert.alert("Error", "Sender not found");
                return;
            }
            const senderDoc = senderSnapshot.docs[0];
            const senderData = senderDoc.data();

            if (senderData.pin !== pin) {
                Alert.alert("Error", "Incorrect PIN");
                return;
            }

            if (senderData.accountBalance < transferAmount) {
                Alert.alert("Error", "Insufficient balance");
                return;
            }

            setIsPinVerified(true);
        } catch (error) {
            console.error(error);
            Alert.alert("Error", "Something went wrong. Please try again");
        } finally {
            setLoading(false);
        }
    };

    const handleTransfer = async () => {
        try {
            setLoading(true);

            const sender = auth.currentUser;
            if (!sender) {
                Alert.alert("Error", "User not authenticated");
                return;
            }

            const senderQuery = query(collection(db, "users"), where("displayName", "==", sender.displayName));
            const senderSnapshot = await getDocs(senderQuery);
            if (senderSnapshot.empty) {
                Alert.alert("Error", "Sender not found");
                return;
            }
            const senderDoc = senderSnapshot.docs[0];
            const senderData = senderDoc.data();

            const recipientQuery = query(collection(db, "users"), where("accountNumber", "==", recipientAccount));
            const recipientSnapshot = await getDocs(recipientQuery);
            if (recipientSnapshot.empty) {
                Alert.alert("Error", "Recipient not found");
                return;
            }
            const recipientDoc = recipientSnapshot.docs[0];
            const recipientData = recipientDoc.data();

            const transactionID = Date.now(); // Unique ID based on timestamp
            const transactionTime = new Date().toLocaleString();

            // Transaction details
            const senderTransaction = {
                transactionID,
                transactionType: "transfer",
                phone: recipientData.displayName,
                accountNumber: recipientAccount,
                name: recipientData.firstName + " " + recipientData.lastName,
                category: "Transfer",
                dateTime: transactionTime,
                amount: parseFloat(amount),
                bankName: "YourBank"
            };

            const recipientTransaction = {
                transactionID,
                transactionType: "receive",
                phone: sender.displayName,
                accountNumber: senderData.accountNumber,
                name: senderData.firstName + " " + senderData.lastName,
                category: "Transfer",
                dateTime: transactionTime,
                amount: parseFloat(amount),
                bankName: "YourBank"
            };

            // Update sender and recipient balances & add transactions
            await updateDoc(doc(db, "users", senderDoc.id), {
                accountBalance: senderData.accountBalance - parseFloat(amount),
                transactions: senderData.transactions ? [...senderData.transactions, senderTransaction] : [senderTransaction]
            });

            await updateDoc(doc(db, "users", recipientDoc.id), {
                accountBalance: recipientData.accountBalance + parseFloat(amount),
                transactions: recipientData.transactions ? [...recipientData.transactions, recipientTransaction] : [recipientTransaction]
            });

            Alert.alert("Success", "Transfer completed successfully");
            setRecipientAccount("");
            setAmount("");
            setPin("");
            setIsPinVerified(false);
            setIsFingerprintVerified(false);
        } catch (error) {
            console.error(error);
            Alert.alert("Error", "Something went wrong. Please try again");
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView className="bg-primary h-full w-full justify-center p-5">
            {loading && <Loader />}

            {!isFingerprintVerified ? (
                <View className="w-full">
                    <Text className="text-2xl font-bold text-secondary">Transfer Money</Text>

                    <TextInput
                        className="mt-5 p-3 border rounded-lg"
                        placeholder="Recipient Account Number"
                        value={recipientAccount}
                        onChangeText={setRecipientAccount}
                        keyboardType="numeric"
                    />
                    <TextInput
                        className="mt-3 p-3 border rounded-lg"
                        placeholder="Amount"
                        value={amount}
                        onChangeText={setAmount}
                        keyboardType="numeric"
                    />
                    <TextInput
                        className="mt-3 p-3 border rounded-lg"
                        placeholder="Enter PIN"
                        value={pin}
                        onChangeText={setPin}
                        keyboardType="numeric"
                        secureTextEntry
                    />

                    {!isPinVerified ? (
                        <TouchableOpacity
                            onPress={validatePinAndAuthenticate}
                            className="bg-secondary mt-5 p-3 rounded-lg items-center">
                            <Text className="text-white text-lg">Verify PIN</Text>
                        </TouchableOpacity>
                    ) : (
                        <View className="mt-5">
                            <FingerprintAuth onSuccess={() => setIsFingerprintVerified(true)} />
                        </View>
                    )}
                </View>
            ) : (
                <AuthVoice onSuccess={(response) => {
                    console.log("AuthVoice Response:", response);
                    if (response.authenticated === true) {
                        handleTransfer();
                    } else {
                        Alert.alert("Authentication Failed", "Your voice could not be verified.");
                    }
                }} />

            )}
        </SafeAreaView>
    );
};

export default TransferMoney;
