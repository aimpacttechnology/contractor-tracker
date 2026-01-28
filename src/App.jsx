import React, { useState, useEffect, useMemo } from 'react';
import { Calendar, Clock, DollarSign, MapPin, Camera, FileText, Plus, Trash2, Download, Edit2, Filter, X, Sun, Moon, FileSpreadsheet, Car, Receipt, Check, ChevronLeft, Eye, Printer, Settings, CheckSquare, Square } from 'lucide-react';

// IRS Mileage Rate for 2026
const IRS_MILEAGE_RATE = 0.725;

// Helper function to format dates correctly
const formatDate = (dateString) => {
  const [year, month, day] = dateString.split('-');
  return new Date(year, month - 1, day).toLocaleDateString();
};

// CSV Export Function
const exportToCSV = (entries, contractorInfo) => {
  const headers = ['Date', 'Project', 'Driving Hours', 'Standard Hours', 'Overtime Hours', 'Night Hours', 'Night OT Hours', 'Weekend Hours', 'Weekend OT Hours', 'Mileage', 'Mileage Payment', 'Per Diem', 'Other Expense', 'Expense Category', 'Expense Description', 'Notes'];
  
  const rows = entries.map(entry => {
    const mileagePayment = (parseFloat(entry.mileage) || 0) * IRS_MILEAGE_RATE;
    return [
      formatDate(entry.date),
      entry.projectName || '',
      entry.drivingHours || '0',
      entry.standardHours || '0',
      entry.overtimeHours || '0',
      entry.nightHours || '0',
      entry.nightOvertimeHours || '0',
      entry.weekendHours || '0',
      entry.weekendOvertimeHours || '0',
      entry.mileage || '0',
      mileagePayment.toFixed(2),
      entry.perDiem || '0',
      entry.otherExpense || '0',
      entry.expenseCategory || '',
      entry.expenseDescription || '',
      entry.notes || ''
    ];
  });

  const csvContent = [
    [`Contractor: ${contractorInfo.name || 'N/A'}`],
    [`Business: ${contractorInfo.business || 'N/A'}`],
    [`Client: ${contractorInfo.clientCompany || 'N/A'}`],
    [`IRS Mileage Rate: $${IRS_MILEAGE_RATE}/mile`],
    [`Generated: ${new Date().toLocaleDateString()}`],
    [],
    headers,
    ...rows
  ].map(row => row.join(',')).join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `contractor_data_${new Date().toISOString().split('T')[0]}.csv`;
  link.click();
};

