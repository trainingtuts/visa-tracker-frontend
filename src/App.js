import React, { useState, useEffect } from 'react';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import { Plus, Trash2, TrendingUp } from 'lucide-react';

const API_URL = process.env.REACT_APP_API_URL || 'https://visa-tracker-api-tau.vercel.app';

export default function VisaTracker() {
  const [tab, setTab] = useState('dashboard');
  const [students, setStudents] = useState([]);
  const [dailySummaries, setDailySummaries] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    joining_date: '',
    interview_date: '',
    decision_date: '',
    notes: ''
  });

  // Fetch students from API on mount
  useEffect(() => {
    fetchStudents();
  }, []);

  // Recalculate summaries when students change
  useEffect(() => {
    generateDailySummaries(students);
  }, [students]);

  const fetchStudents = async () => {
    try {
      const response = await fetch(`${API_URL}/api/students`);
      const data = await response.json();
      setStudents(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error:', error);
    }
  }; 
 
 
   const generateDailySummaries = (data) => {
    const summaries = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];

      const approvedOnDate = data.filter(s => 
        s.visa_milestones?.[0]?.status === 'approved' && 
        s.visa_milestones?.[0]?.decision_date === dateStr
      ).length;
      
      const rejectedOnDate = data.filter(s => 
        s.visa_milestones?.[0]?.status === 'rejected' && 
        s.visa_milestones?.[0]?.decision_date === dateStr
      ).length;

      summaries.push({
        date: dateStr,
        totalStudents: data.length,
        approved: approvedOnDate,
        rejected: rejectedOnDate
      });
    }
    setDailySummaries(summaries);
  };

  const calculateStats = () => {
    const approved = students.filter(s => s.visa_milestones?.[0]?.status === 'approved').length;
    const rejected = students.filter(s => s.visa_milestones?.[0]?.status === 'rejected').length;
    const pending = students.filter(s => !s.visa_milestones?.[0]?.status || s.visa_milestones?.[0]?.status === 'pending').length;
    const interviewed = students.filter(s => s.visa_milestones?.[0]?.interview_date).length;

    return { approved, rejected, pending, interviewed, total: students.length };
  };

  const calculateDays = (from, to) => {
    if (!from || !to) return '-';
    const d1 = new Date(from);
    const d2 = new Date(to);
    const days = Math.floor((d2 - d1) / (1000 * 60 * 60 * 24));
    return days >= 0 ? days : '-';
  };

  const filteredStudents = students.filter(s =>
    s.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.phone?.includes(searchQuery)
  );

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddStudent = async () => {
    // Name is required
    if (!formData.name) {
      alert('Student name is required');
      return;
    }

    // Interview date is required
    if (!formData.interview_date) {
      alert('Interview date is required');
      return;
    }

    setLoading(true);
    try {
      const method = editId ? 'PUT' : 'POST';
      const url = editId 
        ? `${API_URL}/api/students/${editId}` 
        : `${API_URL}/api/students`;

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        fetchStudents();
        resetForm();
        setShowForm(false);
        setEditId(null);
      } else {
        alert('Error saving student');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to save student');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (student) => {
    const milestone = student.visa_milestones?.[0] || {};
    setFormData({
      name: student.name,
      phone: student.phone || '',
      joining_date: milestone.joining_date || '',
      interview_date: milestone.interview_date || '',
      decision_date: milestone.decision_date || '',
      notes: milestone.notes || ''
    });
    setEditId(student.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this student?')) {
      try {
        await fetch(`${API_URL}/api/students/${id}`, { method: 'DELETE' });
        fetchStudents();
      } catch (error) {
        alert('Error deleting student');
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
      <style>{`* { margin: 0; padding: 0; box-sizing: border-box; } body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; } button { transition: all 0.3s; } button:hover { transform: translateY(-2px); } input, select, textarea { border: 1px solid #cbd5e1; padding: 10px; border-radius: 6px; font-size: 14px; color: #0f172a; width: 100%; } input:focus, select:focus, textarea:focus { outline: none; border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59, 130, 244, 0.1); }`}</style>

      {/* Header */}
      <div className="bg-slate-800/50 backdrop-blur border-b border-blue-500/20">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 md:py-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-4xl font-bold text-white mb-1">🇩🇪 German Visa Tracker</h1>
              <p className="text-blue-300 text-sm md:text-base">Crowdsourced visa timeline tracking</p>
            </div>
            <button
              onClick={() => setShowForm(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 md:px-6 py-2 md:py-3 rounded-lg font-semibold flex items-center gap-2 w-full md:w-auto justify-center"
            >
              <Plus size={20} /> Add Student
            </button>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-slate-800/30 border-b border-blue-500/10 sticky top-0 z-10 overflow-x-auto">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="flex gap-4 md:gap-8 whitespace-nowrap">
            {['dashboard', 'students', 'daily'].map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`py-4 px-2 md:px-4 font-semibold border-b-2 transition text-sm md:text-base ${
                  tab === t ? 'border-blue-500 text-blue-400' : 'border-transparent text-slate-400 hover:text-slate-300'
                }`}
              >
                {t === 'dashboard' && '📊 Dashboard'}
                {t === 'students' && `👥 Students (${students.length})`}
                {t === 'daily' && '📈 Daily'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-8">

        {/* Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-slate-800 rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-blue-500/20">
              <div className="sticky top-0 bg-slate-800 border-b border-blue-500/20 p-4 md:p-6 flex justify-between items-center">
                <h2 className="text-xl md:text-2xl font-bold text-white">{editId ? 'Edit' : 'Add'} Student</h2>
                <button onClick={() => { setShowForm(false); resetForm(); setEditId(null); }} className="text-slate-400 hover:text-white">✕</button>
              </div>

              <div className="p-4 md:p-6 space-y-4">
                {/* Name */}
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">Student Name *</label>
                  <input type="text" name="name" value={formData.name} onChange={handleInputChange} placeholder="Full name" />
                </div>

                {/* Phone - Optional */}
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">Phone Number (Optional)</label>
                  <input type="tel" name="phone" value={formData.phone} onChange={handleInputChange} placeholder="+92 300 1234567" />
                </div>

                {/* Dates - Mobile Friendly */}
                <div className="border-t border-blue-500/20 pt-4">
                  <h3 className="font-semibold text-slate-300 mb-4">Key Dates</h3>
                  
                  {/* Joining Date */}
                  <div className="mb-4">
                    <label className="block text-sm font-semibold text-slate-300 mb-2">Joining Date</label>
                    <input type="date" name="joining_date" value={formData.joining_date} onChange={handleInputChange} />
                  </div>

                  {/* Interview Date - Required */}
                  <div className="mb-4">
                    <label className="block text-sm font-semibold text-slate-300 mb-2">Interview Date *</label>
                    <input type="date" name="interview_date" value={formData.interview_date} onChange={handleInputChange} />
                  </div>

                  {/* Decision Date */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-300 mb-2">Decision Made Date</label>
                    <input type="date" name="decision_date" value={formData.decision_date} onChange={handleInputChange} />
                  </div>
                </div>

                {/* Notes */}
                <div className="border-t border-blue-500/20 pt-4">
                  <label className="block text-sm font-semibold text-slate-300 mb-2">Additional Notes</label>
                  <textarea name="notes" value={formData.notes} onChange={handleInputChange} placeholder="Any notes..." rows="3" style={{width: '100%'}} />
                </div>
              </div>

              <div className="border-t border-blue-500/20 p-4 md:p-6 flex gap-4 justify-end">
                <button onClick={() => { setShowForm(false); resetForm(); setEditId(null); }} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-semibold">Cancel</button>
                <button onClick={handleAddStudent} disabled={loading} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold">{loading ? 'Saving...' : editId ? 'Update' : 'Add'} Student</button>
              </div>
            </div>
          </div>
        )}

        {/* Dashboard Tab */}
        {tab === 'dashboard' && (
          <div className="space-y-6 md:space-y-8">
            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
              {[
                { label: 'Total Students', value: stats.total, icon: '👥' },
                { label: 'Approved', value: stats.approved, icon: '✅' },
                { label: 'Pending', value: stats.pending, icon: '⏳' },
                { label: 'Rejected', value: stats.rejected, icon: '❌' }
              ].map((stat, i) => (
                <div key={i} className="bg-slate-800/50 border border-blue-500/20 rounded-lg p-3 md:p-6 backdrop-blur">
                  <p className="text-slate-400 text-xs md:text-sm font-semibold">{stat.label}</p>
                  <p className="text-2xl md:text-4xl font-bold text-white mt-2">{stat.value}</p>
                  <div className="text-4xl opacity-50">{stat.icon}</div>
                </div>
              ))}
            </div>
 
            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
              {/* Status Distribution */}
              <div className="bg-slate-800/50 border border-blue-500/20 rounded-lg p-4 md:p-6 backdrop-blur">
                <h3 className="text-lg md:text-xl font-semibold text-white mb-4">Status Distribution</h3>
                {students.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
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
                  <p className="text-slate-400 text-center py-12">No data yet</p>
                )}
              </div>

              {/* Daily Performance */}
              <div className="bg-slate-800/50 border border-blue-500/20 rounded-lg p-4 md:p-6 backdrop-blur">
                <h3 className="text-lg md:text-xl font-semibold text-white mb-4">Last 7 Days Decisions</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={dailySummaries}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                    <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} />
                    <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #3b82f6' }} />
                    <Legend />
                    <Bar dataKey="approved" fill="#10b981" name="Approved" />
                    <Bar dataKey="rejected" fill="#ef4444" name="Rejected" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* Students Tab */}
        {tab === 'students' && (
          <div className="space-y-4">
            {/* Search */}
            <div className="flex flex-col sm:flex-row gap-4">
              <input
                type="text"
                placeholder="🔍 Search by name or phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 px-4 py-3 bg-slate-800/50 border border-blue-500/20 rounded-lg text-white placeholder-slate-400"
              />
              <div className="text-slate-300 py-3 px-4 bg-slate-800/50 border border-blue-500/20 rounded-lg font-semibold whitespace-nowrap">
                {filteredStudents.length} students
              </div>
            </div>

            {/* Table */}
            <div className="bg-slate-800/50 border border-blue-500/20 rounded-lg backdrop-blur overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-900/50 border-b border-blue-500/20">
                  <tr>
                    <th className="px-3 md:px-6 py-3 text-left font-semibold text-slate-300">Name</th>
                    <th className="px-3 md:px-6 py-3 text-left font-semibold text-slate-300 hidden sm:table-cell">Phone</th>
                    <th className="px-3 md:px-6 py-3 text-left font-semibold text-slate-300 hidden md:table-cell">Interview</th>
                    <th className="px-3 md:px-6 py-3 text-left font-semibold text-slate-300">Status</th>
                    <th className="px-3 md:px-6 py-3 text-left font-semibold text-slate-300">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="px-6 py-12 text-center text-slate-400">
                        {students.length === 0 ? 'No students yet' : 'No matches found'}
                      </td>
                    </tr>
                  ) : (
                    filteredStudents.map(s => {
                      const milestone = s.visa_milestones?.[0] || {};
                      return (
                        <tr key={s.id} className="border-b border-blue-500/10 hover:bg-slate-700/20">
                          <td className="px-3 md:px-6 py-4 text-white font-semibold text-sm md:text-base">{s.name}</td>
                          <td className="px-3 md:px-6 py-4 text-slate-300 text-xs md:text-sm hidden sm:table-cell">{s.phone || '-'}</td>
                          <td className="px-3 md:px-6 py-4 text-slate-300 text-xs md:text-sm hidden md:table-cell">{milestone.interview_date || '-'}</td>
                          <td className="px-3 md:px-6 py-4">
                            <span className={`px-2 py-1 rounded text-xs font-semibold ${
                              milestone.status === 'approved' ? 'bg-green-500/20 text-green-400' :
                              milestone.status === 'rejected' ? 'bg-red-500/20 text-red-400' :
                              'bg-yellow-500/20 text-yellow-400'
                            }`}>
                              {milestone.status === 'approved' ? '✅' : milestone.status === 'rejected' ? '❌' : '⏳'}
                            </span>
                          </td>
                          <td className="px-3 md:px-6 py-4 flex gap-2">
                            <button onClick={() => handleEdit(s)} className="text-blue-400 text-xs md:text-sm font-semibold">Edit</button>
                            <button onClick={() => handleDelete(s.id)} className="text-red-400 text-xs md:text-sm font-semibold">Delete</button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Daily Summary Tab */}
        {tab === 'daily' && (
          <div className="space-y-4">
            <div className="bg-slate-800/50 border border-blue-500/20 rounded-lg p-4 md:p-6 backdrop-blur">
              <h3 className="text-xl font-bold text-white">📅 Decision Activity</h3>
              <p className="text-slate-400 text-sm mt-1">Grouped by decision date</p>
            </div>

            {/* Grouped by decision date */}
            {(() => {
              const decisionDates = [...new Set(
                students
                  .filter(s => s.visa_milestones?.[0]?.decision_date)
                  .map(s => s.visa_milestones[0].decision_date)
              )].sort((a, b) => new Date(b) - new Date(a));

              if (decisionDates.length === 0) {
                return <div className="text-center text-slate-400 py-8">No decision updates recorded yet</div>;
              }

              return decisionDates.map(date => {
                const dateStudents = students.filter(s => s.visa_milestones?.[0]?.decision_date === date);
                return (
                  <div key={date} className="bg-slate-800/50 border border-blue-500/20 rounded-lg p-4 md:p-6 backdrop-blur">
                    <div className="flex justify-between items-center mb-4 pb-3 border-b border-blue-500/20">
                      <h4 className="text-lg font-bold text-white">📅 {date}</h4>
                      <span className="bg-slate-700 text-slate-300 text-xs px-3 py-1 rounded-full font-semibold">{dateStudents.length}</span>
                    </div>
                    <div className="space-y-3">
                      {dateStudents.map(student => {
                        const m = student.visa_milestones?.[0] || {};
                        return (
                          <div key={student.id} className="bg-slate-900/60 border border-slate-700/50 rounded p-3 text-sm">
                            <div className="font-semibold text-white mb-2">{student.name}</div>
                            <div className="grid grid-cols-2 gap-2 text-xs text-slate-300">
                              <div>Interview: {m.interview_date || 'N/A'}</div>
                              <div>Decision: {m.decision_date}</div>
                              <div className="col-span-2">
                                Status: <span className={m.status === 'approved' ? 'text-green-400' : m.status === 'rejected' ? 'text-red-400' : 'text-yellow-400'}>
                                  {m.status === 'approved' ? '✅ Approved' : m.status === 'rejected' ? '❌ Rejected' : '⏳ Pending'}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        )}

      </div>
    </div>
  );
}