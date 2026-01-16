# 💰 Expense Tracker - Next-Gen Mobile PWA

A modern, feature-rich expense tracking application built for mobile devices with offline-first capabilities. Track your finances effortlessly with a beautiful, intuitive interface.

## ✨ Features

### Core Functionality
- **📊 Transaction Management**: Add, edit, and delete income & expenses
- **🏷️ Smart Categories**: Pre-loaded categories with custom category support
- **💵 Multi-Currency**: Support for USD, EUR, GBP, JPY, INR, and more
- **🔄 Recurring Transactions**: Set up daily, weekly, monthly, or yearly recurring transactions
- **📸 Receipt Capture**: Take photos of receipts with automatic compression
- **🏷️ Tags**: Organize transactions with custom tags
- **🔍 Search & Filter**: Quickly find transactions by description, category, or tags

### Budget & Analytics
- **📈 Budget Tracking**: Set budgets per category with customizable alert thresholds
- **⚠️ Smart Alerts**: Get notified when approaching or exceeding budget limits
- **📊 Visual Analytics**: Beautiful charts showing spending patterns
  - Monthly trend line charts
  - Category breakdown doughnut charts
  - Top spending categories with progress bars
- **📅 Period Selection**: View data by week, month, or year

### Data Management
- **💾 Offline-First**: Full functionality without internet connection
- **📥 Export Data**: Download your data as CSV or JSON
- **🔄 Data Sync**: All data stored locally in IndexedDB
- **🗑️ Data Control**: Clear all data when needed

### User Experience
- **🎨 Modern Design**: Next-gen UI with vibrant colors and smooth animations
- **🌓 Dark/Light Theme**: Auto-detect system preference or manual toggle
- **📱 Mobile-Optimized**: Designed specifically for phone devices
- **⚡ PWA Support**: Install as a native app on your device
- **🔔 Notifications**: Budget alerts and reminders (with permission)
- **✨ Glassmorphism**: Beautiful glass-effect cards and components
- **🎭 Micro-animations**: Smooth transitions and hover effects

## 🛠️ Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for blazing-fast development
- **Vanilla CSS** with CSS Variables for theming

### Data & Storage
- **Dexie.js** - IndexedDB wrapper for offline storage
- **dexie-react-hooks** - Live queries for real-time updates

### Visualization
- **Chart.js** - Beautiful, responsive charts
- **react-chartjs-2** - React wrapper for Chart.js

### UI Components
- **Lucide React** - Modern icon library
- **date-fns** - Lightweight date manipulation

### PWA
- **vite-plugin-pwa** - Service worker and manifest generation
- **Workbox** - Advanced caching strategies

## 🚀 Getting Started

```bash
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.

## 📱 Installing as PWA

### On Mobile
1. Open the app in your mobile browser
2. Tap share/menu button
3. Select "Add to Home Screen"

### On Desktop
1. Open in Chrome/Edge
2. Click install icon in address bar
3. Click "Install"

## 🎯 Usage Guide

### Adding a Transaction
1. Tap the **+** button
2. Select type (Expense/Income)
3. Choose category
4. Enter amount and details
5. Tap "Add"

### Setting a Budget
1. Go to **Budgets** tab
2. Tap "Add Budget"
3. Configure and save

### Viewing Analytics
Go to **Analytics** tab to view charts and trends

### Exporting Data
Settings → Data Management → Export CSV/JSON

---

**Built with ❤️ for modern mobile experiences**

## 🤖 Building Android App

This app is configured with **Capacitor** to run as a native Android application.

### Quick Build
```bash
# 1. Build web assets
npm run build

# 2. Sync with Android project
npx cap sync android

# 3. Open in Android Studio to build APK
npx cap open android
```

See `QUICK_START_APK.md` or `MOBILE_BUILD_GUIDE.md` for detailed instructions.
