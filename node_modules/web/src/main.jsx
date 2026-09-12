import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext.jsx'
import { SocketProvider } from './context/SocketContext.jsx'
import Layout from './components/Layout.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import PublicOnlyRoute from './components/PublicOnlyRoute.jsx'
import App from './App.jsx'
import Login from './pages/Login.jsx'
import Signup from './pages/Signup.jsx'
import Profile from './pages/Profile.jsx'
import Search from './pages/Search.jsx'
import TrainingGround from './pages/TrainingGround.jsx'
import ProblemView from './pages/ProblemView.jsx'
import AdminPanel from './pages/AdminPanel.jsx'
import Learn from './pages/Learn.jsx'
import Watch from './pages/Watch.jsx'
import Community from './pages/Community.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <BrowserRouter>
        <SocketProvider>
          <Routes>
          <Route element={<Layout />}>
            {/* Public only routes: If already logged in, redirects to / */}
            <Route element={<PublicOnlyRoute />}>
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
            </Route>

            {/* Protected routes: When opening app, if not logged in, redirects to /login */}
            <Route element={<ProtectedRoute />}>
              <Route path="/" element={<App />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/profile/:username" element={<Profile />} />
              <Route path="/search" element={<Search />} />
              <Route path="/community" element={<Community />} />
              <Route path="/training" element={<TrainingGround />} />
              <Route path="/learn" element={<Learn />} />
              <Route path="/learn/:topicSlug/:subtopicSlug" element={<Learn />} />
              <Route path="/watch" element={<Watch />} />
              <Route path="/problem" element={<ProblemView />} />
              <Route path="/problems" element={<ProblemView />} />
              <Route path="/problem/:slug" element={<ProblemView />} />
              <Route path="/admin" element={<AdminPanel />} />
              <Route path="/:username" element={<Profile />} />
            </Route>

            {/* Catch-all fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
        </SocketProvider>
      </BrowserRouter>
    </AuthProvider>
  </React.StrictMode>,
)
