# Quick Setup Guide

Follow these steps to get your Contractor Tracker running on GitHub and Vercel in minutes!

## Step 1: Organize Your Files

Create this folder structure on your computer:

```
contractor-tracker/
├── src/
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── index.html
├── package.json
├── vite.config.js
├── .gitignore
└── README.md
```

**What to do:**
1. Create a new folder called `contractor-tracker`
2. Inside it, create a folder called `src`
3. Place the files in their correct locations as shown above

## Step 2: Install and Test Locally

Open terminal/command prompt in the `contractor-tracker` folder and run:

```bash
npm install
npm run dev
```

Visit http://localhost:5173 to see your app running!

## Step 3: Push to GitHub

```bash
# Initialize git
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit"

# Create repository on GitHub (via website)
# Then link and push:
git remote add origin https://github.com/YOUR_USERNAME/contractor-tracker.git
git branch -M main
git push -u origin main
```

## Step 4: Deploy to Vercel

1. Go to https://vercel.com
2. Sign in with GitHub
3. Click "Add New..." → "Project"
4. Select your `contractor-tracker` repository
5. Click "Deploy"

**Done!** Your app will be live in ~1 minute at a URL like:
`https://contractor-tracker-xxx.vercel.app`

## Troubleshooting

**Problem:** `npm install` fails
**Solution:** Make sure you have Node.js installed from https://nodejs.org

**Problem:** Files in wrong place
**Solution:** Double-check the folder structure matches Step 1 exactly

**Problem:** Git commands fail
**Solution:** Install Git from https://git-scm.com

## Need More Help?

See the detailed [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for step-by-step instructions with screenshots and explanations.

---

**Total Time:** ~10 minutes from start to live website! 🚀
