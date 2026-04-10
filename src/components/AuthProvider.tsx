import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  displayName: string | null;
  isAdmin: boolean;
  isLocked: boolean;
  lockApp: () => void;
  unlockApp: () => void;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  loading: true,
  displayName: null,
  isAdmin: false,
  isLocked: false,
  lockApp: () => {},
  unlockApp: () => {},
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [isLocked, setIsLocked] = useState(false);

  const fetchDisplayName = async (userId: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("display_name")
      .eq("user_id", userId)
      .single();
    if (data?.display_name) setDisplayName(data.display_name);
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setLoading(false);
        if (session?.user) {
          setTimeout(() => fetchDisplayName(session.user.id), 0);
        } else {
          setDisplayName(null);
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
      if (session?.user) fetchDisplayName(session.user.id);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    setIsLocked(false);
    await supabase.auth.signOut();
  };

  const lockApp = () => {
    if (session?.user) {
      setIsLocked(true);
    }
  };

  const unlockApp = () => {
    setIsLocked(false);
  };

  const isAdmin = session?.user?.email === "psc.paulo81@gmail.com";

  return (
    <AuthContext.Provider value={{ session, user: session?.user ?? null, loading, displayName, isAdmin, isLocked, lockApp, unlockApp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
