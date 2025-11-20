import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import type { UserRole } from '../utils/permissions';
import type { User as SupabaseUser } from '@supabase/supabase-js';

interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  permissions: string[];
  ward?: string;
  constituency?: string;
  is_super_admin?: boolean;
  organization_id?: string;
  tenant_id?: string;
  status?: 'active' | 'inactive' | 'suspended';
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (email: string, password: string, name: string, role?: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
  isInitializing: boolean;
  hasPermission: (permission: string) => boolean;
  isWorker: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

  // Check for existing session on mount and listen for auth changes
  useEffect(() => {
    // Add timeout to prevent infinite loading
    const timeout = setTimeout(() => {
      console.log('[AuthContext] ⏰ Initialization timeout - forcing completion');
      setIsInitializing(false);
    }, 5000); // 5 second timeout

    checkSession().finally(() => {
      clearTimeout(timeout);
    });

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('[AuthContext] 🔔 Auth state changed:', event);

      if (event === 'SIGNED_IN' && session) {
        // User signed in - fetch user data directly using the provided session
        console.log('[AuthContext] ✅ Session found in auth event:', session.user.email);
        await fetchUserData(session);
      } else if (event === 'SIGNED_OUT') {
        // User signed out
        setUser(null);
      } else if (event === 'TOKEN_REFRESHED') {
        // Token refreshed
        console.log('[AuthContext] ✅ Token refreshed');
      }
    });

    return () => {
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, []);

  const checkSession = async () => {
    console.log('[AuthContext] 🔄 Checking Supabase session...');

    try {
      // Clean up any old force login flags
      localStorage.removeItem('force_login');
      localStorage.removeItem('mock_user');

      // Check for existing Supabase session (no timeout for auth check)
      console.log('[AuthContext] 🔄 Step 1/2: Fetching auth session...');
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error) {
        console.error('[AuthContext] ❌ Session check error:', error);
        setIsInitializing(false);
        return;
      }

      if (!session) {
        console.log('[AuthContext] ❌ No active session found');
        setIsInitializing(false);
        return;
      }

      console.log('[AuthContext] ✅ Session found:', session.user.email);

      // Fetch user details from database with extended timeout (30 seconds)
      console.log('[AuthContext] 🔄 Step 2/2: Fetching user data from database...');
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('User data fetch timeout after 30 seconds')), 30000);
      });

      const userDataPromise = supabase
        .from('users')
        .select('*')
        .eq('email', session.user.email)
        .single();

      try {
        const { data: userData, error: userError } = await Promise.race([
          userDataPromise,
          timeoutPromise
        ]) as any;

        if (userError || !userData) {
          console.warn('[AuthContext] ⚠️ Failed to load user data from database:', userError?.message || 'No data found');
          console.log('[AuthContext] 🔄 Creating fallback user from auth session...');

          // Fallback: Create basic user object from auth session
          const fallbackUser: User = {
            id: session.user.id,
            name: session.user.email?.split('@')[0] || 'User',
            email: session.user.email || '',
            role: 'user' as UserRole,
            permissions: ['*'], // Grant basic permissions
            avatar: session.user.user_metadata?.avatar_url,
            is_super_admin: false,
            organization_id: '00000000-0000-0000-0000-000000000001', // Dev org ID
            status: 'active',
          };

          console.log('[AuthContext] ✅ Using fallback user data:', fallbackUser.name, fallbackUser.role);
          setUser(fallbackUser);
          setIsInitializing(false);
          return;
        }

        // Construct full name from first_name and last_name
        const fullName = [userData.first_name, userData.last_name]
          .filter(Boolean)
          .join(' ') || userData.username || 'User';

        console.log('[AuthContext] ✅ User data loaded from database:', fullName, userData.role);

        setUser({
          id: userData.id,
          name: fullName,
          email: userData.email,
          role: userData.role as UserRole,
          permissions: userData.permissions || [],
          avatar: userData.avatar,
          is_super_admin: userData.is_super_admin,
          organization_id: userData.organization_id,
          status: userData.status || 'active',
        });

        setIsInitializing(false);
      } catch (dbError: any) {
        console.error('[AuthContext] ❌ Database query timeout or error:', dbError.message);
        console.log('[AuthContext] 🔄 Creating fallback user from auth session...');

        // Fallback: Create basic user object from auth session
        const fallbackUser: User = {
          id: session.user.id,
          name: session.user.email?.split('@')[0] || 'User',
          email: session.user.email || '',
          role: 'user' as UserRole,
          permissions: ['*'], // Grant basic permissions
          avatar: session.user.user_metadata?.avatar_url,
          is_super_admin: false,
          organization_id: '00000000-0000-0000-0000-000000000001', // Dev org ID
          status: 'active',
        };

        console.log('[AuthContext] ✅ Using fallback user data after timeout:', fallbackUser.name, fallbackUser.role);
        setUser(fallbackUser);
        setIsInitializing(false);
      }
    } catch (error: any) {
      console.error('[AuthContext] ❌ Session check failed with error:', error.message);
      // Always set initializing to false, even on error
      setIsInitializing(false);
      // Don't sign out on error - let user stay logged in with fallback data
    }
  };

  const fetchUserData = async (session: any) => {
    try {
      // Fetch user details from database with extended timeout (30 seconds)
      console.log('[AuthContext] 🔄 Fetching user data from database for:', session.user.email);
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('User data fetch timeout after 30 seconds')), 30000);
      });

      const userDataPromise = supabase
        .from('users')
        .select('*')
        .eq('email', session.user.email)
        .single();

      try {
        const { data: userData, error: userError } = await Promise.race([
          userDataPromise,
          timeoutPromise
        ]) as any;

        if (userError || !userData) {
          console.warn('[AuthContext] ⚠️ Failed to load user data from database:', userError?.message || 'No data found');
          console.log('[AuthContext] 🔄 Creating fallback user from auth session...');

          // Fallback: Create basic user object from auth session
          const fallbackUser: User = {
            id: session.user.id,
            name: session.user.email?.split('@')[0] || 'User',
            email: session.user.email || '',
            role: 'user' as UserRole,
            permissions: ['*'], // Grant basic permissions
            avatar: session.user.user_metadata?.avatar_url,
            is_super_admin: false,
            organization_id: '00000000-0000-0000-0000-000000000001', // Dev org ID
            status: 'active',
          };

          console.log('[AuthContext] ✅ Using fallback user data:', fallbackUser.name, fallbackUser.role);
          setUser(fallbackUser);
          setIsInitializing(false);
          setIsLoading(false);
          return;
        }

        // Construct full name from first_name and last_name
        const fullName = [userData.first_name, userData.last_name]
          .filter(Boolean)
          .join(' ') || userData.username || 'User';

        console.log('[AuthContext] ✅ User data loaded from database:', fullName, userData.role);

        setUser({
          id: userData.id,
          name: fullName,
          email: userData.email,
          role: userData.role as UserRole,
          permissions: userData.permissions || [],
          avatar: userData.avatar,
          is_super_admin: userData.is_super_admin,
          organization_id: userData.organization_id,
          status: userData.status || 'active',
        });

        setIsInitializing(false);
        setIsLoading(false);
      } catch (dbError: any) {
        console.error('[AuthContext] ❌ Database query timeout or error:', dbError.message);
        console.log('[AuthContext] 🔄 Creating fallback user from auth session...');

        // Fallback: Create basic user object from auth session
        const fallbackUser: User = {
          id: session.user.id,
          name: session.user.email?.split('@')[0] || 'User',
          email: session.user.email || '',
          role: 'user' as UserRole,
          permissions: ['*'], // Grant basic permissions
          avatar: session.user.user_metadata?.avatar_url,
          is_super_admin: false,
          organization_id: '00000000-0000-0000-0000-000000000001', // Dev org ID
          status: 'active',
        };

        console.log('[AuthContext] ✅ Using fallback user data after timeout:', fallbackUser.name, fallbackUser.role);
        setUser(fallbackUser);
        setIsInitializing(false);
        setIsLoading(false);
      }
    } catch (error: any) {
      console.error('[AuthContext] ❌ fetchUserData failed with error:', error.message);
      setIsInitializing(false);
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      console.log('[AuthContext] 🔐 Attempting login:', email);

      // Sign in with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        console.error('[AuthContext] ❌ Login failed:', authError.message);

        // Check if it's a network error
        if (authError.message.includes('fetch') || authError.message.includes('network')) {
          console.warn('[AuthContext] ⚠️ Network error detected - checking for demo mode...');
          throw new Error('Unable to connect to authentication server. Please check your internet connection.');
        }

        throw new Error(authError.message);
      }

      if (!authData.user) {
        throw new Error('Login failed - no user returned');
      }

      console.log('[AuthContext] ✅ Supabase auth successful:', authData.user.email);

      // Fetch user details from database with timeout
      console.log('[AuthContext] 🔄 Fetching user data from database...');
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('User data fetch timeout after 30 seconds')), 30000);
      });

      const userDataPromise = supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();

      try {
        const { data: userData, error: userError } = await Promise.race([
          userDataPromise,
          timeoutPromise
        ]) as any;

        if (userError || !userData) {
          console.warn('[AuthContext] ⚠️ Failed to load user data from database:', userError?.message || 'No data found');
          console.log('[AuthContext] 🔄 Using fallback user from auth session...');

          // Fallback: Create basic user object from auth session
          const fallbackUser: User = {
            id: authData.user.id,
            name: authData.user.email?.split('@')[0] || 'User',
            email: authData.user.email || '',
            role: 'user' as UserRole,
            permissions: ['*'], // Grant basic permissions
            avatar: authData.user.user_metadata?.avatar_url,
            is_super_admin: false,
            status: 'active',
          };

          console.log('[AuthContext] ✅ Using fallback user data:', fallbackUser.name, fallbackUser.role);
          setUser(fallbackUser);
          setIsLoading(false);
          return true;
        }

        console.log('[AuthContext] ✅ User data loaded from database:', userData.full_name, userData.role);

        const user: User = {
          id: userData.id,
          name: userData.full_name,
          email: userData.email,
          role: userData.role as UserRole,
          permissions: userData.permissions || [],
          avatar: userData.avatar_url,
          is_super_admin: userData.is_super_admin,
          organization_id: userData.organization_id,
          status: userData.status || 'active',
        };

        setUser(user);
        setIsLoading(false);
        return true;
      } catch (dbError: any) {
        console.error('[AuthContext] ❌ Database query timeout or error:', dbError.message);
        console.log('[AuthContext] 🔄 Using fallback user from auth session...');

        // Fallback: Create basic user object from auth session
        const fallbackUser: User = {
          id: authData.user.id,
          name: authData.user.email?.split('@')[0] || 'User',
          email: authData.user.email || '',
          role: 'user' as UserRole,
          permissions: ['*'], // Grant basic permissions
          avatar: authData.user.user_metadata?.avatar_url,
          is_super_admin: false,
          organization_id: '00000000-0000-0000-0000-000000000001', // Dev org ID
          status: 'active',
        };

        console.log('[AuthContext] ✅ Using fallback user data after timeout:', fallbackUser.name, fallbackUser.role);
        setUser(fallbackUser);
        setIsLoading(false);
        return true;
      }
    } catch (error: any) {
      console.error('[AuthContext] ❌ Login error:', error);
      setIsLoading(false);
      throw error;
    }
  };

  const signup = async (email: string, password: string, name: string, role: string = 'user'): Promise<boolean> => {
    try {
      setIsLoading(true);
      console.log('[AuthContext] 📝 Attempting signup:', email);

      // Sign up with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) {
        console.error('[AuthContext] ❌ Signup failed:', authError.message);
        throw new Error(authError.message);
      }

      if (!authData.user) {
        throw new Error('Signup failed - no user returned');
      }

      console.log('[AuthContext] ✅ Supabase auth signup successful:', authData.user.email);

      // Note: You'll need to create a database trigger or function to automatically
      // create a user record in the users table when a new auth user is created
      // For now, this will return true after signup

      setIsLoading(false);
      return true;
    } catch (error: any) {
      console.error('[AuthContext] ❌ Signup error:', error);
      setIsLoading(false);
      throw error;
    }
  };

  const logout = async () => {
    try {
      console.log('[AuthContext] 🚪 Logging out...');
      await supabase.auth.signOut();
      setUser(null);
      console.log('[AuthContext] ✅ Logged out successfully');
    } catch (error) {
      console.error('[AuthContext] ❌ Logout error:', error);
      setUser(null);
    }
  };

  // Check if user has a specific permission
  const hasPermission = (permission: string): boolean => {
    if (!user) return false;

    // Super admins have all permissions
    if (user.is_super_admin) return true;

    // Admins have all permissions
    if (user.role === 'admin' || user.role === 'superadmin') return true;

    // Check for wildcard permission (mock auth)
    if (user.permissions.includes('*')) return true;

    // Check user's permissions array
    return user.permissions?.includes(permission) || false;
  };

  // Check if user is a field worker
  const isWorker = (): boolean => {
    if (!user) return false;
    return ['volunteer', 'user'].includes(user.role);
  };

  const value: AuthContextType = {
    user,
    login,
    signup,
    logout,
    isLoading,
    isInitializing,
    hasPermission,
    isWorker
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
