import React, { createContext, useContext, useState, useEffect } from 'react'
import { auth } from '../firebase/config'
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
  updatePassword as updateFirebasePassword,
  sendPasswordResetEmail
} from 'firebase/auth'

const AuthContext = createContext()
export { AuthContext }

export const useAuth = () => {
  return useContext(AuthContext)
}

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isReady, setIsReady] = useState(false);
    const [lastEvent, setLastEvent] = useState(null);
    const [isPasswordRecovery, setIsPasswordRecovery] = useState(false);

    const mapFirebaseUser = (firebaseUser) => {
        if (!firebaseUser) return null
        const { uid, email, displayName, photoURL } = firebaseUser
        return { uid, email, displayName, photoURL }
    }

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
            const mapped = mapFirebaseUser(firebaseUser)
            if (mapped) {
                setUser(mapped)
                setIsAuthenticated(true)
                setLastEvent('SIGNED_IN')
            } else {
                setUser(null)
                setIsAuthenticated(false)
                setLastEvent('SIGNED_OUT')
            }
            setLoading(false)
            setIsReady(true)
        })

        return () => unsubscribe()
    }, [])

    const login = (email, password) => signInWithEmailAndPassword(auth, email, password)
    const register = async (email, password, displayName) => {
        const cred = await createUserWithEmailAndPassword(auth, email, password)
        if (displayName && cred?.user) {
            try { await updateProfile(cred.user, { displayName }) } catch {}
        }
        return cred
    }
    const logout = () => signOut(auth)
    // Recuperação de senha via Firebase (usuarios estão no Firebase)
    const resetPassword = (email) => {
        // Usar fluxo padrão do Firebase. Se desejar redirecionar para o app após redefinir,
        // configure Authorized Domains no Firebase e utilize actionCodeSettings.
        return sendPasswordResetEmail(auth, email)
    }
    const updatePassword = (newPassword) => {
        const current = auth.currentUser
        if (!current) throw new Error('Nenhum usuário autenticado')
        return updateFirebasePassword(current, newPassword)
    }
    const completeRecovery = () => setIsPasswordRecovery(false);

    const value = {
        user,
        loading,
        isAuthenticated,
        isReady,
        lastEvent,
        isPasswordRecovery,
        login,
        register,
        logout,
        resetPassword,
        updatePassword,
        completeRecovery,
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
}