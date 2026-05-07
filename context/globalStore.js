import { doc, onSnapshot } from "firebase/firestore"
import { onAuthStateChanged } from "firebase/auth"
import { db, auth } from "../utility/firebaseConfig"
import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand"

export const useGlobalStore = create((set) => ({
    isLogged: false,
    user: null,
    userData: null,
    walletAddress: null, // Track the web3 wallet
    loading: true,

    setUser: (user) => set({ user }),
    setWalletAddress: (address) => set({ walletAddress: address }),

    loadUserFromStorage: async () => {
        try {
            const storedUserAuth = await AsyncStorage.getItem('userAuth')
            if (storedUserAuth) {
                const parseUserAuth = JSON.parse(storedUserAuth)
                set({ user: parseUserAuth, isLogged: true })
            }

            return onAuthStateChanged(auth, async (currentUser) => {
                if (currentUser) {
                    const userDocRef = doc(db, "users", currentUser.uid)
                    return onSnapshot(userDocRef, (doc) => {
                        if (doc.exists()) {
                            const data = doc.data();
                            set({ userData: data, walletAddress: data.walletAddress || null, isLogged: true })
                        } else {
                            set({ userData: null, walletAddress: null })
                        }
                        set({ loading: false })
                    })
                } else {
                    set({ isLogged: false, user: null, userData: null, walletAddress: null })
                    await AsyncStorage.removeItem('userAuth')
                    set({ loading: false })
                }
            })
        } catch (error) {
            console.error("Error loading user data: ", error)
            set({ loading: false })
        }
    }
}))
