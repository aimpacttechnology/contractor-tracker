# Contractor Tracker - Deployment Guide

This guide will walk you through deploying your Contractor Tracker to GitHub and Vercel.

## Prerequisites

- A GitHub account (sign up at https://github.com)
- A Vercel account (sign up at https://vercel.com - you can use your GitHub account)
- Git installed on your computer (download at https://git-scm.com)
- Node.js installed (download at https://nodejs.org)

## Step 1: Set Up Your Local Project

1. **Create a new project folder**
   ```bash
   mkdir contractor-tracker
   cd contractor-tracker
   ```

2. **Initialize a new React + Vite project**
   ```bash
   npm create vite@latest . -- --template react
   ```
   
   When prompted:
   - Select "React" as the framework
   - Select "JavaScript" as the variant

3. **Install dependencies**
   ```bash
   npm install
   npm install lucide-react
   ```

4. **Replace the default App.jsx**
   - Delete the existing `src/App.jsx` file
   - Copy your `contractor-tracker.jsx` file to `src/App.jsx`

5. **Update src/main.jsx**
   Replace the contents with:
   ```jsx
   import React from 'react'
   import ReactDOM from 'react-dom/client'
   import App from './App.jsx'
   import './index.css'

   ReactDOM.createRoot(document.getElementById('root')).render(
     <React.StrictMode>
       <App />
     </React.StrictMode>,
   )
   ```

6. **Update src/index.css**
   Replace the contents with:
   ```css
   * {
     margin: 0;
     padding: 0;
     box-sizing: border-box;
   }

   body {
     margin: 0;
     padding: 0;
   }
   ```

7. **Test locally**
   ```bash
   npm run dev
   ```
   
   Open your browser to the URL shown (usually http://localhost:5173)

## Step 2: Push to GitHub

1. **Initialize Git repository**
   ```bash
   git init
   git add .
   git commit -m "Initial commit - Contractor Tracker"
   ```

2. **Create a new repository on GitHub**
   - Go to https://github.com/new
   - Name it `contractor-tracker` (or any name you prefer)
   - Keep it **Public** (required for free Vercel hosting)
   - Don't initialize with README, .gitignore, or license
   - Click "Create repository"

3. **Link your local repository to GitHub**
   
   Replace `YOUR_USERNAME` with your actual GitHub username:
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/contractor-tracker.git
   git branch -M main
   git push -u origin main
   ```

## Step 3: Deploy to Vercel

### Option A: Deploy via Vercel Dashboard (Recommended)

1. **Go to Vercel**
   - Visit https://vercel.com
   - Click "Sign Up" or "Log In"
   - Use your GitHub account to sign in

2. **Import Your Project**
   - Click "Add New..." → "Project"
   - Select "Import Git Repository"
   - Find and select your `contractor-tracker` repository
   - Click "Import"

3. **Configure Project**
   - Framework Preset: Vite (should auto-detect)
   - Root Directory: `./` (leave as default)
   - Build Command: `npm run build` (default)
   - Output Directory: `dist` (default)
   - Install Command: `npm install` (default)
   - Click "Deploy"

4. **Wait for deployment**
   - Vercel will build and deploy your app (takes 1-2 minutes)
   - You'll get a live URL like `https://contractor-tracker.vercel.app`

### Option B: Deploy via Vercel CLI

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Deploy**
   ```bash
   vercel
   ```
   
   Follow the prompts:
   - Set up and deploy? **Y**
   - Which scope? (select your account)
   - Link to existing project? **N**
   - What's your project's name? **contractor-tracker**
   - In which directory is your code located? **./**
   - Want to override settings? **N**

4. **Deploy to production**
   ```bash
   vercel --prod
   ```

## Step 4: Custom Domain (Optional)

1. **In Vercel Dashboard**
   - Go to your project
   - Click "Settings" → "Domains"
   - Add your custom domain
   - Follow DNS configuration instructions

## Updating Your App

Whenever you make changes:

```bash
# Make your changes to the code
git add .
git commit -m "Description of changes"
git push
```

Vercel will automatically rebuild and deploy your updates!

## Troubleshooting

### Build Fails on Vercel

**Issue**: "Module not found" errors
**Solution**: Make sure all dependencies are in `package.json`
```bash
npm install lucide-react --save
git add package.json package-lock.json
git commit -m "Update dependencies"
git push
```

### Storage Not Working

**Issue**: `window.storage` is undefined
**Solution**: The storage API only works in Claude.ai artifacts. For production deployment, you'll need to implement an alternative storage solution (localStorage, database, etc.). See the note below.

### Blank Page on Deployment

**Issue**: App shows blank page
**Solution**: 
1. Check browser console for errors
2. Verify all import paths are correct
3. Ensure `src/App.jsx` has the correct export

## Important Note: Storage API

The `window.storage` API used in this app is **only available in Claude.ai artifacts**. For production deployment on Vercel, you have two options:

### Option 1: Use Browser localStorage (Simple)
Replace all `window.storage` calls with `localStorage`:

```javascript
// Instead of:
await window.storage.set('key', JSON.stringify(data))
const result = await window.storage.get('key')

// Use:
localStorage.setItem('key', JSON.stringify(data))
const data = JSON.parse(localStorage.getItem('key') || 'null')
```

### Option 2: Use a Backend Service (Advanced)
Integrate with services like:
- Firebase (https://firebase.google.com)
- Supabase (https://supabase.com)
- MongoDB Atlas (https://www.mongodb.com/cloud/atlas)

## Your Live URLs

After deployment, you'll have:
- **Production URL**: `https://contractor-tracker.vercel.app` (or your custom domain)
- **GitHub Repository**: `https://github.com/YOUR_USERNAME/contractor-tracker`

## Need Help?

- **Vercel Documentation**: https://vercel.com/docs
- **Vite Documentation**: https://vitejs.dev
- **React Documentation**: https://react.dev

---

**Congratulations!** 🎉 Your Contractor Tracker is now live on the web!
