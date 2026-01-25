import React, { useState, useEffect } from 'react';
import { Calendar, Clock, DollarSign, MapPin, Camera, FileText, Plus, Trash2, Download } from 'lucide-react';

// PDF generation using jsPDF
const generatePDF = async (entries, contractorInfo) => {
  // Dynamic import of jsPDF
  const { jsPDF } = await import('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js');
  
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  const margin = 20;
  let yPos = margin;

  // Header
  doc.setFillColor(26, 32, 44);
  doc.rect(0, 0, pageWidth, 45, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont(undefined, 'bold');
  doc.text('CONTRACTOR REPORT', margin, 25);
  
  doc.setFontSize(10);
  doc.setFont(undefined, 'normal');
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, margin, 35);

  yPos = 60;

  // Contractor Info
  if (contractorInfo.name || contractorInfo.business) {
    doc.setTextColor(26, 32, 44);
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text('CONTRACTOR INFORMATION', margin, yPos);
    yPos += 8;

    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    if (contractorInfo.name) {
      doc.text(`Name: ${contractorInfo.name}`, margin, yPos);
      yPos += 6;
    }
    if (contractorInfo.business) {
      doc.text(`Business: ${contractorInfo.business}`, margin, yPos);
      yPos += 6;
    }
    yPos += 5;
  }

  // Summary
  const totals = entries.reduce((acc, entry) => ({
    standardHours: acc.standardHours + (parseFloat(entry.standardHours) || 0),
    overtimeHours: acc.overtimeHours + (parseFloat(entry.overtimeHours) || 0),
    mileage: acc.mileage + (parseFloat(entry.mileage) || 0),
    gasExpense: acc.gasExpense + (parseFloat(entry.gasExpense) || 0),
    otherExpense: acc.otherExpense + (parseFloat(entry.otherExpense) || 0)
  }), { standardHours: 0, overtimeHours: 0, mileage: 0, gasExpense: 0, otherExpense: 0 });

  doc.setFillColor(240, 242, 245);
  doc.rect(margin - 5, yPos - 5, pageWidth - 2 * margin + 10, 55, 'F');

  doc.setTextColor(26, 32, 44);
  doc.setFontSize(12);
  doc.setFont(undefined, 'bold');
  doc.text('SUMMARY', margin, yPos + 5);
  yPos += 15;

  doc.setFontSize(10);
  doc.setFont(undefined, 'normal');
  doc.text(`Total Standard Hours: ${totals.standardHours.toFixed(2)}`, margin, yPos);
  yPos += 7;
  doc.text(`Total Overtime Hours: ${totals.overtimeHours.toFixed(2)}`, margin, yPos);
  yPos += 7;
  doc.text(`Total Mileage: ${totals.mileage.toFixed(2)} miles`, margin, yPos);
  yPos += 7;
  doc.text(`Total Gas Expense: $${totals.gasExpense.toFixed(2)}`, margin, yPos);
  yPos += 7;
  doc.text(`Total Other Expenses: $${totals.otherExpense.toFixed(2)}`, margin, yPos);
  yPos += 7;
  
  const totalExpenses = totals.gasExpense + totals.otherExpense;
  doc.setFont(undefined, 'bold');
  doc.text(`TOTAL EXPENSES: $${totalExpenses.toFixed(2)}`, margin, yPos);
  yPos += 15;

  // Entries
  doc.setFontSize(12);
  doc.setFont(undefined, 'bold');
  doc.text('DETAILED ENTRIES', margin, yPos);
  yPos += 10;

  entries.sort((a, b) => new Date(a.date) - new Date(b.date)).forEach((entry, index) => {
    if (yPos > pageHeight - 40) {
      doc.addPage();
      yPos = margin;
    }

    doc.setFillColor(250, 250, 251);
    const entryHeight = 50;
    doc.rect(margin - 5, yPos - 5, pageWidth - 2 * margin + 10, entryHeight, 'F');

    doc.setTextColor(26, 32, 44);
    doc.setFontSize(11);
    doc.setFont(undefined, 'bold');
    doc.text(`${new Date(entry.date).toLocaleDateString()}`, margin, yPos + 3);
    
    doc.setFontSize(9);
    doc.setFont(undefined, 'normal');
    yPos += 10;

    if (entry.standardHours || entry.overtimeHours) {
      doc.text(`Hours: ${entry.standardHours || 0} standard, ${entry.overtimeHours || 0} overtime`, margin + 5, yPos);
      yPos += 6;
    }
    if (entry.mileage) {
      doc.text(`Mileage: ${entry.mileage} miles`, margin + 5, yPos);
      yPos += 6;
    }
    if (entry.gasExpense) {
      doc.text(`Gas: $${parseFloat(entry.gasExpense).toFixed(2)}`, margin + 5, yPos);
      yPos += 6;
    }
    if (entry.otherExpense) {
      doc.text(`Other Expense: $${parseFloat(entry.otherExpense).toFixed(2)}`, margin + 5, yPos);
      if (entry.expenseDescription) {
        doc.text(` - ${entry.expenseDescription}`, margin + 45, yPos);
      }
      yPos += 6;
    }
    if (entry.notes) {
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      doc.text(`Notes: ${entry.notes.substring(0, 60)}${entry.notes.length > 60 ? '...' : ''}`, margin + 5, yPos);
      yPos += 6;
      doc.setTextColor(26, 32, 44);
      doc.setFontSize(9);
    }

    yPos += 8;
  });

  // Footer
  const fileName = `contractor_report_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
};

export default function ContractorTracker() {
  const [entries, setEntries] = useState([]);
  const [currentEntry, setCurrentEntry] = useState({
    date: new Date().toISOString().split('T')[0],
    standardHours: '',
    overtimeHours: '',
    mileage: '',
    gasExpense: '',
    otherExpense: '',
    expenseDescription: '',
    notes: '',
    receiptImage: null
  });
  const [contractorInfo, setContractorInfo] = useState({
    name: '',
    business: ''
  });
  const [showInfo, setShowInfo] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load data from localStorage
  useEffect(() => {
    try {
      const entriesData = localStorage.getItem('contractor-entries');
      const infoData = localStorage.getItem('contractor-info');
      
      if (entriesData) {
        setEntries(JSON.parse(entriesData));
      }
      if (infoData) {
        setContractorInfo(JSON.parse(infoData));
      }
    } catch (error) {
      console.log('No existing data found');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Save entries to localStorage
  const saveEntries = (newEntries) => {
    try {
      localStorage.setItem('contractor-entries', JSON.stringify(newEntries));
    } catch (error) {
      console.error('Failed to save entries:', error);
    }
  };

  // Save contractor info to localStorage
  const saveContractorInfo = (info) => {
    try {
      localStorage.setItem('contractor-info', JSON.stringify(info));
    } catch (error) {
      console.error('Failed to save contractor info:', error);
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCurrentEntry({ ...currentEntry, receiptImage: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const addEntry = () => {
    if (!currentEntry.date) {
      alert('Please select a date');
      return;
    }

    const newEntry = {
      ...currentEntry,
      id: Date.now(),
      timestamp: new Date().toISOString()
    };

    const updatedEntries = [...entries, newEntry];
    setEntries(updatedEntries);
    saveEntries(updatedEntries);

    // Reset form
    setCurrentEntry({
      date: new Date().toISOString().split('T')[0],
      standardHours: '',
      overtimeHours: '',
      mileage: '',
      gasExpense: '',
      otherExpense: '',
      expenseDescription: '',
      notes: '',
      receiptImage: null
    });
  };

  const deleteEntry = (id) => {
    const updatedEntries = entries.filter(e => e.id !== id);
    setEntries(updatedEntries);
    saveEntries(updatedEntries);
  };

  const updateContractorInfo = (field, value) => {
    const updatedInfo = { ...contractorInfo, [field]: value };
    setContractorInfo(updatedInfo);
    saveContractorInfo(updatedInfo);
  };

  const totals = entries.reduce((acc, entry) => ({
    standardHours: acc.standardHours + (parseFloat(entry.standardHours) || 0),
    overtimeHours: acc.overtimeHours + (parseFloat(entry.overtimeHours) || 0),
    mileage: acc.mileage + (parseFloat(entry.mileage) || 0),
    gasExpense: acc.gasExpense + (parseFloat(entry.gasExpense) || 0),
    otherExpense: acc.otherExpense + (parseFloat(entry.otherExpense) || 0)
  }), { standardHours: 0, overtimeHours: 0, mileage: 0, gasExpense: 0, otherExpense: 0 });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-amber-400 text-xl font-light">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-slate-100 pb-20">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
        
        * {
          font-family: 'Outfit', sans-serif;
        }
        
        input, textarea, select {
          font-family: 'Outfit', sans-serif;
        }
        
        .mono {
          font-family: 'JetBrains Mono', monospace;
        }
        
        input:focus, textarea:focus {
          outline: none;
          border-color: #fbbf24;
          box-shadow: 0 0 0 3px rgba(251, 191, 36, 0.1);
        }
        
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-slide-up {
          animation: slideUp 0.4s ease-out;
        }
        
        .glass {
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .input-field {
          background: rgba(15, 23, 42, 0.5);
          border: 1px solid rgba(148, 163, 184, 0.2);
          transition: all 0.3s ease;
        }
        
        .input-field:focus {
          background: rgba(15, 23, 42, 0.7);
          border-color: #fbbf24;
        }
        
        .btn-primary {
          background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
          transition: all 0.3s ease;
          box-shadow: 0 4px 14px rgba(251, 191, 36, 0.3);
        }
        
        .btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(251, 191, 36, 0.4);
        }
        
        .btn-primary:active {
          transform: translateY(0);
        }
      `}</style>

      {/* Header */}
      <div className="glass border-b border-slate-700/50 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-amber-400 tracking-tight">
                CONTRACTOR
              </h1>
              <p className="text-slate-400 text-sm font-light mt-1">Time & Expense Tracker</p>
            </div>
            <button
              onClick={() => setShowInfo(!showInfo)}
              className="text-sm px-4 py-2 rounded-lg glass hover:bg-white/10 transition-all"
            >
              {showInfo ? 'Close' : 'Info'}
            </button>
          </div>
        </div>
      </div>

      {/* Contractor Info Panel */}
      {showInfo && (
        <div className="max-w-4xl mx-auto px-4 mt-6 animate-slide-up">
          <div className="glass rounded-2xl p-6 border border-amber-400/20">
            <h2 className="text-xl font-semibold mb-4 text-amber-400">Contractor Information</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-slate-300">Your Name</label>
                <input
                  type="text"
                  value={contractorInfo.name}
                  onChange={(e) => updateContractorInfo('name', e.target.value)}
                  className="w-full px-4 py-3 rounded-lg input-field text-slate-100"
                  placeholder="John Doe"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-slate-300">Business Name</label>
                <input
                  type="text"
                  value={contractorInfo.business}
                  onChange={(e) => updateContractorInfo('business', e.target.value)}
                  className="w-full px-4 py-3 rounded-lg input-field text-slate-100"
                  placeholder="Doe Contracting LLC"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="max-w-4xl mx-auto px-4 mt-6">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div className="glass rounded-xl p-4 border border-slate-700/50">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-amber-400" />
              <span className="text-xs text-slate-400">Standard</span>
            </div>
            <div className="text-2xl font-semibold mono text-slate-100">{totals.standardHours.toFixed(1)}</div>
            <div className="text-xs text-slate-500 mt-1">hours</div>
          </div>
          
          <div className="glass rounded-xl p-4 border border-slate-700/50">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-orange-400" />
              <span className="text-xs text-slate-400">Overtime</span>
            </div>
            <div className="text-2xl font-semibold mono text-slate-100">{totals.overtimeHours.toFixed(1)}</div>
            <div className="text-xs text-slate-500 mt-1">hours</div>
          </div>
          
          <div className="glass rounded-xl p-4 border border-slate-700/50">
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="w-4 h-4 text-blue-400" />
              <span className="text-xs text-slate-400">Mileage</span>
            </div>
            <div className="text-2xl font-semibold mono text-slate-100">{totals.mileage.toFixed(0)}</div>
            <div className="text-xs text-slate-500 mt-1">miles</div>
          </div>
          
          <div className="glass rounded-xl p-4 border border-slate-700/50">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="w-4 h-4 text-green-400" />
              <span className="text-xs text-slate-400">Gas</span>
            </div>
            <div className="text-2xl font-semibold mono text-slate-100">${totals.gasExpense.toFixed(0)}</div>
            <div className="text-xs text-slate-500 mt-1">spent</div>
          </div>
          
          <div className="glass rounded-xl p-4 border border-slate-700/50">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="w-4 h-4 text-purple-400" />
              <span className="text-xs text-slate-400">Other</span>
            </div>
            <div className="text-2xl font-semibold mono text-slate-100">${totals.otherExpense.toFixed(0)}</div>
            <div className="text-xs text-slate-500 mt-1">expenses</div>
          </div>
        </div>
      </div>

      {/* Entry Form */}
      <div className="max-w-4xl mx-auto px-4 mt-6">
        <div className="glass rounded-2xl p-6 border border-slate-700/50">
          <h2 className="text-xl font-semibold mb-6 text-amber-400 flex items-center gap-2">
            <Plus className="w-5 h-5" />
            New Entry
          </h2>
          
          <div className="space-y-4">
            {/* Date */}
            <div>
              <label className="block text-sm font-medium mb-2 text-slate-300 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Date
              </label>
              <input
                type="date"
                value={currentEntry.date}
                onChange={(e) => setCurrentEntry({ ...currentEntry, date: e.target.value })}
                className="w-full px-4 py-3 rounded-lg input-field text-slate-100"
              />
            </div>

            {/* Hours */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-slate-300">Standard Hours</label>
                <input
                  type="number"
                  step="0.5"
                  value={currentEntry.standardHours}
                  onChange={(e) => setCurrentEntry({ ...currentEntry, standardHours: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg input-field text-slate-100"
                  placeholder="8.0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-slate-300">Overtime Hours</label>
                <input
                  type="number"
                  step="0.5"
                  value={currentEntry.overtimeHours}
                  onChange={(e) => setCurrentEntry({ ...currentEntry, overtimeHours: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg input-field text-slate-100"
                  placeholder="2.0"
                />
              </div>
            </div>

            {/* Expenses */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-slate-300 flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Mileage (miles)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={currentEntry.mileage}
                  onChange={(e) => setCurrentEntry({ ...currentEntry, mileage: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg input-field text-slate-100"
                  placeholder="45.2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-slate-300 flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  Gas Expense
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={currentEntry.gasExpense}
                  onChange={(e) => setCurrentEntry({ ...currentEntry, gasExpense: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg input-field text-slate-100"
                  placeholder="52.30"
                />
              </div>
            </div>

            {/* Other Expenses */}
            <div>
              <label className="block text-sm font-medium mb-2 text-slate-300">Other Expense</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="number"
                  step="0.01"
                  value={currentEntry.otherExpense}
                  onChange={(e) => setCurrentEntry({ ...currentEntry, otherExpense: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg input-field text-slate-100"
                  placeholder="Amount"
                />
                <input
                  type="text"
                  value={currentEntry.expenseDescription}
                  onChange={(e) => setCurrentEntry({ ...currentEntry, expenseDescription: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg input-field text-slate-100"
                  placeholder="Description (e.g., Tools, Materials)"
                />
              </div>
            </div>

            {/* Receipt Upload */}
            <div>
              <label className="block text-sm font-medium mb-2 text-slate-300 flex items-center gap-2">
                <Camera className="w-4 h-4" />
                Receipt Image
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="w-full px-4 py-3 rounded-lg input-field text-slate-100 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-amber-400 file:text-slate-900 hover:file:bg-amber-300 file:cursor-pointer"
              />
              {currentEntry.receiptImage && (
                <div className="mt-3 relative inline-block">
                  <img src={currentEntry.receiptImage} alt="Receipt" className="max-w-full h-32 rounded-lg border border-slate-700" />
                  <button
                    onClick={() => setCurrentEntry({ ...currentEntry, receiptImage: null })}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                  >
                    ×
                  </button>
                </div>
              )}
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium mb-2 text-slate-300">Notes</label>
              <textarea
                value={currentEntry.notes}
                onChange={(e) => setCurrentEntry({ ...currentEntry, notes: e.target.value })}
                className="w-full px-4 py-3 rounded-lg input-field text-slate-100 h-24 resize-none"
                placeholder="Additional notes about this entry..."
              />
            </div>

            {/* Add Button */}
            <button
              onClick={addEntry}
              className="w-full btn-primary text-slate-900 font-semibold py-4 rounded-xl flex items-center justify-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Add Entry
            </button>
          </div>
        </div>
      </div>

      {/* Entries List */}
      {entries.length > 0 && (
        <div className="max-w-4xl mx-auto px-4 mt-6">
          <div className="glass rounded-2xl p-6 border border-slate-700/50">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-amber-400">Recent Entries</h2>
              <button
                onClick={() => generatePDF(entries, contractorInfo)}
                className="btn-primary px-6 py-3 rounded-xl text-slate-900 font-semibold flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Export PDF
              </button>
            </div>
            
            <div className="space-y-3">
              {[...entries].reverse().map((entry) => (
                <div key={entry.id} className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50 animate-slide-up hover:bg-slate-800/70 transition-all">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="font-semibold text-amber-400 mono">{new Date(entry.date).toLocaleDateString()}</div>
                      <div className="text-xs text-slate-500 mt-1">
                        Added {new Date(entry.timestamp).toLocaleString()}
                      </div>
                    </div>
                    <button
                      onClick={() => deleteEntry(entry.id)}
                      className="text-red-400 hover:text-red-300 p-2 hover:bg-red-400/10 rounded-lg transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    {entry.standardHours && (
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-amber-400" />
                        <span className="text-slate-300">{entry.standardHours}h standard</span>
                      </div>
                    )}
                    {entry.overtimeHours && (
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-orange-400" />
                        <span className="text-slate-300">{entry.overtimeHours}h OT</span>
                      </div>
                    )}
                    {entry.mileage && (
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-blue-400" />
                        <span className="text-slate-300">{entry.mileage} mi</span>
                      </div>
                    )}
                    {entry.gasExpense && (
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-green-400" />
                        <span className="text-slate-300">${parseFloat(entry.gasExpense).toFixed(2)} gas</span>
                      </div>
                    )}
                    {entry.otherExpense && (
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-purple-400" />
                        <span className="text-slate-300">
                          ${parseFloat(entry.otherExpense).toFixed(2)}
                          {entry.expenseDescription && ` - ${entry.expenseDescription}`}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  {entry.notes && (
                    <div className="mt-3 text-sm text-slate-400 italic bg-slate-900/50 p-3 rounded-lg">
                      {entry.notes}
                    </div>
                  )}
                  
                  {entry.receiptImage && (
                    <div className="mt-3">
                      <img src={entry.receiptImage} alt="Receipt" className="max-w-full h-32 rounded-lg border border-slate-700 cursor-pointer hover:opacity-80 transition-opacity" 
                        onClick={() => window.open(entry.receiptImage, '_blank')}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {entries.length === 0 && (
        <div className="max-w-4xl mx-auto px-4 mt-12 text-center">
          <div className="glass rounded-2xl p-12 border border-slate-700/50">
            <FileText className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-400 mb-2">No Entries Yet</h3>
            <p className="text-slate-500">Add your first entry to start tracking your contractor work</p>
          </div>
        </div>
      )}
    </div>
  );
}
