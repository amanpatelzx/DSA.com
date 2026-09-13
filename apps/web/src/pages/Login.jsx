import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const [identifier, setIdentifier] = useState('') // Option 1: Username or Email ID
  const [password, setPassword] = useState('') // Option 2: Password
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { login } = useAuth()
  const navigate = useNavigate()

  const handleStandardSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!identifier.trim() || !password) {
      setError('Please enter your Username or Email, and Password.')
      return
    }

    setIsSubmitting(true)
    try {
      const res = await axios.post('http://localhost:5000/api/auth/login', { 
        identifier: identifier.trim(),
        password
      })

      await login(res.data.token, res.data)

      const searchParams = new URLSearchParams(window.location.search);
      const redirect = searchParams.get('redirect');
      if (redirect) {
        const target = redirect === 'me?tab=battles' && res.data?.username
          ? `/${res.data.username}?tab=battles`
          : (redirect.startsWith('/') ? redirect : `/${redirect}`);
        navigate(target);
      } else if (res.data.role === 'SUPER_ADMIN' || res.data.role === 'ADMIN') {
        navigate(res.data.username ? `/${res.data.username}` : '/admin');
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
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 via-[#81b64c] to-lime-400 text-white text-xl font-bold shadow-lg mb-3">
            ⚔️
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-1.5">
            Sign In to DSA Battle
          </h2>
          <p className="text-textMuted text-xs sm:text-sm">
            Enter your username or email and password to continue
          </p>
        </div>

        {error && (
          <div className="bg-rose-500/15 border border-rose-500/30 text-rose-400 px-4 py-3 rounded-xl mb-5 text-xs sm:text-sm flex items-center gap-2">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {/* 2-Option Login Form: Option 1 (Username or Email), Option 2 (Password) */}
        <form onSubmit={handleStandardSubmit} className="flex flex-col gap-4">
          {/* Option 1: Username or Email ID */}
          <div>
            <label className="block text-textMuted mb-1.5 text-xs font-semibold uppercase tracking-wider">
              Username or Email ID <span className="text-rose-400">*</span>
            </label>
            <input 
              type="text" 
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              className="w-full bg-[#1e1d1a] border border-white/10 rounded-xl px-3.5 py-2.5 sm:py-3 focus:outline-none focus:border-[#81b64c] transition text-white placeholder-[#7d7c78] text-sm"
              placeholder="e.g. amanpatelzx or aman@gmail.com"
              required 
            />
          </div>

          {/* Option 2: Password */}
          <div>
            <label className="block text-textMuted mb-1.5 text-xs font-semibold uppercase tracking-wider">
              Password <span className="text-rose-400">*</span>
            </label>
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
            className="w-full bg-[#81b64c] hover:bg-[#92c55b] text-white font-bold py-3.5 rounded-xl transition shadow-lg flex items-center justify-center cursor-pointer mt-2 disabled:opacity-50"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                Signing In...
              </span>
            ) : 'Sign In'}
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
