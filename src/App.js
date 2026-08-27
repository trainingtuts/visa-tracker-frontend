import React, { useState, useEffect } from ‘react’;
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from ‘recharts’;
import { Plus, Trash2, Eye, EyeOff, TrendingUp } from ‘lucide-react’;

export default function VisaTracker() {
const [tab, setTab] = useState(‘dashboard’);
const [students, setStudents] = useState([]);
const [dailySummaries, setDailySummaries] = useState([]);
const [loading, setLoading] = useState(false);
const [showForm, setShowForm] = useState(false);
const [editId, setEditId] = useState(null);

const [formData, setFormData] = useState({
name: ‘’,
phone: ‘’,
joining_date: ‘’,
interview_date: ‘’,
decision_date: ‘’,
notes: ‘’
});

const [searchQuery, setSearchQuery] = useState(’’);

// Initialize with demo data
useEffect(() => {
loadDemoData();
}, []);

const loadDemoData = () => {
const demoStudents = [
{
id: 1,
name: ‘Ali Khan’,
phone: ‘+92 300 1234567’,
joining_date: ‘2024-10-01’,
interview_date: ‘2024-07-20’,
decision_date: ‘2024-08-10’,
status: ‘approved’
},
{
id: 2,
name: ‘Fatima Ahmed’,
phone: ‘+92 300 2234567’,
joining_date: ‘2024-10-01’,
interview_date: ‘2024-07-25’,
decision_date: null,
status: ‘pending’
}
];
setStudents(demoStudents);
generateDailySummaries(demoStudents);
};

const generateDailySummaries = (data) => {
const summaries = [];
for (let i = 7; i >= 0; i–) {
const date = new Date();
date.setDate(date.getDate() - i);
const dateStr = date.toISOString().split(‘T’)[0];

```
  summaries.push({
    date: dateStr,
    totalStudents: Math.floor(Math.random() * 20) + 5,
    newSubmissions: Math.floor(Math.random() * 5) + 1,
    approved: Math.floor(Math.random() * 8) + 2,
    rejected: Math.floor(Math.random() * 3) + 1
  });
}
setDailySummaries(summaries);
```

};

const calculateStats = () => {
const approved = students.filter(s => s.status === ‘approved’).length;
const rejected = students.filter(s => s.status === ‘rejected’).length;
const pending = students.filter(s => s.status === ‘pending’).length;
const interviewed = students.filter(s => s.interview_date).length;

```
return { approved, rejected, pending, interviewed, total: students.length };
```

};

const calculateDays = (from, to) => {
if (!from || !to) return ‘-’;
const d1 = new Date(from);
const d2 = new Date(to);
const days = Math.floor((d2 - d1) / (1000 * 60 * 60 * 24));
return days >= 0 ? days : ‘-’;
};

const filteredStudents = students.filter(s =>
s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
s.phone.includes(searchQuery)
);

const handleInputChange = (e) => {
const { name, value } = e.target;
setFormData(prev => ({ …prev, [name]: value }));
};

const handleAddStudent = () => {
if (!formData.name || !formData.phone) {
alert(‘Name and phone required’);
return;
}

```
if (editId) {
  setStudents(students.map(s => 
    s.id === editId ? { ...formData, id: editId } : s
  ));
  setEditId(null);
} else {
  const newStudent = {
    ...formData,
    id: Date.now()
  };
  setStudents([...students, newStudent]);
}

resetForm();
setShowForm(false);
```

};

const handleEdit = (student) => {
setFormData(student);
setEditId(student.id);
setShowForm(true);
};

const handleDelete = (id) => {
if (confirm(‘Delete this student?’)) {
setStudents(students.filter(s => s.id !== id));
}
};

const resetForm = () => {
setFormData({
name: ‘’,
phone: ‘’,
joining_date: ‘’,
interview_date: ‘’,
decision_date: ‘’,
notes: ‘’
});
};

const stats = calculateStats();
const statusColors = { approved: ‘#10b981’, rejected: ‘#ef4444’, pending: ‘#f59e0b’ };
const statusData = [
{ name: ‘Approved’, value: stats.approved, fill: statusColors.approved },
{ name: ‘Rejected’, value: stats.rejected, fill: statusColors.rejected },
{ name: ‘Pending’, value: stats.pending, fill: statusColors.pending }
];

return (
<div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
<style>{`* { margin: 0; padding: 0; box-sizing: border-box; } body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; } button { transition: all 0.3s; } button:hover { transform: translateY(-2px); } input, select, textarea { border: 1px solid #cbd5e1; padding: 10px; border-radius: 6px; font-size: 14px; } input:focus, select:focus, textarea:focus { outline: none; border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59, 130, 244, 0.1); }`}</style>

```
  {/* Header */}
  <div className="bg-slate-800/50 backdrop-blur border-b border-blue-500/20">
    <div className="max-w-7xl mx-auto px-6 py-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-white mb-2">🇩🇪 German Visa Tracker</h1>
          <p className="text-blue-300">Crowdsourced visa timeline tracking system</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
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
          📈 Daily Summary
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

          <div className="p-6 space-y-4">
            {/* Personal Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">Student Name *</label>
                <input type="text" name="name" value={formData.name} onChange={handleInputChange} placeholder="Full name" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">Phone Number *</label>
                <input type="tel" name="phone" value={formData.phone} onChange={handleInputChange} placeholder="+92 300 1234567" />
              </div>
            </div>

            {/* Key Dates */}
            <div className="border-t border-blue-500/20 pt-4">
              <h3 className="font-semibold text-slate-300 mb-4">Key Dates</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">Joining Date</label>
                  <input type="date" name="joining_date" value={formData.joining_date} onChange={handleInputChange} />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">Interview Date</label>
                  <input type="date" name="interview_date" value={formData.interview_date} onChange={handleInputChange} />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-semibold text-slate-300 mb-2">Decision Made Date</label>
                  <input type="date" name="decision_date" value={formData.decision_date} onChange={handleInputChange} />
                </div>
              </div>
            </div>

            {/* Notes */}
            <div className="border-t border-blue-500/20 pt-4">
              <label className="block text-sm font-semibold text-slate-300 mb-2">Additional Notes</label>
              <textarea name="notes" value={formData.notes} onChange={handleInputChange} placeholder="Any additional notes..." rows="3" />
            </div>
          </div>

          <div className="border-t border-blue-500/20 p-6 flex gap-4 justify-end">
            <button onClick={() => { setShowForm(false); resetForm(); setEditId(null); }} className="px-6 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-semibold">Cancel</button>
            <button onClick={handleAddStudent} className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold">{editId ? 'Update' : 'Add'} Student</button>
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

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Status Distribution */}
          <div className="bg-slate-800/50 border border-blue-500/20 rounded-lg p-6 backdrop-blur">
            <h3 className="text-xl font-semibold text-white mb-4">Status Distribution</h3>
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
              <p className="text-slate-400 text-center py-12">No data yet. Add students to see charts.</p>
            )}
          </div>

          {/* Daily Performance */}
          <div className="bg-slate-800/50 border border-blue-500/20 rounded-lg p-6 backdrop-blur">
            <h3 className="text-xl font-semibold text-white mb-4">Last 7 Days Decision Stats</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={dailySummaries.slice(-7)}>
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
        {/* Search Box */}
        <div className="flex gap-4">
          <input
            type="text"
            placeholder="🔍 Search by name or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 px-4 py-3 bg-slate-800/50 border border-blue-500/20 rounded-lg text-white placeholder-slate-400"
          />
          <div className="text-slate-300 py-3 px-4 bg-slate-800/50 border border-blue-500/20 rounded-lg font-semibold">
            {filteredStudents.length} students
          </div>
        </div>

        {/* Students Table */}
        <div className="bg-slate-800/50 border border-blue-500/20 rounded-lg backdrop-blur overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-900/50 border-b border-blue-500/20">
                <tr>
                  {['Name', 'Phone', 'Joining', 'Interview', 'Decision', 'Days to Interview', 'Status', 'Actions'].map(h => (
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
                      <td className="px-6 py-4 text-slate-300 text-sm">{s.phone}</td>
                      <td className="px-6 py-4 text-slate-300 text-sm">{s.joining_date || '-'}</td>
                      <td className="px-6 py-4 text-slate-300 text-sm">{s.interview_date || '-'}</td>
                      <td className="px-6 py-4 text-slate-300 text-sm">{s.decision_date || '-'}</td>
                      <td className="px-6 py-4 text-slate-300 text-sm font-semibold">{calculateDays(s.joining_date, s.interview_date)} days</td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          s.status === 'approved' ? 'bg-green-500/20 text-green-400' :
                          s.status === 'rejected' ? 'bg-red-500/20 text-red-400' :
                          'bg-yellow-500/20 text-yellow-400'
                        }`}>
                          {s.status}
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

    {/* Daily Summary Tab */}
    {tab === 'daily' && (
      <div className="space-y-6">
        <div className="bg-slate-800/50 border border-blue-500/20 rounded-lg p-6 backdrop-blur">
          <h3 className="text-xl font-semibold text-white mb-4">Daily Decision Trends (7 Days)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={dailySummaries.slice(-7)}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 12 }} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} />
              <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #3b82f6' }} />
              <Legend />
              <Line type="monotone" dataKey="totalStudents" stroke="#3b82f6" name="Total Students" strokeWidth={2} />
              <Line type="monotone" dataKey="approved" stroke="#10b981" name="Approved" strokeWidth={2} />
              <Line type="monotone" dataKey="rejected" stroke="#ef4444" name="Rejected" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {dailySummaries.slice(-7).reverse().map((summary, i) => (
            <div key={i} className="bg-slate-800/50 border border-blue-500/20 rounded-lg p-4 backdrop-blur">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-white">{summary.date}</h4>
                <TrendingUp className="text-blue-400" size={20} />
              </div>
              <div className="space-y-2 text-sm">
                <p className="text-slate-300">📊 <span className="font-semibold">{summary.totalStudents}</span> Total Students</p>
                <p className="text-green-400">✅ <span className="font-semibold">{summary.approved}</span> Approved</p>
                <p className="text-red-400">❌ <span className="font-semibold">{summary.rejected}</span> Rejected</p>
                <p className="text-yellow-400">⏳ <span className="font-semibold">{summary.pending_interviews}</span> Pending Interviews</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    )}
  </div>
</div>
```

);
}