import React, { useEffect, useState, useRef } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { collection, query, where, getDocs, doc, updateDoc } from "firebase/firestore";
import { auth, db } from "../../utility/firebaseConfig";
import Loader from "../../components/Loader";
import FingerprintAuth from "./FingerprintAuth";
import * as Speech from 'expo-speech';
import VoiceToTextTransfer from './VoiceToTextTransfer';
import VerifyVoice from './VerifyVoice';
import { useGlobalStore } from "../../context/globalStore";

// Web3 Imports
import { getContract, prepareContractCall, toUnits } from "thirdweb";
import { useActiveAccount, useConnect, useSendTransaction, useReadContract } from "thirdweb/react";
import { client } from "../../utility/thirdwebClient";
import {
    accountAbstraction,
    appChain,
    BANK_TOKEN_CONTRACT_ADDRESS,
    BANK_TOKEN_DECIMALS,
    createBankWallet,
} from "../../utility/blockchainConfig";

const TransferMoney = () => {
    const [loading, setLoading] = useState(false);
    const [recipientAccount, setRecipientAccount] = useState("");
    const [amount, setAmount] = useState("");
    const [pin, setPin] = useState("");
    const [isPinVerified, setIsPinVerified] = useState(false);
    const [isFingerprintVerified, setIsFingerprintVerified] = useState(false);
    const [isVoiceVerified, setIsVoiceVerified] = useState(false);
    const hasSpokenAllFields = useRef(false);

    const { userData, walletAddress, setWalletAddress } = useGlobalStore();
    const username = userData?.firstName || "";
    const activeAccount = useActiveAccount();
    const { connect, isConnecting } = useConnect({ accountAbstraction });

    // Initialize Smart Contract
    const tokenContract = getContract({
        client,
        chain: appChain,
        address: BANK_TOKEN_CONTRACT_ADDRESS,
    });

    // Web3 Transaction Hook
    const { mutateAsync: sendTx } = useSendTransaction();

    // Check user's current token balance to prevent overdrafts
    const { data: currentBalanceObj } = useReadContract({
        contract: tokenContract,
        method: "function balanceOf(address account) view returns (uint256)",
        params: activeAccount?.address ? [activeAccount.address] : undefined,
        queryOptions: { enabled: !!activeAccount?.address },
    });

    const handleVoiceCommand = (text) => {
        const lowerText = text.toLowerCase();
        if (lowerText.includes('account')) {
            setRecipientAccount(extractNumber(lowerText));
        }
        else if (lowerText.includes('amount')) {
            setAmount(extractNumber(lowerText));
        }
        else if (lowerText.includes('pin')) {
            setPin(extractNumber(lowerText));
        }
        else if (lowerText.includes('validate')) {
            validatePinAndAuthenticate();
        }
    };

    useEffect(() => {
        Speech.speak("Voice transfer page");
    }, []);

    useEffect(() => {
        const currentUser = auth.currentUser;
        if (!currentUser?.uid || !activeAccount?.address) return;
        if (walletAddress === activeAccount.address) return;

        setWalletAddress(activeAccount.address);
        updateDoc(doc(db, "users", currentUser.uid), {
            walletAddress: activeAccount.address,
        }).catch((error) => {
            console.error("Error saving wallet address:", error);
        });
    }, [activeAccount?.address, setWalletAddress, walletAddress]);

    useEffect(() => {
        const allFilled = recipientAccount.trim() && amount.trim() && pin.trim();
        if (allFilled && !hasSpokenAllFields.current) {
            hasSpokenAllFields.current = true;
            Speech.speak("All fields are filled");
        } else if (!allFilled) {
            hasSpokenAllFields.current = false;
        }
    }, [recipientAccount, amount, pin]);

    const extractNumber = (text) => {
        const digitsOnly = text.match(/\d+/g);
        return digitsOnly ? digitsOnly.join('') : '';
    };

    const handleConnectWallet = async () => {
        try {
            await connect(async () => {
                const wallet = createBankWallet();
                await wallet.connect({
                    chain: appChain,
                    client,
                });
                return wallet;
            });
        } catch (error) {
            console.error("Wallet connection failed:", error);
            Alert.alert("Wallet Connection Failed", "Install MetaMask in this emulator or test on a phone with MetaMask.");
        }
    };

    const validatePinAndAuthenticate = async () => {
        if (!recipientAccount || !amount || !pin) {
            Alert.alert("Error", "Please fill in all fields");
            return;
        }

        if (!activeAccount?.address) {
            Alert.alert("Wallet Required", "Connect your wallet before transferring.");
            return;
        }

        if (walletAddress && walletAddress !== activeAccount.address) {
            Alert.alert("Wallet Mismatch", "Use the wallet saved on your profile or reconnect from Home.");
            return;
        }

        const transferAmount = parseFloat(amount);
        if (isNaN(transferAmount) || transferAmount <= 0) {
            Alert.alert("Error", "Enter a valid amount");
            return;
        }

        try {
            setLoading(true);
            const senderData = userData;

            if (senderData.pin !== pin) {
                Alert.alert("Error", "Incorrect PIN");
                return;
            }

            // Convert BigInt balance from contract to readable number (assuming 18 decimals)
            const requestedAmount = toUnits(amount, BANK_TOKEN_DECIMALS);

            if (!currentBalanceObj || currentBalanceObj < requestedAmount) {
                Alert.alert("Error", "Insufficient blockchain balance");
                Speech.speak("Insufficient balance for this transfer");
                return;
            }

            setIsPinVerified(true);
        } catch (error) {
            console.error(error);
            Alert.alert("Error", "Something went wrong.");
        } finally {
            setLoading(false);
        }
    };

    const handleTransfer = async () => {
        try {
            setLoading(true);

            // 1. Get Recipient details from Firestore (to find their 0x wallet address)
            const recipientQuery = query(collection(db, "users"), where("accountNumber", "==", recipientAccount));
            const recipientSnapshot = await getDocs(recipientQuery);
            if (recipientSnapshot.empty) {
                Alert.alert("Error", "Recipient not found");
                return;
            }
            const recipientDoc = recipientSnapshot.docs[0];
            const recipientData = recipientDoc.data();

            if (!recipientData.walletAddress) {
                Alert.alert("Error", "Recipient does not have a registered Web3 Wallet yet.");
                return;
            }

            // 2. Prepare Blockchain Transaction
            const amountInWei = toUnits(amount, BANK_TOKEN_DECIMALS);

            const transaction = prepareContractCall({
                contract: tokenContract,
                method: "function transfer(address to, uint256 value)",
                params: [recipientData.walletAddress, amountInWei],
            });

            // 3. Execute Blockchain Transfer (Gasless via Thirdweb)
            await sendTx(transaction);

            // 4. Record Transaction History in Firestore (Removing accountBalance updates)
            const sender = auth.currentUser;
            const senderQuery = query(collection(db, "users"), where("displayName", "==", sender.displayName));
            const senderDoc = (await getDocs(senderQuery)).docs[0];

            const transactionID = Date.now();
            const transactionTime = new Date().toLocaleString();

            const senderTransaction = {
                transactionID, transactionType: "transfer", phone: recipientData.displayName,
                accountNumber: recipientAccount, name: recipientData.firstName + " " + recipientData.lastName,
                category: "Blockchain Transfer", dateTime: transactionTime, amount: parseFloat(amount), bankName: "YourBank"
            };

            const recipientTransaction = {
                transactionID, transactionType: "receive", phone: sender.displayName,
                accountNumber: userData.accountNumber, name: userData.firstName + " " + userData.lastName,
                category: "Blockchain Transfer", dateTime: transactionTime, amount: parseFloat(amount), bankName: "YourBank"
            };

            await updateDoc(doc(db, "users", senderDoc.id), {
                transactions: userData.transactions ? [...userData.transactions, senderTransaction] : [senderTransaction]
            });

            await updateDoc(doc(db, "users", recipientDoc.id), {
                transactions: recipientData.transactions ? [...recipientData.transactions, recipientTransaction] : [recipientTransaction]
            });

            Speech.speak("Transfer completed securely on the blockchain.");
            setRecipientAccount(""); setAmount(""); setPin("");
            setIsPinVerified(false); setIsFingerprintVerified(false); setIsVoiceVerified(false);
            hasSpokenAllFields.current = false;
        } catch (error) {
            console.error(error);
            Alert.alert("Error", "Blockchain transaction failed. Please try again.");
            Speech.speak("Transfer failed.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView className="bg-primary h-full w-full p-5">
            {loading && <Loader />}

            {!activeAccount?.address && (
                <View className="absolute top-5 left-5 right-5 z-20">
                    <TouchableOpacity
                        className="bg-secondary p-3 rounded-lg items-center"
                        disabled={isConnecting}
                        onPress={handleConnectWallet}
                    >
                        <Text className="text-white font-bold">
                            {isConnecting ? "Connecting..." : "Connect MetaMask"}
                        </Text>
                    </TouchableOpacity>
                </View>
            )}

            {!isPinVerified && activeAccount?.address && (
                <View className="absolute top-5 left-5 right-5 z-10">
                    <VoiceToTextTransfer onSpeechResult={handleVoiceCommand} />
                </View>
            )}

            <View className="flex-1 justify-center">
                {!isFingerprintVerified && !isVoiceVerified && (
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
                )}

                {isFingerprintVerified && !isVoiceVerified && (
                    <View className="w-full">
                        <VerifyVoice username={username} onSuccess={() => {
                            setIsVoiceVerified(true);
                            handleTransfer();
                        }} />
                    </View>
                )}
            </View>
        </SafeAreaView>
    );
};

export default TransferMoney;
