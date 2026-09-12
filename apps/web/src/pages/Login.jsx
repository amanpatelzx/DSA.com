import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const [loginType, setLoginType] = useState('USER') // 'USER' | 'ADMIN'
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setIsSubmitting(true)
    try {
      const res = await axios.post('http://localhost:5000/api/auth/login', { 
        identifier: identifier.trim(),
        password,
        loginType
      })

      await login(res.data.token, res.data)

      // If Admin Login, go directly to Admin Panel
      // If User Login, navigate directly to /:username
      if (loginType === 'ADMIN') {
        navigate('/admin')
      } else {
        navigate(res.data.username ? `/${res.data.username}` : '/')
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-[calc(100vh-100px)] flex items-center justify-center p-4 sm:p-6">
      <div className="glass-panel p-6 sm:p-8 w-full max-w-md shadow-2xl border border-white/10 rounded-2xl">
        {/* Header Branding */}
        <div className="text-center mb-6">
          <div className={`inline-flex items-center justify-center w-12 h-12 rounded-2xl ${
            loginType === 'ADMIN' 
              ? 'bg-gradient-to-tr from-amber-600 to-yellow-500 shadow-amber-900/30' 
              : 'bg-gradient-to-tr from-emerald-600 to-green-400 shadow-emerald-900/30'
          } text-white text-xl font-bold shadow-lg mb-3 transition-colors`}>
            {loginType === 'ADMIN' ? '🛡️' : '</>'}
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-1.5">
            {loginType === 'ADMIN' ? 'Admin Portal' : 'Welcome Back'}
          </h2>
          <p className="text-textMuted text-xs sm:text-sm">
            {loginType === 'ADMIN'
              ? 'Sign in with administrator privileges to manage the platform'
              : 'Sign in to compete, train, and view your profile'}
          </p>
        </div>

        {/* User vs Admin Role Toggle Tabs */}
        <div className="grid grid-cols-2 p-1 bg-[#1e1d1a] rounded-xl mb-6 border border-white/10">
          <button
            type="button"
            onClick={() => { setLoginType('USER'); setError(''); }}
            className={`py-2 px-3 rounded-lg text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1.5 ${
              loginType === 'USER'
                ? 'bg-[#81b64c] text-white shadow-md'
                : 'text-[#8c8b88] hover:text-white'
            }`}
          >
            <span>👤</span>
            <span>User Login</span>
          </button>
          <button
            type="button"
            onClick={() => { setLoginType('ADMIN'); setError(''); }}
            className={`py-2 px-3 rounded-lg text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1.5 ${
              loginType === 'ADMIN'
                ? 'bg-gradient-to-r from-amber-600 to-yellow-600 text-white shadow-md'
                : 'text-[#8c8b88] hover:text-white'
            }`}
          >
            <span>🛡️</span>
            <span>Admin Login</span>
          </button>
        </div>

        {error && (
          <div className="bg-danger/15 border border-danger/40 text-danger px-4 py-3 rounded-xl mb-5 text-xs sm:text-sm flex items-center gap-2">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-textMuted mb-1.5 text-xs font-semibold uppercase tracking-wider">
              {loginType === 'ADMIN' ? 'Admin Email / Username' : 'Username or Gmail'}
            </label>
            <input 
              type="text" 
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              className="w-full bg-[#1e1d1a] border border-white/10 rounded-xl px-3.5 py-2.5 sm:py-3 focus:outline-none focus:border-[#81b64c] transition text-white placeholder-[#7d7c78] text-sm"
              placeholder={loginType === 'ADMIN' ? 'admin@dsabattle.com' : 'amanpatelzx or aman@gmail.com'}
              required 
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-textMuted text-xs font-semibold uppercase tracking-wider">
                Password
              </label>
              {loginType === 'ADMIN' && (
                <span className="text-[11px] text-amber-400 font-mono">Role: ADMIN only</span>
              )}
            </div>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[#1e1d1a] border border-white/10 rounded-xl px-3.5 py-2.5 sm:py-3 focus:outline-none focus:border-[#81b64c] transition text-white placeholder-[#7d7c78] text-sm"
              placeholder="••••••••"
              required 
            />
          </div>

          <button 
            type="submit" 
            disabled={isSubmitting}
            className={`w-full ${
              loginType === 'ADMIN'
                ? 'bg-amber-600 hover:bg-amber-500 shadow-amber-900/30'
                : 'bg-[#81b64c] hover:bg-[#92c55b] shadow-[#81b64c]/20'
            } text-white font-bold py-3.5 rounded-xl transition shadow-lg flex items-center justify-center cursor-pointer mt-1 disabled:opacity-50`}
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                Authenticating...
              </span>
            ) : loginType === 'ADMIN' ? 'Log In as Admin' : 'Sign In as Player'}
          </button>
        </form>

        <p className="mt-6 text-center text-textMuted text-xs sm:text-sm">
          Don't have an account?{' '}
          <Link to="/signup" className="text-[#81b64c] font-semibold hover:underline">
            Sign up for free
          </Link>
        </p>
      </div>
    </div>
  )
}
