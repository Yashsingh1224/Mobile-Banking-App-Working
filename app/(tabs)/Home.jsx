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
            <View className="pt-10">
                <VoiceToTextInput />
            </View>

            <View className="flex-row justify-between items-center px-3 pt-4">
                <View>
                    <Text className="text-xl font-bold text-gray-700">{getGreeting()}</Text>
                    <Text className="text-gray-600">{userData?.firstName + " " + userData?.lastName}</Text>
                </View>
                <View className="flex-row gap-3">
                    <Image className="w-6 h-6" source={icons.scan} resizeMode="contain" />
                    <Image className="w-6 h-6" source={icons.bell} resizeMode="contain" />
                </View>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ minWidth: '100%', alignItems: 'center', justifyContent: 'center' }}>
                <View className="w-full px-3 pt-3">
                    <TouchableOpacity
                        className="p-3 items-center"
                        disabled={isConnecting}
                        onPress={handleConnectWallet}
                    >
                        <Text className="font-pbold text-black">
                            {activeAccount?.address ? "Wallet Connected" : isConnecting ? "Connecting..." : "Connect MetaMask"}
                        </Text>
                    </TouchableOpacity>
                </View>

                <View className="w-full flex-row gap-2 mb-[-20px] p-3 items-center">
                    <Text className=" text-gray-200 text-start">Total Balance</Text>
                    <Image className="w-6 h-6" source={icons.eye} resizeMode="contain" />
                </View>

                <View className="w-full p-3">
                    {/* Displaying Live Blockchain Balance */}
                    <Text className="text-gray-800 font-pregular text-3xl">
                        ${displayBalance}
                    </Text>
                    {hasZeroBalance && (
                        <TouchableOpacity
                            disabled={fundingWallet}
                            onPress={handleGetFreeTestMoney}
                            className="bg-secondary mt-3 p-3 rounded-3xl items-center"
                        >
                            <Text className="text-white font-pbold">
                                {fundingWallet ? "Adding..." : "Get Free Test Money"}
                            </Text>
                        </TouchableOpacity>
                    )}
                    <View className="flex-row justify-between gap-3 mt-1">
                        <TouchableOpacity className="flex-1 p-2 flex-row bg-[#3E92CC] rounded-3xl justify-center items-center" onPress={() => router.push("/Transfer")}>
                            <Image className="w-6 h-6 mr-2" source={icons.transfer} resizeMode="contain" />
                            <Text className="text-white font-pregular text-lg">Transfer</Text>
                        </TouchableOpacity>

                        <TouchableOpacity className="flex-1 p-2 flex-row bg-[#00EB97] rounded-3xl justify-center items-center">
                            <Image className="w-6 h-6 mr-2" source={icons.receiveIcon1} resizeMode="contain" />
                            <Text className="text-white font-pregular text-lg">Receive</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <QuickLink />

                {/* Banner Start */}
                <View className="flex-row justify-around items-center bg-[#00EB97] w-[95%] h-[120px] mt-4 rounded-[8px]">
                    <View className="mr-0">
                        <Image className="w-[112px] h-[83px]" source={images.rafiki} resizeMode="contain" />
                    </View>
                    <View>
                        <Text className="text-[21px] text-white font-pregular">Complete your</Text>
                        <Text className="text-[21px] text-white font-pregular">account verification</Text>
                    </View>
                    <TouchableOpacity className="w-[40px] h-[40px] rounded-full items-center justify-center bg-[#54F2B9] mt-7 mr-3">
                        <Image className="w-6 h-6" source={icons.transfer} resizeMode="contain" />
                    </TouchableOpacity>
                </View>
                {/* Banner End */}

                {/* Transaction Log Start */}
                <View className="w-full mt-2 mb-14">
                    <View className="w-full flex-row justify-between items-center p-3">
                        <Text className="text-gray-200 text-lg">Transactions</Text>
                        <Link href="/Transactions" className="text-[#00EB97] font-pregular">See all</Link>
                    </View>

                    {loading ? (
                        <ActivityIndicator size="large" color="#00EB97" />
                    ) : transactions.length === 0 ? (
                        <View className="w-[100vw] flex-row items-center gap-2 justify-center">
                            <Image className="w-5 h-5" source={icons.empty} resizeMode="contain" />
                            <Text className="text-gray-100 text-lg">No transaction history</Text>
                        </View>
                    ) : (
                        transactions.slice(0, 3).map((item) => (
                            <TouchableOpacity key={item.transactionID} className="flex-row justify-between p-3">
                                <View className="flex-row items-center gap-2">
                                    <Image
                                        className="w-4 h-4"
                                        source={item.transactionType === 'receive' ? icons.receiveIcon2 : item.transactionType === 'transfer' ? icons.sent : icons.sent}
                                        resizeMode="contain"
                                    />
                                    <View>
                                        <Text className="font-pregular text-[16px]">
                                            {item.transactionType === 'airtime' ? `Sent airtime to ${item.phone}` : item.transactionType === 'receive' ? `Received from ${item.name}` : `Transferred to ${item.name}`}
                                        </Text>
                                        <Text className="text-xs text-gray-500">
                                            {item.dateTime} (Category: {item.category})
                                        </Text>
                                    </View>
                                </View>
                                <View>
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
