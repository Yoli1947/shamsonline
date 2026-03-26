import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Lock, Sparkles, LogIn, ChevronRight, User } from 'lucide-react'
import './AdminLogin.css'

export default function AdminLogin() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const { user, login } = useAuth()
    const navigate = useNavigate()

    useEffect(() => {
        if (user && user.role === 'admin') {
            navigate('/admin/dashboard')
        }
    }, [user, navigate])

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        setLoading(true)
        let finished = false

        const timeout = setTimeout(() => {
            if (!finished) {
                setLoading(false)
                setError('Tiempo de espera agotado. Tu internet está lento o el servidor tarda en responder. Intenta de nuevo.')
            }
        }, 30000) // 30 segundos de margen para móviles

        try {
            // Pasamos true para requerir rol de admin en este login
            await login(email, password, true)
            finished = true
            clearTimeout(timeout)
            navigate('/admin/dashboard')
        } catch (err) {
            finished = true
            clearTimeout(timeout)
            console.error(err)
            // Asegurarnos de capturar el mensaje de error de forma segura
            const msg = err.message || (typeof err === 'string' ? err : 'Credenciales inválidas o error de conexión')
            setError(msg)
        } finally {
            if (finished) setLoading(false)
        }
    }

    return (
        <div className="admin-login">
            <div className="admin-login__container">
                <div className="admin-login__header">
                    <div className="admin-login-icon">
                        <Lock size={32} strokeWidth={1.5} />
                    </div>
                    <h1>SHAMS</h1>
                    <p>PORTAL EXCLUSIVO</p>
                </div>

                <form onSubmit={handleSubmit} className="admin-login__form">
                    {error && (
                        <div className="admin-login__error">
                            <p>{error}</p>
                            {error.toLowerCase().includes('failed to fetch') && (
                                <p style={{ fontSize: '10px', marginTop: '5px', opacity: 0.8 }}>
                                    ⚠️ Error de conexión: Servidor inaccesible.
                                </p>
                            )}
                            {(error.includes('Invalid login credentials') || error.includes('Invalid grant')) && (
                                <p style={{ fontSize: '10px', marginTop: '5px', opacity: 0.8 }}>
                                    Credenciales incorrectas. Acceso denegado.
                                </p>
                            )}
                        </div>
                    )}

                    <div className="form-group">
                        <label htmlFor="email">Usuario VIP</label>
                        <input
                            type="email"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="email@shams.com"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="password">Llave de Acceso</label>
                        <input
                            type={showPassword ? "text" : "password"}
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                        />
                        <button
                            type="button"
                            className="password-toggle"
                            onClick={() => setShowPassword(!showPassword)}
                        >
                            {showPassword ? 'Ocultar' : 'Revelar'}
                        </button>
                    </div>

                    <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
                        <span style={{ position: 'relative', zIndex: 10, display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {loading ? (
                                'AUTENTICANDO...'
                            ) : (
                                <>INGRESAR AL CLUB <ChevronRight size={16} strokeWidth={3} /></>
                            )}
                        </span>
                    </button>

                    <div className="benefit-badge">
                        <Sparkles size={16} />
                        ACCESO A OPORTUNIDADES EXCLUSIVAS
                    </div>

                    <p className="admin-login__footer">
                        Servidor en Línea: {import.meta.env.VITE_SUPABASE_URL?.split('//')[1]?.split('.')[0] || 'Desconocido'}
                    </p>
                </form>
            </div>
        </div>
    )
}
