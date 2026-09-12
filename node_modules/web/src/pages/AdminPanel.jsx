import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

export default function AdminPanel() {
  const { user, token, login, logout } = useAuth();
  
  // Admin Login State (if unauthenticated or not admin)
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  // Problem management state
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDiff, setFilterDiff] = useState('all');

  // Create / Edit Modal State
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' or 'edit'
  const [activeModalTab, setActiveModalTab] = useState('info'); // 'info' or 'testcases'
  const [editingProblemId, setEditingProblemId] = useState(null);
  const [modalError, setModalError] = useState('');
  const [saving, setSaving] = useState(false);

  // Form Fields
  const [formTitle, setFormTitle] = useState('');
  const [formSlug, setFormSlug] = useState('');
  const [formDifficulty, setFormDifficulty] = useState('Easy');
  const [formPoints, setFormPoints] = useState(3);
  const [formStatus, setFormStatus] = useState('ACTIVE');
  const [formTags, setFormTags] = useState('Array, Hash Table');
  const [formDescription, setFormDescription] = useState('');
  const [formConstraints, setFormConstraints] = useState('');
  const [formFollowUp, setFormFollowUp] = useState('');
  const [formTimeLimit, setFormTimeLimit] = useState(2000);
  const [formMemoryLimit, setFormMemoryLimit] = useState(256);

  // Testcases in Form
  const [formExamples, setFormExamples] = useState([
    { input: 'nums = [2,7,11,15], target = 9', output: '[0,1]', explanation: 'Because nums[0] + nums[1] == 9' }
  ]);
  const [formHiddenTests, setFormHiddenTests] = useState([
    { input: 'nums = [3,3], target = 6', output: '[0,1]' }
  ]);

  const isAdmin = user && user.role === 'ADMIN';

  // Fetch problems from Admin API
  const fetchAdminProblems = async () => {
    const activeToken = token || localStorage.getItem('token');
    if (!activeToken) return;

    setLoading(true);
    try {
      const res = await axios.get('http://localhost:5000/api/problems/admin/all', {
        headers: { Authorization: `Bearer ${activeToken}` }
      });
      if (res.data) {
        setProblems(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch admin problems:', err);
      // Fallback: fetch public problems
      try {
        const fallbackRes = await axios.get('http://localhost:5000/api/problems');
        setProblems(fallbackRes.data || []);
      } catch {}
    } finally {
      setLoading(false);
    }
  };

  // Admin Tab: 'problems' | 'tournaments'
  const [activeAdminTab, setActiveAdminTab] = useState('problems');
  const [tournaments, setTournaments] = useState([]);
  const [tournamentsLoading, setTournamentsLoading] = useState(false);
  const [showTournamentModal, setShowTournamentModal] = useState(false);
  const [editingTournamentId, setEditingTournamentId] = useState(null);
  const [viewingLeaderboardTourney, setViewingLeaderboardTourney] = useState(null);

  const [tourneyTitle, setTourneyTitle] = useState('');
  const [tourneyDescription, setTourneyDescription] = useState('');
  const [tourneyMode, setTourneyMode] = useState('Blitz');
  const [tourneyTimeControl, setTourneyTimeControl] = useState('15 + 0');
  const [tourneyDuration, setTourneyDuration] = useState(15);
  const [tourneyStatus, setTourneyStatus] = useState('UPCOMING');
  const [tourneySelectedProblems, setTourneySelectedProblems] = useState([]);
  const [tourneyError, setTourneyError] = useState('');
  const [tourneySubmitting, setTourneySubmitting] = useState(false);

  // Fetch tournaments
  const fetchTournaments = async () => {
    setTournamentsLoading(true);
    try {
      const res = await axios.get('http://localhost:5000/api/tournaments');
      if (res.data) setTournaments(res.data);
    } catch (err) {
      console.error('Error fetching tournaments:', err);
    } finally {
      setTournamentsLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchAdminProblems();
      fetchTournaments();
    } else {
      setLoading(false);
    }
  }, [isAdmin, token]);

  const openCreateTourneyModal = () => {
    setEditingTournamentId(null);
    setTourneyTitle('');
    setTourneyDescription('Open practice arena tournament. Climb the rankings!');
    setTourneyMode('Blitz');
    setTourneyTimeControl('15 + 0');
    setTourneyDuration(15);
    setTourneyStatus('UPCOMING');
    setTourneySelectedProblems(problems.slice(0, 2).map(p => p.slug));
    setTourneyError('');
    setShowTournamentModal(true);
  };

  const openEditTourneyModal = (t) => {
    setEditingTournamentId(t._id);
    setTourneyTitle(t.title || '');
    setTourneyDescription(t.description || '');
    setTourneyMode(t.mode || 'Blitz');
    setTourneyTimeControl(t.timeControl || '15 + 0');
    setTourneyDuration(t.durationMinutes || 15);
    setTourneyStatus(t.status || 'UPCOMING');
    setTourneySelectedProblems(t.problems?.map(p => p.slug || p) || []);
    setTourneyError('');
    setShowTournamentModal(true);
  };

  const handleSaveTournament = async (e) => {
    e.preventDefault();
    if (!tourneyTitle.trim()) {
      setTourneyError('Tournament title is required');
      return;
    }
    const activeToken = token || localStorage.getItem('token');
    setTourneySubmitting(true);
    setTourneyError('');

    try {
      const payload = {
        title: tourneyTitle.trim(),
        description: tourneyDescription,
        mode: tourneyMode,
        timeControl: tourneyTimeControl,
        durationMinutes: parseInt(tourneyDuration, 10) || 15,
        status: tourneyStatus,
        problemSlugs: tourneySelectedProblems
      };

      if (editingTournamentId) {
        await axios.put(`http://localhost:5000/api/tournaments/${editingTournamentId}`, payload, {
          headers: { Authorization: `Bearer ${activeToken}` }
        });
      } else {
        await axios.post('http://localhost:5000/api/tournaments', payload, {
          headers: { Authorization: `Bearer ${activeToken}` }
        });
      }

      setShowTournamentModal(false);
      fetchTournaments();
    } catch (err) {
      setTourneyError(err.response?.data?.message || 'Error saving tournament');
    } finally {
      setTourneySubmitting(false);
    }
  };

  const handleUpdateTourneyStatus = async (tourneyId, newStatus) => {
    const activeToken = token || localStorage.getItem('token');
    try {
      await axios.put(`http://localhost:5000/api/tournaments/${tourneyId}`, { status: newStatus }, {
        headers: { Authorization: `Bearer ${activeToken}` }
      });
      fetchTournaments();
    } catch (err) {
      alert(err.response?.data?.message || 'Error updating tournament status');
    }
  };

  const handleDeleteTournament = async (tourneyId) => {
    if (!window.confirm('Are you sure you want to delete this tournament?')) return;
    const activeToken = token || localStorage.getItem('token');
    try {
      await axios.delete(`http://localhost:5000/api/tournaments/${tourneyId}`, {
        headers: { Authorization: `Bearer ${activeToken}` }
      });
      fetchTournaments();
    } catch (err) {
      alert(err.response?.data?.message || 'Error deleting tournament');
    }
  };

  // Handle Admin Login
  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    setLoginLoading(true);

    try {
      const res = await axios.post('http://localhost:5000/api/auth/login', {
        email: adminEmail,
        password: adminPassword
      });

      if (res.data?.token) {
        if (res.data.role !== 'ADMIN') {
          setLoginError('This account does not have Administrator privileges.');
          setLoginLoading(false);
          return;
        }
        await login(res.data.token, res.data);
      }
    } catch (err) {
      setLoginError(err.response?.data?.message || 'Invalid admin credentials');
    } finally {
      setLoginLoading(false);
    }
  };

  // Open Create Problem Modal
  const openCreateModal = () => {
    setModalMode('create');
    setEditingProblemId(null);
    setModalError('');
    setActiveModalTab('info');
    setFormTitle('');
    setFormSlug('');
    setFormDifficulty('Easy');
    setFormPoints(3);
    setFormStatus('ACTIVE');
    setFormTags('Array, Hash Table');
    setFormDescription('Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.');
    setFormConstraints('2 <= nums.length <= 10^4\n-10^9 <= nums[i] <= 10^9\n-10^9 <= target <= 10^9');
    setFormFollowUp('Can you come up with an algorithm that is less than O(n^2) time complexity?');
    setFormTimeLimit(2000);
    setFormMemoryLimit(256);
    setFormExamples([
      { input: 'nums = [2,7,11,15], target = 9', output: '[0,1]', explanation: 'Because nums[0] + nums[1] == 9, we return [0, 1].' }
    ]);
    setFormHiddenTests([
      { input: 'nums = [3,2,4], target = 6', output: '[1,2]' },
      { input: 'nums = [3,3], target = 6', output: '[0,1]' }
    ]);
    setShowModal(true);
  };

  // Open Edit Problem Modal
  const openEditModal = (p) => {
    setModalMode('edit');
    setEditingProblemId(p._id);
    setModalError('');
    setActiveModalTab('info');
    setFormTitle(p.title || '');
    setFormSlug(p.slug || '');
    setFormDifficulty(p.difficulty || 'Easy');
    setFormPoints(p.points || 3);
    setFormStatus(p.status || 'ACTIVE');
    setFormTags(Array.isArray(p.tags) ? p.tags.join(', ') : p.tags || '');
    setFormDescription(p.description || '');
    
    // Constraints formatting
    if (Array.isArray(p.constraints)) {
      setFormConstraints(p.constraints.join('\n'));
    } else {
      setFormConstraints(p.constraints || '');
    }

    setFormFollowUp(p.followUp || '');
    setFormTimeLimit(p.timeLimit || 2000);
    setFormMemoryLimit(p.memoryLimit || 256);

    setFormExamples(p.examples && p.examples.length > 0 ? p.examples : [
      { input: 'nums = [2,7,11,15], target = 9', output: '[0,1]', explanation: '' }
    ]);

    setFormHiddenTests(p.hiddenTestCases && p.hiddenTestCases.length > 0 ? p.hiddenTestCases : [
      { input: 'nums = [3,2,4], target = 6', output: '[1,2]' }
    ]);

    setShowModal(true);
  };

  // Auto-generate slug when title changes in create mode
  const handleTitleChange = (val) => {
    setFormTitle(val);
    if (modalMode === 'create') {
      const generatedSlug = val
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');
      setFormSlug(generatedSlug);
    }
  };

  // Test case handlers
  const handleAddExample = () => {
    setFormExamples(prev => [...prev, { input: '', output: '', explanation: '' }]);
  };

  const handleUpdateExample = (idx, field, value) => {
    setFormExamples(prev => prev.map((ex, i) => i === idx ? { ...ex, [field]: value } : ex));
  };

  const handleDeleteExample = (idx) => {
    if (formExamples.length <= 1) return;
    setFormExamples(prev => prev.filter((_, i) => i !== idx));
  };

  const handleAddHiddenTest = () => {
    setFormHiddenTests(prev => [...prev, { input: '', output: '' }]);
  };

  const handleUpdateHiddenTest = (idx, field, value) => {
    setFormHiddenTests(prev => prev.map((tc, i) => i === idx ? { ...tc, [field]: value } : tc));
  };

  const handleDeleteHiddenTest = (idx) => {
    setFormHiddenTests(prev => prev.filter((_, i) => i !== idx));
  };

  // Save Problem (Create or Update)
  const handleSaveProblem = async (e) => {
    e.preventDefault();
    setModalError('');
    setSaving(true);

    const activeToken = token || localStorage.getItem('token');
    if (!activeToken) {
      setModalError('Session expired. Please log in again.');
      setSaving(false);
      return;
    }

    if (!formTitle.trim() || !formSlug.trim() || !formDescription.trim()) {
      setModalError('Title, slug, and description are required.');
      setSaving(false);
      return;
    }

    // Split tags & constraints
    const tagsArray = formTags.split(',').map(t => t.trim()).filter(Boolean);
    const constraintsArray = formConstraints.split('\n').map(c => c.trim()).filter(Boolean);

    const payload = {
      title: formTitle.trim(),
      slug: formSlug.trim(),
      difficulty: formDifficulty,
      points: Number(formPoints),
      status: formStatus,
      tags: tagsArray,
      description: formDescription.trim(),
      constraints: constraintsArray,
      followUp: formFollowUp.trim(),
      timeLimit: Number(formTimeLimit),
      memoryLimit: Number(formMemoryLimit),
      examples: formExamples.filter(e => e.input && e.output),
      visibleTestCases: formExamples.filter(e => e.input && e.output),
      hiddenTestCases: formHiddenTests.filter(e => e.input && e.output)
    };

    try {
      if (modalMode === 'create') {
        const res = await axios.post('http://localhost:5000/api/problems', payload, {
          headers: { Authorization: `Bearer ${activeToken}` }
        });
        if (res.data) {
          setProblems(prev => [res.data, ...prev]);
          setShowModal(false);
        }
      } else {
        const res = await axios.put(`http://localhost:5000/api/problems/${editingProblemId}`, payload, {
          headers: { Authorization: `Bearer ${activeToken}` }
        });
        if (res.data) {
          setProblems(prev => prev.map(p => p._id === editingProblemId ? res.data : p));
          setShowModal(false);
        }
      }
    } catch (err) {
      setModalError(err.response?.data?.message || err.message || 'Failed to save problem');
    } finally {
      setSaving(false);
    }
  };

  // Toggle Problem Status (Active <-> Draft)
  const handleToggleStatus = async (p) => {
    const activeToken = token || localStorage.getItem('token');
    const newStatus = p.status === 'ACTIVE' ? 'DRAFT' : 'ACTIVE';

    try {
      const res = await axios.put(`http://localhost:5000/api/problems/${p._id}`, { status: newStatus }, {
        headers: { Authorization: `Bearer ${activeToken}` }
      });
      if (res.data) {
        setProblems(prev => prev.map(item => item._id === p._id ? { ...item, status: newStatus } : item));
      }
    } catch (err) {
      alert('Error toggling problem status: ' + (err.response?.data?.message || err.message));
    }
  };

  // Delete Problem
  const handleDeleteProblem = async (p) => {
    if (!window.confirm(`Are you sure you want to delete problem "${p.title}"?`)) return;

    const activeToken = token || localStorage.getItem('token');
    try {
      await axios.delete(`http://localhost:5000/api/problems/${p._id}`, {
        headers: { Authorization: `Bearer ${activeToken}` }
      });
      setProblems(prev => prev.filter(item => item._id !== p._id));
    } catch (err) {
      alert('Error deleting problem: ' + (err.response?.data?.message || err.message));
    }
  };

  // Helper badge for difficulty
  const getDiffBadge = (diff) => {
    switch (diff?.toLowerCase()) {
      case 'easy':
        return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
      case 'medium':
        return 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30';
      case 'hard':
        return 'bg-red-500/15 text-red-400 border-red-500/30';
      default:
        return 'bg-white/10 text-white/70 border-white/10';
    }
  };

  // Filtered problems
  const filteredProblems = problems.filter(p => {
    const matchSearch = p.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.slug?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchDiff = filterDiff === 'all' || p.difficulty?.toLowerCase() === filterDiff;
    return matchSearch && matchDiff;
  });

  // IF USER IS NOT LOGGED IN AS ADMIN
  if (!isAdmin) {
    return (
      <div className="flex-1 flex items-center justify-center p-6 bg-[#161512]">
        <div className="bg-[#21201d] border border-white/10 rounded-2xl p-8 max-w-md w-full shadow-2xl space-y-6">
          <div className="text-center space-y-2">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-600 to-yellow-400 flex items-center justify-center text-3xl mx-auto shadow-lg">
              🛡️
            </div>
            <h1 className="text-2xl font-black text-white">Admin Control Portal</h1>
            <p className="text-xs text-[#8c8b88]">
              {user ? `Logged in as @${user.username} (Standard User). Administrator credentials required.` : 'Enter administrator credentials to access problem management.'}
            </p>
          </div>

          {loginError && (
            <div className="bg-red-500/15 border border-red-500/30 rounded-xl p-3 text-xs text-red-400 font-medium text-center">
              {loginError}
            </div>
          )}

          <form onSubmit={handleAdminLogin} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-white/80 block mb-1.5">Admin Email</label>
              <input
                type="email"
                required
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                placeholder="admin@dsabattle.com"
                className="w-full bg-[#161512] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#81b64c] transition"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-white/80 block mb-1.5">Admin Password</label>
              <input
                type="password"
                required
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#161512] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#81b64c] transition"
              />
            </div>

            <button
              type="submit"
              disabled={loginLoading}
              className="w-full bg-[#81b64c] hover:bg-[#92c55b] text-white font-bold py-3 rounded-xl shadow-lg transition duration-150 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
            >
              {loginLoading ? 'Authenticating...' : 'Sign In to Admin Portal'}
            </button>
          </form>

          <div className="pt-4 border-t border-white/5 text-center text-xs text-[#8c8b88]">
            Default Admin account: <strong className="text-white">admin@dsabattle.com</strong> / <strong className="text-white">admin123</strong>
          </div>
        </div>
      </div>
    );
  }

  // ADMIN DASHBOARD VIEW
  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#161512] overflow-y-auto">
      {/* Top Banner */}
      <div className="bg-[#1f1e1b] border-b border-[#2d2a26] p-6 shrink-0">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-amber-600 to-yellow-400 flex items-center justify-center text-2xl shadow-md">
              {activeAdminTab === 'problems' ? '🛡️' : '🏅'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black text-white">
                  {activeAdminTab === 'problems' ? 'Admin Problem Studio' : 'Arena Tournament Manager'}
                </h1>
                <span className="bg-[#81b64c]/20 text-[#81b64c] text-[10px] font-extrabold px-2 py-0.5 rounded uppercase tracking-wider border border-[#81b64c]/30">
                  Verified Admin
                </span>
              </div>
              <p className="text-xs text-[#8c8b88] mt-0.5">
                {activeAdminTab === 'problems'
                  ? 'Create problems, configure testcases, constraints, and manage contest curriculum.'
                  : 'Host open practice arena tournaments, assign problems, and inspect player standings.'}
              </p>
            </div>
          </div>

          {activeAdminTab === 'problems' ? (
            <button
              onClick={openCreateModal}
              className="bg-[#81b64c] hover:bg-[#92c55b] text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-lg transition flex items-center gap-2 cursor-pointer"
            >
              <span className="text-base leading-none">+</span>
              <span>Create New Problem</span>
            </button>
          ) : (
            <button
              onClick={openCreateTourneyModal}
              className="bg-[#81b64c] hover:bg-[#92c55b] text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-lg transition flex items-center gap-2 cursor-pointer"
            >
              <span className="text-base leading-none">+</span>
              <span>Schedule Tournament</span>
            </button>
          )}
        </div>

        {/* Tab Switcher */}
        <div className="max-w-7xl mx-auto flex items-center gap-3 mt-5 border-t border-white/5 pt-4">
          <button
            type="button"
            onClick={() => setActiveAdminTab('problems')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeAdminTab === 'problems'
                ? 'bg-[#81b64c] text-white shadow-lg shadow-[#81b64c]/20'
                : 'bg-[#262421] text-[#8c8b88] hover:text-white hover:bg-[#302d29] border border-white/5'
            }`}
          >
            <span>📚</span>
            <span>Problem Studio ({problems.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveAdminTab('tournaments')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeAdminTab === 'tournaments'
                ? 'bg-[#81b64c] text-white shadow-lg shadow-[#81b64c]/20'
                : 'bg-[#262421] text-[#8c8b88] hover:text-white hover:bg-[#302d29] border border-white/5'
            }`}
          >
            <span>🏅</span>
            <span>Tournament Manager ({tournaments.length})</span>
          </button>
        </div>

        {/* Statistics Bar */}
        {activeAdminTab === 'problems' ? (
          <div className="max-w-7xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
            <div className="bg-[#262421] border border-white/5 rounded-xl p-3.5 flex items-center justify-between">
              <div>
                <div className="text-[11px] text-[#8c8b88] font-bold uppercase tracking-wider">Total Problems</div>
                <div className="text-xl font-black text-white mt-0.5">{problems.length}</div>
              </div>
              <span className="text-2xl">📚</span>
            </div>

            <div className="bg-[#262421] border border-white/5 rounded-xl p-3.5 flex items-center justify-between">
              <div>
                <div className="text-[11px] text-[#8c8b88] font-bold uppercase tracking-wider">Active Problems</div>
                <div className="text-xl font-black text-[#81b64c] mt-0.5">
                  {problems.filter(p => p.status === 'ACTIVE').length}
                </div>
              </div>
              <span className="text-2xl">✅</span>
            </div>

            <div className="bg-[#262421] border border-white/5 rounded-xl p-3.5 flex items-center justify-between">
              <div>
                <div className="text-[11px] text-[#8c8b88] font-bold uppercase tracking-wider">Draft Problems</div>
                <div className="text-xl font-black text-yellow-400 mt-0.5">
                  {problems.filter(p => p.status === 'DRAFT').length}
                </div>
              </div>
              <span className="text-2xl">📝</span>
            </div>

            <div className="bg-[#262421] border border-white/5 rounded-xl p-3.5 flex items-center justify-between">
              <div>
                <div className="text-[11px] text-[#8c8b88] font-bold uppercase tracking-wider">Total Test Cases</div>
                <div className="text-xl font-black text-white mt-0.5">
                  {problems.reduce((acc, p) => acc + (p.examples?.length || 0) + (p.hiddenTestCases?.length || 0), 0)}
                </div>
              </div>
              <span className="text-2xl">🧪</span>
            </div>
          </div>
        ) : (
          <div className="max-w-7xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
            <div className="bg-[#262421] border border-white/5 rounded-xl p-3.5 flex items-center justify-between">
              <div>
                <div className="text-[11px] text-[#8c8b88] font-bold uppercase tracking-wider">Total Arenas</div>
                <div className="text-xl font-black text-white mt-0.5">{tournaments.length}</div>
              </div>
              <span className="text-2xl">🏆</span>
            </div>

            <div className="bg-[#262421] border border-white/5 rounded-xl p-3.5 flex items-center justify-between">
              <div>
                <div className="text-[11px] text-[#8c8b88] font-bold uppercase tracking-wider">Active Arenas</div>
                <div className="text-xl font-black text-[#81b64c] mt-0.5">
                  {tournaments.filter(t => t.status === 'ACTIVE').length}
                </div>
              </div>
              <span className="text-2xl">⚡</span>
            </div>

            <div className="bg-[#262421] border border-white/5 rounded-xl p-3.5 flex items-center justify-between">
              <div>
                <div className="text-[11px] text-[#8c8b88] font-bold uppercase tracking-wider">Upcoming Arenas</div>
                <div className="text-xl font-black text-yellow-400 mt-0.5">
                  {tournaments.filter(t => t.status === 'UPCOMING').length}
                </div>
              </div>
              <span className="text-2xl">⏳</span>
            </div>

            <div className="bg-[#262421] border border-white/5 rounded-xl p-3.5 flex items-center justify-between">
              <div>
                <div className="text-[11px] text-[#8c8b88] font-bold uppercase tracking-wider">Completed</div>
                <div className="text-xl font-black text-[#38bdf8] mt-0.5">
                  {tournaments.filter(t => t.status === 'COMPLETED').length}
                </div>
              </div>
              <span className="text-2xl">🏁</span>
            </div>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto w-full p-6 space-y-6">
        {activeAdminTab === 'problems' ? (
          <>
            {/* Search & Filters */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#1e1d1a] border border-[#2d2a26] p-3.5 rounded-2xl">
              <div className="w-full sm:w-80">
                <input
                  type="text"
                  placeholder="Search problems by title or slug..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-[#161512] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#81b64c] transition"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <span className="text-xs text-[#8c8b88] font-bold">Difficulty:</span>
                <select
                  value={filterDiff}
                  onChange={(e) => setFilterDiff(e.target.value)}
                  className="bg-[#161512] text-white text-xs border border-white/10 rounded-xl px-3 py-2 focus:outline-none focus:border-[#81b64c] cursor-pointer"
                >
                  <option value="all">All Difficulties</option>
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>
            </div>

            {/* Problems List Table */}
            <div className="bg-[#1e1d1a] border border-[#2d2a26] rounded-2xl overflow-hidden shadow-md">
              {loading ? (
                <div className="p-12 text-center text-xs text-[#8c8b88]">Loading problems from database...</div>
              ) : filteredProblems.length === 0 ? (
                <div className="p-12 text-center space-y-3">
                  <div className="text-3xl">🔍</div>
                  <p className="text-sm font-bold text-white">No problems found</p>
                  <p className="text-xs text-[#8c8b88]">Try adjusting your search query or create a new problem.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-[#262421] text-[#8c8b88] border-b border-white/5 font-bold uppercase tracking-wider text-[11px]">
                        <th className="py-3 px-4">Problem</th>
                        <th className="py-3 px-3">Difficulty</th>
                        <th className="py-3 px-3">Points</th>
                        <th className="py-3 px-4">Tags</th>
                        <th className="py-3 px-3">Test Cases</th>
                        <th className="py-3 px-3">Status</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 font-medium">
                      {filteredProblems.map((p) => (
                        <tr key={p._id} className="hover:bg-white/[0.02] transition">
                          <td className="py-3.5 px-4">
                            <Link
                              to={`/problem/${p.slug}`}
                              className="font-bold text-white hover:text-[#81b64c] transition block truncate max-w-xs"
                            >
                              {p.title}
                            </Link>
                            <span className="text-[11px] text-[#8c8b88] font-mono">{p.slug}</span>
                          </td>

                          <td className="py-3.5 px-3">
                            <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${getDiffBadge(p.difficulty)}`}>
                              {p.difficulty}
                            </span>
                          </td>

                          <td className="py-3.5 px-3 text-white font-mono font-bold">
                            +{p.points || 3} pts
                          </td>

                          <td className="py-3.5 px-4">
                            <div className="flex flex-wrap gap-1 max-w-xs">
                              {p.tags && (Array.isArray(p.tags) ? p.tags : [p.tags]).slice(0, 3).map((tag, i) => (
                                <span key={i} className="bg-[#2b2926] text-white/70 text-[10px] px-2 py-0.5 rounded border border-white/5">
                                  #{tag}
                                </span>
                              ))}
                            </div>
                          </td>

                          <td className="py-3.5 px-3 text-white font-mono">
                            <span className="text-[#81b64c] font-bold">
                              {(p.examples?.length || 0)} sample
                            </span>
                            {p.hiddenTestCases?.length > 0 && (
                              <span className="text-white/40 ml-1">
                                + {p.hiddenTestCases.length} hidden
                              </span>
                            )}
                          </td>

                          <td className="py-3.5 px-3">
                            <button
                              onClick={() => handleToggleStatus(p)}
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold cursor-pointer transition border ${
                                p.status === 'ACTIVE'
                                  ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                                  : 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30'
                              }`}
                            >
                              {p.status || 'ACTIVE'}
                            </button>
                          </td>

                          <td className="py-3.5 px-4 text-right space-x-2">
                            <button
                              onClick={() => openEditModal(p)}
                              className="bg-[#2b2926] hover:bg-[#383531] text-white px-2.5 py-1 rounded-lg border border-white/10 transition cursor-pointer font-bold text-[11px]"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteProblem(p)}
                              className="bg-red-500/15 hover:bg-red-500/25 text-red-400 px-2.5 py-1 rounded-lg border border-red-500/30 transition cursor-pointer font-bold text-[11px]"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            {/* Tournaments Management Table */}
            <div className="bg-[#1e1d1a] border border-[#2d2a26] rounded-2xl overflow-hidden shadow-md">
              <div className="p-4 border-b border-white/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-[#262421]">
                <div>
                  <h2 className="text-sm font-black text-white flex items-center gap-2">
                    <span>🏆</span>
                    <span>Scheduled Practice Tournaments</span>
                  </h2>
                  <p className="text-[11px] text-[#8c8b88] mt-0.5">
                    Tournaments appear on the Home Arena modal. Participants can practice, climb rankings, and view final leaderboards.
                  </p>
                </div>
                <button
                  onClick={openCreateTourneyModal}
                  className="bg-[#81b64c] hover:bg-[#92c55b] text-white text-xs font-bold px-4 py-2 rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <span>+</span>
                  <span>New Tournament</span>
                </button>
              </div>

              {tournamentsLoading ? (
                <div className="p-12 text-center text-xs text-[#8c8b88]">Loading tournaments...</div>
              ) : tournaments.length === 0 ? (
                <div className="p-12 text-center space-y-3">
                  <div className="text-3xl">🏅</div>
                  <p className="text-sm font-bold text-white">No tournaments created yet</p>
                  <p className="text-xs text-[#8c8b88] max-w-md mx-auto">
                    Create a tournament with custom problems, time controls, and duration. Users can register and enter from the Arena Tournaments modal on the Home page.
                  </p>
                  <button
                    onClick={openCreateTourneyModal}
                    className="bg-[#81b64c] hover:bg-[#92c55b] text-white text-xs font-bold px-4 py-2 rounded-xl transition cursor-pointer inline-block"
                  >
                    + Schedule First Tournament
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-[#262421] text-[#8c8b88] border-b border-white/5 font-bold uppercase tracking-wider text-[11px]">
                        <th className="py-3 px-4">Tournament</th>
                        <th className="py-3 px-3">Format / Mode</th>
                        <th className="py-3 px-3">Duration</th>
                        <th className="py-3 px-4">Problems</th>
                        <th className="py-3 px-3">Participants</th>
                        <th className="py-3 px-3">Status</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 font-medium">
                      {tournaments.map((t) => (
                        <tr key={t._id} className="hover:bg-white/[0.02] transition">
                          <td className="py-3.5 px-4">
                            <span className="font-bold text-white block truncate max-w-xs">{t.title}</span>
                            <span className="text-[11px] text-[#8c8b88] block truncate max-w-xs">{t.description || 'Open practice arena'}</span>
                            <span className="text-[10px] text-white/40 block mt-0.5 font-mono">
                              Rating: Unrated (Practice Only)
                            </span>
                          </td>

                          <td className="py-3.5 px-3">
                            <span className="bg-[#2b2926] text-[#81b64c] font-bold px-2.5 py-1 rounded-lg border border-white/5 text-[11px]">
                              {t.timeControl || '15 + 0'} ({t.mode || 'Blitz'})
                            </span>
                          </td>

                          <td className="py-3.5 px-3 text-white font-mono">
                            {t.durationMinutes || 15} mins
                          </td>

                          <td className="py-3.5 px-4">
                            <div className="flex flex-wrap gap-1 max-w-xs">
                              {t.problems && t.problems.length > 0 ? (
                                t.problems.map((prob, idx) => {
                                  const s = typeof prob === 'string' ? prob : prob.slug || prob.title;
                                  return (
                                    <span key={idx} className="bg-[#262421] text-white/80 text-[10px] px-2 py-0.5 rounded border border-white/5 font-mono">
                                      {s}
                                    </span>
                                  );
                                })
                              ) : (
                                <span className="text-[#8c8b88] text-[11px]">No problems selected</span>
                              )}
                            </div>
                          </td>

                          <td className="py-3.5 px-3">
                            <span className="bg-[#262421] text-white px-2.5 py-1 rounded-lg border border-white/5 text-[11px] font-bold">
                              👥 {t.participants?.length || 0}
                            </span>
                          </td>

                          <td className="py-3.5 px-3">
                            <select
                              value={t.status || 'UPCOMING'}
                              onChange={(e) => handleUpdateTourneyStatus(t._id, e.target.value)}
                              className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border cursor-pointer focus:outline-none ${
                                t.status === 'ACTIVE'
                                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                                  : t.status === 'COMPLETED'
                                  ? 'bg-sky-500/20 text-sky-400 border-sky-500/40'
                                  : 'bg-yellow-500/20 text-yellow-400 border-yellow-500/40'
                              }`}
                            >
                              <option value="UPCOMING" className="bg-[#1f1e1b] text-yellow-400">UPCOMING</option>
                              <option value="ACTIVE" className="bg-[#1f1e1b] text-emerald-400">ACTIVE</option>
                              <option value="COMPLETED" className="bg-[#1f1e1b] text-sky-400">COMPLETED</option>
                            </select>
                          </td>

                          <td className="py-3.5 px-4 text-right space-x-2">
                            <button
                              onClick={() => setViewingLeaderboardTourney(t)}
                              className="bg-amber-500/15 hover:bg-amber-500/25 text-amber-400 px-2.5 py-1 rounded-lg border border-amber-500/30 transition cursor-pointer font-bold text-[11px]"
                            >
                              🏆 Standings
                            </button>
                            <button
                              onClick={() => openEditTourneyModal(t)}
                              className="bg-[#2b2926] hover:bg-[#383531] text-white px-2.5 py-1 rounded-lg border border-white/10 transition cursor-pointer font-bold text-[11px]"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteTournament(t._id)}
                              className="bg-red-500/15 hover:bg-red-500/25 text-red-400 px-2.5 py-1 rounded-lg border border-red-500/30 transition cursor-pointer font-bold text-[11px]"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* CREATE / EDIT PROBLEM MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#1f1e1b] border border-white/10 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in duration-150">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-[#2d2a26] flex items-center justify-between shrink-0 bg-[#262421]">
              <div className="flex items-center gap-2">
                <span className="text-xl">⚙️</span>
                <h2 className="text-base sm:text-lg font-black text-white">
                  {modalMode === 'create' ? 'Create New Problem' : `Edit Problem: ${formTitle}`}
                </h2>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-white/50 hover:text-white text-lg font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Navigation Tabs */}
            <div className="flex border-b border-[#2d2a26] bg-[#1a1916] shrink-0 text-xs font-bold">
              <button
                onClick={() => setActiveModalTab('info')}
                className={`flex-1 py-3 border-b-2 cursor-pointer transition ${
                  activeModalTab === 'info'
                    ? 'border-[#81b64c] text-white bg-white/[0.02]'
                    : 'border-transparent text-[#8c8b88] hover:text-white'
                }`}
              >
                1. Problem Details & Constraints
              </button>
              <button
                onClick={() => setActiveModalTab('testcases')}
                className={`flex-1 py-3 border-b-2 cursor-pointer transition ${
                  activeModalTab === 'testcases'
                    ? 'border-[#81b64c] text-white bg-white/[0.02]'
                    : 'border-transparent text-[#8c8b88] hover:text-white'
                }`}
              >
                2. Test Cases Manager ({formExamples.length} sample, {formHiddenTests.length} hidden)
              </button>
            </div>

            {modalError && (
              <div className="bg-red-500/15 border-b border-red-500/30 p-3 text-xs text-red-400 font-medium text-center">
                {modalError}
              </div>
            )}

            {/* Modal Form Content */}
            <form onSubmit={handleSaveProblem} className="flex-1 overflow-y-auto p-6 space-y-5">
              {activeModalTab === 'info' ? (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-white/90 block mb-1">Problem Title *</label>
                      <input
                        type="text"
                        required
                        value={formTitle}
                        onChange={(e) => handleTitleChange(e.target.value)}
                        placeholder="e.g. Reverse Linked List"
                        className="w-full bg-[#161512] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#81b64c]"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-white/90 block mb-1">Slug (URL identifier) *</label>
                      <input
                        type="text"
                        required
                        value={formSlug}
                        onChange={(e) => setFormSlug(e.target.value)}
                        placeholder="e.g. reverse-linked-list"
                        className="w-full bg-[#161512] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white font-mono focus:outline-none focus:border-[#81b64c]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="text-xs font-bold text-white/90 block mb-1">Difficulty</label>
                      <select
                        value={formDifficulty}
                        onChange={(e) => setFormDifficulty(e.target.value)}
                        className="w-full bg-[#161512] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#81b64c]"
                      >
                        <option value="Easy">Easy</option>
                        <option value="Medium">Medium</option>
                        <option value="Hard">Hard</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-white/90 block mb-1">Points</label>
                      <input
                        type="number"
                        min="1"
                        max="20"
                        value={formPoints}
                        onChange={(e) => setFormPoints(e.target.value)}
                        className="w-full bg-[#161512] border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-[#81b64c]"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-white/90 block mb-1">Status</label>
                      <select
                        value={formStatus}
                        onChange={(e) => setFormStatus(e.target.value)}
                        className="w-full bg-[#161512] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#81b64c]"
                      >
                        <option value="ACTIVE">ACTIVE</option>
                        <option value="DRAFT">DRAFT</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-white/90 block mb-1">Topic Tags (comma-separated)</label>
                    <input
                      type="text"
                      value={formTags}
                      onChange={(e) => setFormTags(e.target.value)}
                      placeholder="e.g. Array, Hash Table, Two Pointers"
                      className="w-full bg-[#161512] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#81b64c]"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-white/90 block mb-1">Problem Description (Markdown / Text) *</label>
                    <textarea
                      required
                      rows={5}
                      value={formDescription}
                      onChange={(e) => setFormDescription(e.target.value)}
                      placeholder="Write full problem description statement..."
                      className="w-full bg-[#161512] border border-white/10 rounded-xl p-3 text-xs text-white font-sans focus:outline-none focus:border-[#81b64c] resize-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-white/90 block mb-1">
                      Constraints (One bullet per line, e.g. input size bounds)
                    </label>
                    <textarea
                      rows={3}
                      value={formConstraints}
                      onChange={(e) => setFormConstraints(e.target.value)}
                      placeholder="2 <= nums.length <= 10^4&#10;-10^9 <= nums[i] <= 10^9"
                      className="w-full bg-[#161512] border border-white/10 rounded-xl p-3 text-xs text-white font-mono focus:outline-none focus:border-[#81b64c] resize-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-white/90 block mb-1">Follow-up Challenge (optional)</label>
                    <input
                      type="text"
                      value={formFollowUp}
                      onChange={(e) => setFormFollowUp(e.target.value)}
                      placeholder="e.g. Can you solve this in O(n) runtime complexity?"
                      className="w-full bg-[#161512] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#81b64c]"
                    />
                  </div>
                </>
              ) : (
                <>
                  {/* TAB 2: TEST CASES MANAGER */}
                  <div className="space-y-6">
                    {/* Sample Test Cases */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                            Sample Visible Test Cases ({formExamples.length})
                          </h3>
                          <p className="text-[11px] text-[#8c8b88]">
                            Displayed on problem statement page and evaluated on "Run Code".
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={handleAddExample}
                          className="bg-[#2b2926] hover:bg-[#383531] text-white text-xs px-3 py-1.5 rounded-lg border border-white/10 transition cursor-pointer font-bold"
                        >
                          + Add Sample Case
                        </button>
                      </div>

                      <div className="space-y-3">
                        {formExamples.map((ex, idx) => (
                          <div key={idx} className="bg-[#181714] border border-white/10 rounded-xl p-3.5 space-y-2">
                            <div className="flex items-center justify-between text-[11px] font-bold text-white/70">
                              <span>Example {idx + 1}</span>
                              {formExamples.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => handleDeleteExample(idx)}
                                  className="text-red-400 hover:text-red-300 cursor-pointer"
                                >
                                  Remove
                                </button>
                              )}
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 font-mono text-xs">
                              <div>
                                <label className="text-[10px] text-[#8c8b88] block mb-0.5">Input Parameters</label>
                                <input
                                  type="text"
                                  required
                                  value={ex.input}
                                  onChange={(e) => handleUpdateExample(idx, 'input', e.target.value)}
                                  placeholder="nums = [2,7,11,15], target = 9"
                                  className="w-full bg-[#100f0d] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#81b64c]"
                                />
                              </div>

                              <div>
                                <label className="text-[10px] text-[#8c8b88] block mb-0.5">Expected Output</label>
                                <input
                                  type="text"
                                  required
                                  value={ex.output}
                                  onChange={(e) => handleUpdateExample(idx, 'output', e.target.value)}
                                  placeholder="[0,1]"
                                  className="w-full bg-[#100f0d] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-[#81b64c] font-bold focus:outline-none focus:border-[#81b64c]"
                                />
                              </div>
                            </div>

                            <div>
                              <label className="text-[10px] text-[#8c8b88] block mb-0.5">Explanation (optional)</label>
                              <input
                                type="text"
                                value={ex.explanation || ''}
                                onChange={(e) => handleUpdateExample(idx, 'explanation', e.target.value)}
                                placeholder="Because nums[0] + nums[1] == 9, we return [0, 1]."
                                className="w-full bg-[#100f0d] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white/80 font-sans focus:outline-none focus:border-[#81b64c]"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Hidden Test Cases */}
                    <div className="space-y-3 pt-4 border-t border-white/10">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                            Hidden Contest Test Cases ({formHiddenTests.length})
                          </h3>
                          <p className="text-[11px] text-[#8c8b88]">
                            Hidden from problem description; rigorously evaluated on "Submit Solution".
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={handleAddHiddenTest}
                          className="bg-[#2b2926] hover:bg-[#383531] text-white text-xs px-3 py-1.5 rounded-lg border border-white/10 transition cursor-pointer font-bold"
                        >
                          + Add Hidden Case
                        </button>
                      </div>

                      <div className="space-y-3">
                        {formHiddenTests.map((tc, idx) => (
                          <div key={idx} className="bg-[#181714] border border-white/10 rounded-xl p-3.5 space-y-2">
                            <div className="flex items-center justify-between text-[11px] font-bold text-white/70">
                              <span>Hidden Case {idx + 1}</span>
                              <button
                                type="button"
                                onClick={() => handleDeleteHiddenTest(idx)}
                                className="text-red-400 hover:text-red-300 cursor-pointer"
                              >
                                Remove
                              </button>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 font-mono text-xs">
                              <div>
                                <label className="text-[10px] text-[#8c8b88] block mb-0.5">Input</label>
                                <input
                                  type="text"
                                  required
                                  value={tc.input}
                                  onChange={(e) => handleUpdateHiddenTest(idx, 'input', e.target.value)}
                                  placeholder="nums = [3,3], target = 6"
                                  className="w-full bg-[#100f0d] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#81b64c]"
                                />
                              </div>

                              <div>
                                <label className="text-[10px] text-[#8c8b88] block mb-0.5">Expected Output</label>
                                <input
                                  type="text"
                                  required
                                  value={tc.output}
                                  onChange={(e) => handleUpdateHiddenTest(idx, 'output', e.target.value)}
                                  placeholder="[0,1]"
                                  className="w-full bg-[#100f0d] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-[#81b64c] font-bold focus:outline-none focus:border-[#81b64c]"
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Modal Action Buttons */}
              <div className="pt-4 border-t border-[#2d2a26] flex items-center justify-end gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="bg-[#262421] hover:bg-[#302d29] text-white text-xs font-bold px-4 py-2.5 rounded-xl border border-white/10 transition cursor-pointer"
                >
                  Cancel
                </button>

                {activeModalTab === 'info' ? (
                  <button
                    type="button"
                    onClick={() => setActiveModalTab('testcases')}
                    className="bg-[#81b64c] hover:bg-[#92c55b] text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-md transition cursor-pointer"
                  >
                    Next: Test Cases →
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={saving}
                    className="bg-[#81b64c] hover:bg-[#92c55b] text-white text-xs font-bold px-6 py-2.5 rounded-xl shadow-md transition disabled:opacity-50 cursor-pointer"
                  >
                    {saving ? 'Saving...' : modalMode === 'create' ? 'Save & Create Problem' : 'Save Changes'}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE / EDIT TOURNAMENT MODAL */}
      {showTournamentModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#1f1e1b] border border-white/10 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in duration-150">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-[#2d2a26] flex items-center justify-between shrink-0 bg-[#262421]">
              <div className="flex items-center gap-2">
                <span className="text-xl">🏆</span>
                <h2 className="text-base sm:text-lg font-black text-white">
                  {editingTournamentId ? 'Edit Arena Tournament' : 'Schedule New Arena Tournament'}
                </h2>
              </div>
              <button
                onClick={() => setShowTournamentModal(false)}
                className="text-white/50 hover:text-white text-lg font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveTournament} className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
              {tourneyError && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded-xl">
                  {tourneyError}
                </div>
              )}

              {/* Title & Mode */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[#8c8b88] font-bold block mb-1">Tournament Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Weekly Speed Contest 519"
                    value={tourneyTitle}
                    onChange={(e) => setTourneyTitle(e.target.value)}
                    className="w-full bg-[#161512] border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#81b64c]"
                  />
                </div>

                <div>
                  <label className="text-[#8c8b88] font-bold block mb-1">Challenge Category / Mode</label>
                  <select
                    value={tourneyMode}
                    onChange={(e) => setTourneyMode(e.target.value)}
                    className="w-full bg-[#161512] border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#81b64c] cursor-pointer"
                  >
                    <option value="Bullet">Bullet</option>
                    <option value="Blitz">Blitz</option>
                    <option value="Rapid">Rapid</option>
                    <option value="Classical">Classical</option>
                    <option value="Custom">Custom</option>
                  </select>
                </div>
              </div>

              {/* Time Control & Duration & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[#8c8b88] font-bold block mb-1">Time Control</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 15 + 0 or 3+0 Blitz"
                    value={tourneyTimeControl}
                    onChange={(e) => setTourneyTimeControl(e.target.value)}
                    className="w-full bg-[#161512] border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#81b64c]"
                  />
                </div>

                <div>
                  <label className="text-[#8c8b88] font-bold block mb-1">Duration (Minutes)</label>
                  <input
                    type="number"
                    min="1"
                    max="1440"
                    required
                    value={tourneyDuration}
                    onChange={(e) => setTourneyDuration(e.target.value)}
                    className="w-full bg-[#161512] border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#81b64c]"
                  />
                </div>

                <div>
                  <label className="text-[#8c8b88] font-bold block mb-1">Status</label>
                  <select
                    value={tourneyStatus}
                    onChange={(e) => setTourneyStatus(e.target.value)}
                    className="w-full bg-[#161512] border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#81b64c] cursor-pointer"
                  >
                    <option value="UPCOMING">UPCOMING (Registration Open)</option>
                    <option value="ACTIVE">ACTIVE (Contest Live)</option>
                    <option value="COMPLETED">COMPLETED (Rankings Finalized)</option>
                  </select>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="text-[#8c8b88] font-bold block mb-1">Description / Rules</label>
                <textarea
                  rows={2}
                  placeholder="Open arena practice tournament for honing algorithms and speed..."
                  value={tourneyDescription}
                  onChange={(e) => setTourneyDescription(e.target.value)}
                  className="w-full bg-[#161512] border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#81b64c]"
                />
              </div>

              {/* Problem Selection */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[#8c8b88] font-bold block">
                    Select Problems Included ({tourneySelectedProblems.length} selected)
                  </label>
                  <span className="text-[11px] text-[#81b64c]">
                    Click problem pills to include / exclude
                  </span>
                </div>
                <div className="bg-[#161512] border border-white/10 rounded-xl p-3 max-h-44 overflow-y-auto flex flex-wrap gap-2">
                  {problems.map((p) => {
                    const isSelected = tourneySelectedProblems.includes(p.slug);
                    return (
                      <button
                        key={p.slug}
                        type="button"
                        onClick={() => {
                          if (isSelected) {
                            setTourneySelectedProblems(tourneySelectedProblems.filter(s => s !== p.slug));
                          } else {
                            setTourneySelectedProblems([...tourneySelectedProblems, p.slug]);
                          }
                        }}
                        className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                          isSelected
                            ? 'bg-[#81b64c] text-white border-[#81b64c]'
                            : 'bg-[#262421] text-white/70 border-white/5 hover:border-white/20'
                        }`}
                      >
                        <span>{isSelected ? '✓' : '+'}</span>
                        <span>{p.title}</span>
                        <span className="text-[10px] opacity-75">({p.difficulty})</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Practice Only Notice */}
              <div className="bg-[#81b64c]/10 border border-[#81b64c]/30 rounded-xl p-3 flex items-start gap-2.5">
                <span className="text-base">🛡️</span>
                <div className="text-[11px] text-[#92c55b]">
                  <strong className="text-white block font-semibold mb-0.5">Practice Tournament Guarantee</strong>
                  All tournaments are strictly for practice. Participants climb the arena tournament leaderboard, but global DSA rating points will not be modified.
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-[#2d2a26] flex items-center justify-end gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowTournamentModal(false)}
                  className="bg-[#262421] hover:bg-[#302d29] text-white text-xs font-bold px-4 py-2 rounded-xl border border-white/10 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={tourneySubmitting}
                  className="bg-[#81b64c] hover:bg-[#92c55b] text-white text-xs font-bold px-5 py-2 rounded-xl shadow-md transition disabled:opacity-50 cursor-pointer"
                >
                  {tourneySubmitting ? 'Saving...' : editingTournamentId ? 'Update Tournament' : 'Publish Tournament'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TOURNAMENT LEADERBOARD / STANDINGS MODAL */}
      {viewingLeaderboardTourney && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#1f1e1b] border border-white/10 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in duration-150">
            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-[#2d2a26] flex items-center justify-between shrink-0 bg-[#262421]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-300 flex items-center justify-center text-xl shadow">
                  🏆
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base sm:text-lg font-black text-white">
                      {viewingLeaderboardTourney.title}
                    </h2>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${
                      viewingLeaderboardTourney.status === 'ACTIVE'
                        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                        : viewingLeaderboardTourney.status === 'COMPLETED'
                        ? 'bg-sky-500/20 text-sky-400 border-sky-500/30'
                        : 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                    }`}>
                      {viewingLeaderboardTourney.status}
                    </span>
                  </div>
                  <p className="text-xs text-[#8c8b88] mt-0.5">
                    {viewingLeaderboardTourney.timeControl} ({viewingLeaderboardTourney.mode}) • Practice Only Leaderboard
                  </p>
                </div>
              </div>
              <button
                onClick={() => setViewingLeaderboardTourney(null)}
                className="text-white/50 hover:text-white text-lg font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Standings Table */}
            <div className="flex-1 overflow-y-auto p-5">
              {(!viewingLeaderboardTourney.participants || viewingLeaderboardTourney.participants.length === 0) ? (
                <div className="p-12 text-center space-y-2">
                  <div className="text-3xl">👥</div>
                  <p className="text-sm font-bold text-white">No participants yet</p>
                  <p className="text-xs text-[#8c8b88]">
                    When users register and solve problems in this arena, their rank and score will appear here.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto bg-[#181714] border border-white/5 rounded-xl">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-[#262421] text-[#8c8b88] border-b border-white/5 font-bold uppercase tracking-wider text-[11px]">
                        <th className="py-3 px-4">Rank</th>
                        <th className="py-3 px-4">Participant</th>
                        <th className="py-3 px-3">Problems Solved</th>
                        <th className="py-3 px-3">Score</th>
                        <th className="py-3 px-3">Time</th>
                        <th className="py-3 px-4 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 font-medium">
                      {[...viewingLeaderboardTourney.participants]
                        .sort((a, b) => (a.rank || 999) - (b.rank || 999))
                        .map((part, idx) => (
                          <tr key={idx} className="hover:bg-white/[0.02]">
                            <td className="py-3 px-4 font-black">
                              {idx === 0 ? '🥇 1st' : idx === 1 ? '🥈 2nd' : idx === 2 ? '🥉 3rd' : `#${idx + 1}`}
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-[#81b64c]/20 text-[#81b64c] flex items-center justify-center font-bold text-[10px]">
                                  {part.username?.charAt(0)?.toUpperCase() || 'P'}
                                </div>
                                <span className="font-bold text-white">{part.username}</span>
                              </div>
                            </td>
                            <td className="py-3 px-3 text-[#81b64c] font-bold">
                              {part.problemsSolved || 0} solved
                            </td>
                            <td className="py-3 px-3 font-mono text-amber-400 font-bold">
                              {part.score || 0} pts
                            </td>
                            <td className="py-3 px-3 font-mono text-white/70">
                              {part.timeTakenSeconds ? `${Math.floor(part.timeTakenSeconds / 60)}m ${part.timeTakenSeconds % 60}s` : '--'}
                            </td>
                            <td className="py-3 px-4 text-right">
                              <span className="text-[10px] text-white/40 font-mono">
                                Practice
                              </span>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-[#2d2a26] flex items-center justify-end bg-[#262421]">
              <button
                type="button"
                onClick={() => setViewingLeaderboardTourney(null)}
                className="bg-[#2b2926] hover:bg-[#383531] text-white text-xs font-bold px-4 py-2 rounded-xl border border-white/10 transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
