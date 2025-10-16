import React, { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../supabase/config'
import { auth } from '../firebase/config'
import { sendPasswordResetEmail } from 'firebase/auth'

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

    const syncUserData = async (supabaseUser) => {
        if (supabaseUser) {
            const { data: profile, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', supabaseUser.id)
                .single();

            if (error) {
                setUser(null);
                setIsAuthenticated(false);
            } else {
                const userData = { ...supabaseUser, ...profile };
                setUser(userData);
                setIsAuthenticated(true);
            }
        } else {
            setUser(null);
            setIsAuthenticated(false);
        }
    };

    useEffect(() => {
        const setupAuthListener = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (session) {
                    await syncUserData(session.user);
                } else {
                    setUser(null);
                    setIsAuthenticated(false);
                }
                setLoading(false);
                setIsReady(true);

                const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
                    setLastEvent(event);
                    if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
                        if (session) {
                            await syncUserData(session.user);
                        }
                    } else if (event === 'SIGNED_OUT') {
                        setUser(null);
                        setIsAuthenticated(false);
                    } else if (event === 'PASSWORD_RECOVERY') {
                        // Exibir fluxo de redefinição de senha na UI
                        setIsPasswordRecovery(true);
                    }
                });

                return () => {
                    if (authListener && authListener.subscription) {
                        authListener.subscription.unsubscribe();
                    }
                };
            } catch (error) {
                setLoading(false);
                setIsReady(true);
            }
        };

        setupAuthListener();
    }, []);

    const login = (email, password) => supabase.auth.signInWithPassword({ email, password });
    const register = (email, password, options) => supabase.auth.signUp({ email, password, options });
    const logout = () => supabase.auth.signOut();
    // Recuperação de senha via Firebase (usuarios estão no Firebase)
    const resetPassword = (email) => {
        // Usar fluxo padrão do Firebase. Se desejar redirecionar para o app após redefinir,
        // configure Authorized Domains no Firebase e utilize actionCodeSettings.
        return sendPasswordResetEmail(auth, email)
    }
    const updatePassword = (newPassword) => supabase.auth.updateUser({ password: newPassword });
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