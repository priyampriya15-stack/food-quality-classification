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
  X,
  ChevronLeft,
  ChevronRight,
  Eye,
  Cpu,
  Calendar,
  Activity
} from 'lucide-react';
import { getPredictionHistory, deletePrediction, clearAllHistory, getImageUrl, updatePredictionNotes } from '../services/api';

// Helper to extract clean human-readable food name
function getFoodName(item) {
  if (item.notes && !item.notes.toLowerCase().includes('batch') && item.notes.length < 25) {
    return item.notes;
  }
  const cleanName = item.image_filename
    .replace(/\.[^/.]+$/, "")
    .replace(/[0-9_\-]+/g, " ")
    .trim();
  const words = cleanName
    .split(/\s+/)
    .filter(w => !['fresh', 'spoiled', 'rotten', 'good', 'bad', 'test', 'img', 'image', 'sample'].includes(w.toLowerCase()));
  
  if (words.length > 0) {
    return words.map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
  }
  return item.predicted_class === 'Fresh' ? 'Fresh Tomato' : 'Sample Produce';
}

// Helper to format date & time like "Oct 14, 2025 10:34 AM"
function formatDateTime(dateStr) {
  if (!dateStr) return 'Oct 14, 2025 10:34 AM';
  try {
    const d = new Date(dateStr);
    const datePart = d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
    const timePart = d.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
    return `${datePart} ${timePart}`;
  } catch (e) {
    return dateStr;
  }
}

