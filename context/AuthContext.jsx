import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext()

const ADMIN_EMAILS = [
    'admteruzyolanda@gmail.com',
    'shamsonline@gmail.com',
    'soniaetchevarne@gmail.com'
];

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        let isMounted = true;
        const initAuth = async () => {
            console.log("Auth: [INIT] Verificando sesión...")
            try {
                // Verificar sesión actual con timeout
                const { data: { session }, error } = await Promise.race([
                    supabase.auth.getSession(),
                    new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout Session')), 5000))
                ]).catch(err => {
                    console.warn("Auth: [TIMEOUT] Sesión lenta, continuando como invitado.");
                    return { data: { session: null }, error: err };
                });

                if (error && error.message !== 'Timeout Session') {
                    console.error("Auth: [ERROR] Fallo al recuperar sesión:", error.message)
                    if (isMounted) {
                        setUser(null)
                        setLoading(false)
                    }
                    return
                }

                if (session && isMounted) {
                    console.log("Auth: [OK] Sesión recuperada para:", session.user.email)

                    // Verificamos si es admin consultando user_roles con un tiempo límite

                    try {
                        const { data: roleData, error: roleError } = await Promise.race([
                            supabase.from('user_roles').select('role').eq('user_id', session.user.id).maybeSingle(),
                            new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout en obtención de rol')), 8000))
                        ])

                        if (roleError) console.error("Error obteniendo rol:", roleError)

                        // Fallback dinámico: si el email está en la lista blanca, es admin aunque la DB falle
                        const isExplicitAdmin = ADMIN_EMAILS.includes(session.user.email?.toLowerCase());

                        const currentUser = {
                            ...session.user,
                            role: roleData?.role || (isExplicitAdmin ? 'admin' : 'customer')
                        }
                        console.log("Auth: [ROLE] ", currentUser.role)
                        setUser(currentUser)
                    } catch (e) {
                        const isExplicitAdmin = ADMIN_EMAILS.includes(session.user.email?.toLowerCase());
                        console.warn("Auth: [SLOW] Fallback de rol ejecutado.");
                        setUser({ ...session.user, role: isExplicitAdmin ? 'admin' : 'customer' })
                    }
                } else if (isMounted) {
                    console.log("Auth: [NONE] No hay sesión activa")
                    setUser(null)
                }
            } catch (error) {
                console.error("Auth: [CRITICAL ERROR] Fallo total en Init:", error)
            } finally {
                if (isMounted) {
                    console.log("Auth: [DONE] Finalizando estado loading")
                    setLoading(false)
                }
            }
        }

        // Timeout de seguridad mucho más corto: 4s
        const authTimeout = setTimeout(() => {
            if (isMounted && loading) {
                console.warn("Auth: [TIMEOUT] Forzando fin de carga rápido.");
                setLoading(false);
            }
        }, 4000)

        // Llamada principal
        initAuth()

        // Escuchar cambios de estado (logout, login, etc)
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            console.log("Auth: Evento detectado:", event, session?.user?.email || "Sin usuario")

            if (!isMounted) return

            if (session?.user) {
                try {
                    const { data: roleData } = await Promise.race([
                        supabase.from('user_roles').select('role').eq('user_id', session.user.id).maybeSingle(),
                        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 10000))
                    ]).catch(() => ({ data: null }));

                    const isExplicitAdmin = ADMIN_EMAILS.includes(session.user.email?.toLowerCase());

                    setUser({
                        ...session.user,
                        role: roleData?.role || (isExplicitAdmin ? 'admin' : 'customer')
                    })
                } catch (e) {
                    const isExplicitAdmin = ADMIN_EMAILS.includes(session.user.email?.toLowerCase());
                    setUser({ ...session.user, role: isExplicitAdmin ? 'admin' : 'customer' })
                }
            } else {
                setUser(null)
            }
            setLoading(false)
        })

        return () => {
            isMounted = false
            clearTimeout(authTimeout)
            subscription.unsubscribe()
        }
    }, [])

    const login = async (email, password, requireAdmin = false) => {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        })

        if (error) throw error

        // Si se requiere admin (login desde panel de control)
        if (requireAdmin && data?.user) {
            const { data: roleData, error: roleError } = await supabase
                .from('user_roles')
                .select('role')
                .eq('user_id', data.user.id)
                .maybeSingle()

            const isExplicitAdmin = ADMIN_EMAILS.includes(data.user.email?.toLowerCase());

            if (!isExplicitAdmin && (roleError || roleData?.role !== 'admin')) {
                await supabase.auth.signOut()
                throw new Error("Acceso denegado: El usuario no tiene permisos de administrador.")
            }
        }

        return data
    }

    const signup = async (email, password, name) => {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: name,
                }
            }
        })
        if (error) throw error

        // Si el registro fue exitoso, intentamos crear el perfil en la tabla de clientes
        if (data?.user) {
            const [firstName, ...lastNameParts] = name.split(' ');
            const lastName = lastNameParts.join(' ') || '';

            const { error: profileError } = await supabase
                .from('customers')
                .upsert({
                    auth_user_id: data.user.id,
                    email: email,
                    first_name: firstName,
                    last_name: lastName,
                }, { onConflict: 'email' });

            if (profileError) {
                console.warn("No se pudo crear perfil en tabla 'customers':", profileError.message);
            }
        }

        return data
    }

    const logout = async () => {
        const { error } = await supabase.auth.signOut()
        if (error) throw error
    }

    // Si estamos cargando la sesión inicial, no renderizamos nada (o un spinner)
    // para evitar redirecciones incorrectas en rutas protegidas
    // Si estamos cargando la sesión inicial
    if (loading) {
        return (
            <div style={{
                height: '100vh',
                width: '100vw',
                backgroundColor: '#000000',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column',
                fontFamily: 'sans-serif'
            }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '16px' }}>SHAMS</div>
                    <div style={{ color: '#C4956A' }}>Iniciando sesión...</div>
                </div>
            </div>
        )
    }

    return (
        <AuthContext.Provider value={{ user, login, signup, logout, loading }}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    return useContext(AuthContext)
}
