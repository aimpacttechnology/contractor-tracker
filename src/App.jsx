import React, { useState, useEffect } from 'react';
import { Calendar, Clock, DollarSign, MapPin, Camera, FileText, Plus, Trash2, Download } from 'lucide-react';
import { jsPDF } from 'jspdf';

// Helper function to format dates correctly (avoid timezone issues)
const formatDate = (dateString) => {
  const [year, month, day] = dateString.split('-');
  return new Date(year, month - 1, day).toLocaleDateString();
};

// PDF generation function
const generatePDF = (entries, contractorInfo) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  const margin = 20;
  let yPos = margin;

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

  doc.setFontSize(12);
  doc.setFont(undefined, 'bold');
  doc.text('DETAILED ENTRIES', margin, yPos);
  yPos += 10;

  entries.sort((a, b) => new Date(a.date) - new Date(b.date)).forEach((entry) => {
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
    // Use formatDate helper to avoid timezone issues
    doc.text(formatDate(entry.date), margin, yPos + 3);
    
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

  const saveEntries = (newEntries) => {
    try {
      localStorage.setItem('contractor-entries', JSON.stringify(newEntries));
    } catch (error) {
      console.error('Failed to save entries:', error);
    }
  };

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
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#fbbf24',
        fontSize: '20px',
        fontFamily: "'Outfit', sans-serif"
      }}>
        Loading...
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
      color: '#f1f5f9',
      paddingBottom: '80px',
      fontFamily: "'Outfit', sans-serif"
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
        
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Outfit', sans-serif;
        }
        
        .mono {
          font-family: 'JetBrains Mono', monospace;
        }
        
        input:focus, textarea:focus, select:focus {
          outline: none;
          border-color: #fbbf24 !important;
          box-shadow: 0 0 0 3px rgba(251, 191, 36, 0.1) !important;
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
          padding: 12px 16px;
          border-radius: 8px;
          color: #f1f5f9;
          fontSize: 14px;
          width: 100%;
        }
        
        .input-field:focus {
          background: rgba(15, 23, 42, 0.7);
          border-color: #fbbf24;
        }
        
        .btn-primary {
          background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
          transition: all 0.3s ease;
          box-shadow: 0 4px 14px rgba(251, 191, 36, 0.3);
          border: none;
          color: #0f172a;
          font-weight: 600;
          cursor: pointer;
          padding: 16px;
          border-radius: 12px;
          fontSize: 16px;
          display: flex;
          align-items: center;
          justifyContent: center;
          gap: 8px;
        }
        
        .btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(251, 191, 36, 0.4);
        }
        
        .btn-primary:active {
          transform: translateY(0);
        }
        
        .summary-card {
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          padding: 16px;
        }
        
        .entry-card {
          background: rgba(30, 41, 59, 0.5);
          border: 1px solid rgba(100, 116, 139, 0.5);
          border-radius: 12px;
          padding: 16px;
          animation: slideUp 0.4s ease-out;
          transition: all 0.3s ease;
        }
        
        .entry-card:hover {
          background: rgba(30, 41, 59, 0.7);
        }
      `}</style>

      {/* Header */}
      <div className="glass" style={{
        borderBottom: '1px solid rgba(100, 116, 139, 0.5)',
        position: 'sticky',
        top: 0,
        zIndex: 10,
        background: 'rgba(255, 255, 255, 0.05)',
        backdropFilter: 'blur(12px)'
      }}>
        <div style={{ maxWidth: '896px', margin: '0 auto', padding: '24px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h1 style={{ fontSize: '30px', fontWeight: '700', color: '#fbbf24', letterSpacing: '-0.5px', margin: 0 }}>
                CONTRACTOR
              </h1>
              <p style={{ color: '#94a3b8', fontSize: '14px', fontWeight: '300', marginTop: '4px' }}>Time & Expense Tracker</p>
            </div>
            <button
              onClick={() => setShowInfo(!showInfo)}
              style={{
                fontSize: '14px',
                padding: '8px 16px',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.05)',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#f1f5f9',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.1)'}
              onMouseLeave={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.05)'}
            >
              {showInfo ? 'Close' : 'Info'}
            </button>
          </div>
        </div>
      </div>

      {/* Contractor Info Panel */}
      {showInfo && (
        <div style={{ maxWidth: '896px', margin: '24px auto 0', padding: '0 16px' }} className="animate-slide-up">
          <div className="glass" style={{ borderRadius: '16px', padding: '24px', border: '1px solid rgba(251, 191, 36, 0.2)' }}>
            <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '16px', color: '#fbbf24' }}>Contractor Information</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px', color: '#cbd5e1' }}>Your Name</label>
                <input
                  type="text"
                  value={contractorInfo.name}
                  onChange={(e) => updateContractorInfo('name', e.target.value)}
                  className="input-field"
                  placeholder="John Doe"
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px', color: '#cbd5e1' }}>Business Name</label>
                <input
                  type="text"
                  value={contractorInfo.business}
                  onChange={(e) => updateContractorInfo('business', e.target.value)}
                  className="input-field"
                  placeholder="Doe Contracting LLC"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div style={{ maxWidth: '896px', margin: '24px auto 0', padding: '0 16px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px' }}>
          <div className="summary-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <Clock size={16} color="#fbbf24" />
              <span style={{ fontSize: '12px', color: '#94a3b8' }}>Standard</span>
            </div>
            <div className="mono" style={{ fontSize: '24px', fontWeight: '600', color: '#f1f5f9' }}>{totals.standardHours.toFixed(1)}</div>
            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>hours</div>
          </div>
          
          <div className="summary-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <Clock size={16} color="#fb923c" />
              <span style={{ fontSize: '12px', color: '#94a3b8' }}>Overtime</span>
            </div>
            <div className="mono" style={{ fontSize: '24px', fontWeight: '600', color: '#f1f5f9' }}>{totals.overtimeHours.toFixed(1)}</div>
            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>hours</div>
          </div>
          
          <div className="summary-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <MapPin size={16} color="#60a5fa" />
              <span style={{ fontSize: '12px', color: '#94a3b8' }}>Mileage</span>
            </div>
            <div className="mono" style={{ fontSize: '24px', fontWeight: '600', color: '#f1f5f9' }}>{totals.mileage.toFixed(0)}</div>
            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>miles</div>
          </div>
          
          <div className="summary-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <DollarSign size={16} color="#4ade80" />
              <span style={{ fontSize: '12px', color: '#94a3b8' }}>Gas</span>
            </div>
            <div className="mono" style={{ fontSize: '24px', fontWeight: '600', color: '#f1f5f9' }}>${totals.gasExpense.toFixed(0)}</div>
            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>spent</div>
          </div>
          
          <div className="summary-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <FileText size={16} color="#a78bfa" />
              <span style={{ fontSize: '12px', color: '#94a3b8' }}>Other</span>
            </div>
            <div className="mono" style={{ fontSize: '24px', fontWeight: '600', color: '#f1f5f9' }}>${totals.otherExpense.toFixed(0)}</div>
            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>expenses</div>
          </div>
        </div>
      </div>

      {/* Entry Form */}
      <div style={{ maxWidth: '896px', margin: '24px auto 0', padding: '0 16px' }}>
        <div className="glass" style={{ borderRadius: '16px', padding: '24px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '24px', color: '#fbbf24', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Plus size={20} />
            New Entry
          </h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: '500', marginBottom: '8px', color: '#cbd5e1' }}>
                <Calendar size={16} />
                Date
              </label>
              <input
                type="date"
                value={currentEntry.date}
                onChange={(e) => setCurrentEntry({ ...currentEntry, date: e.target.value })}
                className="input-field"
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px', color: '#cbd5e1' }}>Standard Hours</label>
                <input
                  type="number"
                  step="0.5"
                  value={currentEntry.standardHours}
                  onChange={(e) => setCurrentEntry({ ...currentEntry, standardHours: e.target.value })}
                  className="input-field"
                  placeholder="8.0"
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px', color: '#cbd5e1' }}>Overtime Hours</label>
                <input
                  type="number"
                  step="0.5"
                  value={currentEntry.overtimeHours}
                  onChange={(e) => setCurrentEntry({ ...currentEntry, overtimeHours: e.target.value })}
                  className="input-field"
                  placeholder="2.0"
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: '500', marginBottom: '8px', color: '#cbd5e1' }}>
                  <MapPin size={16} />
                  Mileage (miles)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={currentEntry.mileage}
                  onChange={(e) => setCurrentEntry({ ...currentEntry, mileage: e.target.value })}
                  className="input-field"
                  placeholder="45.2"
                />
              </div>
              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: '500', marginBottom: '8px', color: '#cbd5e1' }}>
                  <DollarSign size={16} />
                  Gas Expense
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={currentEntry.gasExpense}
                  onChange={(e) => setCurrentEntry({ ...currentEntry, gasExpense: e.target.value })}
                  className="input-field"
                  placeholder="52.30"
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px', color: '#cbd5e1' }}>Other Expense</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                <input
                  type="number"
                  step="0.01"
                  value={currentEntry.otherExpense}
                  onChange={(e) => setCurrentEntry({ ...currentEntry, otherExpense: e.target.value })}
                  className="input-field"
                  placeholder="Amount"
                />
                <input
                  type="text"
                  value={currentEntry.expenseDescription}
                  onChange={(e) => setCurrentEntry({ ...currentEntry, expenseDescription: e.target.value })}
                  className="input-field"
                  placeholder="Description (e.g., Tools, Materials)"
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: '500', marginBottom: '8px', color: '#cbd5e1' }}>
                <Camera size={16} />
                Receipt Image
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="input-field"
                style={{ padding: '12px' }}
              />
              {currentEntry.receiptImage && (
                <div style={{ marginTop: '12px', position: 'relative', display: 'inline-block' }}>
                  <img src={currentEntry.receiptImage} alt="Receipt" style={{ maxWidth: '100%', height: '128px', borderRadius: '8px', border: '1px solid #334155' }} />
                  <button
                    onClick={() => setCurrentEntry({ ...currentEntry, receiptImage: null })}
                    style={{
                      position: 'absolute',
                      top: '-8px',
                      right: '-8px',
                      background: '#ef4444',
                      color: 'white',
                      borderRadius: '50%',
                      width: '24px',
                      height: '24px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '12px',
                      border: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    ×
                  </button>
                </div>
              )}
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px', color: '#cbd5e1' }}>Notes</label>
              <textarea
                value={currentEntry.notes}
                onChange={(e) => setCurrentEntry({ ...currentEntry, notes: e.target.value })}
                className="input-field"
                style={{ height: '96px', resize: 'none' }}
                placeholder="Additional notes about this entry..."
              />
            </div>

            <button onClick={addEntry} className="btn-primary" style={{ width: '100%' }}>
              <Plus size={20} />
              Add Entry
            </button>
          </div>
        </div>
      </div>

      {/* Entries List */}
      {entries.length > 0 && (
        <div style={{ maxWidth: '896px', margin: '24px auto 0', padding: '0 16px' }}>
          <div className="glass" style={{ borderRadius: '16px', padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: '600', color: '#fbbf24' }}>Recent Entries</h2>
              <button onClick={() => generatePDF(entries, contractorInfo)} className="btn-primary" style={{ padding: '12px 24px' }}>
                <Download size={16} />
                Export PDF
              </button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[...entries].reverse().map((entry) => (
                <div key={entry.id} className="entry-card">
                  <div style={{ display: 'flex', alignItems: 'start', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <div>
                      <div className="mono" style={{ fontWeight: '600', color: '#fbbf24' }}>{formatDate(entry.date)}</div>
                      <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                        Added {new Date(entry.timestamp).toLocaleString()}
                      </div>
                    </div>
                    <button
                      onClick={() => deleteEntry(entry.id)}
                      style={{
                        color: '#f87171',
                        background: 'transparent',
                        border: 'none',
                        padding: '8px',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease'
                      }}
                      onMouseEnter={(e) => e.target.style.background = 'rgba(248, 113, 113, 0.1)'}
                      onMouseLeave={(e) => e.target.style.background = 'transparent'}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '12px', fontSize: '14px' }}>
                    {entry.standardHours && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Clock size={16} color="#fbbf24" />
                        <span style={{ color: '#cbd5e1' }}>{entry.standardHours}h standard</span>
                      </div>
                    )}
                    {entry.overtimeHours && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Clock size={16} color="#fb923c" />
                        <span style={{ color: '#cbd5e1' }}>{entry.overtimeHours}h OT</span>
                      </div>
                    )}
                    {entry.mileage && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <MapPin size={16} color="#60a5fa" />
                        <span style={{ color: '#cbd5e1' }}>{entry.mileage} mi</span>
                      </div>
                    )}
                    {entry.gasExpense && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <DollarSign size={16} color="#4ade80" />
                        <span style={{ color: '#cbd5e1' }}>${parseFloat(entry.gasExpense).toFixed(2)} gas</span>
                      </div>
                    )}
                    {entry.otherExpense && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <FileText size={16} color="#a78bfa" />
                        <span style={{ color: '#cbd5e1' }}>
                          ${parseFloat(entry.otherExpense).toFixed(2)}
                          {entry.expenseDescription && ` - ${entry.expenseDescription}`}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  {entry.notes && (
                    <div style={{ marginTop: '12px', fontSize: '14px', color: '#94a3b8', fontStyle: 'italic', background: 'rgba(15, 23, 42, 0.5)', padding: '12px', borderRadius: '8px' }}>
                      {entry.notes}
                    </div>
                  )}
                  
                  {entry.receiptImage && (
                    <div style={{ marginTop: '12px' }}>
                      <img 
                        src={entry.receiptImage} 
                        alt="Receipt" 
                        style={{ maxWidth: '100%', height: '128px', borderRadius: '8px', border: '1px solid #334155', cursor: 'pointer', transition: 'opacity 0.3s' }}
                        onClick={() => window.open(entry.receiptImage, '_blank')}
                        onMouseEnter={(e) => e.target.style.opacity = '0.8'}
                        onMouseLeave={(e) => e.target.style.opacity = '1'}
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
        <div style={{ maxWidth: '896px', margin: '48px auto 0', padding: '0 16px', textAlign: 'center' }}>
          <div className="glass" style={{ borderRadius: '16px', padding: '48px' }}>
            <FileText size={64} color="#475569" style={{ margin: '0 auto 16px' }} />
            <h3 style={{ fontSize: '20px', fontWeight: '600', color: '#94a3b8', marginBottom: '8px' }}>No Entries Yet</h3>
            <p style={{ color: '#64748b' }}>Add your first entry to start tracking your contractor work</p>
          </div>
        </div>
      )}
    </div>
  );
}
