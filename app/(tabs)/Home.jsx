import React, { useEffect, useState } from 'react';
import { View, Text, Image, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useGlobalStore } from "../../context/globalStore";
import { icons, images } from "../../constants";
import { Link, router } from "expo-router";
import QuickLink from "../../components/QuickLink";
import * as Speech from 'expo-speech';
import { db } from "../../utility/firebaseConfig";
import { doc, onSnapshot, updateDoc } from "firebase/firestore";
import VoiceToTextInput from '../components/VoiceToTextInput';

// Web3 Imports
import { getContract, prepareContractCall, toTokens, toUnits } from "thirdweb";
import { useActiveAccount, useConnect, useReadContract, useSendTransaction } from "thirdweb/react";
import { client } from "../../utility/thirdwebClient";
import {
    accountAbstraction,
    appChain,
    BANK_TOKEN_CONTRACT_ADDRESS,
    BANK_TOKEN_DECIMALS,
    FREE_TEST_MONEY_AMOUNT,
    createBankWallet,
} from "../../utility/blockchainConfig";

const Home = () => {
    const { user, userData, setWalletAddress } = useGlobalStore();
    const username = userData?.firstName || "";

    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [fundingWallet, setFundingWallet] = useState(false);

    // Get Active Web3 Wallet
    const activeAccount = useActiveAccount();
    const { connect, isConnecting } = useConnect({ accountAbstraction });
    const { mutateAsync: sendTx } = useSendTransaction();
    const tokenContract = getContract({
        client,
        chain: appChain,
        address: BANK_TOKEN_CONTRACT_ADDRESS,
    });

    // Read live balance from Blockchain
    const balanceQuery = useReadContract({
        contract: tokenContract,
        method: "function balanceOf(address account) view returns (uint256)",
        params: activeAccount?.address ? [activeAccount.address] : undefined,
        queryOptions: { enabled: !!activeAccount?.address },
    });
    const balanceData = balanceQuery.data;

    // Format BigInt balance to readable string (assuming 18 decimals)
    const displayBalance = balanceData ? toTokens(balanceData, BANK_TOKEN_DECIMALS) : "0.00";
    const hasZeroBalance = !!activeAccount?.address && balanceData !== undefined && balanceData === 0n;

    const getGreeting = () => {
        const hours = new Date().getHours();
        if (hours < 12) return "Good morning";
        else if (hours < 16) return "Good afternoon";
        else return "Good evening";
    };

    useEffect(() => {
        if (username) {
            Speech.speak(`${getGreeting()} ${username}. Your blockchain balance is ${displayBalance} dollars.`);
        }
    }, [username, displayBalance]);

    useEffect(() => {
        if (!user?.uid || !activeAccount?.address) return;
        if (userData?.walletAddress === activeAccount.address) return;

        setWalletAddress(activeAccount.address);
        updateDoc(doc(db, "users", user.uid), {
            walletAddress: activeAccount.address,
        }).catch((error) => {
            console.error("Error saving wallet address:", error);
        });
    }, [activeAccount?.address, setWalletAddress, user?.uid, userData?.walletAddress]);

    useEffect(() => {
        if (!user?.uid) return;

        const userRef = doc(db, "users", user.uid);
        const unsubscribe = onSnapshot(
            userRef,
            (docSnapshot) => {
                if (docSnapshot.exists()) {
                    const userDocData = docSnapshot.data();
                    let transactionList = userDocData.transactions || [];
                    setTransactions([...transactionList].reverse());
                }
                setLoading(false);
            },
            (error) => {
                console.error("Error fetching realtime transactions:", error);
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, [user?.uid]);

    const handleGetFreeTestMoney = async () => {
        if (!activeAccount?.address) {
            Alert.alert("Wallet Required", "Connect your wallet first.");
            return;
        }

        try {
            setFundingWallet(true);
            const transaction = prepareContractCall({
                contract: tokenContract,
                method: "function mint(address to, uint256 amount)",
                params: [
                    activeAccount.address,
                    toUnits(FREE_TEST_MONEY_AMOUNT, BANK_TOKEN_DECIMALS),
                ],
            });

            await sendTx(transaction);
            await balanceQuery.refetch?.();
            Speech.speak("Test money added to your wallet.");
        } catch (error) {
            console.error("Free test money failed:", error);
            Alert.alert(
                "Funding Failed",
                "The contract must allow this wallet to mint test tokens with mint(address,uint256)."
            );
        } finally {
            setFundingWallet(false);
        }
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

    return (
        <SafeAreaView className="bg-primary w-full h-full">
            <View className="pt-4 px-4">
                <VoiceToTextInput />
            </View>

            <View className="flex-row justify-between items-center px-4 pt-5">
                <View>
                    <Text className="text-sm font-pmedium text-muted">{getGreeting()}</Text>
                    <Text className="text-2xl font-pbold text-navy">{userData?.firstName + " " + userData?.lastName}</Text>
                </View>
                <View className="flex-row gap-3">
                    <View className="w-10 h-10 bg-surface border border-line rounded-2xl items-center justify-center">
                        <Image className="w-5 h-5" source={icons.scan} resizeMode="contain" />
                    </View>
                    <View className="w-10 h-10 bg-surface border border-line rounded-2xl items-center justify-center">
                        <Image className="w-5 h-5" source={icons.bell} resizeMode="contain" />
                    </View>
                </View>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ minWidth: '100%', alignItems: 'center', paddingBottom: 24 }}>
                <View className="w-full px-4 pt-4">
                    <TouchableOpacity
                        className="bg-[#EAF2FF] border border-[#D7E6FF] p-3 rounded-2xl items-center"
                        disabled={isConnecting}
                        onPress={handleConnectWallet}
                    >
                        <Text className="font-pbold text-accent">
                            {activeAccount?.address ? "Wallet Connected" : isConnecting ? "Connecting..." : "Connect MetaMask"}
                        </Text>
                    </TouchableOpacity>
                </View>

                <View className="w-[92%] bg-navy rounded-[28px] p-5 mt-4">
                    <View className="flex-row gap-2 items-center">
                        <Text className="text-gray-100 text-start font-pmedium">Total Balance</Text>
                        <Image className="w-5 h-5" source={icons.eye} resizeMode="contain" />
                    </View>
                    {/* Displaying Live Blockchain Balance */}
                    <Text className="text-white font-pbold text-4xl mt-2">
                        ${displayBalance}
                    </Text>
                    {hasZeroBalance && (
                        <TouchableOpacity
                            disabled={fundingWallet}
                            onPress={handleGetFreeTestMoney}
                            className="bg-secondary mt-4 p-3 rounded-2xl items-center"
                        >
                            <Text className="text-white font-pbold">
                                {fundingWallet ? "Adding..." : "Get Free Test Money"}
                            </Text>
                        </TouchableOpacity>
                    )}
                    <View className="flex-row justify-between gap-3 mt-5">
                        <TouchableOpacity className="flex-1 py-3 flex-row bg-accent rounded-2xl justify-center items-center" onPress={() => router.push("/Transfer")}>
                            <Image className="w-5 h-5 mr-2" source={icons.transfer} resizeMode="contain" />
                            <Text className="text-white font-pbold text-base">Transfer</Text>
                        </TouchableOpacity>

                        <TouchableOpacity className="flex-1 py-3 flex-row bg-secondary rounded-2xl justify-center items-center">
                            <Image className="w-5 h-5 mr-2" source={icons.receiveIcon1} resizeMode="contain" />
                            <Text className="text-white font-pbold text-base">Receive</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <QuickLink />

                {/* Banner Start */}
                <View className="flex-row justify-around items-center bg-[#ECFDF5] border border-[#BBF7D0] w-[92%] h-[120px] mt-5 rounded-2xl">
                    <View className="mr-0">
                        <Image className="w-[112px] h-[83px]" source={images.rafiki} resizeMode="contain" />
                    </View>
                    <View>
                        <Text className="text-[19px] text-navy font-pbold">Complete your</Text>
                        <Text className="text-[19px] text-navy font-pbold">account verification</Text>
                    </View>
                    <TouchableOpacity className="w-[40px] h-[40px] rounded-full items-center justify-center bg-secondary mt-7 mr-3">
                        <Image className="w-6 h-6" source={icons.transfer} resizeMode="contain" />
                    </TouchableOpacity>
                </View>
                {/* Banner End */}

                {/* Transaction Log Start */}
                <View className="w-full mt-4 mb-14 px-4">
                    <View className="w-full flex-row justify-between items-center mb-3">
                        <Text className="text-navy text-lg font-pbold">Transactions</Text>
                        <Link href="/Transactions" className="text-secondary font-pbold">See all</Link>
                    </View>

                    {loading ? (
                        <ActivityIndicator size="large" color="#10B981" />
                    ) : transactions.length === 0 ? (
                        <View className="w-full bg-surface border border-line rounded-2xl p-5 flex-row items-center gap-2 justify-center">
                            <Image className="w-5 h-5" source={icons.empty} resizeMode="contain" />
                            <Text className="text-muted text-base font-pmedium">No transaction history</Text>
                        </View>
                    ) : (
                        transactions.slice(0, 3).map((item) => (
                            <TouchableOpacity key={item.transactionID} className="flex-row justify-between bg-surface border border-line rounded-2xl p-4 mb-3">
                                <View className="flex-row items-center gap-3 flex-1">
                                    <View className="w-10 h-10 rounded-2xl bg-[#F1F5F9] items-center justify-center">
                                    <Image
                                        className="w-5 h-5"
                                        source={item.transactionType === 'receive' ? icons.receiveIcon2 : item.transactionType === 'transfer' ? icons.sent : icons.sent}
                                        resizeMode="contain"
                                    />
                                    </View>
                                    <View className="flex-1">
                                        <Text className="font-pbold text-navy text-[15px]">
                                            {item.transactionType === 'airtime' ? `Sent airtime to ${item.phone}` : item.transactionType === 'receive' ? `Received from ${item.name}` : `Transferred to ${item.name}`}
                                        </Text>
                                        <Text className="text-xs text-muted mt-1">
                                            {item.dateTime} (Category: {item.category})
                                        </Text>
                                    </View>
                                </View>
                                <View className="ml-2">
                                    <Text className={`font-pbold ${item.transactionType === 'transfer' ? "text-red-600" : "text-green-600"}`}>
                                        {item.transactionType === 'receive' ? "+" : "-"}{item.amount.toLocaleString()}
                                    </Text>
                                </View>
                            </TouchableOpacity>
                        ))
                    )}
                </View>
                {/* Transaction Log End */}
            </ScrollView>
        </SafeAreaView>
    );
};

export default Home;
