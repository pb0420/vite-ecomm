import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { toast } from '@/components/ui/use-toast';
import { setQueryCache, getQueryCache, clearQueryCache } from '@/lib/queryCache';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true); // Start with loading true

  const fetchProfile = useCallback(async (userId) => {
    if (!userId) {
      setProfile(null);
      setIsAdmin(false);
      return null;
    }
    try {
      const { data, error, status } = await supabase
        .from('profiles')
        .select(`name,email, phone, address, is_admin, addresses, ai_chat`)
        .eq('id', userId)
        .single();

      if (error && status !== 406) {
        console.error('Error fetching user profile (status not 406):', error.message);
        throw error;
      }

      if (error && status === 406) {
         console.warn('Profile not found or no permission (406), this might be expected for new users before profile creation or RLS issues.');
         setProfile(null);
         setIsAdmin(false);
         return null;
      }


      if (data) {
        // format phone number if required
        const phoneNumber = data.phone;
        data.phone = phoneNumber.startsWith('61') ? `0${phoneNumber.replace(/^61/, '')}` : phoneNumber;
        setProfile(data);
        setIsAdmin(data.is_admin === true);
        setQueryCache('user_profile', data, 1440); // cache for 1 day (1440 minutes)

        return data;
      } else {
        setProfile(null);
        setIsAdmin(false);
        return null;
      }
    } catch (error) {
      console.error('Error fetching user profile (catch block):', error.message);
      if (error.message !== 'JSON object requested, multiple (or no) rows returned') {
        toast({ variant: "destructive", title: "Profile Error", description: "Could not load user profile. " + error.message });
      }
      setProfile(null);
      setIsAdmin(false);
      return null;
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    const cachedProfile = getQueryCache('user_profile');
    if (cachedProfile) {
      setProfile(cachedProfile);
      setIsAdmin(cachedProfile.is_admin === true);
      setLoading(false);
    }

    // Function to handle setting user, profile, isAdmin, and loading state
    const handleAuthStateChange = async (session) => {
      if (!isMounted) return;

      // console.log('Handling auth state change:', session); // Log auth state changes

      if (session?.user) {
        setUser(session.user);
        // Fetch profile only if user is set
        const userProfile = await fetchProfile(session.user.id);
        // Ensure isAdmin is set based on the fetched profile
        setIsAdmin(userProfile?.is_admin === true);
      } else {
        setUser(null);
        setProfile(null);
        setIsAdmin(false);
      }
      // Always set loading to false after state change is processed
      setLoading(false);
    };

    // Set up the auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        // The listener receives the session directly, pass it to our handler
        handleAuthStateChange(session);
      }
    );

    // Initial session check
    const initializeSession = async () => {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (isMounted) {
        if (sessionError) {
          console.error('Error fetching initial session:', sessionError);
          toast({ variant: "destructive", title: "Auth Error", description: "Could not fetch initial session." });
          // Even on error, we should stop loading and clear state
          setUser(null);
          setProfile(null);
          setIsAdmin(false);
          setLoading(false);
        } else {
          // Use the session from getSession to initialize the state
          // The onAuthStateChange listener might fire immediately after getSession if a session exists,
          // but explicitly handling the initial state here ensures it's set correctly from the start.
          // We call handleAuthStateChange with the initial session.
          handleAuthStateChange(session);
        }
      }
    };

    initializeSession();


    return () => {
      isMounted = false;
      subscription?.unsubscribe();
    };
  }, [fetchProfile]); // Dependency array includes fetchProfile

  const login = async (email, password) => {
    setLoading(true); // Set loading true when login starts
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      console.error('Login error:', error);
      toast({ variant: "destructive", title: "Login Failed", description: error.message });
      setLoading(false); // Set loading false on error
      return { success: false, isAdminUser: false, error: error.message };
    }

    // The onAuthStateChange listener will handle state updates and setLoading(false)
    // Fetch profile here to return isAdmin status immediately for the caller if needed
    const userProfile = await fetchProfile(data.user.id);
    return { success: true, isAdminUser: userProfile?.is_admin === true };
  };

  const register = async (email, password, name, phone) => {
     setLoading(true); // Set loading true when registration starts
     const { data, error } = await supabase.auth.signUp({
       email,
       password,
       options: {
         data: {
           name: name,
         }
       }
     });

     if (error) {
       console.error('Registration error:', error);
       toast({ variant: "destructive", title: "Registration Failed", description: error.message });
       setLoading(false); // Set loading false on error
       return false;
     }

     // Handle phone update if needed
     if (data.user && phone) {
        // Wait a bit for the trigger to potentially complete
        await new Promise(resolve => setTimeout(resolve, 1000));
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ phone: phone, updated_at: new Date() })
          .eq('id', data.user.id);

        if (profileError) {
            console.error('Error updating phone during registration:', profileError);
            toast({ variant: "destructive", title: "Profile Update Issue", description: "Could not save phone number: " + profileError.message });
        }
     }

     toast({ title: "Registration Successful", description: "Please check your email to confirm your account." });
     // The onAuthStateChange listener will handle state updates and setLoading(false)
     return true;
  };


  const logout = async () => {
    setLoading(true); // Set loading true when logout starts
    const { error } = await supabase.auth.signOut();
    clearQueryCache('user_profile');

    // The onAuthStateChange listener will handle state updates and setLoading(false)

    if (error) {
      console.error('Logout error:', error);
      toast({ variant: "destructive", title: "Logout Failed", description: error.message });
      setLoading(false); // Set loading false on error
    } else {
      toast({ title: "Logged Out", description: "You have been successfully logged out." });
    }
  };

  const updateUserInfo = async (newUserData,toasty = true) => {
    if (!user) return;
    setLoading(true); // Set loading true when updating starts

    const { data, error } = await supabase
      .from('profiles')
      .update({
        name: newUserData.name,
        email: newUserData.email,
        address: newUserData.address,
        addresses: newUserData.addresses,
        ai_chat:newUserData.ai_chat,
        updated_at: new Date(),
      })
      .eq('id', user.id)
      .select()
      .single();

    if (error) {
      console.error('Profile update error:', error);
      toast({ variant: "destructive", title: "Update Failed", description: error.message });
    } else if (data) {
      // Update profile state directly here as this is a profile update, not an auth state change
      setProfile(data);
      setIsAdmin(data.is_admin === true);
      setQueryCache('user_profile', data, 1440); // update cache
      if(toasty)
        toast({ title: "Profile Updated", description: "Your information has been updated." });
    }
    setLoading(false); // Set loading false after update completes (success or error)
  };


  const combinedUser = user && profile ? { ...user, ...profile } : user;


  return (
    <AuthContext.Provider value={{
      user: combinedUser,
      session: supabase.auth.getSession(), // Keep this to allow components to access session if needed
      isAdmin,
      loading,
      login,
      register,
      logout,
      updateUserInfo
    }}>
      {children}
    </AuthContext.Provider>
  );
};
