import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Plus, Trash2, Eye, EyeOff, TrendingUp } from 'lucide-react';

// Initialize Supabase connection
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials. Check your .env.local file');
}

const supabase = createClient(supabaseUrl, supabaseKey);

export default function VisaTracker() {
  const [tab, setTab] = useState('dashboard');
  const [students, setStudents] = useState([]);
  const [dailySummaries, setDailySummaries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    joining_date: '',
    interview_date: '',
    decision_date: '',
    notes: ''
  });

  const [searchQuery, setSearchQuery] = useState('');

  // Load students from database when app starts
  useEffect(() => {
    loadStudentsFromDatabase();
    generateDailySummaries([]);
  }, []);

  // ===== FETCH DATA FROM DATABASE =====
  const loadStudentsFromDatabase = async () => {
    try {
      setLoading(true);
      setError('');
      console.log('📥 Fetching students from Supabase...');
      
      const { data, error: fetchError } = await supabase
        .from('students')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) {
        console.error('❌ Error loading students:', fetchError.message);
        setError('Error loading students: ' + fetchError.message);
        return;
      }

      console.log('✅ Students loaded from database:', data);
      setStudents(data || []);
    } catch (err) {
      console.error('❌ Unexpected error:', err);
      setError('Unexpected error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const generateDailySummaries = (data) => {
    const summaries = [];
    for (let i = 7; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];

      summaries.push({
        date: dateStr,
        totalStudents: Math.floor(Math.random() * 20) + 5,
        newSubmissions: Math.floor(Math.random() * 5) + 1,
        approved: Math.floor(Math.random() * 8) + 2,
        rejected: Math.floor(Math.random() * 3) + 1,
        pending_interviews: Math.floor(Math.random() * 5) + 1
      });
    }
    setDailySummaries(summaries);
  };

  const calculateStats = () => {
    const approved = students.filter(s => s.status === 'approved').length;
    const rejected = students.filter(s => s.status === 'rejected').length;
    const pending = students.filter(s => s.status === 'pending' || !s.status).length;
    const interviewed = students.filter(s => s.interview_date).length;

    return { approved, rejected, pending, interviewed, total: students.length };
  };

  // Calculate days from today to interview date
  const calculateDaysToInterview = (interviewDate) => {
    if (!interviewDate) return '-';
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const interview = new Date(interviewDate);
    interview.setHours(0, 0, 0, 0);
    const days = Math.ceil((interview - today) / (1000 * 60 * 60 * 24));
    return days >= 0 ? days : '-';
  };

  // Get today's date in YYYY-MM-DD format
  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  // Get students with decision made today
  const getTodaysDecisions = () => {
    const today = getTodayDate();
    return students.filter(s => s.decision_date === today);
  };

  const filteredStudents = students.filter(s => {
    const matchesSearch = s.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          s.phone?.includes(searchQuery);
    const matchesStatus = statusFilter === 'all' || s.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // ===== SAVE DATA TO DATABASE =====
  const handleAddStudent = async () => {
    // Validation
    if (!formData.name || !formData.name.trim()) {
      setError('Student name is required');
      return;
    }

    if (!formData.interview_date) {
      setError('Interview date is required');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      if (editId) {
        // UPDATE existing student in database
        console.log('✏️ Updating student:', editId);
        const { error: updateError } = await supabase
          .from('students')
          .update({
            name: formData.name.trim(),
            phone: formData.phone?.trim() || null,
            joining_date: formData.joining_date || null,
            interview_date: formData.interview_date,
            decision_date: formData.decision_date || null,
            notes: formData.notes.trim() || null,
            status: formData.decision_date ? 'approved' : 'pending',
            updated_at: new Date().toISOString()
          })
          .eq('id', editId);

        if (updateError) {
          console.error('❌ Update error:', updateError.message);
          setError('Error updating student: ' + updateError.message);
          return;
        }
        console.log('✅ Student updated successfully');
      } else {
        // INSERT new student to database
        console.log('➕ Adding new student:', formData.name);
        const { error: insertError } = await supabase
          .from('students')
          .insert([{
            name: formData.name.trim(),
            phone: formData.phone?.trim() || null,
            joining_date: formData.joining_date || null,
            interview_date: formData.interview_date,
            decision_date: formData.decision_date || null,
            notes: formData.notes.trim() || null,
            status: formData.decision_date ? 'approved' : 'pending'
          }]);

        if (insertError) {
          console.error('❌ Insert error:', insertError.message);
          setError('Error adding student: ' + insertError.message);
          return;
        }
        console.log('✅ Student added successfully');
      }

      // Reload students from database
      await loadStudentsFromDatabase();
      resetForm();
      setShowForm(false);
      setEditId(null);
    } catch (err) {
      console.error('❌ Unexpected error:', err);
      setError('Error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (student) => {
    setFormData(student);
    setEditId(student.id);
    setShowForm(true);
    setError('');
  };

  // ===== DELETE DATA FROM DATABASE =====
  const handleDelete = async (id) => {
    if (window.confirm('Delete this student?')) {
      try {
        setLoading(true);
        setError('');
        console.log('🗑️ Deleting student:', id);
        
        const { error: deleteError } = await supabase
          .from('students')
          .delete()
          .eq('id', id);

        if (deleteError) {
          console.error('❌ Delete error:', deleteError.message);
          setError('Error deleting student: ' + deleteError.message);
          return;
        }

        console.log('✅ Student deleted successfully');
        // Reload students from database
        await loadStudentsFromDatabase();
      } catch (err) {
        console.error('❌ Unexpected error:', err);
        setError('Error: ' + err.message);
      } finally {
        setLoading(false);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      phone: '',
      joining_date: '',
      interview_date: '',
      decision_date: '',
      notes: ''
    });
    setError('');
  };

  const stats = calculateStats();
  const statusColors = { approved: '#10b981', rejected: '#ef4444', pending: '#f59e0b' };
  const statusData = [
    { name: 'Approved', value: stats.approved, fill: statusColors.approved },
    { name: 'Rejected', value: stats.rejected, fill: statusColors.rejected },
    { name: 'Pending', value: stats.pending, fill: statusColors.pending }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <style>{`* { margin: 0; padding: 0; box-sizing: border-box; } body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; } button { transition: all 0.3s; } button:hover { transform: translateY(-2px); } input, textarea, select { padding: 0.75rem; background-color: rgba(30, 41, 59, 0.5); border: 1px solid rgba(59, 130, 246, 0.2); border-radius: 0.5rem; color: white; font-size: 1rem; } input::placeholder, textarea::placeholder { color: rgb(148, 163, 184); } input:focus, textarea:focus, select:focus { outline: none; border-color: rgb(59, 130, 246); background-color: rgba(30, 41, 59, 0.8); } select option { background-color: rgb(30, 41, 59); color: white; } table tbody tr:hover { background-color: rgba(55, 65, 81, 0.2); }`}</style>

      {/* Header */}
      <div className="bg-slate-800/50 backdrop-blur border-b border-blue-500/20">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">🇩🇪 German Visa Tracker</h1>
              <p className="text-blue-300">Crowdsourced visa timeline tracking system</p>
            </div>
            <button
              onClick={() => { setShowForm(true); setError(''); }}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold flex items-center gap-2"
            >
              <Plus size={20} /> Add Student
            </button>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-slate-800/30 border-b border-blue-500/10 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex gap-8">
            <button
              onClick={() => setTab('dashboard')}
              className={`py-4 px-2 font-semibold border-b-2 transition ${
                tab === 'dashboard'
                  ? 'border-blue-500 text-blue-400'
                  : 'border-transparent text-slate-400 hover:text-slate-300'
              }`}
            >
              📊 Dashboard
            </button>
            <button
              onClick={() => setTab('students')}
              className={`py-4 px-2 font-semibold border-b-2 transition ${
                tab === 'students'
                  ? 'border-blue-500 text-blue-400'
                  : 'border-transparent text-slate-400 hover:text-slate-300'
              }`}
            >
              👥 Students ({students.length})
            </button>
            <button
              onClick={() => setTab('daily')}
              className={`py-4 px-2 font-semibold border-b-2 transition ${
                tab === 'daily'
                  ? 'border-blue-500 text-blue-400'
                  : 'border-transparent text-slate-400 hover:text-slate-300'
              }`}
            >
              📅 Today's Decisions
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Add/Edit Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-slate-800 rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-blue-500/20">
              <div className="sticky top-0 bg-slate-800 border-b border-blue-500/20 p-6 flex justify-between items-center">
                <h2 className="text-2xl font-bold text-white">{editId ? 'Edit' : 'Add'} Student</h2>
                <button onClick={() => { setShowForm(false); resetForm(); setEditId(null); }} className="text-slate-400 hover:text-white">✕</button>
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-500/20 border border-red-500 text-red-300 p-4 m-4 rounded-lg">
                  ⚠️ {error}
                </div>
              )}

              <div className="p-6 space-y-4">
                {/* Personal Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-300 mb-2">Student Name *</label>
                    <input type="text" name="name" value={formData.name} onChange={handleInputChange} placeholder="Full name" className="w-full" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-300 mb-2">Phone Number (Optional)</label>
                    <input type="tel" name="phone" value={formData.phone} onChange={handleInputChange} placeholder="+92 300 1234567" className="w-full" />
                  </div>
                </div>

                {/* Key Dates */}
                <div className="border-t border-blue-500/20 pt-4">
                  <h3 className="font-semibold text-slate-300 mb-4">Key Dates</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-300 mb-2">Joining Date</label>
                      <input type="date" name="joining_date" value={formData.joining_date} onChange={handleInputChange} className="w-full" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-300 mb-2">Interview Date *</label>
                      <input type="date" name="interview_date" value={formData.interview_date} onChange={handleInputChange} className="w-full" required />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-semibold text-slate-300 mb-2">Decision Made Date</label>
                      <input type="date" name="decision_date" value={formData.decision_date} onChange={handleInputChange} className="w-full" />
                    </div>
                  </div>
                </div>

                {/* Notes */}
                <div className="border-t border-blue-500/20 pt-4">
                  <label className="block text-sm font-semibold text-slate-300 mb-2">Additional Notes</label>
                  <textarea name="notes" value={formData.notes} onChange={handleInputChange} placeholder="Any additional notes..." rows="3" className="w-full" />
                </div>
              </div>

              <div className="border-t border-blue-500/20 p-6 flex gap-4 justify-end">
                <button onClick={() => { setShowForm(false); resetForm(); setEditId(null); }} className="px-6 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-semibold">Cancel</button>
                <button onClick={handleAddStudent} disabled={loading} className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold disabled:opacity-50">{loading ? 'Saving...' : (editId ? 'Update' : 'Add')} Student</button>
              </div>
            </div>
          </div>
        )}

        {/* Dashboard Tab */}
        {tab === 'dashboard' && (
          <div className="space-y-8">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { label: 'Total Students', value: stats.total, color: '#3b82f6', icon: '👥' },
                { label: 'Approved', value: stats.approved, color: '#10b981', icon: '✅' },
                { label: 'Pending', value: stats.pending, color: '#f59e0b', icon: '⏳' },
                { label: 'Rejected', value: stats.rejected, color: '#ef4444', icon: '❌' }
              ].map((stat, i) => (
                <div key={i} className="bg-slate-800/50 border border-blue-500/20 rounded-lg p-6 backdrop-blur">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-slate-400 text-sm font-semibold">{stat.label}</p>
                      <p className="text-4xl font-bold text-white mt-2">{stat.value}</p>
                    </div>
                    <div className="text-5xl opacity-50">{stat.icon}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pie Chart Only */}
            <div className="bg-slate-800/50 border border-blue-500/20 rounded-lg p-6 backdrop-blur">
              <h3 className="text-xl font-semibold text-white mb-4">Status Distribution</h3>
              {students.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie data={statusData} cx="50%" cy="50%" labelLine={false} label={({ name, value }) => `${name}: ${value}`} outerRadius={80} dataKey="value">
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-slate-400 text-center py-12">No data yet. Add students to see charts.</p>
              )}
            </div>
          </div>
        )}

        {/* Students Tab */}
        {tab === 'students' && (
          <div className="space-y-4">
            {loading && <p className="text-blue-400 text-center py-2">⏳ Loading...</p>}
            
            {/* Search and Filter */}
            <div className="flex flex-col md:flex-row gap-4">
              <input
                type="text"
                placeholder="🔍 Search by name or phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 px-4 py-3 bg-slate-800/50 border border-blue-500/20 rounded-lg text-white placeholder-slate-400"
              />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-3 bg-slate-800/50 border border-blue-500/20 rounded-lg text-white font-semibold md:w-48"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
              <div className="text-slate-300 py-3 px-4 bg-slate-800/50 border border-blue-500/20 rounded-lg font-semibold whitespace-nowrap">
                {filteredStudents.length} students
              </div>
            </div>

            {/* Students Table */}
            <div className="bg-slate-800/50 border border-blue-500/20 rounded-lg backdrop-blur overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-900/50 border-b border-blue-500/20">
                    <tr>
                      {['Name', 'Phone', 'Joining', 'Interview', 'Days to Interview', 'Decision', 'Status', 'Actions'].map(h => (
                        <th key={h} className="px-6 py-3 text-left text-sm font-semibold text-slate-300">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStudents.length === 0 ? (
                      <tr>
                        <td colSpan="8" className="px-6 py-12 text-center text-slate-400">
                          {students.length === 0 ? 'No students yet. Click "Add Student" to get started.' : 'No matching students found.'}
                        </td>
                      </tr>
                    ) : (
                      filteredStudents.map(s => (
                        <tr key={s.id} className="border-b border-blue-500/10 hover:bg-slate-700/20 transition">
                          <td className="px-6 py-4 text-white font-semibold">{s.name}</td>
                          <td className="px-6 py-4 text-slate-300 text-sm">{s.phone || '-'}</td>
                          <td className="px-6 py-4 text-slate-300 text-sm">{s.joining_date || '-'}</td>
                          <td className="px-6 py-4 text-slate-300 text-sm">{s.interview_date || '-'}</td>
                          <td className="px-6 py-4 text-slate-300 text-sm font-semibold text-blue-400">{calculateDaysToInterview(s.interview_date)} days</td>
                          <td className="px-6 py-4 text-slate-300 text-sm">{s.decision_date || '-'}</td>
                          <td className="px-6 py-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              s.status === 'approved' ? 'bg-green-500/20 text-green-400' :
                              s.status === 'rejected' ? 'bg-red-500/20 text-red-400' :
                              'bg-yellow-500/20 text-yellow-400'
                            }`}>
                              {s.status || 'pending'}
                            </span>
                          </td>
                          <td className="px-6 py-4 flex gap-2">
                            <button onClick={() => handleEdit(s)} className="text-blue-400 hover:text-blue-300 font-semibold">Edit</button>
                            <button onClick={() => handleDelete(s.id)} className="text-red-400 hover:text-red-300 font-semibold">Delete</button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Today's Decisions Tab */}
        {tab === 'daily' && (
          <div className="space-y-6">
            <div className="bg-slate-800/50 border border-blue-500/20 rounded-lg p-6 backdrop-blur">
              <h3 className="text-2xl font-semibold text-white mb-2">📅 Today's Decisions</h3>
              <p className="text-slate-400 mb-6">Showing students with decision made on {getTodayDate()}</p>

              {getTodaysDecisions().length === 0 ? (
                <p className="text-slate-400 text-center py-12">No decisions made today.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-900/50 border-b border-blue-500/20">
                      <tr>
                        {['Name', 'Phone', 'Interview Date', 'Decision Date', 'Status', 'Notes', 'Actions'].map(h => (
                          <th key={h} className="px-6 py-3 text-left text-sm font-semibold text-slate-300">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {getTodaysDecisions().map(s => (
                        <tr key={s.id} className="border-b border-blue-500/10 hover:bg-slate-700/20 transition">
                          <td className="px-6 py-4 text-white font-semibold">{s.name}</td>
                          <td className="px-6 py-4 text-slate-300 text-sm">{s.phone || '-'}</td>
                          <td className="px-6 py-4 text-slate-300 text-sm">{s.interview_date || '-'}</td>
                          <td className="px-6 py-4 text-slate-300 text-sm font-semibold">{s.decision_date}</td>
                          <td className="px-6 py-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              s.status === 'approved' ? 'bg-green-500/20 text-green-400' :
                              s.status === 'rejected' ? 'bg-red-500/20 text-red-400' :
                              'bg-yellow-500/20 text-yellow-400'
                            }`}>
                              {s.status || 'pending'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-slate-300 text-sm">{s.notes || '-'}</td>
                          <td className="px-6 py-4 flex gap-2">
                            <button onClick={() => handleEdit(s)} className="text-blue-400 hover:text-blue-300 font-semibold">Edit</button>
                            <button onClick={() => handleDelete(s.id)} className="text-red-400 hover:text-red-300 font-semibold">Delete</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
