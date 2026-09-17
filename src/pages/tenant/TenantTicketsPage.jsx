import React, { useState, useEffect } from 'react';
import { fetchJson, API_URL } from '../../utils/api';
import { 
  LifeBuoy, Plus, Search, CheckCircle2, Clock, AlertCircle, 
  ChevronRight, Copy, Check, X, RefreshCw, MessageSquare
} from 'lucide-react';

export default function TenantTicketsPage() {
  const [tenant, setTenant] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('tenant_user') || localStorage.getItem('user') || '{}');
    } catch (_) {
      return {};
    }
  });

  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showRaiseModal, setShowRaiseModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  const [formData, setFormData] = useState({
    ticket_type: 'Payment Issue',
    priority: 'Medium',
    subject: '',
    description: '',
    property_name: ''
  });

  const loadTickets = async () => {
    const loginId = tenant.loginId || tenant._id || tenant.email || tenant.phone;
    if (!loginId) return;
    setLoading(true);
    try {
      const res = await fetchJson(`${API_URL}/api/tickets/my-tickets?loginId=${encodeURIComponent(loginId)}`);
      if (res && res.success) {
        setTickets(res.tickets || []);
      }
    } catch (err) {
      console.error('Failed to load tenant tickets:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTickets();
  }, [tenant]);

  const handleCopyRef = (refId) => {
    navigator.clipboard.writeText(refId);
    setCopiedId(refId);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleRaiseSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    if (!formData.subject.trim() || !formData.description.trim()) {
      setFormError('Please enter both subject and description.');
      return;
    }

    setIsSubmitting(true);
    const loginId = tenant.loginId || tenant._id || tenant.email || tenant.phone || 'Tenant';
    try {
      const res = await fetchJson(`${API_URL}/api/tickets/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          raised_by: loginId,
          raised_by_name: tenant.name || loginId,
          raised_by_role: 'tenant',
          user_email: tenant.email || '',
          user_phone: tenant.phone || ''
        })
      });

      if (res && res.success) {
        setFormSuccess(`Ticket ${res.ticket?.ticket_id} created successfully! Notification sent.`);
        setTimeout(() => {
          setShowRaiseModal(false);
          setFormData({
            ticket_type: 'Payment Issue',
            priority: 'Medium',
            subject: '',
            description: '',
            property_name: ''
          });
          setFormSuccess('');
          loadTickets();
        }, 1800);
      } else {
        setFormError(res?.message || 'Failed to create support ticket.');
      }
    } catch (err) {
      setFormError(err.message || 'An error occurred while creating ticket.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredTickets = tickets.filter((t) => 
    (t.ticket_id || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (t.subject || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Completed':
      case 'Resolved':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            {status}
          </span>
        );
      case 'In Progress':
      case 'Assigned':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            {status}
          </span>
        );
      case 'Open':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
            <AlertCircle className="w-3.5 h-3.5 text-blue-600" />
            Open
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">

        {/* Top Header */}
        <div className="bg-gradient-to-r from-teal-900 to-slate-900 rounded-3xl p-6 md:p-8 text-white shadow-xl flex flex-wrap items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 text-xs font-bold border border-teal-500/30 mb-2">
              <LifeBuoy className="w-4 h-4" /> Tenant Support Desk
            </div>
            <h1 className="text-2xl font-black text-white">Help &amp; Support Tickets</h1>
            <p className="text-slate-300 text-xs mt-1">Raise complaints or payment issues and track updates with your Ref ID.</p>
          </div>

          <button
            onClick={() => setShowRaiseModal(true)}
            className="bg-[#0FA89C] hover:bg-[#0b7a73] text-white font-bold text-xs px-5 py-3 rounded-2xl transition-all shadow-lg flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Raise New Ticket
          </button>
        </div>

        {/* Search Bar */}
        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex items-center justify-between gap-4">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by Ref ID (e.g. TKT-849201) or Subject..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-teal-500"
            />
          </div>
          <button onClick={loadTickets} className="p-2 text-slate-500 hover:text-teal-600">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {/* Tickets List */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-slate-400 text-xs font-bold">Loading your tickets...</div>
          ) : filteredTickets.length === 0 ? (
            <div className="p-12 text-center">
              <LifeBuoy className="w-12 h-12 text-slate-300 mx-auto mb-2" />
              <h3 className="text-sm font-bold text-slate-700">No Support Tickets</h3>
              <p className="text-xs text-slate-400 mt-1">Need help with payments or room issues? Click Raise New Ticket.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredTickets.map((t) => (
                <div
                  key={t._id}
                  onClick={() => setSelectedTicket(t)}
                  className="p-5 hover:bg-slate-50 transition-all cursor-pointer flex items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleCopyRef(t.ticket_id); }}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 font-mono text-xs font-bold text-slate-700 hover:bg-teal-50"
                    >
                      {t.ticket_id}
                      {copiedId === t.ticket_id ? <Check className="w-3.5 h-3.5 text-emerald-600 inline ml-1" /> : <Copy className="w-3.5 h-3.5 text-slate-400 inline ml-1" />}
                    </button>

                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t.ticket_type}</p>
                      <h4 className="text-sm font-bold text-slate-800 mt-0.5 truncate">{t.subject}</h4>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    {getStatusBadge(t.status)}
                    <ChevronRight className="w-4 h-4 text-slate-300" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* Modal: Raise Ticket */}
      {showRaiseModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl relative">
            <button onClick={() => setShowRaiseModal(false)} className="absolute top-4 right-4 text-slate-400">
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-base font-bold text-slate-800 mb-4">Raise Support Ticket</h3>

            {formError && <div className="mb-3 text-xs text-red-600 font-bold">{formError}</div>}
            {formSuccess && <div className="mb-3 text-xs text-emerald-600 font-bold">{formSuccess}</div>}

            <form onSubmit={handleRaiseSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Issue Category</label>
                <select
                  value={formData.ticket_type}
                  onChange={(e) => setFormData({ ...formData, ticket_type: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800"
                >
                  <option value="Payment Issue">💳 Payment / PayU / Razorpay Issue</option>
                  <option value="Tenant Complaint">⚠️ Room / Maintenance Complaint</option>
                  <option value="Refund Request">💰 Refund Request</option>
                  <option value="Other">💬 Other Inquiry</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Subject</label>
                <input
                  type="text"
                  placeholder="Subject of your ticket..."
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={4}
                  placeholder="Describe your issue in detail..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-medium"
                  required
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRaiseModal(false)}
                  className="px-4 py-2 border rounded-xl text-xs font-bold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-[#0FA89C] text-white font-bold text-xs px-5 py-2 rounded-xl shadow-sm disabled:opacity-70"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Ticket'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Drawer: Detail */}
      {selectedTicket && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex justify-end">
          <div className="bg-white max-w-md w-full h-full p-6 overflow-y-auto shadow-2xl relative">
            <button onClick={() => setSelectedTicket(null)} className="absolute top-4 right-4 text-slate-400">
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-5">
              <div>
                <span className="font-mono text-xs font-bold text-teal-600 bg-teal-50 px-3 py-1 rounded-lg">
                  {selectedTicket.ticket_id}
                </span>
                <h3 className="text-base font-bold text-slate-800 mt-2">{selectedTicket.subject}</h3>
                <p className="text-xs text-slate-400">Category: {selectedTicket.ticket_type}</p>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <p className="text-xs font-bold text-slate-400 uppercase mb-1">Description</p>
                <p className="text-xs text-slate-700 leading-relaxed">{selectedTicket.description}</p>
              </div>

              {selectedTicket.resolution_notes && (
                <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-200">
                  <p className="text-xs font-bold text-emerald-800 uppercase mb-1">🟢 Resolution Note</p>
                  <p className="text-xs text-emerald-900">{selectedTicket.resolution_notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
