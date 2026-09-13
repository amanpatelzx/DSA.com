import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'

export default function Signup() {
  const [name, setName] = useState('')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    // Client-side validations
    if (password !== confirmPassword) {
      setError('Passwords do not match. Please verify your password.')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.')
      return
    }

    const cleanUsername = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, '')
    if (cleanUsername.length < 3) {
      setError('Username must be at least 3 characters (letters, numbers, underscores only).')
      return
    }

    setIsSubmitting(true)
    try {
      const res = await axios.post('http://localhost:5000/api/auth/register', { 
        name: name.trim(),
        username: cleanUsername, 
        email: email.trim() || undefined, 
        password 
      })
      
      await login(res.data.token, res.data)
      // Navigate directly to the user's profile URL at /:username
      navigate(`/${res.data.username}`)
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-[calc(100vh-100px)] flex items-center justify-center p-4 sm:p-6">
      <div className="glass-panel p-6 sm:p-8 w-full max-w-md shadow-2xl border border-white/10 rounded-2xl">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-green-400 text-white text-xl font-bold shadow-lg shadow-emerald-900/30 mb-3">
            &lt;/&gt;
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-1.5">
            Create Player Account
          </h2>
          <p className="text-textMuted text-xs sm:text-sm">
            Join the competitive arena and battle fellow developers
          </p>
        </div>

        {error && (
          <div className="bg-danger/15 border border-danger/40 text-danger px-4 py-3 rounded-xl mb-5 text-xs sm:text-sm flex items-center gap-2">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
          {/* Full Name */}
          <div>
            <label className="block text-textMuted mb-1.5 text-xs font-semibold uppercase tracking-wider">
              Full Name
            </label>
            <input 
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-[#1e1d1a] border border-white/10 rounded-xl px-3.5 py-2.5 sm:py-3 focus:outline-none focus:border-[#81b64c] transition text-white placeholder-[#7d7c78] text-sm"
              placeholder="e.g. Aman Patel"
              required 
            />
          </div>

          {/* Player Username */}
          <div>
            <label className="block text-textMuted mb-1.5 text-xs font-semibold uppercase tracking-wider">
              Player Username (Handle)
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40 text-sm font-mono select-none">
                @
              </span>
              <input 
                type="text" 
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                className="w-full bg-[#1e1d1a] border border-white/10 rounded-xl pl-8 pr-3.5 py-2.5 sm:py-3 focus:outline-none focus:border-[#81b64c] transition text-white placeholder-[#7d7c78] text-sm font-mono"
                placeholder="amanpatelzx"
                required 
              />
            </div>
            <span className="text-[10px] text-[#7d7c78] mt-1 block">
              Used in your profile URL: dsa.com/{username || 'yourhandle'}
            </span>
          </div>

          {/* Gmail / Email Address (Optional) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-textMuted text-xs font-semibold uppercase tracking-wider">
                Gmail / Email Address
              </label>
              <span className="text-[10px] text-white/40 font-mono">Optional</span>
            </div>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-[#1e1d1a] border border-white/10 rounded-xl px-3.5 py-2.5 sm:py-3 focus:outline-none focus:border-[#81b64c] transition text-white placeholder-[#7d7c78] text-sm"
              placeholder="e.g. aman@gmail.com (optional)"
            />
          </div>

          {/* Password */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-textMuted mb-1.5 text-xs font-semibold uppercase tracking-wider">
                Password
              </label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#1e1d1a] border border-white/10 rounded-xl px-3.5 py-2.5 sm:py-3 focus:outline-none focus:border-[#81b64c] transition text-white placeholder-[#7d7c78] text-sm"
                placeholder="••••••••"
                required 
                minLength={6}
              />
            </div>
            <div>
              <label className="block text-textMuted mb-1.5 text-xs font-semibold uppercase tracking-wider">
                Confirm Password
              </label>
              <input 
                type="password" 
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-[#1e1d1a] border border-white/10 rounded-xl px-3.5 py-2.5 sm:py-3 focus:outline-none focus:border-[#81b64c] transition text-white placeholder-[#7d7c78] text-sm"
                placeholder="••••••••"
                required 
                minLength={6}
              />
            </div>
          </div>

          {/* Submit Button */}
          <button 
            type="submit" 
            disabled={isSubmitting}
            className="w-full bg-[#81b64c] hover:bg-[#92c55b] text-white font-bold py-3.5 rounded-xl transition shadow-lg shadow-[#81b64c]/20 flex items-center justify-center cursor-pointer mt-2 disabled:opacity-50"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                Creating account...
              </span>
            ) : 'Sign Up & Start Battling'}
          </button>
        </form>

        <p className="mt-6 text-center text-textMuted text-xs sm:text-sm">
          Already have an account?{' '}
          <Link to="/login" className="text-[#81b64c] font-semibold hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  )
}
