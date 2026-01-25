# Contractor Tracker

A mobile-friendly expense and time tracking application for contractors, featuring PDF export capabilities.

## Features

- ⏰ **Time Tracking**: Log standard and overtime hours
- 🚗 **Mileage Tracking**: Record miles driven for business
- ⛽ **Expense Tracking**: Track gas and other business expenses
- 📸 **Receipt Capture**: Upload photos of receipts
- 📊 **Live Dashboard**: View totals at a glance
- 📄 **PDF Export**: Generate professional reports
- 💾 **Auto-Save**: All data persists automatically
- 📱 **Mobile-Friendly**: Responsive design for any device

## Quick Start

### Option 1: Deploy to Vercel (Recommended)

1. Fork or clone this repository
2. Go to [Vercel](https://vercel.com)
3. Click "Add New..." → "Project"
4. Import your repository
5. Deploy!

See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for detailed instructions.

### Option 2: Run Locally

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## File Structure

```
contractor-tracker/
├── src/
│   ├── App.jsx          # Main application component
│   ├── main.jsx         # React entry point
│   └── index.css        # Global styles
├── public/              # Static assets
├── package.json         # Project dependencies
└── vite.config.js       # Vite configuration
```

## Technology Stack

- **React** - UI framework
- **Vite** - Build tool
- **Tailwind CSS** - Styling (via inline styles)
- **Lucide React** - Icons
- **jsPDF** - PDF generation
- **localStorage** - Data persistence

## Data Storage

This app uses browser localStorage to save your data. Your information stays on your device and is never sent to any server. To backup your data, use the PDF export feature regularly.

## Browser Compatibility

- Chrome/Edge: ✅ Full support
- Firefox: ✅ Full support
- Safari: ✅ Full support
- Mobile browsers: ✅ Full support

## Support

For issues or questions, please open an issue on GitHub.

## License

MIT License - feel free to use this for your business!
