import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  displayName: string | null;
  userPin: string | null;
  role: string | null;
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
  userPin: null,
  role: null,
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
  const [userPin, setUserPin] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [isLocked, setIsLocked] = useState(false);

  const fetchUserData = async (currentUser: User) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("display_name, pin, company_id, role")
        .eq("user_id", currentUser.id)
        .single();
      
      // Se não encontrou perfil (Ocorreu porque deletamos o Trigger)
      if (error && error.code === 'PGRST116') {
        const metadata = currentUser.user_metadata || {};
        // Tenta buscar o nome da empresa em vários lugares possíveis dos metadados
        let companyName = metadata.company_name || metadata.company || 'Empresa Sem Nome';
        
        // Vamos verificar se o usuário foi convidado ou se é o Admin Mestre
        let companyId = null;
        let userRole = 'owner'; 
        
        if (currentUser.email === ADMIN_EMAIL) {
          // O Administrador Mestre não fica vinculado a nenhuma empresa específica
          console.log("Perfil administrativo detectado. Ignorando vínculo de empresa.");
          companyId = null;
        } else {
          const { data: inviteData } = await supabase
            .from("invites")
            .select("company_id")
            .eq("email", currentUser.email)
            .maybeSingle();

          if (inviteData && inviteData.company_id) {
            // O usuário tem um convite oficial: ele é um MEMBRO
            companyId = inviteData.company_id;
            userRole = 'member';
          } else {
            // Não tem convite, então vamos tentar achar a empresa ou criar
            const { data: compData } = await supabase.from("companies").select("id").ilike("name", companyName).maybeSingle();
            
            if (compData) {
              companyId = compData.id;
            } else {
              // Cria nova empresa
              const { data: newComp } = await supabase.from("companies").insert([{ 
                name: (metadata.company_name || metadata.company || 'Empresa Sem Nome').trim().toUpperCase(),
                subscription_status: 'trialing',
                plan_id: 'free'
              }]).select("id").single();
              if (newComp) companyId = newComp.id;
            }
          }
        }

        // Insere o perfil novo com os metadados do login
        const newProfile = {
          user_id: currentUser.id,
          display_name: metadata.full_name || currentUser.email,
          company_id: companyId,
          pin: metadata.pin || "0000",
          role: userRole
        };
        
        await supabase.from("profiles").insert([newProfile]);
        
        setDisplayName(newProfile.display_name);
        setUserPin(newProfile.pin);
        setRole(newProfile.role);
      } else if (data) {
        if (data.display_name) setDisplayName(data.display_name);
        if (data.pin) setUserPin(data.pin);
        if (data.role) setRole(data.role);
      }
    } catch (err) {
      console.error("Erro ao recuperar perfil local", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setLoading(false);
        setSession(session);
        if (session?.user) {
          fetchUserData(session.user);
        } else {
          setDisplayName(null);
          setUserPin(null);
          setRole(null);
          setLoading(false);
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        fetchUserData(session.user);
      } else {
        setLoading(false);
      }
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

  const ADMIN_EMAIL = "psc.paulo81@gmail.com";
  const isAdmin = session?.user?.email === ADMIN_EMAIL;

  return (
    <AuthContext.Provider value={{ session, user: session?.user ?? null, loading, displayName, userPin, role, isAdmin, isLocked, lockApp, unlockApp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