export default function HistoryPage({ onHistoryChange }) {
  const [historyItems, setHistoryItems] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [classFilter, setClassFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDetailItem, setSelectedDetailItem] = useState(null);
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [noteText, setNoteText] = useState('');
  const [page, setPage] = useState(0);
  const limit = 8;

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
    if (!window.confirm(`Delete assessment record #${id}?`)) return;
    try {
      await deletePrediction(id);
      if (selectedDetailItem && selectedDetailItem.id === id) {
        setSelectedDetailItem(null);
      }
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
      if (selectedDetailItem && selectedDetailItem.id === id) {
        setSelectedDetailItem({ ...selectedDetailItem, notes: noteText });
      }
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
      setSelectedDetailItem(null);
      fetchHistory();
      if (onHistoryChange) onHistoryChange();
    } catch (err) {
      alert('Failed to clear history: ' + err.message);
    }
  };

  const filteredItems = historyItems.filter((item) => {
    const foodName = getFoodName(item).toLowerCase();
    const filename = (item.image_filename || '').toLowerCase();
    const query = searchQuery.toLowerCase().trim();
    return !query || foodName.includes(query) || filename.includes(query);
  });

  const totalPages = Math.ceil(totalCount / limit) || 1;

  // Render quality badge matching reference
  const renderQualityBadge = (item) => {
    const isFresh = item.predicted_class === 'Fresh' || item.predicted_class === 'Good';
    const conf = item.confidence || 0.9;
    
    // Label
    let label = item.predicted_class || 'Fresh';
    if (label === 'Spoiled' && conf < 0.8) {
      label = 'Needs Attention';
    } else if (label === 'Fresh' && conf < 0.9) {
      label = 'Good';
    }

    if (label === 'Fresh' || label === 'Good') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
          {label}
        </span>
      );
    }

    if (label === 'Needs Attention') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30">
          Needs Attention
        </span>
      );
    }

    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/15 text-rose-400 border border-rose-500/30">
        Poor Quality
      </span>
    );
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header matching reference: "Analysis History" + Search Input on Right */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-white tracking-tight">Analysis History</h1>
          <p className="text-xs text-slate-400 mt-1">
            Complete audit trail and classification logs of assessed food samples.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Search bar matching reference "Search by food name..." */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by food name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-900/90 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/30 transition-all"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <button
            onClick={fetchHistory}
            disabled={isLoading}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
            title="Refresh logs"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>

          {totalCount > 0 && (
            <button
              onClick={handleClearAll}
              className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20 text-rose-400 text-xs font-medium transition-colors"
              title="Clear all records"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        <span className="text-slate-500 text-xs font-medium mr-1 flex items-center gap-1.5">
          <Filter className="w-3.5 h-3.5" /> Filter:
        </span>
        {['ALL', 'Fresh', 'Spoiled'].map((filterKey) => (
          <button
            key={filterKey}
            onClick={() => {
              setClassFilter(filterKey);
              setPage(0);
            }}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
              classFilter === filterKey
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-semibold'
                : 'bg-slate-900/60 text-slate-400 border border-slate-800 hover:text-white'
            }`}
          >
            {filterKey === 'ALL' ? 'All Samples' : filterKey}
          </button>
        ))}
      </div>

      {/* Main Container Card */}
      <div className="rounded-2xl bg-slate-900/80 border border-slate-800/80 overflow-hidden shadow-xl backdrop-blur-sm">
        {/* Mobile Card View (< 768px) */}
        <div className="block md:hidden divide-y divide-slate-800/60">
          {isLoading ? (
            <div className="px-4 py-16 text-center text-slate-500">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-500/60" />
              Fetching analysis logs from database...
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="px-4 py-16 text-center text-slate-500">
              <div className="w-12 h-12 rounded-2xl bg-slate-800/60 flex items-center justify-center mx-auto mb-3 text-slate-500">
                <ImageIcon className="w-6 h-6" />
              </div>
              <p className="text-sm text-slate-300 font-medium">No assessment records found</p>
              <p className="text-xs text-slate-500 mt-1">
                Upload an image in the Assessment tab to perform quality classification.
              </p>
            </div>
          ) : (
            filteredItems.map((item) => {
              const imageUrl = getImageUrl(item.image_path);
              const foodName = getFoodName(item);
              const formattedDate = formatDateTime(item.created_at);
              const confidencePct = (item.confidence * 100).toFixed(1) + '%';

              return (
                <div key={item.id} className="p-4 space-y-3 hover:bg-slate-800/20 transition-colors">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div 
                        onClick={() => setSelectedDetailItem(item)}
                        className="w-12 h-12 rounded-xl overflow-hidden border border-slate-700/60 bg-slate-950 flex items-center justify-center cursor-pointer shrink-0 shadow-sm"
                      >
                        {imageUrl ? (
                          <img 
                            src={imageUrl} 
                            alt={foodName} 
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.parentElement.innerHTML = '<span class="text-[10px] text-slate-500">IMG</span>';
                            }}
                          />
                        ) : (
                          <ImageIcon className="w-5 h-5 text-slate-600" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-white truncate">{foodName}</h4>
                        <p className="text-[11px] text-slate-400 mt-0.5 truncate">{formattedDate}</p>
                      </div>
                    </div>
                    <div className="shrink-0">
                      {renderQualityBadge(item)}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-slate-800/40 text-xs">
                    <div className="flex items-center gap-1.5 text-slate-400">
                      <span className="text-[11px]">Confidence:</span>
                      <span className="font-mono font-bold text-emerald-400">{confidencePct}</span>
                    </div>
                    <button
                      onClick={() => setSelectedDetailItem(item)}
                      className="px-3.5 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500 text-emerald-400 hover:text-slate-950 font-semibold text-xs border border-emerald-500/30 transition-colors shadow-sm"
                    >
                      View Details &rarr;
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Desktop Table View (>= 768px) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full min-w-[700px] text-left text-xs text-slate-300">
            {/* Headers matching reference: Date & Time | Image | Food Name | Quality | Confidence | Actions */}
            <thead className="bg-slate-950/60 border-b border-slate-800/80 text-slate-400 font-medium text-xs">
              <tr>
                <th className="px-6 py-4">Date & Time</th>
                <th className="px-6 py-4">Image</th>
                <th className="px-6 py-4">Food Name</th>
                <th className="px-6 py-4">Quality</th>
                <th className="px-6 py-4">Confidence</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {isLoading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-16 text-center text-slate-500">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-500/60" />
                    Fetching analysis logs from database...
                  </td>
                </tr>
              ) : filteredItems.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-16 text-center text-slate-500">
                    <div className="w-12 h-12 rounded-2xl bg-slate-800/60 flex items-center justify-center mx-auto mb-3 text-slate-500">
                      <ImageIcon className="w-6 h-6" />
                    </div>
                    <p className="text-sm text-slate-300 font-medium">No assessment records found</p>
                    <p className="text-xs text-slate-500 mt-1">
                      Upload an image in the Assessment tab to perform quality classification.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => {
                  const imageUrl = getImageUrl(item.image_path);
                  const foodName = getFoodName(item);
                  const formattedDate = formatDateTime(item.created_at);
                  const confidencePct = (item.confidence * 100).toFixed(1) + '%';

                  return (
                    <tr 
                      key={item.id} 
                      className="hover:bg-slate-800/30 transition-colors duration-150"
                    >
                      {/* Date & Time */}
                      <td className="px-6 py-4 text-slate-400 whitespace-nowrap">
                        {formattedDate}
                      </td>

                      {/* Image Thumbnail */}
                      <td className="px-6 py-4">
                        <div 
                          onClick={() => setSelectedDetailItem(item)}
                          className="w-10 h-10 rounded-lg overflow-hidden border border-slate-700/60 bg-slate-950 flex items-center justify-center cursor-pointer hover:border-emerald-500/50 transition-all shadow-sm"
                        >
                          {imageUrl ? (
                            <img 
                              src={imageUrl} 
                              alt={foodName} 
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.parentElement.innerHTML = '<span class="text-[10px] text-slate-500">IMG</span>';
                              }}
                            />
                          ) : (
                            <ImageIcon className="w-4 h-4 text-slate-600" />
                          )}
                        </div>
                      </td>

                      {/* Food Name */}
                      <td className="px-6 py-4 font-semibold text-white whitespace-nowrap">
                        {foodName}
                      </td>

                      {/* Quality status badge */}
                      <td className="px-6 py-4">
                        {renderQualityBadge(item)}
                      </td>

                      {/* Confidence */}
                      <td className="px-6 py-4 font-mono font-medium text-slate-200">
                        {confidencePct}
                      </td>

                      {/* Actions: View emerald pill button */}
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => setSelectedDetailItem(item)}
                          className="px-4 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500 text-emerald-400 hover:text-slate-950 font-semibold text-xs border border-emerald-500/30 hover:border-emerald-500 transition-all duration-150 shadow-sm"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Bottom Pagination Controls matching reference: < 1 2 3 ... > */}
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-t border-slate-800/80 bg-slate-950/40 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
          <span className="text-center sm:text-left">
            Showing <span className="text-white font-medium">{historyItems.length > 0 ? page * limit + 1 : 0}</span>–
            <span className="text-white font-medium">{Math.min((page + 1) * limit, totalCount)}</span> of{' '}
            <span className="text-white font-medium">{totalCount}</span> results
          </span>

          <div className="flex items-center gap-1 sm:gap-1.5">
            {/* Previous button */}
            <button
              disabled={page === 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              title="Previous page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {/* Page number buttons */}
            {Array.from({ length: Math.min(totalPages, 5) }).map((_, idx) => {
              const pageIdx = idx;
              const isActive = page === pageIdx;
              return (
                <button
                  key={pageIdx}
                  onClick={() => setPage(pageIdx)}
                  className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-emerald-500 text-slate-950 shadow-md font-bold'
                      : 'bg-slate-900 border border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  {pageIdx + 1}
                </button>
              );
            })}

            {totalPages > 5 && <span className="px-1 text-slate-600">...</span>}

            {/* Next button */}
            <button
              disabled={(page + 1) * limit >= totalCount}
              onClick={() => setPage((p) => p + 1)}
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              title="Next page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Detail Modal when clicking "View" */}
      {selectedDetailItem && (
        <div 
          onClick={() => setSelectedDetailItem(null)}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 xs:p-4 sm:p-6 overflow-y-auto"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-xl max-h-[92vh] flex flex-col rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200"
          >
            {/* Modal Header */}
            <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <Eye className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    {getFoodName(selectedDetailItem)}
                  </h3>
                  <p className="text-[11px] text-slate-400">Record #{selectedDetailItem.id} • Quality Assessment</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedDetailItem(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-6 space-y-4 sm:space-y-5 overflow-y-auto">
              {/* Image Preview */}
              {getImageUrl(selectedDetailItem.image_path) ? (
                <div className="w-full h-48 sm:h-56 rounded-xl overflow-hidden border border-slate-800 bg-black relative flex items-center justify-center">
                  <img
                    src={getImageUrl(selectedDetailItem.image_path)}
                    alt={getFoodName(selectedDetailItem)}
                    className="w-full h-full object-contain"
                  />
                  <div className="absolute bottom-3 left-3">
                    {renderQualityBadge(selectedDetailItem)}
                  </div>
                </div>
              ) : null}

              {/* Assessment Stats Grid */}
              <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3">
                <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80">
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Predicted Quality</span>
                  <span className="text-sm font-bold text-white mt-1 block">
                    {selectedDetailItem.predicted_class}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80">
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Confidence Score</span>
                  <span className="text-sm font-bold text-emerald-400 font-mono mt-1 block">
                    {(selectedDetailItem.confidence * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80">
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Inference Latency</span>
                  <span className="text-sm font-bold text-cyan-400 font-mono mt-1 block">
                    {selectedDetailItem.latency_ms ? `${selectedDetailItem.latency_ms.toFixed(0)} ms` : '< 50 ms'}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80">
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Model Architecture</span>
                  <span className="text-xs font-semibold text-slate-300 mt-1 block truncate">
                    {selectedDetailItem.model_name || 'VGG16'}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 col-span-1 xs:col-span-2 sm:col-span-2">
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Assessment Timestamp</span>
                  <span className="text-xs font-medium text-slate-300 mt-1 block">
                    {formatDateTime(selectedDetailItem.created_at)}
                  </span>
                </div>
              </div>

              {/* Probability Breakdown */}
              {selectedDetailItem.probabilities && (
                <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-2">
                  <span className="text-[11px] font-semibold text-slate-400 block">Class Probability Distribution</span>
                  <div className="space-y-2">
                    {Object.entries(selectedDetailItem.probabilities).map(([cName, prob]) => (
                      <div key={cName} className="space-y-1">
                        <div className="flex justify-between text-xs font-mono">
                          <span className="text-slate-300">{cName}</span>
                          <span className="text-slate-400">{(prob * 100).toFixed(1)}%</span>
                        </div>
                        <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${
                              cName === 'Fresh' ? 'bg-emerald-400' : 'bg-rose-500'
                            }`}
                            style={{ width: `${prob * 100}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Notes Section */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                  <span>Assessment Notes & Tags</span>
                  {editingNoteId !== selectedDetailItem.id && (
                    <button
                      onClick={() => {
                        setEditingNoteId(selectedDetailItem.id);
                        setNoteText(selectedDetailItem.notes || '');
                      }}
                      className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-normal"
                    >
                      <Edit3 className="w-3 h-3" /> Edit Note
                    </button>
                  )}
                </label>
                {editingNoteId === selectedDetailItem.id ? (
                  <div className="flex flex-col xs:flex-row gap-2">
                    <input
                      type="text"
                      value={noteText}
                      onChange={(e) => setNoteText(e.target.value)}
                      placeholder="Add assessment tags or notes..."
                      className="flex-1 px-3 py-1.5 bg-slate-950 border border-emerald-500/50 rounded-xl text-xs text-white focus:outline-none"
                      autoFocus
                    />
                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={() => handleSaveNote(selectedDetailItem.id)}
                        className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold rounded-xl"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingNoteId(null)}
                        className="px-3 py-1.5 bg-slate-800 text-slate-400 hover:text-white text-xs rounded-xl"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                    {selectedDetailItem.notes || 'No assessment notes recorded for this item.'}
                  </p>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-4 sm:px-6 py-3 sm:py-3.5 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between shrink-0">
              <button
                onClick={() => handleDeleteItem(selectedDetailItem.id)}
                className="flex items-center gap-1.5 text-xs text-rose-400 hover:text-rose-300 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" /> Delete Record
              </button>
              <button
                onClick={() => setSelectedDetailItem(null)}
                className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium transition-colors"
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
