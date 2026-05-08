import React, { useState } from "react";
import { Image, ScrollView, Text, TextInput, TouchableOpacity, View, Platform, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { icons } from "../../constants";
import DateTimePicker from "@react-native-community/datetimepicker";
import Checkbox from "expo-checkbox"
import { Link, router } from "expo-router";
import { createUserWithEmailAndPassword, sendEmailVerification, updateProfile } from "firebase/auth"
import { collection, query, where, getDocs, doc, setDoc } from "firebase/firestore"
import { auth, db } from "../../utility/firebaseConfig"
import Loader from "../../components/Loader";
import RegisterVoice from "../components/RegisterVoice";


const Register = () => {
    const [loading, setLoading] = useState(false)
    const [showPassword, setShowPassword] = useState(false);
    const [showDateOfBirth, setShowDateOfBirth] = useState(false);
    const [date, setDate] = useState(new Date());
    const [checked, setChecked] = useState(false);
    const [form, setForm] = useState({
        phone: "",
        email: "",
        password: "",
        firstName: "",
        lastName: "",
        dateOfBirth: "",
        terms: checked
    })

    //terms and condition
    const ToggleTerms = () => {
        const newChecked = !checked
        setChecked(newChecked)
        setForm({ ...form, terms: newChecked })
    }

    //Date picker
    const onchange = (event, selectedDate) => {
        const currentDate = selectedDate || date
        setShowDateOfBirth(Platform.OS === "ios")
        setDate(currentDate)
        setForm({ ...form, dateOfBirth: currentDate.toLocaleDateString() })
    }

    const SendOTP = async () => {
        try {
            const user = auth.currentUser
            await sendEmailVerification(user)
            Alert.alert('Success', 'Email verification link sent!')
        } catch (error) {
            console.log(error)
        }
    }

    async function handleSubmit() {

        if (!form.email || !form.password || !form.phone || !form.firstName || !form.lastName || !form.dateOfBirth) {
            Alert.alert('Error', 'Please fill in all fields')
            return
        }

        //handle phone number format here

        const phoneRegex = /^\+\d{2}\d{8,14}$/;
        if (!phoneRegex.test(form.phone)) {
            Alert.alert('Error', 'Please enter a valid phone number including a two-digit country code');
            return;
        }


        //get bank account number from phone number
        const accountNumber = form.phone.slice(3, form.phone.length)




        try {
            setLoading(true)
            //Check for unique phone number
            const usersCollection = collection(db, 'users')
            const q = query(usersCollection, where("displayName", "==", form.phone))
            const querySnapshot = await getDocs(q)

            if (!querySnapshot.empty) {
                Alert.alert('Error', 'Phone number already exist')
                return
            }
            //Creat user with email and password
            const cred = await createUserWithEmailAndPassword(auth, form.email, form.password)

            //update user profile with phone number
            await updateProfile(cred.user, { displayName: form.phone })

            //Create user document in firestore
            const userDocRef = doc(usersCollection, cred.user.uid)
            const docData = {
                displayName: form.phone,
                email: form.email,
                firstName: form.firstName,
                lastName: form.lastName,
                pin: "1234",
                image: "",
                address: "UPES Bhidoli Via Premnagar, Dehradun-248007, Uttarakhand",
                accountNumber: accountNumber,
                country: "",
                state: "",
                dateOfBirth: form.dateOfBirth,
                accountBalance: 1000,
                walletAddress: "",
                transactions: [],
                beneficiary: []
            }
            await setDoc(userDocRef, docData)

            //send verification link
            SendOTP()
            //Navigate to OTP screen
            router.push("/EmailOTP")
        } catch (error) {
            console.log(error.message)
            if (error.code === 'auth/weak-password') {
                Alert.alert('Password must be atleast 6 characters')
            }

            if (error.code === 'auth/email-already-in-use') {
                Alert.alert('Error', 'Email already used')
            }

        } finally {
            setLoading(false)
        }

    }

    return (
        <SafeAreaView className="bg-primary h-full w-full justify-center ">
            {loading &&
                <Loader />
            }
            <ScrollView
                showsVerticalScrollIndicator={false}
                className="mx-5 mb-2"
                contentContainerStyle={{ minHeight: "100%", justifyContent: "center" }}
            >
                <View className="w-full justify-center items-center mt-7 mb-2">
                    <View className="w-14 h-14 bg-[#EAF2FF] rounded-2xl items-center justify-center mb-4">
                        <Image className="w-7 h-7" source={icons.bank} resizeMode="contain" />
                    </View>
                    <Text className="text-3xl font-pbold text-navy">Create account</Text>
                    <Text className="text-muted text-base mt-1 font-pmedium">Start banking securely</Text>
                </View>

                <View
                    className="mt-5 rounded-3xl border border-line bg-surface w-full px-4 py-4">
                    <RegisterVoice username="yash" />
                </View>

                <View
                    className=" mt-4 rounded-2xl border border-line bg-surface flex-row items-center w-full h-[58px] px-4">
                    <Image
                        className="w-6 h-6 "
                        source={icons.phone}
                        resizeMode="contain"
                    />
                    <TextInput
                        onChangeText={(e) => setForm({ ...form, phone: e })}
                        className="flex-1 font-pmedium ml-3 text-navy"
                        placeholder="Phone number"
                        placeholderTextColor="#9AA6BF"
                    />
                </View>

                <View
                    className=" mt-4 rounded-2xl border border-line bg-surface flex-row items-center w-full h-[58px] px-4">
                    <Image
                        className="w-6 h-6 "
                        source={icons.mail}
                        resizeMode="contain"
                    />
                    <TextInput
                        onChangeText={(e) => setForm({ ...form, email: e })}
                        className="flex-1 font-pmedium ml-3 text-navy"
                        placeholder="Email address"
                        placeholderTextColor="#9AA6BF"
                        keyboardType="email-address"
                    />
                </View>

                <View className="mt-4 rounded-2xl border border-line bg-surface flex-row items-center w-full h-[58px] px-4">
                    <Image className="w-6 h-6" source={icons.lock} resizeMode="contain" />
                    <TextInput
                        onChangeText={(e) => setForm({ ...form, password: e })}
                        className="flex-1 font-pmedium ml-3 text-navy"
                        placeholder="Password"
                        placeholderTextColor="#9AA6BF"
                        keyboardType="default"
                        secureTextEntry={!showPassword}
                    />
                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                        <Image
                            source={!showPassword ? icons.eye : icons.eyeHide}
                            className="w-6 h-6"
                            resizeMode="contain"
                        />
                    </TouchableOpacity>
                </View>

                <View
                    className=" mt-4 rounded-2xl border border-line bg-surface flex-row items-center w-full h-[58px] px-4">
                    <Image
                        className="w-6 h-6 "
                        source={icons.user}
                        resizeMode="contain"
                    />
                    <TextInput
                        onChangeText={(e) => setForm({ ...form, firstName: e })}
                        className="flex-1 font-pmedium ml-3 text-navy"
                        placeholder="First Name"
                        placeholderTextColor="#9AA6BF"
                    />
                </View>

                <View
                    className=" mt-4 rounded-2xl border border-line bg-surface flex-row items-center w-full h-[58px] px-4">
                    <Image
                        className="w-6 h-6 "
                        source={icons.user}
                        resizeMode="contain"
                    />
                    <TextInput
                        onChangeText={(e) => setForm({ ...form, lastName: e })}
                        className="flex-1 font-pmedium ml-3 text-navy"
                        placeholder="Last Name"
                        placeholderTextColor="#9AA6BF"
                    />
                </View>

                {/*Date picker field start*/}
                <TouchableOpacity
                    onPress={() => setShowDateOfBirth(true)}
                    className=" mt-4 rounded-2xl border border-line bg-surface flex-row items-center w-full h-[58px] px-4">

                    <Image
                        resizeMode="contain"
                        className="w-6 h-6"
                        source={icons.calendar} />

                    <Text className="flex-1 text-muted ml-3 font-pmedium">
                        {date.toLocaleDateString()} Date Of Birth
                    </Text>
                </TouchableOpacity>
                {showDateOfBirth && (
                    <DateTimePicker
                        mode="date"
                        value={date}
                        display="default"
                        onChange={onchange}
                    />
                )}

                <View className="flex-row items-center w-full min-h-[56px] px-1 mt-2">
                    <Checkbox value={checked} onValueChange={ToggleTerms} />
                    <Text className="ml-3 text-muted font-pregular">I agree to the terms and conditions</Text>
                </View>

                <TouchableOpacity
                    onPress={handleSubmit}
                    className="bg-secondary mt-4 flex-row p-4 rounded-2xl items-center justify-center"
                >
                    <Text className="text-lg font-pbold text-white items-center justify-center">Submit</Text>
                </TouchableOpacity>

                <View className="w-full justify-center items-center pt-5 flex-row">
                    <Text className="font-pregular text-muted">Already have an account? </Text>
                    <Link href="/Login" className="text-lg text-secondary font-pbold mx-2">Login</Link>
                </View>

            </ScrollView>
        </SafeAreaView>
    );
};

export default Register;
