import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  Trash2, 
  Filter, 
  Search, 
  CheckCircle2, 
  AlertTriangle, 
  ExternalLink, 
  RefreshCw,
  Image as ImageIcon,
  Edit3,
  Check,
  X
} from 'lucide-react';
import { getPredictionHistory, deletePrediction, clearAllHistory, getImageUrl, updatePredictionNotes } from '../services/api';

export default function HistoryPage({ onHistoryChange }) {
  const [historyItems, setHistoryItems] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [classFilter, setClassFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [previewImage, setPreviewImage] = useState(null);
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [noteText, setNoteText] = useState('');
  const [page, setPage] = useState(0);
  const limit = 20;

  const fetchHistory = async () => {
    setIsLoading(true);
    try {
      const params = {
        limit,
        offset: page * limit,
      };
      if (classFilter !== 'ALL') {
        params.class_name = classFilter;
      }
      const data = await getPredictionHistory(params);
      setHistoryItems(data.items || []);
      setTotalCount(data.total || 0);
    } catch (err) {
      console.error('Failed to load history:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [page, classFilter]);

  const handleDeleteItem = async (id) => {
    if (!window.confirm(`Delete prediction record #${id}?`)) return;
    try {
      await deletePrediction(id);
      fetchHistory();
      if (onHistoryChange) onHistoryChange();
    } catch (err) {
      alert('Failed to delete record: ' + err.message);
    }
  };

  const handleSaveNote = async (id) => {
    try {
      await updatePredictionNotes(id, noteText);
      setEditingNoteId(null);
      fetchHistory();
    } catch (err) {
      alert('Failed to update note: ' + err.message);
    }
  };

  const handleClearAll = async () => {
    if (!window.confirm('Are you sure you want to delete ALL prediction history? This action cannot be undone.')) {
      return;
    }
    try {
      await clearAllHistory();
      fetchHistory();
      if (onHistoryChange) onHistoryChange();
    } catch (err) {
      alert('Failed to clear history: ' + err.message);
    }
  };

  const filteredItems = historyItems.filter((item) =>
    item.image_filename.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Prediction History</h1>
          <p className="text-sm text-slate-400 mt-1">
            Audit trail of past food quality classifications logged in SQLite.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchHistory}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          {totalCount > 0 && (
            <button
              onClick={handleClearAll}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-semibold border border-rose-500/30 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Clear All History
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-slate-900 border border-slate-800">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs font-medium">
            {['ALL', 'Fresh', 'Spoiled'].map((filterKey) => (
              <button
                key={filterKey}
                onClick={() => {
                  setClassFilter(filterKey);
                  setPage(0);
                }}
                className={`px-3 py-1 rounded-md transition-all ${
                  classFilter === filterKey
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {filterKey}
              </button>
            ))}
          </div>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search filename..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      {/* History Table */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[740px] text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-5 py-3.5 font-semibold">Preview</th>
                <th className="px-5 py-3.5 font-semibold">ID</th>
                <th className="px-5 py-3.5 font-semibold">Image & Notes</th>
                <th className="px-5 py-3.5 font-semibold">Quality Outcome</th>
                <th className="px-5 py-3.5 font-semibold">Confidence</th>
                <th className="px-5 py-3.5 font-semibold">Model</th>
                <th className="px-5 py-3.5 font-semibold">Timestamp</th>
                <th className="px-5 py-3.5 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {isLoading ? (
                <tr>
                  <td colSpan="8" className="px-5 py-12 text-center text-slate-500">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-slate-600" />
                    Loading prediction records...
                  </td>
                </tr>
              ) : filteredItems.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-5 py-12 text-center text-slate-500">
                    No history records found matching criteria.
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => {
                  const isFresh = item.predicted_class === 'Fresh';
                  const imageUrl = getImageUrl(item.image_path);
                  return (
                    <tr key={item.id} className="hover:bg-slate-800/40 transition-colors">
                      {/* Thumbnail Preview */}
                      <td className="px-5 py-3">
                        {imageUrl ? (
                          <div 
                            onClick={() => setPreviewImage(imageUrl)}
                            className="w-10 h-10 rounded-lg overflow-hidden border border-slate-700 bg-black cursor-pointer hover:scale-105 transition-transform"
                          >
                            <img src={imageUrl} alt="" className="w-full h-full object-cover" />
                          </div>
                        ) : (
                          <div className="w-10 h-10 rounded-lg border border-slate-800 bg-slate-950 flex items-center justify-center text-slate-600">
                            <ImageIcon className="w-4 h-4" />
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-3 font-mono text-slate-500">#{item.id}</td>
                      <td className="px-5 py-3 font-medium text-white max-w-xs">
                        <div className="truncate" title={item.image_filename}>
                          {item.image_filename}
                        </div>
                        {editingNoteId === item.id ? (
                          <div className="flex items-center gap-1.5 mt-1.5">
                            <input
                              type="text"
                              value={noteText}
                              onChange={(e) => setNoteText(e.target.value)}
                              placeholder="Assessment note or batch tag..."
                              className="w-full px-2 py-0.5 bg-slate-950 border border-emerald-500 rounded text-[11px] text-slate-100 focus:outline-none"
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSaveNote(item.id);
                                if (e.key === 'Escape') setEditingNoteId(null);
                              }}
                            />
                            <button
                              onClick={() => handleSaveNote(item.id)}
                              className="p-1 rounded bg-emerald-500 text-slate-950 hover:bg-emerald-400"
                              title="Save note"
                            >
                              <Check className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => setEditingNoteId(null)}
                              className="p-1 rounded bg-slate-800 text-slate-400 hover:text-white"
                              title="Cancel"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          item.notes && (
                            <p className="text-[11px] text-emerald-400/90 font-mono mt-0.5 truncate flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block"></span>
                              {item.notes}
                            </p>
                          )
                        )}
                      </td>
                      <td className="px-5 py-3">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
                            isFresh
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25'
                              : 'bg-rose-500/10 text-rose-400 border-rose-500/25'
                          }`}
                        >
                          {isFresh ? (
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          ) : (
                            <AlertTriangle className="w-3.5 h-3.5" />
                          )}
                          {item.predicted_class}
                        </span>
                      </td>
                      <td className="px-5 py-3 font-mono font-medium text-slate-200">
                        {(item.confidence * 100).toFixed(1)}%
                      </td>
                      <td className="px-5 py-3 text-slate-400 text-[11px]">{item.model_name}</td>
                      <td className="px-5 py-3 text-slate-500 text-[11px] whitespace-nowrap">
                        {new Date(item.created_at).toLocaleString()}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => {
                              setEditingNoteId(item.id);
                              setNoteText(item.notes || '');
                            }}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors"
                            title="Edit assessment note"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteItem(item.id)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                            title="Delete record"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination controls */}
        {totalCount > limit && (
          <div className="px-5 py-3 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between text-xs text-slate-400">
            <span>
              Showing {page * limit + 1}–{Math.min((page + 1) * limit, totalCount)} of {totalCount} records
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={page === 0}
                onClick={() => setPage(page - 1)}
                className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                disabled={(page + 1) * limit >= totalCount}
                onClick={() => setPage(page + 1)}
                className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Image Modal Lightbox */}
      {previewImage && (
        <div 
          onClick={() => setPreviewImage(null)}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 cursor-pointer"
        >
          <div className="relative max-w-2xl max-h-[80vh] rounded-2xl overflow-hidden border border-slate-700 bg-slate-900 shadow-2xl">
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute top-3 right-3 p-1 rounded-full bg-slate-950/80 text-white hover:bg-rose-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <img src={previewImage} alt="Expanded preview" className="max-w-full max-h-[75vh] object-contain" />
          </div>
        </div>
      )}
    </div>
  );
}
