import React, { useState, useEffect } from 'react';
import { Calendar, Clock, DollarSign, MapPin, Camera, FileText, Plus, Trash2, Download, Edit2, Filter, X, Sun, Moon, FileSpreadsheet, Car, Receipt } from 'lucide-react';
import { jsPDF } from 'jspdf';

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

// Invoice generation for 1099 contractors
const generateInvoice = (entries, contractorInfo, invoiceInfo) => {
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
    doc.text(`Due: ${new Date(invoiceInfo.dueDate).toLocaleDateString()}`, pageWidth - margin - 50, 45);
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
  
  // From section (Contractor)
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

  // To section (Client)
  let toY = yPos;
  if (invoiceInfo.clientName) {
    doc.setFont(undefined, 'bold');
    doc.text(invoiceInfo.clientName, pageWidth / 2 + 10, toY);
    doc.setFont(undefined, 'normal');
    toY += 5;
  }
  if (invoiceInfo.clientAddress) {
    doc.text(invoiceInfo.clientAddress, pageWidth / 2 + 10, toY);
    toY += 5;
  }

  yPos = Math.max(fromY, toY) + 15;

  // Line items header
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

  let subtotal = 0;

  // Calculate hour totals
  const hourTotals = entries.reduce((acc, entry) => ({
    driving: acc.driving + (parseFloat(entry.drivingHours) || 0),
    standard: acc.standard + (parseFloat(entry.standardHours) || 0),
    overtime: acc.overtime + (parseFloat(entry.overtimeHours) || 0),
    night: acc.night + (parseFloat(entry.nightHours) || 0),
    nightOT: acc.nightOT + (parseFloat(entry.nightOvertimeHours) || 0),
    weekend: acc.weekend + (parseFloat(entry.weekendHours) || 0),
    weekendOT: acc.weekendOT + (parseFloat(entry.weekendOvertimeHours) || 0)
  }), { driving: 0, standard: 0, overtime: 0, night: 0, nightOT: 0, weekend: 0, weekendOT: 0 });

  // Labor line items
  const laborItems = [];
  if (hourTotals.driving > 0) laborItems.push({ desc: 'Driving Hours', hours: hourTotals.driving, rate: invoiceInfo.drivingRate || 0 });
  if (hourTotals.standard > 0) laborItems.push({ desc: 'Standard Labor', hours: hourTotals.standard, rate: invoiceInfo.standardRate || 0 });
  if (hourTotals.overtime > 0) laborItems.push({ desc: 'Overtime Labor', hours: hourTotals.overtime, rate: invoiceInfo.overtimeRate || 0 });
  if (hourTotals.night > 0) laborItems.push({ desc: 'Night Shift Labor', hours: hourTotals.night, rate: invoiceInfo.nightRate || 0 });
  if (hourTotals.nightOT > 0) laborItems.push({ desc: 'Night Shift Overtime', hours: hourTotals.nightOT, rate: invoiceInfo.nightOTRate || 0 });
  if (hourTotals.weekend > 0) laborItems.push({ desc: 'Weekend Labor', hours: hourTotals.weekend, rate: invoiceInfo.weekendRate || 0 });
  if (hourTotals.weekendOT > 0) laborItems.push({ desc: 'Weekend Overtime', hours: hourTotals.weekendOT, rate: invoiceInfo.weekendOTRate || 0 });

  laborItems.forEach(item => {
    const amount = item.hours * item.rate;
    doc.text(item.desc, margin, yPos);
    doc.text(`${item.hours.toFixed(2)}`, pageWidth - 90, yPos);
    doc.text(`$${item.rate.toFixed(2)}`, pageWidth - 60, yPos);
    doc.text(`$${amount.toFixed(2)}`, pageWidth - margin - 5, yPos, { align: 'right' });
    subtotal += amount;
    yPos += 7;
  });

  // Reimbursements
  const mileageTotal = entries.reduce((sum, e) => sum + (parseFloat(e.mileage) || 0), 0);
  const perDiemTotal = entries.reduce((sum, e) => sum + (parseFloat(e.perDiem) || 0), 0);
  const expensesTotal = entries.reduce((sum, e) => sum + (parseFloat(e.otherExpense) || 0), 0);

  if (mileageTotal > 0) {
    const mileageAmount = mileageTotal * IRS_MILEAGE_RATE;
    yPos += 3;
    doc.text('Mileage Reimbursement', margin, yPos);
    doc.text(`${mileageTotal.toFixed(1)} mi`, pageWidth - 90, yPos);
    doc.text(`$${IRS_MILEAGE_RATE}`, pageWidth - 60, yPos);
    doc.text(`$${mileageAmount.toFixed(2)}`, pageWidth - margin - 5, yPos, { align: 'right' });
    subtotal += mileageAmount;
    yPos += 7;
  }

  if (perDiemTotal > 0) {
    doc.text('Per Diem', margin, yPos);
    doc.text('', pageWidth - 90, yPos);
    doc.text('', pageWidth - 60, yPos);
    doc.text(`$${perDiemTotal.toFixed(2)}`, pageWidth - margin - 5, yPos, { align: 'right' });
    subtotal += perDiemTotal;
    yPos += 7;
  }

  if (expensesTotal > 0) {
    doc.text('Reimbursable Expenses', margin, yPos);
    doc.text('', pageWidth - 90, yPos);
    doc.text('', pageWidth - 60, yPos);
    doc.text(`$${expensesTotal.toFixed(2)}`, pageWidth - margin - 5, yPos, { align: 'right' });
    subtotal += expensesTotal;
    yPos += 7;
  }

  // Totals section
  yPos += 5;
  doc.setDrawColor(200, 200, 200);
  doc.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 10;

  doc.setFont(undefined, 'bold');
  doc.setFontSize(11);
  doc.text('SUBTOTAL:', pageWidth - 70, yPos);
  doc.text(`$${subtotal.toFixed(2)}`, pageWidth - margin - 5, yPos, { align: 'right' });
  yPos += 10;

  // NO TAXES for 1099
  doc.setFontSize(13);
  doc.text('TOTAL DUE:', pageWidth - 70, yPos);
  doc.text(`$${subtotal.toFixed(2)}`, pageWidth - margin - 5, yPos, { align: 'right' });
  
  // 1099 Notice
  yPos += 15;
  doc.setFontSize(9);
  doc.setFont(undefined, 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text('Payment subject to 1099 reporting. Taxes not withheld.', margin, yPos);

  // Payment terms
  if (invoiceInfo.paymentTerms) {
    yPos += 10;
    doc.setTextColor(26, 32, 44);
    doc.setFont(undefined, 'bold');
    doc.text('Payment Terms:', margin, yPos);
    doc.setFont(undefined, 'normal');
    yPos += 6;
    doc.text(invoiceInfo.paymentTerms, margin, yPos);
  }

  // Notes
  if (invoiceInfo.notes) {
    yPos += 10;
    doc.setFont(undefined, 'bold');
    doc.text('Notes:', margin, yPos);
    doc.setFont(undefined, 'normal');
    yPos += 6;
    const splitNotes = doc.splitTextToSize(invoiceInfo.notes, pageWidth - 2 * margin);
    doc.text(splitNotes, margin, yPos);
  }

  const fileName = `invoice_${invoiceNum.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
  doc.save(fileName);
};

// PDF generation
const generatePDF = (entries, contractorInfo, filterProject = null) => {
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
    doc.rect(margin - 5, yPos - 5, pageWidth - 2 * margin + 10, 60, 'F');

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
      if (entry.expenseDescription) {
        doc.text(` - ${entry.expenseDescription}`, margin + 50, yPos);
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

    yPos += 10;
  });

  const fileName = filterProject 
    ? `contractor_report_${filterProject.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`
    : `contractor_report_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
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
    clientCompany: ''
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
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
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
      
      if (entriesData) {
        setEntries(JSON.parse(entriesData));
      }
      if (infoData) {
        setContractorInfo(JSON.parse(infoData));
      }
      if (categoriesData) {
        setExpenseCategories(JSON.parse(categoriesData));
      }
      if (themeData) {
        setTheme(themeData);
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
    entryBorder: 'rgba(100, 116, 139, 0.5)'
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
    entryBorder: 'rgba(148, 163, 184, 0.4)'
  };

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

        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.7);
          display: flex;
          align-items: center;
          justifyContent: center;
          z-index: 1000;
          padding: 16px;
        }

        .modal-content {
          background: ${theme === 'dark' ? '#1e293b' : '#ffffff'};
          border-radius: 16px;
          padding: 32px;
          max-width: 600px;
          width: 100%;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
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
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
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
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px', color: colors.textSecondary }}>Client/Company Name</label>
                <input
                  type="text"
                  value={contractorInfo.clientCompany}
                  onChange={(e) => updateContractorInfo('clientCompany', e.target.value)}
                  className="input-field"
                  placeholder="ABC Manufacturing"
                />
              </div>
            </div>

            <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px', marginTop: '24px', color: colors.text }}>Expense Categories</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
              {expenseCategories.map(cat => (
                <span key={cat} style={{ 
                  background: colors.cardBg,
                  padding: '6px 12px',
                  borderRadius: '12px',
                  fontSize: '12px',
                  border: `1px solid ${colors.cardBorder}`
                }}>
                  {cat}
                </span>
              ))}
            </div>
            <button onClick={addCategory} className="btn-secondary" style={{ padding: '8px 16px' }}>
              <Plus size={14} />
              Add Category
            </button>
          </div>
        </div>
      )}

      {/* Date Range Filter */}
      <div style={{ maxWidth: '1200px', margin: '16px auto 0', padding: '0 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <Calendar size={16} color={colors.textSecondary} />
          <span style={{ fontSize: '14px', color: colors.textSecondary }}>Date Range:</span>
          <div className="filter-chip" onClick={() => setDateFilter('all')} style={{
            background: dateFilter === 'all' ? (theme === 'dark' ? 'rgba(251, 191, 36, 0.3)' : 'rgba(245, 158, 11, 0.3)') : colors.cardBg,
            borderColor: dateFilter === 'all' ? (theme === 'dark' ? 'rgba(251, 191, 36, 0.5)' : 'rgba(245, 158, 11, 0.5)') : colors.cardBorder
          }}>
            All Time
          </div>
          <div className="filter-chip" onClick={() => setDateFilter('today')} style={{
            background: dateFilter === 'today' ? (theme === 'dark' ? 'rgba(251, 191, 36, 0.3)' : 'rgba(245, 158, 11, 0.3)') : colors.cardBg,
            borderColor: dateFilter === 'today' ? (theme === 'dark' ? 'rgba(251, 191, 36, 0.5)' : 'rgba(245, 158, 11, 0.5)') : colors.cardBorder
          }}>
            Today
          </div>
          <div className="filter-chip" onClick={() => setDateFilter('week')} style={{
            background: dateFilter === 'week' ? (theme === 'dark' ? 'rgba(251, 191, 36, 0.3)' : 'rgba(245, 158, 11, 0.3)') : colors.cardBg,
            borderColor: dateFilter === 'week' ? (theme === 'dark' ? 'rgba(251, 191, 36, 0.5)' : 'rgba(245, 158, 11, 0.5)') : colors.cardBorder
          }}>
            This Week
          </div>
          <div className="filter-chip" onClick={() => setDateFilter('month')} style={{
            background: dateFilter === 'month' ? (theme === 'dark' ? 'rgba(251, 191, 36, 0.3)' : 'rgba(245, 158, 11, 0.3)') : colors.cardBg,
            borderColor: dateFilter === 'month' ? (theme === 'dark' ? 'rgba(251, 191, 36, 0.5)' : 'rgba(245, 158, 11, 0.5)') : colors.cardBorder
          }}>
            This Month
          </div>
          <div className="filter-chip" onClick={() => setDateFilter('custom')} style={{
            background: dateFilter === 'custom' ? (theme === 'dark' ? 'rgba(251, 191, 36, 0.3)' : 'rgba(245, 158, 11, 0.3)') : colors.cardBg,
            borderColor: dateFilter === 'custom' ? (theme === 'dark' ? 'rgba(251, 191, 36, 0.5)' : 'rgba(245, 158, 11, 0.5)') : colors.cardBorder
          }}>
            Custom Range
          </div>
        </div>

        {dateFilter === 'custom' && (
          <div style={{ display: 'flex', gap: '12px', marginTop: '12px', flexWrap: 'wrap' }}>
            <input
              type="date"
              value={customDateRange.start}
              onChange={(e) => setCustomDateRange({ ...customDateRange, start: e.target.value })}
              className="input-field"
              style={{ maxWidth: '200px' }}
            />
            <span style={{ alignSelf: 'center', color: colors.textSecondary }}>to</span>
            <input
              type="date"
              value={customDateRange.end}
              onChange={(e) => setCustomDateRange({ ...customDateRange, end: e.target.value })}
              className="input-field"
              style={{ maxWidth: '200px' }}
            />
          </div>
        )}
      </div>

      {/* Project Filter */}
      {getUniqueProjects().length > 0 && (
        <div style={{ maxWidth: '1200px', margin: '12px auto 0', padding: '0 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <Filter size={16} color={colors.textSecondary} />
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
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '6px', color: colors.textSecondary }}>
                    Driving
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={entryFormContent.drivingHours}
                    onChange={(e) => isEditing
                      ? setEditingEntry({ ...editingEntry, drivingHours: e.target.value })
                      : setCurrentEntry({ ...currentEntry, drivingHours: e.target.value })
                    }
                    className="input-field"
                    placeholder="0.0"
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '6px', color: colors.textSecondary }}>
                    Standard
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={entryFormContent.standardHours}
                    onChange={(e) => isEditing
                      ? setEditingEntry({ ...editingEntry, standardHours: e.target.value })
                      : setCurrentEntry({ ...currentEntry, standardHours: e.target.value })
                    }
                    className="input-field"
                    placeholder="8.0"
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '6px', color: colors.textSecondary }}>
                    Overtime
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={entryFormContent.overtimeHours}
                    onChange={(e) => isEditing
                      ? setEditingEntry({ ...editingEntry, overtimeHours: e.target.value })
                      : setCurrentEntry({ ...currentEntry, overtimeHours: e.target.value })
                    }
                    className="input-field"
                    placeholder="0.0"
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '6px', color: colors.textSecondary }}>
                    Night
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={entryFormContent.nightHours}
                    onChange={(e) => isEditing
                      ? setEditingEntry({ ...editingEntry, nightHours: e.target.value })
                      : setCurrentEntry({ ...currentEntry, nightHours: e.target.value })
                    }
                    className="input-field"
                    placeholder="0.0"
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '6px', color: colors.textSecondary }}>
                    Night OT
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={entryFormContent.nightOvertimeHours}
                    onChange={(e) => isEditing
                      ? setEditingEntry({ ...editingEntry, nightOvertimeHours: e.target.value })
                      : setCurrentEntry({ ...currentEntry, nightOvertimeHours: e.target.value })
                    }
                    className="input-field"
                    placeholder="0.0"
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '6px', color: colors.textSecondary }}>
                    Weekend
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={entryFormContent.weekendHours}
                    onChange={(e) => isEditing
                      ? setEditingEntry({ ...editingEntry, weekendHours: e.target.value })
                      : setCurrentEntry({ ...currentEntry, weekendHours: e.target.value })
                    }
                    className="input-field"
                    placeholder="0.0"
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '6px', color: colors.textSecondary }}>
                    Weekend OT
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={entryFormContent.weekendOvertimeHours}
                    onChange={(e) => isEditing
                      ? setEditingEntry({ ...editingEntry, weekendOvertimeHours: e.target.value })
                      : setCurrentEntry({ ...currentEntry, weekendOvertimeHours: e.target.value })
                    }
                    className="input-field"
                    placeholder="0.0"
                  />
                </div>
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
                    Per Diem
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
              </div>

              <div style={{ marginTop: '16px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px', color: colors.textSecondary }}>
                  Other Expense
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px' }}>
                  <input
                    type="number"
                    step="0.01"
                    value={entryFormContent.otherExpense}
                    onChange={(e) => isEditing
                      ? setEditingEntry({ ...editingEntry, otherExpense: e.target.value })
                      : setCurrentEntry({ ...currentEntry, otherExpense: e.target.value })
                    }
                    className="input-field"
                    placeholder="Amount"
                  />
                  <select
                    value={entryFormContent.expenseCategory}
                    onChange={(e) => isEditing
                      ? setEditingEntry({ ...editingEntry, expenseCategory: e.target.value })
                      : setCurrentEntry({ ...currentEntry, expenseCategory: e.target.value })
                    }
                    className="input-field"
                  >
                    <option value="">Category...</option>
                    {expenseCategories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={entryFormContent.expenseDescription}
                    onChange={(e) => isEditing
                      ? setEditingEntry({ ...editingEntry, expenseDescription: e.target.value })
                      : setCurrentEntry({ ...currentEntry, expenseDescription: e.target.value })
                    }
                    className="input-field"
                    placeholder="Description"
                  />
                </div>
              </div>
            </div>

            {/* Receipt & Notes */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: '500', marginBottom: '8px', color: colors.textSecondary }}>
                  <Camera size={16} />
                  Receipt Image
                </label>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleImageUpload}
                  className="input-field"
                  style={{ padding: '12px' }}
                />
                {entryFormContent.receiptImage && (
                  <div style={{ marginTop: '12px', position: 'relative', display: 'inline-block' }}>
                    <img 
                      src={entryFormContent.receiptImage} 
                      alt="Receipt" 
                      style={{ maxWidth: '100%', height: '160px', borderRadius: '8px', border: `1px solid ${colors.cardBorder}`, objectFit: 'cover' }} 
                    />
                    <button
                      onClick={() => isEditing
                        ? setEditingEntry({ ...editingEntry, receiptImage: null })
                        : setCurrentEntry({ ...currentEntry, receiptImage: null })
                      }
                      style={{
                        position: 'absolute',
                        top: '-8px',
                        right: '-8px',
                        background: '#ef4444',
                        color: 'white',
                        borderRadius: '50%',
                        width: '28px',
                        height: '28px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '18px',
                        fontWeight: 'bold',
                        border: '2px solid white',
                        cursor: 'pointer',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
                      }}
                    >
                      ×
                    </button>
                  </div>
                )}
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px', color: colors.textSecondary }}>Notes</label>
                <textarea
                  value={entryFormContent.notes}
                  onChange={(e) => isEditing
                    ? setEditingEntry({ ...editingEntry, notes: e.target.value })
                    : setCurrentEntry({ ...currentEntry, notes: e.target.value })
                  }
                  className="input-field"
                  style={{ height: '120px', resize: 'none' }}
                  placeholder="Additional notes about this entry..."
                />
              </div>
            </div>

            <button onClick={isEditing ? updateEntry : addEntry} className="btn-primary" style={{ width: '100%', padding: '18px' }}>
              {isEditing ? <><Edit2 size={20} /> Update Entry</> : <><Plus size={20} /> Add Entry</>}
            </button>
          </div>
        </div>
      </div>

      {/* Entries List */}
      {filteredEntries.length > 0 && (
        <div style={{ maxWidth: '1200px', margin: '24px auto 0', padding: '0 16px' }}>
          <div className="glass" style={{ borderRadius: '16px', padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: '600', color: colors.accent, margin: 0 }}>
                Recent Entries {filterProject && `(${filterProject})`}
              </h2>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button onClick={() => exportToCSV(filteredEntries, contractorInfo)} className="btn-secondary" style={{ padding: '12px 16px' }}>
                  <FileSpreadsheet size={16} />
                  CSV
                </button>
                <button onClick={() => generatePDF(filteredEntries, contractorInfo, filterProject)} className="btn-secondary" style={{ padding: '12px 16px' }}>
                  <Download size={16} />
                  PDF Report
                </button>
                <button onClick={() => setShowInvoiceModal(true)} className="btn-primary" style={{ padding: '12px 20px' }}>
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
                          onMouseEnter={(e) => e.target.style.background = 'rgba(96, 165, 250, 0.1)'}
                          onMouseLeave={(e) => e.target.style.background = 'transparent'}
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
                          onMouseEnter={(e) => e.target.style.background = 'rgba(248, 113, 113, 0.1)'}
                          onMouseLeave={(e) => e.target.style.background = 'transparent'}
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
                          onMouseEnter={(e) => e.target.style.opacity = '0.8'}
                          onMouseLeave={(e) => e.target.style.opacity = '1'}
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

      {/* Invoice Modal */}
      {showInvoiceModal && (
        <div className="modal-overlay" onClick={() => setShowInvoiceModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontSize: '24px', fontWeight: '700', color: colors.accent, marginBottom: '8px' }}>Create Invoice</h2>
            <p style={{ fontSize: '13px', color: colors.textSecondary, marginBottom: '24px' }}>
              Generate a professional 1099 contractor invoice (taxes not withheld)
            </p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px', color: colors.textSecondary }}>Invoice Number</label>
                  <input
                    type="text"
                    value={invoiceInfo.invoiceNumber}
                    onChange={(e) => setInvoiceInfo({ ...invoiceInfo, invoiceNumber: e.target.value })}
                    className="input-field"
                    placeholder="INV-001"
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px', color: colors.textSecondary }}>Due Date</label>
                  <input
                    type="date"
                    value={invoiceInfo.dueDate}
                    onChange={(e) => setInvoiceInfo({ ...invoiceInfo, dueDate: e.target.value })}
                    className="input-field"
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px', color: colors.textSecondary }}>Client Name *</label>
                <input
                  type="text"
                  value={invoiceInfo.clientName}
                  onChange={(e) => setInvoiceInfo({ ...invoiceInfo, clientName: e.target.value })}
                  className="input-field"
                  placeholder="ABC Manufacturing"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px', color: colors.textSecondary }}>Client Address</label>
                <input
                  type="text"
                  value={invoiceInfo.clientAddress}
                  onChange={(e) => setInvoiceInfo({ ...invoiceInfo, clientAddress: e.target.value })}
                  className="input-field"
                  placeholder="123 Main St, City, ST 12345"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '12px', color: colors.text }}>Hourly Rates (for labor line items)</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', marginBottom: '6px', color: colors.textSecondary }}>Driving</label>
                    <input
                      type="number"
                      step="0.01"
                      value={invoiceInfo.drivingRate}
                      onChange={(e) => setInvoiceInfo({ ...invoiceInfo, drivingRate: e.target.value })}
                      className="input-field"
                      placeholder="$/hr"
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', marginBottom: '6px', color: colors.textSecondary }}>Standard</label>
                    <input
                      type="number"
                      step="0.01"
                      value={invoiceInfo.standardRate}
                      onChange={(e) => setInvoiceInfo({ ...invoiceInfo, standardRate: e.target.value })}
                      className="input-field"
                      placeholder="$/hr"
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', marginBottom: '6px', color: colors.textSecondary }}>Overtime</label>
                    <input
                      type="number"
                      step="0.01"
                      value={invoiceInfo.overtimeRate}
                      onChange={(e) => setInvoiceInfo({ ...invoiceInfo, overtimeRate: e.target.value })}
                      className="input-field"
                      placeholder="$/hr"
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', marginBottom: '6px', color: colors.textSecondary }}>Night</label>
                    <input
                      type="number"
                      step="0.01"
                      value={invoiceInfo.nightRate}
                      onChange={(e) => setInvoiceInfo({ ...invoiceInfo, nightRate: e.target.value })}
                      className="input-field"
                      placeholder="$/hr"
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', marginBottom: '6px', color: colors.textSecondary }}>Night OT</label>
                    <input
                      type="number"
                      step="0.01"
                      value={invoiceInfo.nightOTRate}
                      onChange={(e) => setInvoiceInfo({ ...invoiceInfo, nightOTRate: e.target.value })}
                      className="input-field"
                      placeholder="$/hr"
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', marginBottom: '6px', color: colors.textSecondary }}>Weekend</label>
                    <input
                      type="number"
                      step="0.01"
                      value={invoiceInfo.weekendRate}
                      onChange={(e) => setInvoiceInfo({ ...invoiceInfo, weekendRate: e.target.value })}
                      className="input-field"
                      placeholder="$/hr"
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', marginBottom: '6px', color: colors.textSecondary }}>Weekend OT</label>
                    <input
                      type="number"
                      step="0.01"
                      value={invoiceInfo.weekendOTRate}
                      onChange={(e) => setInvoiceInfo({ ...invoiceInfo, weekendOTRate: e.target.value })}
                      className="input-field"
                      placeholder="$/hr"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px', color: colors.textSecondary }}>Payment Terms</label>
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

              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px', color: colors.textSecondary }}>Notes (Optional)</label>
                <textarea
                  value={invoiceInfo.notes}
                  onChange={(e) => setInvoiceInfo({ ...invoiceInfo, notes: e.target.value })}
                  className="input-field"
                  style={{ height: '80px', resize: 'none' }}
                  placeholder="Payment instructions, thank you note, etc."
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                <button 
                  onClick={() => {
                    if (!invoiceInfo.clientName) {
                      alert('Please enter client name');
                      return;
                    }
                    if (!invoiceInfo.standardRate && !invoiceInfo.overtimeRate && !invoiceInfo.drivingRate) {
                      alert('Please enter at least one hourly rate');
                      return;
                    }
                    generateInvoice(filteredEntries, contractorInfo, invoiceInfo);
                    setShowInvoiceModal(false);
                  }}
                  className="btn-primary" 
                  style={{ flex: 1 }}
                >
                  <Download size={16} />
                  Generate Invoice
                </button>
                <button onClick={() => setShowInvoiceModal(false)} className="btn-secondary" style={{ flex: 1 }}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