// PDF Report generation
const generatePDF = (entries, contractorInfo, filterProject = null) => {
  // Dynamic import for jsPDF
  import('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js').then(() => {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    const margin = 20;
    let yPos = margin;

    const filteredEntries = filterProject 
      ? entries.filter(e => e.projectName === filterProject)
      : entries;

    doc.setFillColor(26, 32, 44);
    doc.rect(0, 0, pageWidth, 45, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont(undefined, 'bold');
    doc.text('CONTRACTOR REPORT', margin, 25);
    
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, margin, 35);
    if (filterProject) {
      doc.text(`Project: ${filterProject}`, margin, 40);
    }

    yPos = 55;

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
      if (contractorInfo.clientCompany) {
        doc.text(`Client: ${contractorInfo.clientCompany}`, margin, yPos);
        yPos += 6;
      }
      doc.text(`IRS Mileage Rate: $${IRS_MILEAGE_RATE}/mile`, margin, yPos);
      yPos += 10;
    }

    const totals = filteredEntries.reduce((acc, entry) => ({
      drivingHours: acc.drivingHours + (parseFloat(entry.drivingHours) || 0),
      standardHours: acc.standardHours + (parseFloat(entry.standardHours) || 0),
      overtimeHours: acc.overtimeHours + (parseFloat(entry.overtimeHours) || 0),
      nightHours: acc.nightHours + (parseFloat(entry.nightHours) || 0),
      nightOvertimeHours: acc.nightOvertimeHours + (parseFloat(entry.nightOvertimeHours) || 0),
      weekendHours: acc.weekendHours + (parseFloat(entry.weekendHours) || 0),
      weekendOvertimeHours: acc.weekendOvertimeHours + (parseFloat(entry.weekendOvertimeHours) || 0),
      mileage: acc.mileage + (parseFloat(entry.mileage) || 0),
      perDiem: acc.perDiem + (parseFloat(entry.perDiem) || 0),
      otherExpense: acc.otherExpense + (parseFloat(entry.otherExpense) || 0)
    }), { drivingHours: 0, standardHours: 0, overtimeHours: 0, nightHours: 0, nightOvertimeHours: 0, weekendHours: 0, weekendOvertimeHours: 0, mileage: 0, perDiem: 0, otherExpense: 0 });

    const totalHours = totals.drivingHours + totals.standardHours + totals.overtimeHours + totals.nightHours + totals.nightOvertimeHours + totals.weekendHours + totals.weekendOvertimeHours;
    const mileagePayment = totals.mileage * IRS_MILEAGE_RATE;

    doc.setFillColor(240, 242, 245);
    doc.rect(margin - 5, yPos - 5, pageWidth - 2 * margin + 10, 75, 'F');

    doc.setTextColor(26, 32, 44);
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text('SUMMARY', margin, yPos + 5);
    yPos += 15;

    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text(`Total Hours: ${totalHours.toFixed(2)}`, margin, yPos);
    yPos += 6;
    doc.text(`  Driving: ${totals.drivingHours.toFixed(2)}h | Standard: ${totals.standardHours.toFixed(2)}h | Overtime: ${totals.overtimeHours.toFixed(2)}h`, margin + 3, yPos);
    yPos += 6;
    doc.text(`  Night: ${totals.nightHours.toFixed(2)}h | Night OT: ${totals.nightOvertimeHours.toFixed(2)}h`, margin + 3, yPos);
    yPos += 6;
    doc.text(`  Weekend: ${totals.weekendHours.toFixed(2)}h | Weekend OT: ${totals.weekendOvertimeHours.toFixed(2)}h`, margin + 3, yPos);
    yPos += 8;
    
    doc.text(`Total Mileage: ${totals.mileage.toFixed(2)} miles`, margin, yPos);
    yPos += 6;
    doc.setFont(undefined, 'bold');
    doc.text(`Mileage Payment ($${IRS_MILEAGE_RATE}/mi): $${mileagePayment.toFixed(2)}`, margin, yPos);
    doc.setFont(undefined, 'normal');
    yPos += 8;
    
    doc.text(`Total Per Diem: $${totals.perDiem.toFixed(2)}`, margin, yPos);
    yPos += 6;
    doc.text(`Total Other Expenses: $${totals.otherExpense.toFixed(2)}`, margin, yPos);
    yPos += 8;
    
    const totalReimbursements = mileagePayment + totals.perDiem + totals.otherExpense;
    doc.setFont(undefined, 'bold');
    doc.setFontSize(11);
    doc.text(`TOTAL REIMBURSEMENTS: $${totalReimbursements.toFixed(2)}`, margin, yPos);
    yPos += 15;

    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text('DETAILED ENTRIES', margin, yPos);
    yPos += 10;

    filteredEntries.sort((a, b) => new Date(a.date) - new Date(b.date)).forEach((entry) => {
      if (yPos > pageHeight - 60) {
        doc.addPage();
        yPos = margin;
      }

      doc.setFillColor(250, 250, 251);
      doc.rect(margin - 5, yPos - 5, pageWidth - 2 * margin + 10, 50, 'F');

      doc.setTextColor(26, 32, 44);
      doc.setFontSize(11);
      doc.setFont(undefined, 'bold');
      doc.text(formatDate(entry.date), margin, yPos + 3);
      if (entry.projectName) {
        doc.setFontSize(9);
        doc.setFont(undefined, 'normal');
        doc.text(`Project: ${entry.projectName}`, margin + 60, yPos + 3);
      }
      
      doc.setFontSize(9);
      doc.setFont(undefined, 'normal');
      yPos += 10;

      const hours = [];
      if (entry.drivingHours) hours.push(`${entry.drivingHours}h driving`);
      if (entry.standardHours) hours.push(`${entry.standardHours}h standard`);
      if (entry.overtimeHours) hours.push(`${entry.overtimeHours}h OT`);
      if (entry.nightHours) hours.push(`${entry.nightHours}h night`);
      if (entry.nightOvertimeHours) hours.push(`${entry.nightOvertimeHours}h night OT`);
      if (entry.weekendHours) hours.push(`${entry.weekendHours}h weekend`);
      if (entry.weekendOvertimeHours) hours.push(`${entry.weekendOvertimeHours}h weekend OT`);
      
      if (hours.length > 0) {
        doc.text(`Hours: ${hours.join(', ')}`, margin + 5, yPos);
        yPos += 6;
      }
      
      if (entry.mileage) {
        const mileagePay = parseFloat(entry.mileage) * IRS_MILEAGE_RATE;
        doc.text(`Mileage: ${entry.mileage} miles ($${mileagePay.toFixed(2)})`, margin + 5, yPos);
        yPos += 6;
      }
      if (entry.perDiem) {
        doc.text(`Per Diem: $${parseFloat(entry.perDiem).toFixed(2)}`, margin + 5, yPos);
        yPos += 6;
      }
      if (entry.otherExpense) {
        const categoryText = entry.expenseCategory ? ` (${entry.expenseCategory})` : '';
        doc.text(`Expense: $${parseFloat(entry.otherExpense).toFixed(2)}${categoryText}`, margin + 5, yPos);
        yPos += 6;
      }

      yPos += 10;
    });

    const fileName = filterProject 
      ? `contractor_report_${filterProject.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`
      : `contractor_report_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
  });
};

// Invoice PDF generation
const generateInvoicePDF = (selectedEntries, contractorInfo, invoiceInfo, lineItems, totals) => {
  import('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js').then(() => {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const margin = 20;
    let yPos = margin;

    // Header
    doc.setFillColor(26, 32, 44);
    doc.rect(0, 0, pageWidth, 55, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(32);
    doc.setFont(undefined, 'bold');
    doc.text('INVOICE', margin, 28);
    
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    const invoiceNum = invoiceInfo.invoiceNumber || `INV-${Date.now()}`;
    doc.text(`Invoice #: ${invoiceNum}`, pageWidth - margin - 50, 25);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, pageWidth - margin - 50, 35);
    if (invoiceInfo.dueDate) {
      doc.text(`Due: ${formatDate(invoiceInfo.dueDate)}`, pageWidth - margin - 50, 45);
    }

    yPos = 70;

    // From/To Section
    doc.setTextColor(26, 32, 44);
    doc.setFontSize(11);
    doc.setFont(undefined, 'bold');
    doc.text('FROM:', margin, yPos);
    doc.text('BILL TO:', pageWidth / 2 + 10, yPos);
    yPos += 8;

    doc.setFont(undefined, 'normal');
    doc.setFontSize(10);
    
    let fromY = yPos;
    if (contractorInfo.name) {
      doc.setFont(undefined, 'bold');
      doc.text(contractorInfo.name, margin, fromY);
      doc.setFont(undefined, 'normal');
      fromY += 5;
    }
    if (contractorInfo.business) {
      doc.text(contractorInfo.business, margin, fromY);
      fromY += 5;
    }
    if (contractorInfo.address) {
      doc.text(contractorInfo.address, margin, fromY);
      fromY += 5;
    }
    if (contractorInfo.email) {
      doc.text(contractorInfo.email, margin, fromY);
      fromY += 5;
    }

    let toY = yPos;
    if (invoiceInfo.clientName) {
      doc.setFont(undefined, 'bold');
      doc.text(invoiceInfo.clientName, pageWidth / 2 + 10, toY);
      doc.setFont(undefined, 'normal');
      toY += 5;
    }
    if (invoiceInfo.clientAddress) {
      const addressLines = doc.splitTextToSize(invoiceInfo.clientAddress, 70);
      addressLines.forEach(line => {
        doc.text(line, pageWidth / 2 + 10, toY);
        toY += 5;
      });
    }

    yPos = Math.max(fromY, toY) + 15;

    // Service period
    if (selectedEntries.length > 0) {
      const dates = selectedEntries.map(e => new Date(e.date)).sort((a, b) => a - b);
      const startDate = dates[0].toLocaleDateString();
      const endDate = dates[dates.length - 1].toLocaleDateString();
      doc.setFontSize(9);
      doc.setTextColor(100, 100, 100);
      doc.text(`Service Period: ${startDate} - ${endDate}`, margin, yPos);
      yPos += 10;
    }

    // Line items header
    doc.setTextColor(26, 32, 44);
    doc.setFillColor(240, 242, 245);
    doc.rect(margin - 5, yPos - 5, pageWidth - 2 * margin + 10, 12, 'F');
    
    doc.setFont(undefined, 'bold');
    doc.setFontSize(10);
    doc.text('Description', margin, yPos + 3);
    doc.text('Qty', pageWidth - 90, yPos + 3);
    doc.text('Rate', pageWidth - 60, yPos + 3);
    doc.text('Amount', pageWidth - margin - 5, yPos + 3, { align: 'right' });
    yPos += 15;

    doc.setFont(undefined, 'normal');
    doc.setFontSize(9);

    // Line items
    lineItems.forEach(item => {
      if (item.amount > 0) {
        doc.text(item.description, margin, yPos);
        doc.text(item.qty, pageWidth - 90, yPos);
        doc.text(item.rate, pageWidth - 60, yPos);
        doc.text(`$${item.amount.toFixed(2)}`, pageWidth - margin - 5, yPos, { align: 'right' });
        yPos += 7;
      }
    });

    // Totals section
    yPos += 5;
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 10;

    doc.setFont(undefined, 'bold');
    doc.setFontSize(10);
    
    // Labor subtotal
    if (totals.laborTotal > 0) {
      doc.text('Labor Subtotal:', pageWidth - 75, yPos);
      doc.text(`$${totals.laborTotal.toFixed(2)}`, pageWidth - margin - 5, yPos, { align: 'right' });
      yPos += 7;
    }
    
    // Reimbursements subtotal
    if (totals.reimbursementsTotal > 0) {
      doc.text('Reimbursements:', pageWidth - 75, yPos);
      doc.text(`$${totals.reimbursementsTotal.toFixed(2)}`, pageWidth - margin - 5, yPos, { align: 'right' });
      yPos += 7;
    }

    yPos += 3;
    doc.setFontSize(13);
    doc.text('TOTAL DUE:', pageWidth - 75, yPos);
    doc.text(`$${totals.grandTotal.toFixed(2)}`, pageWidth - margin - 5, yPos, { align: 'right' });
    
    // 1099 Notice
    yPos += 15;
    doc.setFontSize(9);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text('Payment subject to 1099 reporting. Taxes not withheld.', margin, yPos);

    // Payment terms
    if (invoiceInfo.paymentTerms) {
      yPos += 12;
      doc.setTextColor(26, 32, 44);
      doc.setFont(undefined, 'bold');
      doc.text('Payment Terms:', margin, yPos);
      doc.setFont(undefined, 'normal');
      yPos += 6;
      doc.text(invoiceInfo.paymentTerms, margin, yPos);
    }

    // Notes
    if (invoiceInfo.notes) {
      yPos += 12;
      doc.setFont(undefined, 'bold');
      doc.text('Notes:', margin, yPos);
      doc.setFont(undefined, 'normal');
      yPos += 6;
      const splitNotes = doc.splitTextToSize(invoiceInfo.notes, pageWidth - 2 * margin);
      doc.text(splitNotes, margin, yPos);
    }

    const fileName = `invoice_${invoiceNum.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
    doc.save(fileName);
  });
};

export default function ContractorTracker() {
  const [entries, setEntries] = useState([]);
  const [currentEntry, setCurrentEntry] = useState({
    date: new Date().toISOString().split('T')[0],
    projectName: '',
    drivingHours: '',
    standardHours: '',
    overtimeHours: '',
    nightHours: '',
    nightOvertimeHours: '',
    weekendHours: '',
    weekendOvertimeHours: '',
    mileage: '',
    perDiem: '',
    otherExpense: '',
    expenseCategory: '',
    expenseDescription: '',
    notes: '',
    receiptImage: null
  });
  const [contractorInfo, setContractorInfo] = useState({
    name: '',
    business: '',
    clientCompany: '',
    address: '',
    email: ''
  });
  const [expenseCategories, setExpenseCategories] = useState([
    'Materials', 'Tools', 'Permits', 'Subcontractors', 'Equipment Rental', 'Lodging', 'Meals', 'Other'
  ]);
  const [showInfo, setShowInfo] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [editingEntry, setEditingEntry] = useState(null);
  const [filterProject, setFilterProject] = useState(null);
  const [dateFilter, setDateFilter] = useState('all');
  const [customDateRange, setCustomDateRange] = useState({ start: '', end: '' });
  const [theme, setTheme] = useState('dark');
  
  // Invoice Builder State
  const [view, setView] = useState('tracker'); // 'tracker' or 'invoice'
  const [selectedEntryIds, setSelectedEntryIds] = useState(new Set());
  const [invoiceInfo, setInvoiceInfo] = useState({
    invoiceNumber: '',
    clientName: '',
    clientAddress: '',
    dueDate: '',
    drivingRate: '',
    standardRate: '',
    overtimeRate: '',
    nightRate: '',
    nightOTRate: '',
    weekendRate: '',
    weekendOTRate: '',
    paymentTerms: 'Net 30',
    notes: ''
  });

  useEffect(() => {
    try {
      const entriesData = localStorage.getItem('contractor-entries');
      const infoData = localStorage.getItem('contractor-info');
      const categoriesData = localStorage.getItem('expense-categories');
      const themeData = localStorage.getItem('theme');
      const invoiceData = localStorage.getItem('invoice-info');
      
      if (entriesData) setEntries(JSON.parse(entriesData));
      if (infoData) setContractorInfo(JSON.parse(infoData));
      if (categoriesData) setExpenseCategories(JSON.parse(categoriesData));
      if (themeData) setTheme(themeData);
      if (invoiceData) setInvoiceInfo(prev => ({ ...prev, ...JSON.parse(invoiceData) }));
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

  const saveInvoiceInfo = (info) => {
    try {
      // Save rates for reuse
      const ratesOnly = {
        drivingRate: info.drivingRate,
        standardRate: info.standardRate,
        overtimeRate: info.overtimeRate,
        nightRate: info.nightRate,
        nightOTRate: info.nightOTRate,
        weekendRate: info.weekendRate,
        weekendOTRate: info.weekendOTRate,
        paymentTerms: info.paymentTerms
      };
      localStorage.setItem('invoice-info', JSON.stringify(ratesOnly));
    } catch (error) {
      console.error('Failed to save invoice info:', error);
    }
  };

  const saveCategories = (categories) => {
    try {
      localStorage.setItem('expense-categories', JSON.stringify(categories));
    } catch (error) {
      console.error('Failed to save categories:', error);
    }
  };

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (editingEntry) {
          setEditingEntry({ ...editingEntry, receiptImage: reader.result });
        } else {
          setCurrentEntry({ ...currentEntry, receiptImage: reader.result });
        }
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
      projectName: currentEntry.projectName,
      drivingHours: '',
      standardHours: '',
      overtimeHours: '',
      nightHours: '',
      nightOvertimeHours: '',
      weekendHours: '',
      weekendOvertimeHours: '',
      mileage: '',
      perDiem: '',
      otherExpense: '',
      expenseCategory: '',
      expenseDescription: '',
      notes: '',
      receiptImage: null
    });
  };

  const updateEntry = () => {
    if (!editingEntry.date) {
      alert('Please select a date');
      return;
    }

    const updatedEntries = entries.map(e => e.id === editingEntry.id ? editingEntry : e);
    setEntries(updatedEntries);
    saveEntries(updatedEntries);
    setEditingEntry(null);
  };

  const deleteEntry = (id) => {
    if (!confirm('Are you sure you want to delete this entry?')) return;
    const updatedEntries = entries.filter(e => e.id !== id);
    setEntries(updatedEntries);
    saveEntries(updatedEntries);
    setSelectedEntryIds(prev => {
      const newSet = new Set(prev);
      newSet.delete(id);
      return newSet;
    });
  };

  const updateContractorInfo = (field, value) => {
    const updatedInfo = { ...contractorInfo, [field]: value };
    setContractorInfo(updatedInfo);
    saveContractorInfo(updatedInfo);
  };

  const addCategory = () => {
    const newCategory = prompt('Enter new expense category:');
    if (newCategory && !expenseCategories.includes(newCategory)) {
      const updated = [...expenseCategories, newCategory];
      setExpenseCategories(updated);
      saveCategories(updated);
    }
  };

  const getUniqueProjects = () => {
    return [...new Set(entries.filter(e => e.projectName).map(e => e.projectName))];
  };

  const getDateFilteredEntries = () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    return entries.filter(entry => {
      const entryDate = new Date(entry.date);
      
      switch(dateFilter) {
        case 'today':
          return entryDate >= today;
        case 'week':
          const weekAgo = new Date(today);
          weekAgo.setDate(weekAgo.getDate() - 7);
          return entryDate >= weekAgo;
        case 'month':
          const monthAgo = new Date(today);
          monthAgo.setMonth(monthAgo.getMonth() - 1);
          return entryDate >= monthAgo;
        case 'custom':
          if (!customDateRange.start || !customDateRange.end) return true;
          const start = new Date(customDateRange.start);
          const end = new Date(customDateRange.end);
          return entryDate >= start && entryDate <= end;
        default:
          return true;
      }
    });
  };

  const filteredEntries = filterProject 
    ? getDateFilteredEntries().filter(e => e.projectName === filterProject)
    : getDateFilteredEntries();

  const totals = filteredEntries.reduce((acc, entry) => ({
    drivingHours: acc.drivingHours + (parseFloat(entry.drivingHours) || 0),
    standardHours: acc.standardHours + (parseFloat(entry.standardHours) || 0),
    overtimeHours: acc.overtimeHours + (parseFloat(entry.overtimeHours) || 0),
    nightHours: acc.nightHours + (parseFloat(entry.nightHours) || 0),
    nightOvertimeHours: acc.nightOvertimeHours + (parseFloat(entry.nightOvertimeHours) || 0),
    weekendHours: acc.weekendHours + (parseFloat(entry.weekendHours) || 0),
    weekendOvertimeHours: acc.weekendOvertimeHours + (parseFloat(entry.weekendOvertimeHours) || 0),
    mileage: acc.mileage + (parseFloat(entry.mileage) || 0),
    perDiem: acc.perDiem + (parseFloat(entry.perDiem) || 0),
    otherExpense: acc.otherExpense + (parseFloat(entry.otherExpense) || 0)
  }), { drivingHours: 0, standardHours: 0, overtimeHours: 0, nightHours: 0, nightOvertimeHours: 0, weekendHours: 0, weekendOvertimeHours: 0, mileage: 0, perDiem: 0, otherExpense: 0 });

  const totalHours = totals.drivingHours + totals.standardHours + totals.overtimeHours + totals.nightHours + totals.nightOvertimeHours + totals.weekendHours + totals.weekendOvertimeHours;
  const mileagePayment = totals.mileage * IRS_MILEAGE_RATE;

  // Invoice calculations
  const selectedEntries = useMemo(() => 
    filteredEntries.filter(e => selectedEntryIds.has(e.id)),
    [filteredEntries, selectedEntryIds]
  );

  const invoiceTotals = useMemo(() => {
    const hourTotals = selectedEntries.reduce((acc, entry) => ({
      driving: acc.driving + (parseFloat(entry.drivingHours) || 0),
      standard: acc.standard + (parseFloat(entry.standardHours) || 0),
      overtime: acc.overtime + (parseFloat(entry.overtimeHours) || 0),
      night: acc.night + (parseFloat(entry.nightHours) || 0),
      nightOT: acc.nightOT + (parseFloat(entry.nightOvertimeHours) || 0),
      weekend: acc.weekend + (parseFloat(entry.weekendHours) || 0),
      weekendOT: acc.weekendOT + (parseFloat(entry.weekendOvertimeHours) || 0)
    }), { driving: 0, standard: 0, overtime: 0, night: 0, nightOT: 0, weekend: 0, weekendOT: 0 });

    const mileageTotal = selectedEntries.reduce((sum, e) => sum + (parseFloat(e.mileage) || 0), 0);
    const perDiemTotal = selectedEntries.reduce((sum, e) => sum + (parseFloat(e.perDiem) || 0), 0);
    const expensesTotal = selectedEntries.reduce((sum, e) => sum + (parseFloat(e.otherExpense) || 0), 0);

    const laborItems = [];
    if (hourTotals.driving > 0) laborItems.push({ desc: 'Driving Hours', hours: hourTotals.driving, rate: parseFloat(invoiceInfo.drivingRate) || 0 });
    if (hourTotals.standard > 0) laborItems.push({ desc: 'Standard Labor', hours: hourTotals.standard, rate: parseFloat(invoiceInfo.standardRate) || 0 });
    if (hourTotals.overtime > 0) laborItems.push({ desc: 'Overtime Labor', hours: hourTotals.overtime, rate: parseFloat(invoiceInfo.overtimeRate) || 0 });
    if (hourTotals.night > 0) laborItems.push({ desc: 'Night Shift Labor', hours: hourTotals.night, rate: parseFloat(invoiceInfo.nightRate) || 0 });
    if (hourTotals.nightOT > 0) laborItems.push({ desc: 'Night Shift Overtime', hours: hourTotals.nightOT, rate: parseFloat(invoiceInfo.nightOTRate) || 0 });
    if (hourTotals.weekend > 0) laborItems.push({ desc: 'Weekend Labor', hours: hourTotals.weekend, rate: parseFloat(invoiceInfo.weekendRate) || 0 });
    if (hourTotals.weekendOT > 0) laborItems.push({ desc: 'Weekend Overtime', hours: hourTotals.weekendOT, rate: parseFloat(invoiceInfo.weekendOTRate) || 0 });

    const laborTotal = laborItems.reduce((sum, item) => sum + (item.hours * item.rate), 0);
    const mileageAmount = mileageTotal * IRS_MILEAGE_RATE;
    const reimbursementsTotal = mileageAmount + perDiemTotal + expensesTotal;
    const grandTotal = laborTotal + reimbursementsTotal;

    // Build line items for PDF
    const lineItems = [
      ...laborItems.map(item => ({
        description: item.desc,
        qty: `${item.hours.toFixed(2)} hrs`,
        rate: `$${item.rate.toFixed(2)}/hr`,
        amount: item.hours * item.rate
      })),
      ...(mileageTotal > 0 ? [{
        description: 'Mileage Reimbursement',
        qty: `${mileageTotal.toFixed(1)} mi`,
        rate: `$${IRS_MILEAGE_RATE}/mi`,
        amount: mileageAmount
      }] : []),
      ...(perDiemTotal > 0 ? [{
        description: 'Per Diem',
        qty: '',
        rate: '',
        amount: perDiemTotal
      }] : []),
      ...(expensesTotal > 0 ? [{
        description: 'Reimbursable Expenses',
        qty: '',
        rate: '',
        amount: expensesTotal
      }] : [])
    ];

    return {
      hourTotals,
      laborItems,
      laborTotal,
      mileageTotal,
      mileageAmount,
      perDiemTotal,
      expensesTotal,
      reimbursementsTotal,
      grandTotal,
      lineItems
    };
  }, [selectedEntries, invoiceInfo]);

  const toggleEntrySelection = (id) => {
    setSelectedEntryIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const selectAllEntries = () => {
    setSelectedEntryIds(new Set(filteredEntries.map(e => e.id)));
  };

  const clearSelection = () => {
    setSelectedEntryIds(new Set());
  };

  const openInvoiceBuilder = () => {
    // Auto-generate invoice number if empty
    if (!invoiceInfo.invoiceNumber) {
      const num = `INV-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}${String(entries.length + 1).padStart(3, '0')}`;
      setInvoiceInfo(prev => ({ ...prev, invoiceNumber: num }));
    }
    // Pre-fill client name from contractor info
    if (!invoiceInfo.clientName && contractorInfo.clientCompany) {
      setInvoiceInfo(prev => ({ ...prev, clientName: contractorInfo.clientCompany }));
    }
    setView('invoice');
  };

  const handleGenerateInvoice = () => {
    if (selectedEntries.length === 0) {
      alert('Please select at least one entry to invoice');
      return;
    }
    if (!invoiceInfo.clientName) {
      alert('Please enter a client name');
      return;
    }
    if (invoiceTotals.grandTotal === 0) {
      alert('Please enter at least one rate or have reimbursable expenses');
      return;
    }
    
    saveInvoiceInfo(invoiceInfo);
    generateInvoicePDF(selectedEntries, contractorInfo, invoiceInfo, invoiceTotals.lineItems, invoiceTotals);
  };

  if (isLoading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: theme === 'dark' 
          ? 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)'
          : 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 50%, #f8fafc 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: theme === 'dark' ? '#fbbf24' : '#0f172a',
        fontSize: '20px',
        fontFamily: "'Outfit', sans-serif"
      }}>
        Loading...
      </div>
    );
  }

  const entryFormContent = editingEntry || currentEntry;
  const isEditing = !!editingEntry;

  const colors = theme === 'dark' ? {
    bg: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
    text: '#f1f5f9',
    textSecondary: '#94a3b8',
    textTertiary: '#64748b',
    accent: '#fbbf24',
    cardBg: 'rgba(255, 255, 255, 0.05)',
    cardBorder: 'rgba(255, 255, 255, 0.1)',
    inputBg: 'rgba(15, 23, 42, 0.5)',
    inputBorder: 'rgba(148, 163, 184, 0.2)',
    entryCard: 'rgba(30, 41, 59, 0.5)',
    entryBorder: 'rgba(100, 116, 139, 0.5)',
    invoiceBg: '#1e293b',
    invoiceHeaderBg: '#0f172a'
  } : {
    bg: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 50%, #f8fafc 100%)',
    text: '#0f172a',
    textSecondary: '#475569',
    textTertiary: '#64748b',
    accent: '#f59e0b',
    cardBg: 'rgba(255, 255, 255, 0.8)',
    cardBorder: 'rgba(148, 163, 184, 0.3)',
    inputBg: 'rgba(255, 255, 255, 0.9)',
    inputBorder: 'rgba(148, 163, 184, 0.3)',
    entryCard: 'rgba(255, 255, 255, 0.7)',
    entryBorder: 'rgba(148, 163, 184, 0.4)',
    invoiceBg: '#ffffff',
    invoiceHeaderBg: '#1e293b'
  };

  // Invoice Builder View
  if (view === 'invoice') {
    return (
      <div style={{
        minHeight: '100vh',
        background: colors.bg,
        color: colors.text,
        fontFamily: "'Outfit', sans-serif"
      }}>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
          
          * { margin: 0; padding: 0; box-sizing: border-box; }
          
          .mono { font-family: 'JetBrains Mono', monospace; }
          
          input:focus, textarea:focus, select:focus {
            outline: none;
            border-color: ${colors.accent} !important;
            box-shadow: 0 0 0 3px ${theme === 'dark' ? 'rgba(251, 191, 36, 0.1)' : 'rgba(245, 158, 11, 0.2)'} !important;
          }
          
          .input-field {
            background: ${colors.inputBg};
            border: 1px solid ${colors.inputBorder};
            padding: 10px 14px;
            border-radius: 8px;
            color: ${colors.text};
            font-size: 14px;
            width: 100%;
            transition: all 0.2s;
          }
          
          .btn-primary {
            background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
            border: none;
            color: #0f172a;
            font-weight: 600;
            cursor: pointer;
            padding: 14px 24px;
            border-radius: 10px;
            font-size: 15px;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            transition: all 0.2s;
          }
          
          .btn-primary:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(251, 191, 36, 0.3); }
          
          .btn-secondary {
            background: ${theme === 'dark' ? 'rgba(100, 116, 139, 0.3)' : 'rgba(203, 213, 225, 0.5)'};
            border: 1px solid ${theme === 'dark' ? 'rgba(100, 116, 139, 0.5)' : 'rgba(148, 163, 184, 0.4)'};
            color: ${colors.text};
            font-weight: 500;
            cursor: pointer;
            padding: 10px 16px;
            border-radius: 8px;
            font-size: 14px;
            display: flex;
            align-items: center;
            gap: 6px;
            transition: all 0.2s;
          }
          
          .btn-secondary:hover { background: ${theme === 'dark' ? 'rgba(100, 116, 139, 0.5)' : 'rgba(203, 213, 225, 0.7)'}; }

          .entry-select {
            cursor: pointer;
            padding: 12px;
            border-radius: 10px;
            border: 2px solid transparent;
            transition: all 0.2s;
            background: ${colors.entryCard};
          }
          
          .entry-select:hover { background: ${theme === 'dark' ? 'rgba(30, 41, 59, 0.7)' : 'rgba(255, 255, 255, 0.9)'}; }
          
          .entry-select.selected {
            border-color: ${colors.accent};
            background: ${theme === 'dark' ? 'rgba(251, 191, 36, 0.1)' : 'rgba(245, 158, 11, 0.1)'};
          }

          .invoice-preview {
            background: ${colors.invoiceBg};
            border-radius: 12px;
            box-shadow: 0 8px 32px rgba(0,0,0,0.2);
            overflow: hidden;
          }
        `}</style>

        {/* Header */}
        <div style={{
          background: colors.cardBg,
          backdropFilter: 'blur(12px)',
          borderBottom: `1px solid ${colors.cardBorder}`,
          position: 'sticky',
          top: 0,
          zIndex: 10
        }}>
          <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <button onClick={() => setView('tracker')} className="btn-secondary" style={{ padding: '8px 12px' }}>
                <ChevronLeft size={18} />
                Back
              </button>
              <div>
                <h1 style={{ fontSize: '24px', fontWeight: '700', color: colors.accent }}>Invoice Builder</h1>
                <p style={{ fontSize: '13px', color: colors.textSecondary }}>
                  {selectedEntries.length} of {filteredEntries.length} entries selected
                </p>
              </div>
            </div>
            <button onClick={handleGenerateInvoice} className="btn-primary" disabled={selectedEntries.length === 0}>
              <Download size={18} />
              Generate PDF
            </button>
          </div>
        </div>

        <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '24px 20px', display: 'grid', gridTemplateColumns: '1fr 420px', gap: '24px' }}>
          {/* Left Panel - Entry Selection & Rates */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Invoice Details */}
            <div style={{ background: colors.cardBg, backdropFilter: 'blur(12px)', border: `1px solid ${colors.cardBorder}`, borderRadius: '14px', padding: '20px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px', color: colors.text, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileText size={18} />
                Invoice Details
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', marginBottom: '6px', color: colors.textSecondary }}>Invoice #</label>
                  <input
                    type="text"
                    value={invoiceInfo.invoiceNumber}
                    onChange={(e) => setInvoiceInfo({ ...invoiceInfo, invoiceNumber: e.target.value })}
                    className="input-field"
                    placeholder="INV-001"
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', marginBottom: '6px', color: colors.textSecondary }}>Client Name *</label>
                  <input
                    type="text"
                    value={invoiceInfo.clientName}
                    onChange={(e) => setInvoiceInfo({ ...invoiceInfo, clientName: e.target.value })}
                    className="input-field"
                    placeholder="ABC Company"
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', marginBottom: '6px', color: colors.textSecondary }}>Due Date</label>
                  <input
                    type="date"
                    value={invoiceInfo.dueDate}
                    onChange={(e) => setInvoiceInfo({ ...invoiceInfo, dueDate: e.target.value })}
                    className="input-field"
                  />
                </div>
              </div>
              <div style={{ marginTop: '12px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', marginBottom: '6px', color: colors.textSecondary }}>Client Address</label>
                <input
                  type="text"
                  value={invoiceInfo.clientAddress}
                  onChange={(e) => setInvoiceInfo({ ...invoiceInfo, clientAddress: e.target.value })}
                  className="input-field"
                  placeholder="123 Main St, City, ST 12345"
                />
              </div>
            </div>

            {/* Hourly Rates */}
            <div style={{ background: colors.cardBg, backdropFilter: 'blur(12px)', border: `1px solid ${colors.cardBorder}`, borderRadius: '14px', padding: '20px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px', color: colors.text, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <DollarSign size={18} />
                Hourly Rates
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
                {[
                  { key: 'drivingRate', label: 'Driving', hours: invoiceTotals.hourTotals.driving },
                  { key: 'standardRate', label: 'Standard', hours: invoiceTotals.hourTotals.standard },
                  { key: 'overtimeRate', label: 'Overtime', hours: invoiceTotals.hourTotals.overtime },
                  { key: 'nightRate', label: 'Night', hours: invoiceTotals.hourTotals.night },
                  { key: 'nightOTRate', label: 'Night OT', hours: invoiceTotals.hourTotals.nightOT },
                  { key: 'weekendRate', label: 'Weekend', hours: invoiceTotals.hourTotals.weekend },
                  { key: 'weekendOTRate', label: 'Wknd OT', hours: invoiceTotals.hourTotals.weekendOT }
                ].map(item => (
                  <div key={item.key} style={{ opacity: item.hours > 0 ? 1 : 0.5 }}>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: '500', marginBottom: '4px', color: colors.textSecondary }}>
                      {item.label} {item.hours > 0 && <span style={{ color: colors.accent }}>({item.hours.toFixed(1)}h)</span>}
                    </label>
                    <div style={{ position: 'relative' }}>
                      <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: colors.textTertiary, fontSize: '13px' }}>$</span>
                      <input
                        type="number"
                        step="0.01"
                        value={invoiceInfo[item.key]}
                        onChange={(e) => setInvoiceInfo({ ...invoiceInfo, [item.key]: e.target.value })}
                        className="input-field"
                        style={{ paddingLeft: '24px' }}
                        placeholder="0.00"
                        disabled={item.hours === 0}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Entry Selection */}
            <div style={{ background: colors.cardBg, backdropFilter: 'blur(12px)', border: `1px solid ${colors.cardBorder}`, borderRadius: '14px', padding: '20px', flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '600', color: colors.text, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CheckSquare size={18} />
                  Select Entries
                </h3>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={selectAllEntries} className="btn-secondary" style={{ padding: '6px 12px', fontSize: '12px' }}>
                    Select All
                  </button>
                  <button onClick={clearSelection} className="btn-secondary" style={{ padding: '6px 12px', fontSize: '12px' }}>
                    Clear
                  </button>
                </div>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '400px', overflowY: 'auto' }}>
                {filteredEntries.length === 0 ? (
                  <p style={{ color: colors.textTertiary, textAlign: 'center', padding: '20px' }}>No entries to invoice</p>
                ) : (
                  [...filteredEntries].reverse().map(entry => {
                    const isSelected = selectedEntryIds.has(entry.id);
                    const entryTotal = (parseFloat(entry.mileage) || 0) * IRS_MILEAGE_RATE + (parseFloat(entry.perDiem) || 0) + (parseFloat(entry.otherExpense) || 0);
                    const totalHrs = (parseFloat(entry.drivingHours) || 0) + (parseFloat(entry.standardHours) || 0) + (parseFloat(entry.overtimeHours) || 0) + (parseFloat(entry.nightHours) || 0) + (parseFloat(entry.nightOvertimeHours) || 0) + (parseFloat(entry.weekendHours) || 0) + (parseFloat(entry.weekendOvertimeHours) || 0);
                    
                    return (
                      <div
                        key={entry.id}
                        className={`entry-select ${isSelected ? 'selected' : ''}`}
                        onClick={() => toggleEntrySelection(entry.id)}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{ color: isSelected ? colors.accent : colors.textTertiary }}>
                            {isSelected ? <CheckSquare size={20} /> : <Square size={20} />}
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                              <span className="mono" style={{ fontWeight: '600', color: colors.accent, fontSize: '14px' }}>
                                {formatDate(entry.date)}
                              </span>
                              {entry.projectName && (
                                <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '10px', background: theme === 'dark' ? 'rgba(251, 191, 36, 0.15)' : 'rgba(245, 158, 11, 0.15)', color: colors.accent }}>
                                  {entry.projectName}
                                </span>
                              )}
                            </div>
                            <div style={{ fontSize: '12px', color: colors.textSecondary, display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                              {totalHrs > 0 && <span>{totalHrs.toFixed(1)} hrs</span>}
                              {entry.mileage && <span>{entry.mileage} mi</span>}
                              {entryTotal > 0 && <span style={{ color: '#10b981' }}>${entryTotal.toFixed(2)} reimb.</span>}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Right Panel - Live Invoice Preview */}
          <div style={{ position: 'sticky', top: '100px', height: 'fit-content' }}>
            <div className="invoice-preview">
              {/* Invoice Header */}
              <div style={{ background: colors.invoiceHeaderBg, padding: '24px', color: '#fff' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h2 style={{ fontSize: '28px', fontWeight: '700', letterSpacing: '2px' }}>INVOICE</h2>
                  </div>
                  <div style={{ textAlign: 'right', fontSize: '12px', opacity: 0.9 }}>
                    <div>#{invoiceInfo.invoiceNumber || 'INV-XXX'}</div>
                    <div>{new Date().toLocaleDateString()}</div>
                    {invoiceInfo.dueDate && <div>Due: {formatDate(invoiceInfo.dueDate)}</div>}
                  </div>
                </div>
              </div>

              {/* Invoice Body */}
              <div style={{ padding: '24px' }}>
                {/* From/To */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px', fontSize: '12px' }}>
                  <div>
                    <div style={{ fontWeight: '600', color: colors.textTertiary, marginBottom: '6px', fontSize: '10px', letterSpacing: '1px' }}>FROM</div>
                    <div style={{ fontWeight: '600', color: colors.text }}>{contractorInfo.name || 'Your Name'}</div>
                    {contractorInfo.business && <div style={{ color: colors.textSecondary }}>{contractorInfo.business}</div>}
                    {contractorInfo.email && <div style={{ color: colors.textSecondary }}>{contractorInfo.email}</div>}
                  </div>
                  <div>
                    <div style={{ fontWeight: '600', color: colors.textTertiary, marginBottom: '6px', fontSize: '10px', letterSpacing: '1px' }}>BILL TO</div>
                    <div style={{ fontWeight: '600', color: colors.text }}>{invoiceInfo.clientName || 'Client Name'}</div>
                    {invoiceInfo.clientAddress && <div style={{ color: colors.textSecondary }}>{invoiceInfo.clientAddress}</div>}
                  </div>
                </div>

                {/* Line Items */}
                <div style={{ borderTop: `1px solid ${colors.cardBorder}`, borderBottom: `1px solid ${colors.cardBorder}` }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 60px 70px 70px', padding: '10px 0', fontSize: '10px', fontWeight: '600', color: colors.textTertiary, letterSpacing: '0.5px' }}>
                    <div>DESCRIPTION</div>
                    <div style={{ textAlign: 'right' }}>QTY</div>
                    <div style={{ textAlign: 'right' }}>RATE</div>
                    <div style={{ textAlign: 'right' }}>AMOUNT</div>
                  </div>
                  
                  {invoiceTotals.lineItems.length === 0 ? (
                    <div style={{ padding: '20px 0', textAlign: 'center', color: colors.textTertiary, fontSize: '12px' }}>
                      Select entries and set rates to see line items
                    </div>
                  ) : (
                    invoiceTotals.lineItems.map((item, idx) => (
                      <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1fr 60px 70px 70px', padding: '10px 0', fontSize: '12px', borderTop: idx > 0 ? `1px solid ${theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}` : 'none' }}>
                        <div style={{ color: colors.text }}>{item.description}</div>
                        <div style={{ textAlign: 'right', color: colors.textSecondary }}>{item.qty}</div>
                        <div style={{ textAlign: 'right', color: colors.textSecondary }}>{item.rate}</div>
                        <div style={{ textAlign: 'right', fontWeight: '500', color: colors.text }}>${item.amount.toFixed(2)}</div>
                      </div>
                    ))
                  )}
                </div>

                {/* Totals */}
                <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                  {invoiceTotals.laborTotal > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', width: '180px', fontSize: '12px' }}>
                      <span style={{ color: colors.textSecondary }}>Labor:</span>
                      <span style={{ color: colors.text }}>${invoiceTotals.laborTotal.toFixed(2)}</span>
                    </div>
                  )}
                  {invoiceTotals.reimbursementsTotal > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', width: '180px', fontSize: '12px' }}>
                      <span style={{ color: colors.textSecondary }}>Reimbursements:</span>
                      <span style={{ color: colors.text }}>${invoiceTotals.reimbursementsTotal.toFixed(2)}</span>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', width: '180px', paddingTop: '10px', borderTop: `2px solid ${colors.accent}`, marginTop: '4px' }}>
                    <span style={{ fontWeight: '700', color: colors.text }}>TOTAL DUE</span>
                    <span className="mono" style={{ fontWeight: '700', fontSize: '18px', color: colors.accent }}>${invoiceTotals.grandTotal.toFixed(2)}</span>
                  </div>
                </div>

                {/* Footer */}
                <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: `1px solid ${colors.cardBorder}`, fontSize: '11px', color: colors.textTertiary }}>
                  <div>Payment subject to 1099 reporting. Taxes not withheld.</div>
                  {invoiceInfo.paymentTerms && <div style={{ marginTop: '4px' }}>Terms: {invoiceInfo.paymentTerms}</div>}
                </div>
              </div>
            </div>

            {/* Notes Section */}
            <div style={{ marginTop: '16px', background: colors.cardBg, backdropFilter: 'blur(12px)', border: `1px solid ${colors.cardBorder}`, borderRadius: '14px', padding: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', marginBottom: '6px', color: colors.textSecondary }}>Invoice Notes</label>
              <textarea
                value={invoiceInfo.notes}
                onChange={(e) => setInvoiceInfo({ ...invoiceInfo, notes: e.target.value })}
                className="input-field"
                style={{ height: '70px', resize: 'none' }}
                placeholder="Payment instructions, thank you note, etc."
              />
              <div style={{ marginTop: '10px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', marginBottom: '6px', color: colors.textSecondary }}>Payment Terms</label>
                <select
                  value={invoiceInfo.paymentTerms}
                  onChange={(e) => setInvoiceInfo({ ...invoiceInfo, paymentTerms: e.target.value })}
                  className="input-field"
                >
                  <option value="Due on Receipt">Due on Receipt</option>
                  <option value="Net 15">Net 15</option>
                  <option value="Net 30">Net 30</option>
                  <option value="Net 60">Net 60</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main Tracker View
  return (
    <div style={{
      minHeight: '100vh',
      background: colors.bg,
      color: colors.text,
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
          border-color: ${colors.accent} !important;
          box-shadow: 0 0 0 3px ${theme === 'dark' ? 'rgba(251, 191, 36, 0.1)' : 'rgba(245, 158, 11, 0.2)'} !important;
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
          background: ${colors.cardBg};
          backdrop-filter: blur(12px);
          border: 1px solid ${colors.cardBorder};
        }
        
        .input-field {
          background: ${colors.inputBg};
          border: 1px solid ${colors.inputBorder};
          transition: all 0.3s ease;
          padding: 12px 16px;
          border-radius: 8px;
          color: ${colors.text};
          fontSize: 14px;
          width: 100%;
        }
        
        .input-field:focus {
          background: ${theme === 'dark' ? 'rgba(15, 23, 42, 0.7)' : 'rgba(255, 255, 255, 1)'};
          border-color: ${colors.accent};
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

        .btn-secondary {
          background: ${theme === 'dark' ? 'rgba(100, 116, 139, 0.3)' : 'rgba(203, 213, 225, 0.5)'};
          transition: all 0.3s ease;
          border: 1px solid ${theme === 'dark' ? 'rgba(100, 116, 139, 0.5)' : 'rgba(148, 163, 184, 0.4)'};
          color: ${colors.text};
          font-weight: 500;
          cursor: pointer;
          padding: 12px 16px;
          border-radius: 8px;
          fontSize: 14px;
          display: flex;
          align-items: center;
          justifyContent: center;
          gap: 8px;
        }

        .btn-secondary:hover {
          background: ${theme === 'dark' ? 'rgba(100, 116, 139, 0.5)' : 'rgba(203, 213, 225, 0.7)'};
        }
        
        .summary-card {
          background: ${colors.cardBg};
          backdrop-filter: blur(12px);
          border: 1px solid ${colors.cardBorder};
          border-radius: 12px;
          padding: 16px;
        }
        
        .entry-card {
          background: ${colors.entryCard};
          border: 1px solid ${colors.entryBorder};
          border-radius: 12px;
          padding: 16px;
          animation: slideUp 0.4s ease-out;
          transition: all 0.3s ease;
        }
        
        .entry-card:hover {
          background: ${theme === 'dark' ? 'rgba(30, 41, 59, 0.7)' : 'rgba(255, 255, 255, 0.9)'};
        }

        .filter-chip {
          background: ${theme === 'dark' ? 'rgba(251, 191, 36, 0.2)' : 'rgba(245, 158, 11, 0.2)'};
          border: 1px solid ${theme === 'dark' ? 'rgba(251, 191, 36, 0.3)' : 'rgba(245, 158, 11, 0.3)'};
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 12px;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          cursor: pointer;
          transition: all 0.3s ease;
          color: ${colors.text};
        }

        .filter-chip:hover {
          background: ${theme === 'dark' ? 'rgba(251, 191, 36, 0.3)' : 'rgba(245, 158, 11, 0.3)'};
        }
      `}</style>

      {/* Header */}
      <div className="glass" style={{
        borderBottom: `1px solid ${colors.cardBorder}`,
        position: 'sticky',
        top: 0,
        zIndex: 10,
        background: colors.cardBg,
        backdropFilter: 'blur(12px)'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h1 style={{ fontSize: '30px', fontWeight: '700', color: colors.accent, letterSpacing: '-0.5px', margin: 0 }}>
                CONTRACTOR
              </h1>
              <p style={{ color: colors.textSecondary, fontSize: '14px', fontWeight: '300', marginTop: '4px' }}>
                {contractorInfo.name || 'Time & Expense Tracker'}
              </p>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={toggleTheme}
                style={{
                  fontSize: '14px',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  background: colors.cardBg,
                  backdropFilter: 'blur(12px)',
                  border: `1px solid ${colors.cardBorder}`,
                  color: colors.text,
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
              </button>
              <button
                onClick={() => setShowInfo(!showInfo)}
                style={{
                  fontSize: '14px',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  background: colors.cardBg,
                  backdropFilter: 'blur(12px)',
                  border: `1px solid ${colors.cardBorder}`,
                  color: colors.text,
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
              >
                {showInfo ? 'Close' : 'Settings'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Settings Panel */}
      {showInfo && (
        <div style={{ maxWidth: '1200px', margin: '24px auto 0', padding: '0 16px' }} className="animate-slide-up">
          <div className="glass" style={{ borderRadius: '16px', padding: '24px', border: `1px solid ${theme === 'dark' ? 'rgba(251, 191, 36, 0.2)' : 'rgba(245, 158, 11, 0.3)'}` }}>
            <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '16px', color: colors.accent }}>Settings</h2>
            
            <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px', marginTop: '24px', color: colors.text }}>Contractor Information</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px', color: colors.textSecondary }}>Your Name *</label>
                <input
                  type="text"
                  value={contractorInfo.name}
                  onChange={(e) => updateContractorInfo('name', e.target.value)}
                  className="input-field"
                  placeholder="John Doe"
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px', color: colors.textSecondary }}>Business Name</label>
                <input
                  type="text"
                  value={contractorInfo.business}
                  onChange={(e) => updateContractorInfo('business', e.target.value)}
                  className="input-field"
                  placeholder="Doe Contracting LLC"
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px', color: colors.textSecondary }}>Default Client</label>
                <input
                  type="text"
                  value={contractorInfo.clientCompany}
                  onChange={(e) => updateContractorInfo('clientCompany', e.target.value)}
                  className="input-field"
                  placeholder="ABC Manufacturing"
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px', color: colors.textSecondary }}>Your Email</label>
                <input
                  type="email"
                  value={contractorInfo.email}
                  onChange={(e) => updateContractorInfo('email', e.target.value)}
                  className="input-field"
                  placeholder="john@example.com"
                />
              </div>
            </div>

            <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px', marginTop: '24px', color: colors.text }}>Expense Categories</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
              {expenseCategories.map(cat => (
                <span key={cat} style={{ padding: '6px 12px', borderRadius: '16px', background: colors.inputBg, fontSize: '13px', color: colors.textSecondary }}>
                  {cat}
                </span>
              ))}
              <button onClick={addCategory} style={{ padding: '6px 12px', borderRadius: '16px', background: 'transparent', border: `1px dashed ${colors.accent}`, color: colors.accent, cursor: 'pointer', fontSize: '13px' }}>
                + Add
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Date Filter */}
      <div style={{ maxWidth: '1200px', margin: '24px auto 0', padding: '0 16px' }}>
        <div className="glass" style={{ borderRadius: '12px', padding: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <Filter size={16} color={colors.textSecondary} />
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              style={{
                background: colors.inputBg,
                border: `1px solid ${colors.inputBorder}`,
                borderRadius: '8px',
                padding: '8px 12px',
                color: colors.text,
                cursor: 'pointer'
              }}
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="custom">Custom Range</option>
            </select>
            
            {dateFilter === 'custom' && (
              <>
                <input
                  type="date"
                  value={customDateRange.start}
                  onChange={(e) => setCustomDateRange({ ...customDateRange, start: e.target.value })}
                  style={{
                    background: colors.inputBg,
                    border: `1px solid ${colors.inputBorder}`,
                    borderRadius: '8px',
                    padding: '8px 12px',
                    color: colors.text
                  }}
                />
                <span style={{ color: colors.textSecondary }}>to</span>
                <input
                  type="date"
                  value={customDateRange.end}
                  onChange={(e) => setCustomDateRange({ ...customDateRange, end: e.target.value })}
                  style={{
                    background: colors.inputBg,
                    border: `1px solid ${colors.inputBorder}`,
                    borderRadius: '8px',
                    padding: '8px 12px',
                    color: colors.text
                  }}
                />
              </>
            )}
          </div>
        </div>
      </div>

      {/* Project Filter */}
      {getUniqueProjects().length > 0 && (
        <div style={{ maxWidth: '1200px', margin: '12px auto 0', padding: '0 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '14px', color: colors.textSecondary }}>Projects:</span>
            <div className="filter-chip" onClick={() => setFilterProject(null)} style={{
              background: !filterProject ? (theme === 'dark' ? 'rgba(251, 191, 36, 0.3)' : 'rgba(245, 158, 11, 0.3)') : colors.cardBg,
              borderColor: !filterProject ? (theme === 'dark' ? 'rgba(251, 191, 36, 0.5)' : 'rgba(245, 158, 11, 0.5)') : colors.cardBorder
            }}>
              All
            </div>
            {getUniqueProjects().map(project => (
              <div 
                key={project} 
                className="filter-chip"
                onClick={() => setFilterProject(project)}
                style={{
                  background: filterProject === project ? (theme === 'dark' ? 'rgba(251, 191, 36, 0.3)' : 'rgba(245, 158, 11, 0.3)') : colors.cardBg,
                  borderColor: filterProject === project ? (theme === 'dark' ? 'rgba(251, 191, 36, 0.5)' : 'rgba(245, 158, 11, 0.5)') : colors.cardBorder
                }}
              >
                {project}
                {filterProject === project && <X size={14} />}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div style={{ maxWidth: '1200px', margin: '24px auto 0', padding: '0 16px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px' }}>
          <div className="summary-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <Clock size={16} color="#fbbf24" />
              <span style={{ fontSize: '12px', color: colors.textSecondary }}>Total Hours</span>
            </div>
            <div className="mono" style={{ fontSize: '28px', fontWeight: '600', color: colors.text }}>{totalHours.toFixed(1)}</div>
            <div style={{ fontSize: '11px', color: colors.textTertiary, marginTop: '4px' }}>
              Drive: {totals.drivingHours.toFixed(1)} | Std: {totals.standardHours.toFixed(1)} | OT: {totals.overtimeHours.toFixed(1)}
            </div>
            <div style={{ fontSize: '11px', color: colors.textTertiary, marginTop: '2px' }}>
              Night: {totals.nightHours.toFixed(1)} | Night OT: {totals.nightOvertimeHours.toFixed(1)}
            </div>
            <div style={{ fontSize: '11px', color: colors.textTertiary, marginTop: '2px' }}>
              Weekend: {totals.weekendHours.toFixed(1)} | Weekend OT: {totals.weekendOvertimeHours.toFixed(1)}
            </div>
          </div>
          
          <div className="summary-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <Car size={16} color="#60a5fa" />
              <span style={{ fontSize: '12px', color: colors.textSecondary }}>Mileage</span>
            </div>
            <div className="mono" style={{ fontSize: '24px', fontWeight: '600', color: colors.text }}>{totals.mileage.toFixed(0)}</div>
            <div style={{ fontSize: '12px', color: colors.textTertiary, marginTop: '4px' }}>miles</div>
            <div className="mono" style={{ fontSize: '16px', fontWeight: '600', color: '#10b981', marginTop: '8px' }}>
              ${mileagePayment.toFixed(2)}
            </div>
            <div style={{ fontSize: '11px', color: colors.textTertiary, marginTop: '2px' }}>
              @ ${IRS_MILEAGE_RATE}/mi (IRS 2026)
            </div>
          </div>
          
          <div className="summary-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <DollarSign size={16} color="#8b5cf6" />
              <span style={{ fontSize: '12px', color: colors.textSecondary }}>Per Diem</span>
            </div>
            <div className="mono" style={{ fontSize: '28px', fontWeight: '600', color: colors.text }}>${totals.perDiem.toFixed(0)}</div>
            <div style={{ fontSize: '12px', color: colors.textTertiary, marginTop: '4px' }}>daily allowance</div>
          </div>
          
          <div className="summary-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <FileText size={16} color="#ec4899" />
              <span style={{ fontSize: '12px', color: colors.textSecondary }}>Expenses</span>
            </div>
            <div className="mono" style={{ fontSize: '28px', fontWeight: '600', color: colors.text }}>${totals.otherExpense.toFixed(0)}</div>
            <div style={{ fontSize: '12px', color: colors.textTertiary, marginTop: '4px' }}>other costs</div>
          </div>
          
          <div className="summary-card" style={{ background: theme === 'dark' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(16, 185, 129, 0.15)', border: `1px solid ${theme === 'dark' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(16, 185, 129, 0.4)'}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <DollarSign size={16} color="#10b981" />
              <span style={{ fontSize: '12px', color: '#10b981', fontWeight: '600' }}>TOTAL REIMBURSEMENT</span>
            </div>
            <div className="mono" style={{ fontSize: '32px', fontWeight: '700', color: '#10b981' }}>
              ${(mileagePayment + totals.perDiem + totals.otherExpense).toFixed(2)}
            </div>
            <div style={{ fontSize: '11px', color: colors.textTertiary, marginTop: '4px' }}>
              Mileage + Per Diem + Expenses
            </div>
          </div>
        </div>
      </div>

      {/* Entry Form */}
      <div style={{ maxWidth: '1200px', margin: '24px auto 0', padding: '0 16px' }}>
        <div className="glass" style={{ borderRadius: '16px', padding: '24px', border: isEditing ? '1px solid rgba(59, 130, 246, 0.3)' : `1px solid ${colors.cardBorder}` }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: '600', color: colors.accent, display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
              {isEditing ? <Edit2 size={20} /> : <Plus size={20} />}
              {isEditing ? 'Edit Entry' : 'New Entry'}
            </h2>
            {isEditing && (
              <button onClick={() => setEditingEntry(null)} className="btn-secondary" style={{ padding: '8px 16px' }}>
                Cancel
              </button>
            )}
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Date and Project */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: '500', marginBottom: '8px', color: colors.textSecondary }}>
                  <Calendar size={16} />
                  Date *
                </label>
                <input
                  type="date"
                  value={entryFormContent.date}
                  onChange={(e) => isEditing 
                    ? setEditingEntry({ ...editingEntry, date: e.target.value })
                    : setCurrentEntry({ ...currentEntry, date: e.target.value })
                  }
                  className="input-field"
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px', color: colors.textSecondary }}>Project Name</label>
                <input
                  type="text"
                  value={entryFormContent.projectName}
                  onChange={(e) => isEditing
                    ? setEditingEntry({ ...editingEntry, projectName: e.target.value })
                    : setCurrentEntry({ ...currentEntry, projectName: e.target.value })
                  }
                  className="input-field"
                  placeholder="e.g., Pump Station Overhaul"
                  list="projects-list"
                />
                <datalist id="projects-list">
                  {getUniqueProjects().map(p => <option key={p} value={p} />)}
                </datalist>
              </div>
            </div>

            {/* Hours Section */}
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px', color: colors.text, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Clock size={18} />
                Hours Worked
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px' }}>
                {[
                  { key: 'drivingHours', label: 'Driving' },
                  { key: 'standardHours', label: 'Standard' },
                  { key: 'overtimeHours', label: 'Overtime' },
                  { key: 'nightHours', label: 'Night' },
                  { key: 'nightOvertimeHours', label: 'Night OT' },
                  { key: 'weekendHours', label: 'Weekend' },
                  { key: 'weekendOvertimeHours', label: 'Weekend OT' }
                ].map(item => (
                  <div key={item.key}>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '6px', color: colors.textSecondary }}>
                      {item.label}
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      value={entryFormContent[item.key]}
                      onChange={(e) => isEditing
                        ? setEditingEntry({ ...editingEntry, [item.key]: e.target.value })
                        : setCurrentEntry({ ...currentEntry, [item.key]: e.target.value })
                      }
                      className="input-field"
                      placeholder="0.0"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Expenses Section */}
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px', color: colors.text, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <DollarSign size={18} />
                Expenses & Reimbursements
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: '500', marginBottom: '8px', color: colors.textSecondary }}>
                    <MapPin size={16} />
                    Mileage (miles)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={entryFormContent.mileage}
                    onChange={(e) => isEditing
                      ? setEditingEntry({ ...editingEntry, mileage: e.target.value })
                      : setCurrentEntry({ ...currentEntry, mileage: e.target.value })
                    }
                    className="input-field"
                    placeholder="45.2"
                  />
                  {entryFormContent.mileage && (
                    <div style={{ fontSize: '12px', color: '#10b981', marginTop: '4px', fontWeight: '500' }}>
                      = ${(parseFloat(entryFormContent.mileage) * IRS_MILEAGE_RATE).toFixed(2)} @ ${IRS_MILEAGE_RATE}/mi
                    </div>
                  )}
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px', color: colors.textSecondary }}>
                    Per Diem ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={entryFormContent.perDiem}
                    onChange={(e) => isEditing
                      ? setEditingEntry({ ...editingEntry, perDiem: e.target.value })
                      : setCurrentEntry({ ...currentEntry, perDiem: e.target.value })
                    }
                    className="input-field"
                    placeholder="75.00"
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px', color: colors.textSecondary }}>
                    Other Expense ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={entryFormContent.otherExpense}
                    onChange={(e) => isEditing
                      ? setEditingEntry({ ...editingEntry, otherExpense: e.target.value })
                      : setCurrentEntry({ ...currentEntry, otherExpense: e.target.value })
                    }
                    className="input-field"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px', color: colors.textSecondary }}>
                    Expense Category
                  </label>
                  <select
                    value={entryFormContent.expenseCategory}
                    onChange={(e) => isEditing
                      ? setEditingEntry({ ...editingEntry, expenseCategory: e.target.value })
                      : setCurrentEntry({ ...currentEntry, expenseCategory: e.target.value })
                    }
                    className="input-field"
                    style={{ cursor: 'pointer' }}
                  >
                    <option value="">Select category</option>
                    {expenseCategories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div style={{ marginTop: '16px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px', color: colors.textSecondary }}>
                  Expense Description
                </label>
                <input
                  type="text"
                  value={entryFormContent.expenseDescription}
                  onChange={(e) => isEditing
                    ? setEditingEntry({ ...editingEntry, expenseDescription: e.target.value })
                    : setCurrentEntry({ ...currentEntry, expenseDescription: e.target.value })
                  }
                  className="input-field"
                  placeholder="Brief description of expense"
                />
              </div>
            </div>

            {/* Notes and Receipt */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px', color: colors.textSecondary }}>
                  Notes
                </label>
                <textarea
                  value={entryFormContent.notes}
                  onChange={(e) => isEditing
                    ? setEditingEntry({ ...editingEntry, notes: e.target.value })
                    : setCurrentEntry({ ...currentEntry, notes: e.target.value })
                  }
                  className="input-field"
                  style={{ height: '80px', resize: 'none' }}
                  placeholder="Any additional notes..."
                />
              </div>
              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: '500', marginBottom: '8px', color: colors.textSecondary }}>
                  <Camera size={16} />
                  Receipt Photo
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  style={{
                    width: '100%',
                    padding: '12px',
                    background: colors.inputBg,
                    border: `1px solid ${colors.inputBorder}`,
                    borderRadius: '8px',
                    color: colors.text,
                    cursor: 'pointer'
                  }}
                />
                {entryFormContent.receiptImage && (
                  <div style={{ marginTop: '8px', position: 'relative', display: 'inline-block' }}>
                    <img src={entryFormContent.receiptImage} alt="Receipt" style={{ height: '60px', borderRadius: '8px' }} />
                    <button
                      onClick={() => isEditing 
                        ? setEditingEntry({ ...editingEntry, receiptImage: null })
                        : setCurrentEntry({ ...currentEntry, receiptImage: null })
                      }
                      style={{
                        position: 'absolute',
                        top: '-6px',
                        right: '-6px',
                        background: '#ef4444',
                        border: 'none',
                        borderRadius: '50%',
                        width: '20px',
                        height: '20px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <X size={12} color="#fff" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Submit Button */}
            <button onClick={isEditing ? updateEntry : addEntry} className="btn-primary" style={{ marginTop: '8px' }}>
              {isEditing ? <Check size={20} /> : <Plus size={20} />}
              {isEditing ? 'Update Entry' : 'Add Entry'}
            </button>
          </div>
        </div>
      </div>

      {/* Entries List */}
      {filteredEntries.length > 0 && (
        <div style={{ maxWidth: '1200px', margin: '24px auto 0', padding: '0 16px' }}>
          <div className="glass" style={{ borderRadius: '16px', padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: '600', color: colors.text, margin: 0 }}>
                Entries ({filteredEntries.length})
              </h2>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <button onClick={() => exportToCSV(filteredEntries, contractorInfo)} className="btn-secondary">
                  <FileSpreadsheet size={16} />
                  CSV
                </button>
                <button onClick={() => generatePDF(filteredEntries, contractorInfo, filterProject)} className="btn-secondary">
                  <Download size={16} />
                  PDF Report
                </button>
                <button onClick={openInvoiceBuilder} className="btn-primary" style={{ padding: '12px 20px' }}>
                  <Receipt size={16} />
                  Create Invoice
                </button>
              </div>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[...filteredEntries].reverse().map((entry) => {
                const entryMileagePayment = (parseFloat(entry.mileage) || 0) * IRS_MILEAGE_RATE;
                
                return (
                  <div key={entry.id} className="entry-card">
                    <div style={{ display: 'flex', alignItems: 'start', justifyContent: 'space-between', marginBottom: '12px' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                          <div className="mono" style={{ fontWeight: '600', color: colors.accent, fontSize: '16px' }}>
                            {formatDate(entry.date)}
                          </div>
                          {entry.projectName && (
                            <span style={{ 
                              background: theme === 'dark' ? 'rgba(251, 191, 36, 0.2)' : 'rgba(245, 158, 11, 0.2)', 
                              padding: '4px 12px', 
                              borderRadius: '12px', 
                              fontSize: '12px',
                              color: colors.accent,
                              border: `1px solid ${theme === 'dark' ? 'rgba(251, 191, 36, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`
                            }}>
                              {entry.projectName}
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: '11px', color: colors.textTertiary, marginTop: '4px' }}>
                          Added {new Date(entry.timestamp).toLocaleString()}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={() => setEditingEntry(entry)}
                          style={{
                            color: '#60a5fa',
                            background: 'transparent',
                            border: 'none',
                            padding: '8px',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            transition: 'all 0.3s ease'
                          }}
                        >
                          <Edit2 size={16} />
                        </button>
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
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                    
                    {/* Hours Display */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '10px', fontSize: '13px', marginBottom: '12px' }}>
                      {entry.drivingHours && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Clock size={14} color="#94a3b8" />
                          <span style={{ color: colors.textSecondary }}>{entry.drivingHours}h driving</span>
                        </div>
                      )}
                      {entry.standardHours && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Clock size={14} color="#fbbf24" />
                          <span style={{ color: colors.textSecondary }}>{entry.standardHours}h standard</span>
                        </div>
                      )}
                      {entry.overtimeHours && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Clock size={14} color="#fb923c" />
                          <span style={{ color: colors.textSecondary }}>{entry.overtimeHours}h OT</span>
                        </div>
                      )}
                      {entry.nightHours && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Clock size={14} color="#a78bfa" />
                          <span style={{ color: colors.textSecondary }}>{entry.nightHours}h night</span>
                        </div>
                      )}
                      {entry.nightOvertimeHours && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Clock size={14} color="#c084fc" />
                          <span style={{ color: colors.textSecondary }}>{entry.nightOvertimeHours}h night OT</span>
                        </div>
                      )}
                      {entry.weekendHours && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Clock size={14} color="#22d3ee" />
                          <span style={{ color: colors.textSecondary }}>{entry.weekendHours}h weekend</span>
                        </div>
                      )}
                      {entry.weekendOvertimeHours && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Clock size={14} color="#06b6d4" />
                          <span style={{ color: colors.textSecondary }}>{entry.weekendOvertimeHours}h weekend OT</span>
                        </div>
                      )}
                    </div>

                    {/* Expenses Display */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '10px', fontSize: '13px' }}>
                      {entry.mileage && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <MapPin size={14} color="#60a5fa" />
                          <span style={{ color: colors.textSecondary }}>
                            {entry.mileage} mi 
                            <span style={{ color: '#10b981', fontWeight: '600', marginLeft: '4px' }}>
                              (${entryMileagePayment.toFixed(2)})
                            </span>
                          </span>
                        </div>
                      )}
                      {entry.perDiem && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <DollarSign size={14} color="#8b5cf6" />
                          <span style={{ color: colors.textSecondary }}>
                            ${parseFloat(entry.perDiem).toFixed(2)} per diem
                          </span>
                        </div>
                      )}
                      {entry.otherExpense && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <FileText size={14} color="#ec4899" />
                          <span style={{ color: colors.textSecondary }}>
                            ${parseFloat(entry.otherExpense).toFixed(2)}
                            {entry.expenseCategory && ` (${entry.expenseCategory})`}
                            {entry.expenseDescription && ` - ${entry.expenseDescription}`}
                          </span>
                        </div>
                      )}
                    </div>
                    
                    {entry.notes && (
                      <div style={{ marginTop: '12px', fontSize: '13px', color: colors.textSecondary, fontStyle: 'italic', background: colors.inputBg, padding: '12px', borderRadius: '8px' }}>
                        {entry.notes}
                      </div>
                    )}
                    
                    {entry.receiptImage && (
                      <div style={{ marginTop: '12px' }}>
                        <img 
                          src={entry.receiptImage} 
                          alt="Receipt" 
                          style={{ 
                            maxWidth: '100%', 
                            height: '140px', 
                            borderRadius: '8px', 
                            border: `1px solid ${colors.cardBorder}`, 
                            cursor: 'pointer', 
                            transition: 'opacity 0.3s',
                            objectFit: 'cover'
                          }}
                          onClick={() => window.open(entry.receiptImage, '_blank')}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {entries.length === 0 && (
        <div style={{ maxWidth: '1200px', margin: '48px auto 0', padding: '0 16px', textAlign: 'center' }}>
          <div className="glass" style={{ borderRadius: '16px', padding: '48px' }}>
            <FileText size={64} color={colors.textTertiary} style={{ margin: '0 auto 16px' }} />
            <h3 style={{ fontSize: '20px', fontWeight: '600', color: colors.textSecondary, marginBottom: '8px' }}>No Entries Yet</h3>
            <p style={{ color: colors.textTertiary }}>Add your first entry to start tracking your contractor work</p>
          </div>
        </div>
      )}
    </div>
  );
}
