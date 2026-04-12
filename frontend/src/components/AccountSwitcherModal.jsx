import React, { useState, useEffect } from 'react';
import { X, Plus, Mail, Shield, Check, Trash2, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../utils/api';

const AccountSwitcherModal = ({ isOpen, onClose }) => {
  const [accounts, setAccounts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [newAccount, setNewAccount] = useState({ email: '', appPassword: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchAccounts();
    }
  }, [isOpen]);

  const fetchAccounts = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/api/accounts');
      setAccounts(response.data);
    } catch (error) {
      toast.error('Failed to fetch accounts');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelect = async (id) => {
    try {
      await api.put(`/api/accounts/${id}/select`);
      toast.success('Account switched');
      fetchAccounts();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error switching account');
    }
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this account?')) return;

    try {
      await api.delete(`/api/accounts/${id}`);
      toast.success('Account deleted');
      fetchAccounts();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error deleting account');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await api.post('/api/accounts', newAccount);
      toast.success('Account added successfully');
      setNewAccount({ email: '', appPassword: '' });
      setIsAdding(false);
      fetchAccounts();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error adding account');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 h-fit max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-10">
          <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Mail className="text-blue-600" size={24} />
            Switch Account
          </h3>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {isAdding ? (
            <div className="space-y-6">
              <div className="space-y-2">
                <h4 className="text-lg font-semibold text-slate-800">Add New Email</h4>
                <p className="text-sm text-slate-500">
                  Use a Gmail account and its 16-character App Password.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Email Address</label>
                  <input
                    type="email"
                    required
                    value={newAccount.email}
                    onChange={(e) => setNewAccount({ ...newAccount, email: e.target.value })}
                    placeholder="example@gmail.com"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">App Password</label>
                  <div className="relative">
                    <input
                      type="password"
                      required
                      value={newAccount.appPassword}
                      onChange={(e) => setNewAccount({ ...newAccount, appPassword: e.target.value })}
                      placeholder="16-character password"
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    />
                    <Shield className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsAdding(false)}
                    className="flex-1 px-4 py-3 rounded-xl border border-slate-200 text-slate-600 font-medium hover:bg-slate-50 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 px-4 py-3 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="animate-spin" size={20} />
                        Verifying...
                      </>
                    ) : 'Save Account'}
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="space-y-4">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-12 text-slate-400 gap-3">
                  <Loader2 className="animate-spin" size={32} />
                  <p>Loading accounts...</p>
                </div>
              ) : accounts.length === 0 ? (
                <div className="text-center py-10 space-y-4">
                  <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto">
                    <Mail className="text-slate-300" size={32} />
                  </div>
                  <p className="text-slate-500">No accounts added yet.</p>
                  <button
                    onClick={() => setIsAdding(true)}
                    className="text-blue-600 font-medium hover:underline flex items-center gap-1 mx-auto"
                  >
                    <Plus size={18} /> Add your first account
                  </button>
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    {accounts.map((acc) => (
                      <div
                        key={acc._id}
                        onClick={() => handleSelect(acc._id)}
                        className={`group relative flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all ${
                          acc.isActive
                            ? 'border-blue-500 bg-blue-50/50'
                            : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${acc.isActive ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                            <Mail size={18} />
                          </div>
                          <div>
                            <p className="font-medium text-slate-800 break-all">{acc.email}</p>
                            {acc.isActive && <span className="text-xs text-blue-600 font-bold uppercase tracking-wider">Active</span>}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {acc.isActive && (
                            <div className="bg-blue-600 text-white p-1 rounded-full">
                              <Check size={14} />
                            </div>
                          )}
                          <button
                            onClick={(e) => handleDelete(e, acc._id)}
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-white rounded-lg transition-all opacity-0 group-hover:opacity-100"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={() => setIsAdding(true)}
                    className="w-full mt-4 flex items-center justify-center gap-2 p-4 rounded-xl border-2 border-dashed border-slate-200 text-slate-500 font-medium hover:border-blue-400 hover:text-blue-500 transition-all"
                  >
                    <Plus size={20} />
                    Add Another Account
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-100 bg-slate-50/50">
          <p className="text-center text-xs text-slate-400">
            Selected account will be used for all future campaigns.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AccountSwitcherModal;
