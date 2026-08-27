import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { Plus } from 'lucide-react';

export default function VisaTracker() {
  const [tab, setTab] = useState('dashboard');
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);

  // Status Filter State for Students Tab
  const [statusFilter, setStatusFilter] = useState('all');

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    joining_date: '',
    interview_date: '',
    decision_date: '',
    status: 'pending',
    notes: ''
  });

  const [searchQuery, setSearchQuery] = useState('');

  // Current Date in YYYY-MM-DD
  const todayStr = new Date().toISOString().split('T')[0];

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching data:', error);
    } else {
      setStudents(data || []);
    }
    setLoading(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddStudent = async () => {
    // 3. Interview Date Mandatory & 4. Phone Optional Validation
    if (!formData.name) {
      alert('Student Name is required');
      return;
    }

    if (!formData.interview_date) {
      alert('Interview Date is required');
      return;
    }

    if ((formData.status === 'approved' || formData.status === 'rejected') && !formData.decision_date) {
      alert('Please select Decision Made Date when marking status as Approved or Rejected');
      return;
    }

    if (editId) {
      const { error } = await supabase.from('students').update(formData).eq('id', editId);
      if (error) alert('Error updating: ' + error.message);
    } else {
      const { error } = await supabase.from('students').insert([formData]);
      if (error) alert('Error inserting: ' + error.message);
    }

    resetForm();
    setShowForm(false);
    fetchStudents();
  };

  const handleEdit = (student) => {
    setFormData({
      name: student.name || '',
      phone: student.phone || '',
      joining_date: student.joining_date || '',
      interview_date: student.interview_date || '',
      decision_date: student.decision_date || '',
      status: student.status || 'pending',
      notes: student.notes || ''
    });
    setEditId(student.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this student?')) {
      const { error } = await supabase.from('students').delete().eq('id', id);
      if (error) alert('Error deleting: ' + error.message);
      else fetchStudents();
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      phone: '',
      joining_date: '',
      interview_date: '',
      decision_date: '',
      status: 'pending',
      notes: ''
    });
    setEditId(null);
  };

  const calculateStats = () => {
    const approved = students.filter(s => s.status === 'approved').length;
    const rejected = students.filter(s => s.status === 'rejected').length;
    const pending = students.filter(s => s.status === 'pending' || !s.status).length;
    return { approved, rejected, pending, total: students.length };
  };

  // 2. Correct Formula: Days from Interview Date to Current Date (Today)
  const calculateDaysSinceInterview = (interviewDate) => {
    if (!interviewDate) return '-';
    const interview = new Date(interviewDate);
    const today = new Date(todayStr);
    const diffTime = today - interview;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return diffDays >= 0 ? `${diffDays} days ago` : `In ${Math.abs(diffDays)} days`;
  };

  // 1. Filtering by Status & Search Query
  const filteredStudents = students.filter(s => {
    const matchesSearch = s.name?.toLowerCase().includes(searchQuery.toLowerCase()) || s.phone?.includes(searchQuery);
    const matchesStatus = statusFilter === 'all' || s.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // 5. Daily Summary Filter: Only students whose Decision Date IS CURRENT DATE (Today)
  const todayDecisionStudents = students.filter(
    s => (s.status === 'approved' || s.status === 'rejected') && s.decision_date === todayStr
  );

  const stats = calculateStats();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white">
      {/* Header */}
      <div className="bg-slate-800/50 backdrop-blur border-b border-blue-500/20 px-6 py-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">🇩🇪 German Visa Tracker</h1>
            <p className="text-blue-300 text-sm mt-1">Real-time Visa Updates System</p>
          </div>
          <button
            onClick={() => { resetForm(); setShowForm(true); }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-semibold flex items-center gap-2"
          >
            <Plus size={18} /> Add Student
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-slate-800/30 border-b border-blue-500/10 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 flex gap-8">
          <button
            onClick={() => setTab('dashboard')}
            className={`py-4 font-semibold border-b-2 transition ${
              tab === 'dashboard' ? 'border-blue-400 text-blue-400' : 'border-transparent text-slate-400 hover:text-slate-300'
            }`}
          >
            📊 Dashboard
          </button>
          <button
            onClick={() => setTab('students')}
            className={`py-4 font-semibold border-b-2 transition ${
              tab === 'students' ? 'border-blue-400 text-blue-400' : 'border-transparent text-slate-400 hover:text-slate-300'
            }`}
          >
            👥 Students ({students.length})
          </button>
          <button
            onClick={() => setTab('daily')}
            className={`py-4 font-semibold border-b-2 transition ${
              tab === 'daily' ? 'border-blue-400 text-blue-400' : 'border-transparent text-slate-400 hover:text-slate-300'
            }`}
          >
            📈 Daily Summary
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="max-w-7xl mx-auto p-6">
        {loading ? (
          <div className="text-center py-16 text-slate-400">Loading data from Supabase...</div>
        ) : (
          <>
            {/* Modal Form */}
            {showForm && (
              <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
                <div className="bg-slate-800 border border-blue-500/30 p-6 rounded-lg max-w-lg w-full space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-700 pb-3">
                    <h2 className="text-xl font-bold">{editId ? 'Edit Student' : 'Add Student'}</h2>
                    <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-white">✕</button>
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Student Name *</label>
                    <input type="text" name="name" value={formData.name} onChange={handleInputChange} placeholder="Full Name" className="w-full bg-slate-900 border border-slate-700 p-2.5 rounded text-white" />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Phone Number (Optional)</label>
                    <input type="text" name="phone" value={formData.phone} onChange={handleInputChange} placeholder="Phone Number" className="w-full bg-slate-900 border border-slate-700 p-2.5 rounded text-white" />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Visa Status *</label>
                    <select name="status" value={formData.status} onChange={handleInputChange} className="w-full bg-slate-900 border border-slate-700 p-2.5 rounded text-white">
                      <option value="pending">⏳ Pending</option>
                      <option value="approved">✅ Approved</option>
                      <option value="rejected">❌ Rejected</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-slate-400 block mb-1">Joining Date</label>
                      <input type="date" name="joining_date" value={formData.joining_date} onChange={handleInputChange} className="w-full bg-slate-900 border border-slate-700 p-2.5 rounded text-white" />
                    </div>
                    <div>
                      <label className="text-xs text-slate-400 block mb-1">Interview Date *</label>
                      <input type="date" name="interview_date" value={formData.interview_date} onChange={handleInputChange} className="w-full bg-slate-900 border border-slate-700 p-2.5 rounded text-white" />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Decision Made Date {formData.status !== 'pending' && '*'}</label>
                    <input type="date" name="decision_date" value={formData.decision_date} onChange={handleInputChange} className="w-full bg-slate-900 border border-slate-700 p-2.5 rounded text-white" />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Notes</label>
                    <textarea name="notes" value={formData.notes} onChange={handleInputChange} placeholder="Additional notes..." rows="2" className="w-full bg-slate-900 border border-slate-700 p-2.5 rounded text-white" />
                  </div>
                  <div className="flex gap-2 justify-end pt-3 border-t border-slate-700">
                    <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 rounded font-semibold">Cancel</button>
                    <button onClick={handleAddStudent} className="px-5 py-2 bg-blue-600 hover:bg-blue-700 rounded font-semibold">{editId ? 'Update' : 'Save'}</button>
                  </div>
                </div>
              </div>
            )}

            {/* Dashboard Tab */}
            {tab === 'dashboard' && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                  { label: 'Total Students', value: stats.total, icon: '👥' },
                  { label: 'Approved', value: stats.approved, icon: '✅' },
                  { label: 'Pending', value: stats.pending, icon: '⏳' },
                  { label: 'Rejected', value: stats.rejected, icon: '❌' }
                ].map((stat, i) => (
                  <div key={i} className="bg-slate-800/50 border border-blue-500/20 rounded-lg p-6">
                    <p className="text-slate-400 text-sm font-semibold">{stat.label}</p>
                    <p className="text-4xl font-bold text-white mt-2">{stat.value}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Students Tab */}
            {tab === 'students' && (
              <div className="space-y-4">
                <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
                  <input
                    type="text"
                    placeholder="🔍 Search by name or phone..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full md:w-1/2 px-4 py-2.5 bg-slate-800/50 border border-blue-500/20 rounded-lg text-white"
                  />
                  
                  {/* 1. STATUS FILTER BUTTONS */}
                  <div className="flex gap-2 w-full md:w-auto overflow-x-auto">
                    {['all', 'pending', 'approved', 'rejected'].map(status => (
                      <button
                        key={status}
                        onClick={() => setStatusFilter(status)}
                        className={`px-4 py-2 rounded-lg font-semibold text-xs capitalize transition ${
                          statusFilter === status
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-800/50 text-slate-400 hover:text-slate-200 border border-slate-700'
                        }`}
                      >
                        {status}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bg-slate-800/50 border border-blue-500/20 rounded-lg overflow-hidden">
                  <table className="w-full text-left">
                    <thead className="bg-slate-900/50 border-b border-blue-500/20 text-slate-300 text-sm">
                      <tr>
                        <th className="p-4">Name</th>
                        <th className="p-4">Phone</th>
                        <th className="p-4">Joining</th>
                        <th className="p-4">Interview</th>
                        <th className="p-4">Decision Date</th>
                        <th className="p-4">Days Since Interview</th>
                        <th className="p-4">Status</th>
                        <th className="p-4">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredStudents.length === 0 ? (
                        <tr><td colSpan="8" className="p-8 text-center text-slate-400">No matching students found.</td></tr>
                      ) : (
                        filteredStudents.map(s => (
                          <tr key={s.id} className="border-b border-slate-800 hover:bg-slate-800/40">
                            <td className="p-4 font-semibold">{s.name}</td>
                            <td className="p-4 text-slate-300">{s.phone || '-'}</td>
                            <td className="p-4 text-slate-300">{s.joining_date || '-'}</td>
                            <td className="p-4 text-slate-300">{s.interview_date}</td>
                            <td className="p-4 text-slate-300">{s.decision_date || '-'}</td>
                            <td className="p-4 text-slate-300 font-mono text-xs">{calculateDaysSinceInterview(s.interview_date)}</td>
                            <td className="p-4">
                              <span className={`px-2.5 py-1 rounded text-xs font-semibold uppercase ${
                                s.status === 'approved' ? 'bg-green-500/20 text-green-400' :
                                s.status === 'rejected' ? 'bg-red-500/20 text-red-400' :
                                'bg-yellow-500/20 text-yellow-400'
                              }`}>
                                {s.status}
                              </span>
                            </td>
                            <td className="p-4 flex gap-3">
                              <button onClick={() => handleEdit(s)} className="text-blue-400 font-semibold">Edit</button>
                              <button onClick={() => handleDelete(s.id)} className="text-red-400 font-semibold">Delete</button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 5. DAILY SUMMARY TAB - ONLY CURRENT DATE DECISIONS */}
            {tab === 'daily' && (
              <div className="space-y-6">
                <div className="bg-slate-800/50 border border-blue-500/20 p-5 rounded-lg flex justify-between items-center">
                  <div>
                    <h3 className="text-xl font-bold">📋 Daily Decision Updates</h3>
                    <p className="text-slate-400 text-xs mt-1">Showing decision updates for TODAY only</p>
                  </div>
                  <span className="bg-blue-600/30 text-blue-400 border border-blue-500/40 px-4 py-1.5 rounded-lg font-semibold text-sm">
                    Today: {todayStr}
                  </span>
                </div>

                {todayDecisionStudents.length === 0 ? (
                  <div className="bg-slate-800/40 border border-blue-500/20 rounded-lg p-12 text-center text-slate-400">
                    No student decision updates recorded for today ({todayStr}).
                  </div>
                ) : (
                  <div className="bg-slate-800/50 border border-blue-500/20 rounded-lg p-6 space-y-4">
                    <h4 className="text-lg font-bold text-blue-400 border-b border-slate-700/80 pb-3 flex justify-between items-center">
                      <span>📅 Current Date: {todayStr}</span>
                      <span className="text-xs bg-slate-700 px-3 py-1 rounded-full text-slate-300">
                        {todayDecisionStudents.length} Decisions Today
                      </span>
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {todayDecisionStudents.map(student => (
                        <div key={student.id} className="bg-slate-900/80 border border-slate-700 p-4 rounded-lg space-y-1.5 text-sm font-mono">
                          <p><span className="text-slate-400 font-sans">Student:</span> <strong className="text-white font-sans text-base">{student.name}</strong></p>
                          <p><span className="text-slate-400 font-sans">Joining date:</span> {student.joining_date || '-'}</p>
                          <p><span className="text-slate-400 font-sans">Interview date:</span> {student.interview_date}</p>
                          <p><span className="text-slate-400 font-sans">Decision made:</span> {student.decision_date}</p>
                          <p><span className="text-slate-400 font-sans">Decision:</span> <span className={`font-bold capitalize ${
                            student.status === 'approved' ? 'text-green-400' : 'text-red-400'
                          }`}>{student.status}</span></p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
