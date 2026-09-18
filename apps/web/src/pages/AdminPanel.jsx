import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import Editor from '@monaco-editor/react';

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
    { input: '', output: '', explanation: '' }
  ]);
  const [formHiddenTests, setFormHiddenTests] = useState([]);
  const [formMetaData, setFormMetaData] = useState(null);
  const [formCodeSnippets, setFormCodeSnippets] = useState([]);
  const [selectedSnippetLang, setSelectedSnippetLang] = useState('cpp');
  const [inferringMeta, setInferringMeta] = useState(false);

  const isAdmin = user && (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN');
  const isSuperAdmin = user && user.role === 'SUPER_ADMIN';

  // Users & Moderation State
  const [usersList, setUsersList] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('ALL'); // ALL, ADMIN, USER, BANNED
  const [userActionMsg, setUserActionMsg] = useState('');
  const [userActionError, setUserActionError] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState(null);

  // Fetch all users for moderation
  const fetchUsers = async () => {
    const activeToken = token || localStorage.getItem('token');
    if (!activeToken) return;
    setUsersLoading(true);
    try {
      const res = await axios.get('http://localhost:5000/api/admin/users', {
        headers: { Authorization: `Bearer ${activeToken}` }
      });
      if (res.data) setUsersList(res.data);
    } catch (err) {
      console.error('Error fetching users:', err);
    } finally {
      setUsersLoading(false);
    }
  };

  // Toggle role: Only Super Admin can promote/demote
  const handleToggleRole = async (targetUser) => {
    if (!isSuperAdmin) {
      alert('Only the Super Admin has the power to assign or remove Admin privileges.');
      return;
    }
    const newRole = targetUser.role === 'ADMIN' ? 'USER' : 'ADMIN';
    const confirmMsg = newRole === 'ADMIN'
      ? `Promote @${targetUser.username} (${targetUser.displayName || targetUser.username}) to Administrator? They will be granted full access to create/edit problems and ban/unban users.`
      : `Remove Administrator position from @${targetUser.username}? They will return to a standard Coder account.`;

    if (!window.confirm(confirmMsg)) return;

    const activeToken = token || localStorage.getItem('token');
    setActionLoadingId(targetUser._id);
    setUserActionMsg('');
    setUserActionError('');
    try {
      const res = await axios.put(`http://localhost:5000/api/admin/users/${targetUser._id}/role`, {
        role: newRole
      }, {
        headers: { Authorization: `Bearer ${activeToken}` }
      });
      setUserActionMsg(res.data.message || `Successfully updated role to ${newRole}`);
      await fetchUsers();
    } catch (err) {
      setUserActionError(err.response?.data?.message || 'Failed to update user role');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Toggle ban: Admin & Super Admin
  const handleToggleBan = async (targetUser) => {
    const willBan = !targetUser.isBanned;
    let reason = '';
    if (willBan) {
      const inputReason = window.prompt(
        `Enter ban reason for @${targetUser.username}:`,
        'Violation of platform guidelines / fair play'
      );
      if (inputReason === null) return;
      reason = inputReason.trim() || 'Fair play violation';
    } else {
      if (!window.confirm(`Unban @${targetUser.username} and restore platform access?`)) return;
    }

    const activeToken = token || localStorage.getItem('token');
    setActionLoadingId(targetUser._id);
    setUserActionMsg('');
    setUserActionError('');
    try {
      const res = await axios.put(`http://localhost:5000/api/admin/users/${targetUser._id}/ban`, {
        banned: willBan,
        reason
      }, {
        headers: { Authorization: `Bearer ${activeToken}` }
      });
      setUserActionMsg(res.data.message || (willBan ? `Banned @${targetUser.username}` : `Unbanned @${targetUser.username}`));
      await fetchUsers();
    } catch (err) {
      setUserActionError(err.response?.data?.message || 'Failed to update ban status');
    } finally {
      setActionLoadingId(null);
    }
  };

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

  // Admin Tab: 'problems' | 'tournaments' | 'users'
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
  const [tourneyStartTime, setTourneyStartTime] = useState('');
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

  // Cheating Reports State
  const [reportsList, setReportsList] = useState([]);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [reportsFilter, setReportsFilter] = useState('ALL'); // 'ALL' | 'PENDING' | 'RESOLVED_REVERTED' | 'DISMISSED'
  const [reviewingReport, setReviewingReport] = useState(null);
  const [reportActionLoadingId, setReportActionLoadingId] = useState(null);
  const [reportSuccessMsg, setReportSuccessMsg] = useState('');
  const [reportErrorMsg, setReportErrorMsg] = useState('');
  const [reportSearchTerm, setReportSearchTerm] = useState('');

  const pendingReportsCount = reportsList.filter(r => r.status === 'PENDING').length;

  // Fetch cheating reports
  const fetchReports = async () => {
    const activeToken = token || localStorage.getItem('token');
    if (!activeToken) return;
    setReportsLoading(true);
    try {
      const res = await axios.get(`http://localhost:5000/api/admin/reports?status=${reportsFilter}`, {
        headers: { Authorization: `Bearer ${activeToken}` }
      });
      if (res.data) setReportsList(res.data);
    } catch (err) {
      console.error('Error fetching reports:', err);
    } finally {
      setReportsLoading(false);
    }
  };

  const handleRevertRatings = async (report) => {
    if (!report) return;
    const reporterName = report.reporterId?.username || 'Reporter';
    const cheaterName = report.reportedUserId?.username || 'Cheater';
    const confirmMsg = `Are you sure you want to revert ratings for this match?\n\n` +
      `• @${reporterName} will regain lost rating points\n` +
      `• @${cheaterName} will lose their gained rating points\n\n` +
      `This rollback will be logged in Rating History as CHEATING_ROLLBACK.`;

    if (!window.confirm(confirmMsg)) return;

    setReportActionLoadingId(report._id);
    setReportSuccessMsg('');
    setReportErrorMsg('');

    try {
      const activeToken = token || localStorage.getItem('token');
      const res = await axios.post(
        `http://localhost:5000/api/admin/reports/${report._id}/revert-ratings`,
        { adminNotes: 'Verified unfair advantage / cheating via code review.' },
        { headers: { Authorization: `Bearer ${activeToken}` } }
      );

      if (res.data?.success) {
        setReportSuccessMsg(res.data.message || 'Ratings successfully reverted!');
        if (reviewingReport && reviewingReport._id === report._id) {
          setReviewingReport({ ...reviewingReport, status: 'RESOLVED_REVERTED', ratingReverted: true });
        }
        fetchReports();
        fetchUsers();
      }
    } catch (err) {
      console.error('Error reverting ratings:', err);
      setReportErrorMsg(err.response?.data?.message || 'Failed to revert ratings.');
    } finally {
      setReportActionLoadingId(null);
    }
  };

  const handleDismissReport = async (report) => {
    if (!report) return;
    const notes = window.prompt('Enter notes for dismissing this report (optional):', 'Code and match metrics verified as legitimate.');
    if (notes === null) return;

    setReportActionLoadingId(report._id);
    setReportSuccessMsg('');
    setReportErrorMsg('');

    try {
      const activeToken = token || localStorage.getItem('token');
      const res = await axios.put(
        `http://localhost:5000/api/admin/reports/${report._id}/dismiss`,
        { adminNotes: notes },
        { headers: { Authorization: `Bearer ${activeToken}` } }
      );

      if (res.data?.success) {
        setReportSuccessMsg('Report dismissed.');
        if (reviewingReport && reviewingReport._id === report._id) {
          setReviewingReport({ ...reviewingReport, status: 'DISMISSED' });
        }
        fetchReports();
      }
    } catch (err) {
      console.error('Error dismissing report:', err);
      setReportErrorMsg(err.response?.data?.message || 'Failed to dismiss report.');
    } finally {
      setReportActionLoadingId(null);
    }
  };

  const handleBanFromReport = async (targetUserId, targetUsername) => {
    if (!targetUserId) return;
    if (!window.confirm(`Ban user @${targetUsername} immediately for fair play violation?`)) return;

    try {
      const activeToken = token || localStorage.getItem('token');
      await axios.put(
        `http://localhost:5000/api/admin/users/${targetUserId}/ban`,
        { banned: true, reason: 'Confirmed cheating in 1v1 battle' },
        { headers: { Authorization: `Bearer ${activeToken}` } }
      );
      setReportSuccessMsg(`User @${targetUsername} has been banned.`);
      fetchUsers();
      fetchReports();
    } catch (err) {
      console.error('Ban error:', err);
      setReportErrorMsg(err.response?.data?.message || 'Failed to ban user.');
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchAdminProblems();
      fetchTournaments();
      fetchUsers();
      fetchReports();
    } else {
      setLoading(false);
    }
  }, [isAdmin, token]);

  useEffect(() => {
    if (activeAdminTab === 'reports') {
      fetchReports();
    }
  }, [activeAdminTab, reportsFilter]);


  const openCreateTourneyModal = () => {
    setEditingTournamentId(null);
    setTourneyTitle('');
    setTourneyDescription('Open practice arena tournament. Climb the rankings!');
    setTourneyMode('Blitz');
    setTourneyTimeControl('15 + 0');
    setTourneyDuration(15);
    // Default start time: 5 minutes from current moment
    const d = new Date(Date.now() + 5 * 60000);
    const localIso = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    setTourneyStartTime(localIso);
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
    const sDate = t.startTime ? new Date(t.startTime) : new Date();
    const localIso = new Date(sDate.getTime() - sDate.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    setTourneyStartTime(localIso);
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
        startTime: tourneyStartTime ? new Date(tourneyStartTime).toISOString() : new Date().toISOString(),
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
    setFormTags('');
    setFormDescription('');
    setFormConstraints('');
    setFormFollowUp('');
    setFormTimeLimit(2000);
    setFormMemoryLimit(256);
    setFormExamples([
      { input: '', output: '', explanation: '' }
    ]);
    setFormHiddenTests([]);
    setFormMetaData(null);
    setFormCodeSnippets([]);
    setSelectedSnippetLang('cpp');
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

    setFormExamples(Array.isArray(p.examples) && p.examples.length > 0 ? p.examples : [
      { input: '', output: '', explanation: '' }
    ]);

    // Sanitize any residual wrong testcase like nums = [3,2,4], target = 6
    const rawHidden = Array.isArray(p.hiddenTestCases) ? p.hiddenTestCases : [];
    const cleanedHidden = rawHidden.filter(
      tc => !(tc && tc.input && tc.input.includes('3,2,4') && tc.input.includes('target = 6'))
    );
    setFormHiddenTests(cleanedHidden);

    setFormMetaData(p.metaData || null);
    setFormCodeSnippets(p.codeSnippets || []);
    setSelectedSnippetLang('cpp');

    setShowModal(true);
  };

  // Check bracket balance utility
  const checkBracketBalance = (str) => {
    if (!str) return true;
    let b = 0, curly = 0;
    let inStr = false, q = null;
    for (let i = 0; i < str.length; i++) {
      const c = str[i];
      if ((c === '"' || c === "'") && (i === 0 || str[i-1] !== '\\')) {
        if (!inStr) { inStr = true; q = c; }
        else if (c === q) inStr = false;
      } else if (!inStr) {
        if (c === '[') b++;
        else if (c === ']') b--;
        else if (c === '{') curly++;
        else if (c === '}') curly--;
      }
    }
    return b === 0 && curly === 0 && !inStr;
  };

  // Auto-infer function metadata and snippets from current title & examples
  const handleAutoInfer = async () => {
    setInferringMeta(true);
    try {
      const activeToken = token || localStorage.getItem('token');
      const validExamples = formExamples.filter(e => e.input && e.output);
      const res = await axios.post('http://localhost:5000/api/problems/infer-meta', {
        title: formTitle,
        slug: formSlug,
        examples: validExamples.length > 0 ? validExamples : formHiddenTests.filter(e => e.input && e.output)
      }, {
        headers: { Authorization: `Bearer ${activeToken}` }
      });
      if (res.data) {
        if (res.data.metaData) setFormMetaData(res.data.metaData);
        if (res.data.codeSnippets) setFormCodeSnippets(res.data.codeSnippets);
      }
    } catch (e) {
      console.error('Auto infer error:', e);
    } finally {
      setInferringMeta(false);
    }
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
      hiddenTestCases: formHiddenTests.filter(e => e.input && e.output),
      metaData: formMetaData,
      codeSnippets: formCodeSnippets
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

  // Filtered users for Moderation tab
  const filteredUsers = usersList.filter((u) => {
    const term = userSearchTerm.toLowerCase();
    const matchSearch =
      (u.username && u.username.toLowerCase().includes(term)) ||
      (u.displayName && u.displayName.toLowerCase().includes(term)) ||
      (u.email && u.email.toLowerCase().includes(term));

    if (!matchSearch) return false;

    if (userRoleFilter === 'ADMIN') {
      return u.role === 'ADMIN' || u.role === 'SUPER_ADMIN';
    }
    if (userRoleFilter === 'USER') {
      return u.role === 'USER';
    }
    if (userRoleFilter === 'BANNED') {
      return Boolean(u.isBanned);
    }
    return true;
  });

  // IF USER IS NOT LOGGED IN AS ADMIN OR SUPER ADMIN
  if (!isAdmin) {
    return (
      <div className="flex-1 flex items-center justify-center p-6 bg-[#161512]">
        <div className="bg-[#21201d] border border-white/10 rounded-2xl p-8 max-w-md w-full shadow-2xl space-y-6 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-600 to-yellow-400 flex items-center justify-center text-3xl mx-auto shadow-lg">
            🔒
          </div>
          <div>
            <h1 className="text-2xl font-black text-white">Administrator Access Required</h1>
            <p className="text-xs text-[#8c8b88] mt-2">
              {user
                ? `You are signed in as @${user.username} (${user.displayName || 'Coder'}). Only Administrators and the Super Admin are permitted to access this portal.`
                : 'Please sign in with an Administrator or Super Administrator account to continue.'}
            </p>
          </div>

          <div className="space-y-3 pt-2">
            <Link
              to="/"
              className="w-full bg-[#81b64c] hover:bg-[#92c55b] text-white font-bold py-3 px-4 rounded-xl shadow-lg transition flex items-center justify-center gap-2 text-sm"
            >
              <span>← Return to Home Arena</span>
            </Link>

            {user ? (
              <button
                onClick={() => {
                  logout();
                  window.location.href = '/login';
                }}
                className="w-full bg-[#2b2926] hover:bg-[#383531] text-white/80 hover:text-white font-bold py-2.5 px-4 rounded-xl border border-white/10 transition text-xs cursor-pointer"
              >
                Sign in with Different Account
              </button>
            ) : (
              <Link
                to="/login"
                className="w-full bg-[#2b2926] hover:bg-[#383531] text-white/80 hover:text-white font-bold py-2.5 px-4 rounded-xl border border-white/10 transition text-xs flex items-center justify-center"
              >
                Go to Sign In
              </Link>
            )}
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
              {activeAdminTab === 'problems' ? '📚' : activeAdminTab === 'tournaments' ? '🏅' : activeAdminTab === 'users' ? '👥' : '🚨'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black text-white">
                  {activeAdminTab === 'problems'
                    ? 'Admin Problem Studio'
                    : activeAdminTab === 'tournaments'
                    ? 'Arena Tournament Manager'
                    : activeAdminTab === 'users'
                    ? 'Users & Moderation Management'
                    : 'Cheating Reports & Rating Rollback'}
                </h1>
                {isSuperAdmin ? (
                  <span className="bg-amber-500/20 text-amber-300 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider border border-amber-500/40 flex items-center gap-1">
                    <span>👑</span>
                    <span>Super Admin Authority</span>
                  </span>
                ) : (
                  <span className="bg-[#81b64c]/20 text-[#81b64c] text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider border border-[#81b64c]/30 flex items-center gap-1">
                    <span>🛡️</span>
                    <span>Verified Admin</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-[#8c8b88] mt-0.5">
                {activeAdminTab === 'problems'
                  ? 'Create problems, edit problems, configure testcases, constraints, and manage curriculum.'
                  : activeAdminTab === 'tournaments'
                  ? 'Host open practice arena tournaments, assign problems, and inspect player standings.'
                  : activeAdminTab === 'users'
                  ? isSuperAdmin
                    ? 'Super Admin Authority: You have exclusive power to assign or revoke Administrator roles, and ban or unban users.'
                    : 'Administrator Controls: Review platform users and ban/unban rule violators.'
                  : 'Fair Play Enforcement: Review reported 1v1 battles, inspect side-by-side player code, dismiss reports, or revert Elo rating changes.'}
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
          ) : activeAdminTab === 'tournaments' ? (
            <button
              onClick={openCreateTourneyModal}
              className="bg-[#81b64c] hover:bg-[#92c55b] text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-lg transition flex items-center gap-2 cursor-pointer"
            >
              <span className="text-base leading-none">+</span>
              <span>Schedule Tournament</span>
            </button>
          ) : activeAdminTab === 'users' ? (
            <button
              onClick={fetchUsers}
              disabled={usersLoading}
              className="bg-[#262421] hover:bg-[#302d29] text-white font-bold text-xs px-4 py-2.5 rounded-xl border border-white/10 transition flex items-center gap-2 cursor-pointer"
            >
              <span className={usersLoading ? 'animate-spin' : ''}>🔄</span>
              <span>Refresh Users</span>
            </button>
          ) : (
            <button
              onClick={() => fetchReports(reportsFilter)}
              disabled={reportsLoading}
              className="bg-[#262421] hover:bg-[#302d29] text-white font-bold text-xs px-4 py-2.5 rounded-xl border border-white/10 transition flex items-center gap-2 cursor-pointer"
            >
              <span className={reportsLoading ? 'animate-spin' : ''}>🔄</span>
              <span>Refresh Reports</span>
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

          <button
            type="button"
            onClick={() => setActiveAdminTab('users')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeAdminTab === 'users'
                ? 'bg-[#81b64c] text-white shadow-lg shadow-[#81b64c]/20'
                : 'bg-[#262421] text-[#8c8b88] hover:text-white hover:bg-[#302d29] border border-white/5'
            }`}
          >
            <span>👥</span>
            <span>Users & Moderation ({usersList.length})</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveAdminTab('reports');
              fetchReports(reportsFilter);
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer relative ${
              activeAdminTab === 'reports'
                ? 'bg-[#81b64c] text-white shadow-lg shadow-[#81b64c]/20'
                : 'bg-[#262421] text-[#8c8b88] hover:text-white hover:bg-[#302d29] border border-white/5'
            }`}
          >
            <span>🚨</span>
            <span>Cheating Reports</span>
            {pendingReportsCount > 0 && (
              <span className="bg-red-500 text-white text-[10px] font-black px-1.5 py-0.2 rounded-full animate-pulse">
                {pendingReportsCount}
              </span>
            )}
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
        ) : activeAdminTab === 'tournaments' ? (
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
        ) : activeAdminTab === 'users' ? (
          <div className="max-w-7xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
            <div className="bg-[#262421] border border-white/5 rounded-xl p-3.5 flex items-center justify-between">
              <div>
                <div className="text-[11px] text-[#8c8b88] font-bold uppercase tracking-wider">Total Registered</div>
                <div className="text-xl font-black text-white mt-0.5">{usersList.length}</div>
              </div>
              <span className="text-2xl">👥</span>
            </div>

            <div className="bg-[#262421] border border-white/5 rounded-xl p-3.5 flex items-center justify-between">
              <div>
                <div className="text-[11px] text-[#8c8b88] font-bold uppercase tracking-wider">Super Admin</div>
                <div className="text-xl font-black text-amber-400 mt-0.5">
                  {usersList.filter(u => u.role === 'SUPER_ADMIN').length || 1} (Owner)
                </div>
              </div>
              <span className="text-2xl">👑</span>
            </div>

            <div className="bg-[#262421] border border-white/5 rounded-xl p-3.5 flex items-center justify-between">
              <div>
                <div className="text-[11px] text-[#8c8b88] font-bold uppercase tracking-wider">Administrators</div>
                <div className="text-xl font-black text-purple-400 mt-0.5">
                  {usersList.filter(u => u.role === 'ADMIN').length}
                </div>
              </div>
              <span className="text-2xl">🛡️</span>
            </div>

            <div className="bg-[#262421] border border-white/5 rounded-xl p-3.5 flex items-center justify-between">
              <div>
                <div className="text-[11px] text-[#8c8b88] font-bold uppercase tracking-wider">Banned Users</div>
                <div className="text-xl font-black text-red-400 mt-0.5">
                  {usersList.filter(u => u.isBanned).length}
                </div>
              </div>
              <span className="text-2xl">⛔</span>
            </div>
          </div>
        ) : (
          <div className="max-w-7xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
            <div className="bg-[#262421] border border-white/5 rounded-xl p-3.5 flex items-center justify-between">
              <div>
                <div className="text-[11px] text-[#8c8b88] font-bold uppercase tracking-wider">Total Reports</div>
                <div className="text-xl font-black text-white mt-0.5">{reportsList.length}</div>
              </div>
              <span className="text-2xl">📋</span>
            </div>

            <div className="bg-[#262421] border border-white/5 rounded-xl p-3.5 flex items-center justify-between">
              <div>
                <div className="text-[11px] text-[#8c8b88] font-bold uppercase tracking-wider">Pending Review</div>
                <div className="text-xl font-black text-amber-400 mt-0.5">{pendingReportsCount}</div>
              </div>
              <span className="text-2xl">⏳</span>
            </div>

            <div className="bg-[#262421] border border-white/5 rounded-xl p-3.5 flex items-center justify-between">
              <div>
                <div className="text-[11px] text-[#8c8b88] font-bold uppercase tracking-wider">Ratings Reverted</div>
                <div className="text-xl font-black text-[#81b64c] mt-0.5">
                  {reportsList.filter(r => r.status === 'RESOLVED_REVERTED').length}
                </div>
              </div>
              <span className="text-2xl">⏪</span>
            </div>

            <div className="bg-[#262421] border border-white/5 rounded-xl p-3.5 flex items-center justify-between">
              <div>
                <div className="text-[11px] text-[#8c8b88] font-bold uppercase tracking-wider">Dismissed</div>
                <div className="text-xl font-black text-[#8c8b88] mt-0.5">
                  {reportsList.filter(r => r.status === 'DISMISSED').length}
                </div>
              </div>
              <span className="text-2xl">🛡️</span>
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
        ) : activeAdminTab === 'tournaments' ? (
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
                        <th className="py-3 px-3">Schedule / Timing</th>
                        <th className="py-3 px-3">Duration</th>
                        <th className="py-3 px-4">Problems</th>
                        <th className="py-3 px-3">Participants</th>
                        <th className="py-3 px-3">Status</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 font-medium">
                      {tournaments.map((t) => {
                        const sTime = t.startTime ? new Date(t.startTime).getTime() : 0;
                        const durationMs = (t.durationMinutes || 15) * 60 * 1000;
                        const eTime = t.endTime ? new Date(t.endTime).getTime() : sTime + durationMs;
                        const now = Date.now();
                        const isLive = t.status === 'ACTIVE' || (now >= sTime && now < eTime);
                        const isPast = t.status === 'COMPLETED' || now >= eTime;

                        return (
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

                          <td className="py-3.5 px-3 text-[11px] font-mono">
                            {t.startTime ? (
                              <div>
                                <span className="text-white/80 block">
                                  {new Date(t.startTime).toLocaleDateString([], { month: 'short', day: 'numeric' })} at {new Date(t.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                                {isLive ? (
                                  <span className="text-emerald-400 font-bold text-[10px] flex items-center gap-1 mt-0.5 animate-pulse">
                                    🔴 Live ({Math.max(1, Math.round((eTime - now) / 60000))}m left)
                                  </span>
                                ) : isPast ? (
                                  <span className="text-sky-400 text-[10px] block mt-0.5 font-sans">
                                    Concluded
                                  </span>
                                ) : (
                                  <span className="text-amber-400 text-[10px] block mt-0.5 font-sans">
                                    Starts in {Math.max(1, Math.round((sTime - now) / 60000))}m
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-white/40">Immediate</span>
                            )}
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
                      );
                    })}
                  </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        ) : activeAdminTab === 'users' ? (
          <>
            {/* Users & Moderation Management Section */}
            <div className="bg-[#1e1d1a] border border-[#2d2a26] rounded-2xl overflow-hidden shadow-md space-y-4 p-5">
              {/* Header */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-white/5 pb-4">
                <div>
                  <h2 className="text-base font-black text-white flex items-center gap-2">
                    <span>👥</span>
                    <span>User Accounts & Moderation Studio</span>
                  </h2>
                  <p className="text-xs text-[#8c8b88] mt-0.5">
                    {isSuperAdmin
                      ? '👑 Super Admin Power: Assign or remove Administrator privileges, and ban or unban platform users.'
                      : '🛡️ Administrator Power: Moderate platform users, inspect standing, and ban or unban violators.'}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-[#8c8b88] font-bold">Showing {filteredUsers.length} of {usersList.length} users</span>
                </div>
              </div>

              {/* Feedback Banners */}
              {userActionMsg && (
                <div className="bg-emerald-500/15 border border-emerald-500/30 rounded-xl p-3 text-xs text-emerald-300 font-semibold flex items-center justify-between">
                  <span>✅ {userActionMsg}</span>
                  <button onClick={() => setUserActionMsg('')} className="text-white/60 hover:text-white cursor-pointer ml-3">✕</button>
                </div>
              )}
              {userActionError && (
                <div className="bg-red-500/15 border border-red-500/30 rounded-xl p-3 text-xs text-red-300 font-semibold flex items-center justify-between">
                  <span>⚠️ {userActionError}</span>
                  <button onClick={() => setUserActionError('')} className="text-white/60 hover:text-white cursor-pointer ml-3">✕</button>
                </div>
              )}

              {/* Search & Filter Controls */}
              <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 pt-1">
                <div className="relative flex-1 max-w-md">
                  <input
                    type="text"
                    value={userSearchTerm}
                    onChange={(e) => setUserSearchTerm(e.target.value)}
                    placeholder="Search by username, display name, or email..."
                    className="w-full bg-[#161512] border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-white/40 focus:outline-none focus:border-[#81b64c] transition"
                  />
                  <span className="absolute left-3 top-2.5 text-xs text-white/40">🔍</span>
                </div>

                {/* Filter Pills */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setUserRoleFilter('ALL')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                      userRoleFilter === 'ALL'
                        ? 'bg-[#81b64c] text-white'
                        : 'bg-[#262421] text-white/70 hover:text-white border border-white/5'
                    }`}
                  >
                    All ({usersList.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setUserRoleFilter('ADMIN')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                      userRoleFilter === 'ADMIN'
                        ? 'bg-purple-600 text-white'
                        : 'bg-[#262421] text-white/70 hover:text-white border border-white/5'
                    }`}
                  >
                    🛡️ Admins ({usersList.filter(u => u.role === 'ADMIN' || u.role === 'SUPER_ADMIN').length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setUserRoleFilter('USER')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                      userRoleFilter === 'USER'
                        ? 'bg-blue-600 text-white'
                        : 'bg-[#262421] text-white/70 hover:text-white border border-white/5'
                    }`}
                  >
                    💻 Coders ({usersList.filter(u => u.role === 'USER').length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setUserRoleFilter('BANNED')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                      userRoleFilter === 'BANNED'
                        ? 'bg-red-600 text-white'
                        : 'bg-[#262421] text-white/70 hover:text-white border border-white/5'
                    }`}
                  >
                    ⛔ Banned ({usersList.filter(u => u.isBanned).length})
                  </button>
                </div>
              </div>

              {/* Users Table */}
              {usersLoading ? (
                <div className="p-12 text-center text-xs text-[#8c8b88]">
                  <div className="animate-spin text-2xl inline-block mb-2">⏳</div>
                  <p>Loading users list...</p>
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="p-12 text-center space-y-3">
                  <div className="text-3xl">👤</div>
                  <p className="text-sm font-bold text-white">No users found</p>
                  <p className="text-xs text-[#8c8b88]">
                    No accounts match "{userSearchTerm}" with filter "{userRoleFilter}".
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-white/5 mt-3">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-[#262421] text-[#8c8b88] border-b border-white/5 font-bold uppercase tracking-wider text-[11px]">
                        <th className="py-3 px-4">User</th>
                        <th className="py-3 px-3">Email Address</th>
                        <th className="py-3 px-3">Platform Role</th>
                        <th className="py-3 px-3">Account Status</th>
                        <th className="py-3 px-3">Admin Assignment</th>
                        <th className="py-3 px-4 text-right">Moderation Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 font-medium">
                      {filteredUsers.map((u) => {
                        const isTargetSuperAdmin = u.role === 'SUPER_ADMIN';
                        const isTargetAdmin = u.role === 'ADMIN';
                        const isTargetSelf = user && (user._id === u._id || user.username === u.username);

                        return (
                          <tr key={u._id} className="hover:bg-white/[0.02] transition">
                            {/* User Column */}
                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-3">
                                {u.avatar ? (
                                  <img
                                    src={u.avatar}
                                    alt={u.username}
                                    className="w-9 h-9 rounded-xl object-cover border border-white/10"
                                  />
                                ) : (
                                  <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-zinc-700 to-zinc-600 flex items-center justify-center text-white font-bold border border-white/10 text-xs">
                                    {(u.displayName || u.username || 'U')[0].toUpperCase()}
                                  </div>
                                )}
                                <div>
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-bold text-white block truncate max-w-[180px]">
                                      {u.displayName || u.username}
                                    </span>
                                    {isTargetSelf && (
                                      <span className="bg-white/10 text-white/80 text-[9px] px-1.5 py-0.2 rounded font-mono">
                                        You
                                      </span>
                                    )}
                                  </div>
                                  <span className="text-[11px] text-[#8c8b88] font-mono block">
                                    @{u.username}
                                  </span>
                                  <span className="text-[10px] text-white/30 block mt-0.5">
                                    Joined {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'Active coder'}
                                  </span>
                                </div>
                              </div>
                            </td>

                            {/* Email Column */}
                            <td className="py-3.5 px-3 font-mono text-white/80 text-xs">
                              {u.email || '—'}
                            </td>

                            {/* Role Badge Column */}
                            <td className="py-3.5 px-3">
                              {isTargetSuperAdmin ? (
                                <span className="bg-gradient-to-r from-amber-500/20 to-yellow-500/20 text-amber-300 font-extrabold px-2.5 py-1 rounded-full border border-amber-500/40 text-[10px] inline-flex items-center gap-1">
                                  <span>👑</span>
                                  <span>Super Admin</span>
                                </span>
                              ) : isTargetAdmin ? (
                                <span className="bg-purple-500/20 text-purple-300 font-extrabold px-2.5 py-1 rounded-full border border-purple-500/30 text-[10px] inline-flex items-center gap-1">
                                  <span>🛡️</span>
                                  <span>Administrator</span>
                                </span>
                              ) : (
                                <span className="bg-zinc-800 text-white/70 font-semibold px-2.5 py-1 rounded-full border border-white/5 text-[10px] inline-flex items-center gap-1">
                                  <span>💻</span>
                                  <span>Coder</span>
                                </span>
                              )}
                            </td>

                            {/* Account Status Column */}
                            <td className="py-3.5 px-3">
                              {u.isBanned ? (
                                <div>
                                  <span className="bg-red-500/20 text-red-400 font-bold px-2 py-0.5 rounded-full border border-red-500/40 text-[10px] inline-flex items-center gap-1">
                                    <span>⛔</span>
                                    <span>Banned</span>
                                  </span>
                                  {u.bannedReason && (
                                    <span className="text-[10px] text-red-300/70 block mt-0.5 truncate max-w-[150px]" title={u.bannedReason}>
                                      {u.bannedReason}
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <span className="bg-emerald-500/15 text-emerald-400 font-bold px-2 py-0.5 rounded-full border border-emerald-500/30 text-[10px] inline-flex items-center gap-1">
                                  <span>●</span>
                                  <span>Active</span>
                                </span>
                              )}
                            </td>

                            {/* Admin Role Assignment (SUPER ADMIN ONLY) */}
                            <td className="py-3.5 px-3">
                              {isTargetSuperAdmin ? (
                                <span className="text-[11px] font-bold text-amber-400/70 italic flex items-center gap-1">
                                  <span>🔒</span>
                                  <span>Super Admin</span>
                                </span>
                              ) : isSuperAdmin ? (
                                isTargetAdmin ? (
                                  <button
                                    type="button"
                                    onClick={() => handleToggleRole(u)}
                                    disabled={actionLoadingId === u._id}
                                    className="bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 hover:text-amber-300 px-2.5 py-1 rounded-lg border border-amber-500/30 transition cursor-pointer font-bold text-[11px] flex items-center gap-1 disabled:opacity-50"
                                    title="Revoke admin privileges and demote to regular user"
                                  >
                                    <span>🔻</span>
                                    <span>{actionLoadingId === u._id ? 'Updating...' : 'Remove Admin'}</span>
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => handleToggleRole(u)}
                                    disabled={actionLoadingId === u._id}
                                    className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white px-2.5 py-1 rounded-lg shadow-sm transition cursor-pointer font-bold text-[11px] flex items-center gap-1 disabled:opacity-50"
                                    title="Promote this coder to Administrator"
                                  >
                                    <span>🛡️</span>
                                    <span>{actionLoadingId === u._id ? 'Updating...' : 'Assign Admin'}</span>
                                  </button>
                                )
                              ) : (
                                <span className="text-[10px] text-white/30 italic flex items-center gap-1">
                                  <span>🔒</span>
                                  <span>Super Admin only</span>
                                </span>
                              )}
                            </td>

                            {/* Moderation Actions (Admin & Super Admin) */}
                            <td className="py-3.5 px-4 text-right">
                              {isTargetSuperAdmin ? (
                                <span className="text-[11px] text-white/30 italic font-mono">Protected</span>
                              ) : !isSuperAdmin && isTargetAdmin ? (
                                <span className="text-[11px] text-white/30 italic font-mono">Protected</span>
                              ) : isTargetSelf ? (
                                <span className="text-[11px] text-white/30 italic font-mono">—</span>
                              ) : u.isBanned ? (
                                <button
                                  type="button"
                                  onClick={() => handleToggleBan(u)}
                                  disabled={actionLoadingId === u._id}
                                  className="bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 px-3 py-1 rounded-lg border border-emerald-500/30 transition cursor-pointer font-bold text-[11px] disabled:opacity-50"
                                >
                                  {actionLoadingId === u._id ? 'Updating...' : '🔓 Unban User'}
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleToggleBan(u)}
                                  disabled={actionLoadingId === u._id}
                                  className="bg-red-500/15 hover:bg-red-500/25 text-red-400 px-3 py-1 rounded-lg border border-red-500/30 transition cursor-pointer font-bold text-[11px] disabled:opacity-50"
                                >
                                  {actionLoadingId === u._id ? 'Updating...' : '🔨 Ban User'}
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            {/* Cheating Reports & Rating Rollback Studio */}
            <div className="bg-[#1e1d1a] border border-[#2d2a26] rounded-2xl overflow-hidden shadow-md space-y-4 p-5">
              {/* Header */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-white/5 pb-4">
                <div>
                  <h2 className="text-base font-black text-white flex items-center gap-2">
                    <span>🚨</span>
                    <span>Cheating Reports & Rating Rollback Studio</span>
                  </h2>
                  <p className="text-xs text-[#8c8b88] mt-0.5">
                    Review user-submitted cheating allegations from 1v1 battles, inspect side-by-side code submissions, dismiss invalid claims, or revert Elo ratings.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-[#8c8b88] font-bold">
                    Showing {reportsList.length} incidents
                  </span>
                </div>
              </div>

              {/* Feedback Notifications */}
              {reportSuccessMsg && (
                <div className="bg-emerald-500/15 border border-emerald-500/30 rounded-xl p-3 text-xs text-emerald-300 font-semibold flex items-center justify-between">
                  <span>✅ {reportSuccessMsg}</span>
                  <button onClick={() => setReportSuccessMsg('')} className="text-white/60 hover:text-white cursor-pointer ml-3">✕</button>
                </div>
              )}
              {reportErrorMsg && (
                <div className="bg-red-500/15 border border-red-500/30 rounded-xl p-3 text-xs text-red-400 font-semibold flex items-center justify-between">
                  <span>⚠️ {reportErrorMsg}</span>
                  <button onClick={() => setReportErrorMsg('')} className="text-white/60 hover:text-white cursor-pointer ml-3">✕</button>
                </div>
              )}

              {/* Filter Tabs & Search */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#181714] p-3 rounded-xl border border-white/5">
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                  <button
                    type="button"
                    onClick={() => setReportsFilter('ALL')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer shrink-0 ${
                      reportsFilter === 'ALL'
                        ? 'bg-[#81b64c] text-white'
                        : 'bg-[#262421] text-[#8c8b88] hover:text-white border border-white/5'
                    }`}
                  >
                    All ({reportsList.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setReportsFilter('PENDING')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer shrink-0 flex items-center gap-1.5 ${
                      reportsFilter === 'PENDING'
                        ? 'bg-amber-500 text-black font-extrabold'
                        : 'bg-[#262421] text-[#8c8b88] hover:text-white border border-white/5'
                    }`}
                  >
                    <span>⏳ Pending</span>
                    {pendingReportsCount > 0 && (
                      <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                        {pendingReportsCount}
                      </span>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setReportsFilter('RESOLVED_REVERTED')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer shrink-0 ${
                      reportsFilter === 'RESOLVED_REVERTED'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-[#262421] text-[#8c8b88] hover:text-white border border-white/5'
                    }`}
                  >
                    ⏪ Reverted
                  </button>
                  <button
                    type="button"
                    onClick={() => setReportsFilter('DISMISSED')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer shrink-0 ${
                      reportsFilter === 'DISMISSED'
                        ? 'bg-[#3b3a36] text-white'
                        : 'bg-[#262421] text-[#8c8b88] hover:text-white border border-white/5'
                    }`}
                  >
                    🛡️ Dismissed
                  </button>
                </div>

                <div className="relative">
                  <input
                    type="text"
                    value={reportSearchTerm}
                    onChange={(e) => setReportSearchTerm(e.target.value)}
                    placeholder="Search by user or problem..."
                    className="w-full sm:w-64 bg-[#141311] border border-white/10 rounded-xl px-3.5 py-1.5 text-xs text-white placeholder:text-[#8c8b88] focus:outline-none focus:border-[#81b64c]"
                  />
                  {reportSearchTerm && (
                    <button
                      onClick={() => setReportSearchTerm('')}
                      className="absolute right-2.5 top-1.5 text-white/50 hover:text-white text-xs cursor-pointer"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>

              {/* Reports Table */}
              {reportsLoading ? (
                <div className="p-12 text-center text-[#8c8b88] text-xs">
                  <span className="inline-block animate-spin mr-2">🔄</span> Loading cheating reports...
                </div>
              ) : reportsList.length === 0 ? (
                <div className="p-12 text-center space-y-2">
                  <div className="text-3xl">🛡️</div>
                  <p className="text-sm font-bold text-white">No reports found</p>
                  <p className="text-xs text-[#8c8b88]">
                    {reportsFilter === 'ALL'
                      ? 'No cheating allegations have been submitted yet. Fair play is clean!'
                      : `No reports matching "${reportsFilter}" status.`}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto bg-[#181714] border border-white/5 rounded-xl">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-[#262421] text-[#8c8b88] border-b border-white/5 font-bold uppercase tracking-wider text-[11px]">
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4">Suspected Cheater</th>
                        <th className="py-3 px-4">Reporter (Victim)</th>
                        <th className="py-3 px-3">Problem & Reason</th>
                        <th className="py-3 px-3">Rating Shift</th>
                        <th className="py-3 px-3">Date</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 font-medium">
                      {reportsList
                        .filter((r) => {
                          if (!reportSearchTerm) return true;
                          const term = reportSearchTerm.toLowerCase();
                          const suspect = r.reportedUserId?.username?.toLowerCase() || '';
                          const reporter = r.reporterId?.username?.toLowerCase() || '';
                          const prob = r.problemSlug?.toLowerCase() || '';
                          return suspect.includes(term) || reporter.includes(term) || prob.includes(term);
                        })
                        .map((report) => {
                          const suspectName = report.reportedUserId?.username || 'Unknown';
                          const reporterName = report.reporterId?.username || 'Unknown';
                          const isReverted = report.status === 'RESOLVED_REVERTED' || report.ratingReverted;
                          const isDismissed = report.status === 'DISMISSED';

                          const reporterOld = report.ratingDetails?.reporterOldRating;
                          const reporterNew = report.ratingDetails?.reporterNewRating;
                          const reportedOld = report.ratingDetails?.reportedOldRating;
                          const reportedNew = report.ratingDetails?.reportedNewRating;

                          return (
                            <tr key={report._id} className="hover:bg-white/[0.02] transition">
                              <td className="py-3.5 px-4">
                                {report.status === 'RESOLVED_REVERTED' ? (
                                  <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-wider inline-flex items-center gap-1">
                                    <span>⏪</span>
                                    <span>Reverted</span>
                                  </span>
                                ) : report.status === 'DISMISSED' ? (
                                  <span className="bg-white/10 text-white/50 border border-white/10 text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-wider inline-flex items-center gap-1">
                                    <span>🛡️</span>
                                    <span>Dismissed</span>
                                  </span>
                                ) : (
                                  <span className="bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-wider inline-flex items-center gap-1 animate-pulse">
                                    <span>⏳</span>
                                    <span>Pending</span>
                                  </span>
                                )}
                              </td>

                              <td className="py-3.5 px-4">
                                <div className="flex items-center gap-2">
                                  <div className="w-7 h-7 rounded-lg bg-red-500/20 text-red-400 font-black flex items-center justify-center text-xs">
                                    {suspectName.charAt(0).toUpperCase()}
                                  </div>
                                  <div>
                                    <div className="font-bold text-white flex items-center gap-1.5">
                                      <span>@{suspectName}</span>
                                      {report.reportedUserId?.isBanned && (
                                        <span className="bg-red-500/20 text-red-400 text-[9px] px-1.5 py-0.2 rounded font-extrabold border border-red-500/40">
                                          BANNED
                                        </span>
                                      )}
                                    </div>
                                    <span className="text-[10px] text-[#8c8b88] font-mono">
                                      Current Rating: {report.reportedUserId?.rating || '--'}
                                    </span>
                                  </div>
                                </div>
                              </td>

                              <td className="py-3.5 px-4">
                                <div className="flex items-center gap-2">
                                  <div className="w-7 h-7 rounded-lg bg-sky-500/20 text-sky-400 font-black flex items-center justify-center text-xs">
                                    {reporterName.charAt(0).toUpperCase()}
                                  </div>
                                  <div>
                                    <div className="font-bold text-white">@{reporterName}</div>
                                    <span className="text-[10px] text-[#8c8b88] font-mono">
                                      Current Rating: {report.reporterId?.rating || '--'}
                                    </span>
                                  </div>
                                </div>
                              </td>

                              <td className="py-3.5 px-3">
                                <div className="space-y-0.5">
                                  <span className="bg-[#262421] text-white/90 text-[10px] px-2 py-0.5 rounded border border-white/5 font-mono">
                                    {report.problemSlug}
                                  </span>
                                  <div className="text-[11px] font-bold text-amber-300/90 flex items-center gap-1">
                                    <span>⚠️</span>
                                    <span>{report.reason}</span>
                                  </div>
                                  {report.description && (
                                    <p className="text-[10px] text-[#8c8b88] truncate max-w-[180px]" title={report.description}>
                                      "{report.description}"
                                    </p>
                                  )}
                                </div>
                              </td>

                              <td className="py-3.5 px-3">
                                {reportedOld !== undefined && reportedNew !== undefined ? (
                                  <div className="space-y-0.5 text-[10px] font-mono">
                                    <div className="text-red-400">
                                      Suspect: {reportedOld} → {reportedNew} ({reportedNew >= reportedOld ? `+${reportedNew - reportedOld}` : reportedNew - reportedOld})
                                    </div>
                                    <div className="text-sky-400">
                                      Victim: {reporterOld} → {reporterNew} ({reporterNew >= reporterOld ? `+${reporterNew - reporterOld}` : reporterNew - reporterOld})
                                    </div>
                                  </div>
                                ) : (
                                  <span className="text-[10px] text-white/30 font-mono">--</span>
                                )}
                              </td>

                              <td className="py-3.5 px-3 text-[#8c8b88] text-[10px] font-mono whitespace-nowrap">
                                {new Date(report.createdAt).toLocaleDateString()}
                              </td>

                              <td className="py-3.5 px-4 text-right space-x-2 whitespace-nowrap">
                                <button
                                  type="button"
                                  onClick={() => setReviewingReport(report)}
                                  className="bg-[#262421] hover:bg-[#302d29] text-white px-2.5 py-1.5 rounded-lg border border-white/10 transition cursor-pointer font-bold text-[11px] inline-flex items-center gap-1"
                                >
                                  <span>🔍</span>
                                  <span>Review Code</span>
                                </button>

                                {!isReverted && (
                                  <button
                                    type="button"
                                    onClick={() => handleRevertRatings(report)}
                                    disabled={reportActionLoadingId === report._id}
                                    className="bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 px-2.5 py-1.5 rounded-lg border border-emerald-500/30 transition cursor-pointer font-bold text-[11px] inline-flex items-center gap-1 disabled:opacity-50"
                                    title="Revert Elo rating shift for both players"
                                  >
                                    <span>⏪</span>
                                    <span>{reportActionLoadingId === report._id ? 'Reverting...' : 'Revert Rating'}</span>
                                  </button>
                                )}

                                {!isReverted && !isDismissed && (
                                  <button
                                    type="button"
                                    onClick={() => handleDismissReport(report)}
                                    disabled={reportActionLoadingId === report._id}
                                    className="bg-white/5 hover:bg-white/10 text-white/60 hover:text-white px-2 py-1.5 rounded-lg border border-white/5 transition cursor-pointer font-bold text-[11px] inline-flex items-center gap-1 disabled:opacity-50"
                                    title="Dismiss this report as invalid"
                                  >
                                    <span>🛡️ Dismiss</span>
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })}
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
                type="button"
                onClick={() => setActiveModalTab('testcases')}
                className={`flex-1 py-3 border-b-2 cursor-pointer transition ${
                  activeModalTab === 'testcases'
                    ? 'border-[#81b64c] text-white bg-white/[0.02]'
                    : 'border-transparent text-[#8c8b88] hover:text-white'
                }`}
              >
                2. Test Cases ({formExamples.length} sample, {formHiddenTests.length} hidden)
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveModalTab('templates');
                  if (!formMetaData?.name || formCodeSnippets.length === 0) {
                    handleAutoInfer();
                  }
                }}
                className={`flex-1 py-3 border-b-2 cursor-pointer transition flex items-center justify-center gap-1.5 ${
                  activeModalTab === 'templates'
                    ? 'border-[#81b64c] text-white bg-white/[0.02]'
                    : 'border-transparent text-[#8c8b88] hover:text-white'
                }`}
              >
                <span>⚡</span>
                <span>3. Code Templates & Signature</span>
              </button>
            </div>

            {modalError && (
              <div className="bg-red-500/15 border-b border-red-500/30 p-3 text-xs text-red-400 font-medium text-center">
                {modalError}
              </div>
            )}

            {/* Modal Form Content */}
            <form onSubmit={handleSaveProblem} className="flex-1 overflow-y-auto p-6 space-y-5">
              {activeModalTab === 'info' && (
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
              )}

              {activeModalTab === 'testcases' && (
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
                              {!checkBracketBalance(ex.input) && (
                                <div className="text-[10px] text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 font-sans mt-1">
                                  ⚠️ Syntax warning: Unbalanced brackets or quotes in input
                                </div>
                              )}
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
                      {formHiddenTests.length === 0 ? (
                        <div className="bg-[#181714] border border-dashed border-white/10 rounded-xl p-5 text-center text-xs text-[#8c8b88]">
                          No hidden test cases configured for this problem. Click <strong className="text-white">+ Add Hidden Case</strong> above to add one.
                        </div>
                      ) : (
                        formHiddenTests.map((tc, idx) => (
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
                                {!checkBracketBalance(tc.input) && (
                                  <div className="text-[10px] text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 font-sans mt-1">
                                    ⚠️ Syntax warning: Unbalanced brackets or quotes in input
                                  </div>
                                )}
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
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}

              {activeModalTab === 'templates' && (
                <div className="space-y-5">
                  <div className="flex items-center justify-between bg-[#161512] p-4 rounded-xl border border-white/10">
                    <div>
                      <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                        <span>⚡</span> Function Signature & Code Templates
                      </h3>
                      <p className="text-[11px] text-[#8c8b88] mt-0.5">
                        Automatically detected from testcase inputs & expected outputs.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleAutoInfer}
                      disabled={inferringMeta}
                      className="bg-[#2b2926] hover:bg-[#383531] text-[#81b64c] text-xs px-3 py-1.5 rounded-lg border border-[#81b64c]/30 transition cursor-pointer font-bold flex items-center gap-1.5"
                    >
                      {inferringMeta ? (
                        <>
                          <span className="animate-spin text-xs">⏳</span>
                          <span>Detecting...</span>
                        </>
                      ) : (
                        <>
                          <span>🔄</span>
                          <span>Re-Detect from Examples</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Function Signature Config */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] text-[#8c8b88] block mb-1 font-bold">Function Name</label>
                      <input
                        type="text"
                        value={formMetaData?.name || ''}
                        onChange={(e) => setFormMetaData(prev => ({ ...(prev || {}), name: e.target.value }))}
                        placeholder="e.g. diagonalSum"
                        className="w-full bg-[#161512] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white font-mono focus:outline-none focus:border-[#81b64c]"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] text-[#8c8b88] block mb-1 font-bold">Return Type</label>
                      <input
                        type="text"
                        value={formMetaData?.return?.type || 'integer'}
                        onChange={(e) => setFormMetaData(prev => ({ ...(prev || {}), return: { type: e.target.value } }))}
                        placeholder="e.g. integer, integer[][], boolean"
                        className="w-full bg-[#161512] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white font-mono focus:outline-none focus:border-[#81b64c]"
                      />
                    </div>
                  </div>

                  {/* Inferred Parameters */}
                  <div>
                    <label className="text-[10px] text-[#8c8b88] block mb-1 font-bold">Inferred Parameters</label>
                    <div className="flex flex-wrap gap-2">
                      {(formMetaData?.params && formMetaData.params.length > 0) ? (
                        formMetaData.params.map((p, pIdx) => (
                          <div key={pIdx} className="bg-[#262421] border border-white/10 px-2.5 py-1 rounded-lg text-xs font-mono flex items-center gap-1.5 text-white">
                            <span className="text-[#81b64c] font-bold">{p.name}:</span>
                            <span className="text-[#a09e9a]">{p.type}</span>
                          </div>
                        ))
                      ) : (
                        <span className="text-xs text-[#8c8b88] italic">No parameters detected yet. Add examples in tab 2.</span>
                      )}
                    </div>
                  </div>

                  {/* Code Snippets Preview / Editor */}
                  <div className="space-y-3 pt-3 border-t border-white/10">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-white uppercase tracking-wider">
                        Starter Code Templates
                      </label>
                      <div className="flex items-center gap-1.5">
                        {[
                          { label: 'C++', slug: 'cpp' },
                          { label: 'Java', slug: 'java' },
                          { label: 'Python 3', slug: 'python' },
                          { label: 'JavaScript', slug: 'javascript' }
                        ].map(l => (
                          <button
                            key={l.slug}
                            type="button"
                            onClick={() => setSelectedSnippetLang(l.slug)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                              selectedSnippetLang === l.slug
                                ? 'bg-[#81b64c] text-white'
                                : 'bg-[#1e1d1a] text-[#8c8b88] hover:text-white border border-white/5'
                            }`}
                          >
                            {l.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="relative">
                      <textarea
                        rows={8}
                        value={formCodeSnippets.find(s => s.langSlug === selectedSnippetLang)?.code || ''}
                        onChange={(e) => {
                          const updatedCode = e.target.value;
                          setFormCodeSnippets(prev => {
                            const exists = prev.some(s => s.langSlug === selectedSnippetLang);
                            if (exists) {
                              return prev.map(s => s.langSlug === selectedSnippetLang ? { ...s, code: updatedCode } : s);
                            }
                            const langLabels = { cpp: 'C++', java: 'Java', python: 'Python 3', javascript: 'JavaScript' };
                            return [...prev, { lang: langLabels[selectedSnippetLang] || selectedSnippetLang, langSlug: selectedSnippetLang, code: updatedCode }];
                          });
                        }}
                        placeholder="// Code template will be generated automatically..."
                        className="w-full bg-[#0d0c0b] border border-white/10 rounded-xl p-3 text-xs text-white font-mono leading-relaxed focus:outline-none focus:border-[#81b64c] resize-none"
                      />
                    </div>
                  </div>
                </div>
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

                {activeModalTab === 'info' && (
                  <button
                    type="button"
                    onClick={() => setActiveModalTab('testcases')}
                    className="bg-[#81b64c] hover:bg-[#92c55b] text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-md transition cursor-pointer"
                  >
                    Next: Test Cases →
                  </button>
                )}

                {activeModalTab === 'testcases' && (
                  <button
                    type="button"
                    onClick={() => {
                      setActiveModalTab('templates');
                      if (!formMetaData?.name || formCodeSnippets.length === 0) {
                        handleAutoInfer();
                      }
                    }}
                    className="bg-[#81b64c] hover:bg-[#92c55b] text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-md transition cursor-pointer"
                  >
                    Next: Code Templates →
                  </button>
                )}

                {activeModalTab === 'templates' && (
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
                  <label className="text-[#8c8b88] font-bold block mb-1">Status Override</label>
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

              {/* Scheduled Time Setting & Auto-Lifecycle Preview */}
              <div className="bg-[#161512] border border-white/10 rounded-xl p-3.5 space-y-2.5">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <label className="text-white font-bold text-xs flex items-center gap-1.5">
                    <span>⏰</span>
                    <span>Scheduled Start Time & Live Automation</span>
                    <span className="text-[10px] text-[#81b64c] font-normal bg-[#81b64c]/10 px-1.5 py-0.5 rounded border border-[#81b64c]/20">
                      Auto-Lifecycle
                    </span>
                  </label>
                  <div className="text-[11px] text-[#8c8b88]">
                    {(() => {
                      if (!tourneyStartTime) return null;
                      const sTime = new Date(tourneyStartTime).getTime();
                      const durationMs = (parseInt(tourneyDuration, 10) || 15) * 60 * 1000;
                      const eTime = sTime + durationMs;
                      const now = Date.now();
                      if (now >= eTime) {
                        return <span className="text-sky-400 font-bold">🏁 Concluded (Time Over)</span>;
                      } else if (now >= sTime) {
                        const minsLeft = Math.max(1, Math.round((eTime - now) / 60000));
                        return <span className="text-emerald-400 font-bold animate-pulse">🔴 Live Now! ({minsLeft}m remaining)</span>;
                      } else {
                        const diffMins = Math.round((sTime - now) / 60000);
                        return <span className="text-amber-400 font-bold">⏳ Starts in {diffMins > 60 ? `${Math.floor(diffMins / 60)}h ${diffMins % 60}m` : `${diffMins}m`}</span>;
                      }
                    })()}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <input
                      type="datetime-local"
                      required
                      value={tourneyStartTime}
                      onChange={(e) => setTourneyStartTime(e.target.value)}
                      className="w-full bg-[#1b1a18] border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#81b64c] text-xs font-mono"
                    />
                    <span className="text-[10px] text-[#8c8b88] mt-1.5 block leading-relaxed">
                      At this scheduled moment, the tournament automatically turns <strong>LIVE</strong>. Only users registered beforehand can enter.
                    </span>
                  </div>

                  <div className="bg-[#1b1a18] border border-white/5 rounded-xl p-2.5 flex flex-col justify-center text-xs space-y-1.5 font-mono">
                    <div className="flex items-center justify-between text-white/60 text-[11px]">
                      <span>Start Moment:</span>
                      <span className="text-white font-semibold">
                        {tourneyStartTime ? new Date(tourneyStartTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' }) : '--'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-white/60 text-[11px]">
                      <span>End Moment:</span>
                      <span className="text-[#81b64c] font-semibold">
                        {tourneyStartTime ? new Date(new Date(tourneyStartTime).getTime() + (parseInt(tourneyDuration, 10) || 15) * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' }) : '--'}
                      </span>
                    </div>
                    <div className="text-[10px] text-white/40 pt-1 border-t border-white/5 font-sans leading-tight">
                      When tournament time expires, it automatically transitions to <strong>COMPLETED</strong> and closes submissions.
                    </div>
                  </div>
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

      {/* CHEATING REPORT CODE REVIEW & ROLLBACK MODAL */}
      {reviewingReport && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#1a1916] border border-white/10 rounded-2xl w-full max-w-6xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in duration-150">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-[#2d2a26] flex items-center justify-between shrink-0 bg-[#262421]">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🚨</span>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base sm:text-lg font-black text-white">
                      Code & Match Investigation — Report #{reviewingReport._id?.slice(-6)}
                    </h2>
                    {reviewingReport.status === 'RESOLVED_REVERTED' || reviewingReport.ratingReverted ? (
                      <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-wider">
                        ⏪ Ratings Reverted
                      </span>
                    ) : reviewingReport.status === 'DISMISSED' ? (
                      <span className="bg-white/10 text-white/50 border border-white/10 text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-wider">
                        🛡️ Dismissed
                      </span>
                    ) : (
                      <span className="bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-wider animate-pulse">
                        ⏳ Pending Review
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#8c8b88] mt-0.5">
                    Problem: <span className="font-mono text-white font-bold">{reviewingReport.problemSlug}</span> • Reason: <span className="text-amber-400 font-bold">{reviewingReport.reason}</span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setReviewingReport(null)}
                className="text-white/50 hover:text-white text-lg font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Match Information Bar */}
            <div className="p-4 bg-[#141311] border-b border-[#2d2a26] grid grid-cols-1 md:grid-cols-3 gap-3 text-xs shrink-0">
              <div className="bg-[#1f1e1b] p-3 rounded-xl border border-white/5 space-y-1">
                <div className="text-[#8c8b88] text-[10px] uppercase font-bold tracking-wider">Suspected Cheater</div>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-sm">@{reviewingReport.reportedUserId?.username || 'Unknown'}</span>
                  {reviewingReport.reportedUserId?.isBanned && (
                    <span className="bg-red-500/20 text-red-400 text-[10px] px-2 py-0.5 rounded font-black border border-red-500/40">
                      BANNED
                    </span>
                  )}
                </div>
                <div className="text-[11px] font-mono text-red-400">
                  Rating Shift: {reviewingReport.ratingDetails?.reportedOldRating ?? '--'} → {reviewingReport.ratingDetails?.reportedNewRating ?? '--'}
                </div>
              </div>

              <div className="bg-[#1f1e1b] p-3 rounded-xl border border-white/5 space-y-1">
                <div className="text-[#8c8b88] text-[10px] uppercase font-bold tracking-wider">Reporter (Alleged Victim)</div>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-sm">@{reviewingReport.reporterId?.username || 'Unknown'}</span>
                </div>
                <div className="text-[11px] font-mono text-sky-400">
                  Rating Shift: {reviewingReport.ratingDetails?.reporterOldRating ?? '--'} → {reviewingReport.ratingDetails?.reporterNewRating ?? '--'}
                </div>
              </div>

              <div className="bg-[#1f1e1b] p-3 rounded-xl border border-white/5 space-y-1">
                <div className="text-[#8c8b88] text-[10px] uppercase font-bold tracking-wider">Reporter's Complaint</div>
                <p className="text-white/90 text-xs italic line-clamp-2" title={reviewingReport.description}>
                  "{reviewingReport.description || 'No additional remarks provided.'}"
                </p>
                {reviewingReport.adminNotes && (
                  <p className="text-[10px] text-emerald-400 mt-1 font-semibold">
                    Admin note: {reviewingReport.adminNotes}
                  </p>
                )}
              </div>
            </div>

            {/* Side-by-Side Monaco Editor Comparison */}
            <div className="flex-1 overflow-y-auto p-4 grid grid-cols-1 lg:grid-cols-2 gap-4 min-h-0">
              {/* Suspected Code */}
              <div className="flex flex-col bg-[#141311] border border-red-500/20 rounded-xl overflow-hidden shadow-inner h-full min-h-[380px]">
                <div className="bg-[#241c1c] px-3.5 py-2.5 border-b border-red-500/20 flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">⚠️</span>
                    <span className="text-xs font-black text-red-300">
                      Suspected Cheater's Code (@{reviewingReport.reportedUserId?.username || 'Suspect'})
                    </span>
                  </div>
                  <span className="text-[10px] font-mono uppercase bg-red-500/20 text-red-400 px-2 py-0.5 rounded font-bold">
                    {reviewingReport.reportedLanguage || 'javascript'}
                  </span>
                </div>
                <div className="flex-1 h-[380px]">
                  <Editor
                    height="100%"
                    language={reviewingReport.reportedLanguage || 'javascript'}
                    theme="vs-dark"
                    value={reviewingReport.reportedCode || '// No code captured for this player'}
                    options={{
                      readOnly: true,
                      minimap: { enabled: false },
                      fontSize: 13,
                      scrollBeyondLastLine: false,
                      wordWrap: 'on'
                    }}
                  />
                </div>
              </div>

              {/* Reporter Code */}
              <div className="flex flex-col bg-[#141311] border border-sky-500/20 rounded-xl overflow-hidden shadow-inner h-full min-h-[380px]">
                <div className="bg-[#1c2226] px-3.5 py-2.5 border-b border-sky-500/20 flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">👤</span>
                    <span className="text-xs font-black text-sky-300">
                      Reporter's Code (@{reviewingReport.reporterId?.username || 'Reporter'})
                    </span>
                  </div>
                  <span className="text-[10px] font-mono uppercase bg-sky-500/20 text-sky-400 px-2 py-0.5 rounded font-bold">
                    {reviewingReport.reporterLanguage || 'javascript'}
                  </span>
                </div>
                <div className="flex-1 h-[380px]">
                  <Editor
                    height="100%"
                    language={reviewingReport.reporterLanguage || 'javascript'}
                    theme="vs-dark"
                    value={reviewingReport.reporterCode || '// No code captured for reporter'}
                    options={{
                      readOnly: true,
                      minimap: { enabled: false },
                      fontSize: 13,
                      scrollBeyondLastLine: false,
                      wordWrap: 'on'
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Modal Footer with Actions */}
            <div className="p-4 border-t border-[#2d2a26] flex flex-wrap items-center justify-between gap-3 bg-[#262421] shrink-0">
              <div className="flex items-center gap-2">
                {!reviewingReport.reportedUserId?.isBanned && (
                  <button
                    type="button"
                    onClick={() => handleBanFromReport(reviewingReport.reportedUserId?._id, reviewingReport.reportedUserId?.username)}
                    className="bg-red-500/15 hover:bg-red-500/25 text-red-400 px-3 py-2 rounded-xl border border-red-500/30 text-xs font-bold transition cursor-pointer flex items-center gap-1.5"
                  >
                    <span>🔨</span>
                    <span>Ban Suspect (@{reviewingReport.reportedUserId?.username})</span>
                  </button>
                )}

                {reviewingReport.status === 'PENDING' && (
                  <button
                    type="button"
                    onClick={() => handleDismissReport(reviewingReport)}
                    disabled={reportActionLoadingId === reviewingReport._id}
                    className="bg-white/5 hover:bg-white/10 text-white/70 hover:text-white px-3 py-2 rounded-xl border border-white/10 text-xs font-bold transition cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <span>🛡️</span>
                    <span>Dismiss Report</span>
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setReviewingReport(null)}
                  className="bg-[#2b2926] hover:bg-[#383531] text-white text-xs font-bold px-4 py-2 rounded-xl border border-white/10 transition cursor-pointer"
                >
                  Close
                </button>

                {!(reviewingReport.status === 'RESOLVED_REVERTED' || reviewingReport.ratingReverted) ? (
                  <button
                    type="button"
                    onClick={() => handleRevertRatings(reviewingReport)}
                    disabled={reportActionLoadingId === reviewingReport._id}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold px-5 py-2 rounded-xl shadow-lg shadow-emerald-600/30 transition cursor-pointer flex items-center gap-2 disabled:opacity-50"
                  >
                    <span>⏪</span>
                    <span>{reportActionLoadingId === reviewingReport._id ? 'Reverting Ratings...' : 'Revert Both Player Ratings (Undo Battle Elo)'}</span>
                  </button>
                ) : (
                  <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-black px-4 py-2 rounded-xl flex items-center gap-1.5">
                    <span>✅</span>
                    <span>Ratings Already Reverted</span>
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
