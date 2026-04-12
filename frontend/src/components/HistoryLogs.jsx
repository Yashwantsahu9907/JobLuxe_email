import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { Download, Trash2, CheckCircle, XCircle, Eye, X, Mail } from 'lucide-react';
import Papa from 'papaparse';
import ConfirmModal from './ConfirmModal';

const HistoryLogs = () => {
  const [logs, setLogs] = useState([]);
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isLoadingLog, setIsLoadingLog] = useState(false);

  useEffect(() => {
    fetchLogs();
  }, []);

  const handleViewLog = async (id) => {
    try {
      setIsLoadingLog(true);
      setIsViewModalOpen(true);
      const res = await api.get(`/api/logs/${id}`);
      setSelectedLog(res.data);
    } catch (err) {
      toast.error('Failed to fetch log details');
      setIsViewModalOpen(false);
    } finally {
      setIsLoadingLog(false);
    }
  };

  const closeViewModal = () => {
    setIsViewModalOpen(false);
    setTimeout(() => setSelectedLog(null), 200);
  };

  const fetchLogs = async () => {
    try {
      const res = await api.get('/api/logs');
      setLogs(res.data);
    } catch (err) {
      console.error('Error fetching logs', err);
    }
  };

  const handleClearLogs = async () => {
    try {
      await api.delete('/api/logs');
      setLogs([]);
      toast.success('Logs cleared');
    } catch (err) {
      toast.error('Failed to clear logs');
    }
  };

  const handleDownload = async () => {
    try {
      const res = await api.get('/api/logs/all');
      const csv = Papa.unparse(res.data.map(l => ({
        Campaign: l.campaignId,
        Recipient: l.recipient,
        Subject: l.subject,
        Status: l.status,
        Error: l.errorMsg || '',
        SentAt: new Date(l.sentAt).toLocaleString()
      })));
      
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', 'campaign_logs.csv');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Log CSV downloaded');
    } catch (err) {
      toast.error('Failed to generate log CSV');
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full">
      <div className="p-6 border-b border-slate-200 flex flex-wrap gap-4 items-center justify-between bg-slate-50">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Delivery History</h2>
          <p className="text-sm text-slate-500 mt-1">Review the status of recently processed emails.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={handleDownload}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-blue-600 rounded-lg transition-colors font-medium text-sm shadow-sm"
          >
            <Download size={16} /> Download CSV
          </button>
          <button 
            onClick={() => setIsClearModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-red-600 hover:bg-red-50 rounded-lg transition-colors font-medium text-sm shadow-sm"
          >
            <Trash2 size={16} /> Clear
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-100 text-slate-600 text-sm">
              <th className="py-3 px-6 font-semibold border-b border-slate-200">Recipient</th>
              <th className="py-3 px-6 font-semibold border-b border-slate-200">Subject</th>
              <th className="py-3 px-6 font-semibold border-b border-slate-200">Status</th>
              <th className="py-3 px-6 font-semibold border-b border-slate-200 hidden md:table-cell">Date & Time</th>
              <th className="py-3 px-6 font-semibold border-b border-slate-200 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {logs.length === 0 ? (
              <tr>
                <td colSpan="5" className="py-8 text-center text-slate-500">
                  No logs available.
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log._id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => handleViewLog(log._id)}>
                  <td className="py-3 px-6 font-medium text-slate-800">{log.recipient}</td>
                  <td className="py-3 px-6 text-slate-600 truncate max-w-xs">{log.subject}</td>
                  <td className="py-3 px-6">
                    {log.status === 'success' ? (
                      <span className="flex items-center gap-1.5 text-green-600 bg-green-50 px-2.5 py-1 rounded-full w-max text-xs font-semibold">
                        <CheckCircle size={14} /> Delivered
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-red-600 bg-red-50 px-2.5 py-1 rounded-full w-max text-xs font-semibold" title={log.errorMsg}>
                        <XCircle size={14} /> Failed
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-6 text-slate-500 hidden md:table-cell">
                    {new Date(log.sentAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                  </td>
                  <td className="py-3 px-6 text-center">
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleViewLog(log._id); }}
                      className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-transparent hover:border-blue-100"
                      title="View Details"
                    >
                      <Eye size={16} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <ConfirmModal 
        isOpen={isClearModalOpen}
        onClose={() => setIsClearModalOpen(false)}
        onConfirm={handleClearLogs}
        title="Clear History"
        message="Are you sure you want to clear all email delivery history? This action cannot be undone."
        confirmText="Clear All Logs"
      />

      {/* Detailed View Modal */}
      {isViewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm transition-opacity">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <h3 className="text-lg font-bold text-slate-800">Email Details</h3>
              <button 
                onClick={closeViewModal}
                className="text-slate-400 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition-colors"
                title="Close"
              >
                <X size={20} />
              </button>
            </div>
            
            {/* Body */}
            <div className="flex-1 overflow-auto p-6 bg-slate-50 relative">
              {isLoadingLog || !selectedLog ? (
                <div className="flex items-center justify-center h-64">
                   <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Meta Information Panel */}
                  <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Recipient</span>
                      <p className="text-slate-800 font-medium mt-1 select-all">{selectedLog.recipient}</p>
                    </div>
                    <div>
                      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</span>
                      <div className="mt-1">
                        {selectedLog.status === 'success' ? (
                          <span className="inline-flex items-center gap-1.5 text-green-700 bg-green-100 px-3 py-1 rounded-full text-xs font-bold">
                            <CheckCircle size={14} /> Delivered
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-red-700 bg-red-100 px-3 py-1 rounded-full text-xs font-bold">
                            <XCircle size={14} /> Failed {selectedLog.errorMsg && `- ${selectedLog.errorMsg}`}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="md:col-span-2">
                      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Subject</span>
                      <p className="text-slate-800 font-medium mt-1 text-lg">{selectedLog.subject}</p>
                    </div>
                    <div className="md:col-span-2 text-xs text-slate-500 font-medium">
                      Sent on {new Date(selectedLog.sentAt).toLocaleString()}
                    </div>
                  </div>
                  
                  {/* Content Panel */}
                  <div className="bg-white flex flex-col border border-slate-200 rounded-xl overflow-hidden shadow-sm h-[500px]">
                    <div className="px-5 py-3 border-b border-slate-200 bg-slate-50/80">
                       <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">HTML Content</span>
                    </div>
                    {selectedLog.content ? (
                      <div 
                        className="w-full flex-1 bg-white p-6 overflow-y-auto email-content-container"
                        dangerouslySetInnerHTML={{ __html: selectedLog.content }}
                      />
                    ) : (
                       <div className="px-8 flex-1 flex flex-col items-center justify-center text-slate-500 bg-slate-50 italic">
                         <Mail size={48} className="text-slate-300 mb-4" />
                         <p>No content available for this legacy log entry.</p>
                       </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HistoryLogs;
