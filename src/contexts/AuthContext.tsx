import React, { createContext, useContext, useState, useCallback } from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { auth } from "../firebase";

interface AcademicYear {
  id: number;
  name: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
}

export interface User {
  id: number;
  firstName: string;
  lastName: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: string;
  active?: boolean;
  role: string;
  lastLogin?: string;
  activatedAt?: string;
  AcademicYears?: AcademicYear[];
}

interface DisplayUser {
  id: number;
  name: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  displayUser: DisplayUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<string>;
  getToken: () => Promise<string | null>;
  logout: () => void;
  setUser: (user: User | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const getDisplayUser = (userData: User): DisplayUser => ({
    id: userData.id,
    name: `${userData.firstName} ${userData.lastName}`.trim(),
    role: userData.role ? userData.role.replace("_", " ") : "",
  });

  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          // إجبار Firebase على جلب Token حديث يحمل Custom Claims الجديدة (role و id)
          const idToken = await firebaseUser.getIdToken(true);
          localStorage.setItem("authToken", idToken);

          const profileResponse = await fetch("http://localhost:8081/profile", {
            headers: { Authorization: "Bearer " + idToken },
          });

          if (profileResponse.ok) {
            const profileData = await profileResponse.json();
            setUser(profileData);
          } else {
            setUser(null);
            localStorage.removeItem("authToken");
          }
        } catch (error) {
          console.error("Failed to restore session:", error);
          setUser(null);
        }
      } else {
        setUser(null);
        localStorage.removeItem("authToken");
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );

      // 1. طلب أول بدون forceRefresh لمعرفة الـ Profile
      let idToken = await userCredential.user.getIdToken();

      const profileResponse = await fetch("http://localhost:8081/profile", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + idToken,
        },
      });
      console.log(profileResponse);
      if (!profileResponse.ok) {
        throw new Error("Failed to fetch profile");
      }

      const profileData = await profileResponse.json();

      // 2. إجبار تحديث الـ Token للحصول على الـ Custom Claims فوراً
      idToken = await userCredential.user.getIdToken(true);

      setUser(profileData);
      localStorage.setItem("authToken", idToken);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const signup = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const idToken = await userCredential.user.getIdToken();
      localStorage.setItem("authToken", idToken);
      return idToken;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getToken = useCallback(async () => {
    if (auth.currentUser) {
      const token = await auth.currentUser.getIdToken(true);
      localStorage.setItem("authToken", token);
      return token;
    }
    return localStorage.getItem("authToken");
  }, []);

  const logout = useCallback(() => {
    signOut(auth);
    localStorage.removeItem("authToken");
    setUser(null);
  }, []);

  const displayUser = user ? getDisplayUser(user) : null;

  return (
    <AuthContext.Provider
      value={{
        user,
        displayUser,
        isAuthenticated: !!user,
        isLoading,
        login,
        signup,
        getToken,
        logout,
        setUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};
