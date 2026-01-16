import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Moon, Sun, Download, Trash2, Bell, DollarSign, Globe } from 'lucide-react';
import { exportToCSV, exportToJSON, downloadFile } from '../utils/helpers';
import './Settings.css';

const Settings: React.FC = () => {
    const { transactions, categories, settings, updateSettings } = useApp();
    const [theme, setTheme] = useState<'light' | 'dark' | 'auto'>(settings?.theme || 'auto');
    const [currency, setCurrency] = useState(settings?.currency || 'USD');
    const [notifications, setNotifications] = useState(settings?.notifications ?? true);
    const [budgetAlerts, setBudgetAlerts] = useState(settings?.budgetAlerts ?? true);

    useEffect(() => {
        if (settings) {
            setTheme(settings.theme);
            setCurrency(settings.currency);
            setNotifications(settings.notifications);
            setBudgetAlerts(settings.budgetAlerts);
        }
    }, [settings]);

    useEffect(() => {
        // Apply theme
        if (theme === 'dark') {
            document.documentElement.setAttribute('data-theme', 'dark');
        } else if (theme === 'light') {
            document.documentElement.setAttribute('data-theme', 'light');
        } else {
            // Auto theme based on system preference
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
        }
    }, [theme]);

    const handleThemeChange = async (newTheme: 'light' | 'dark' | 'auto') => {
        setTheme(newTheme);
        await updateSettings({ theme: newTheme });
    };

    const handleCurrencyChange = async (newCurrency: string) => {
        setCurrency(newCurrency);
        await updateSettings({ currency: newCurrency });
    };

    const handleNotificationsChange = async (enabled: boolean) => {
        setNotifications(enabled);
        await updateSettings({ notifications: enabled });

        if (enabled && 'Notification' in window) {
            Notification.requestPermission();
        }
    };

    const handleBudgetAlertsChange = async (enabled: boolean) => {
        setBudgetAlerts(enabled);
        await updateSettings({ budgetAlerts: enabled });
    };

    const handleExportCSV = () => {
        const csv = exportToCSV(transactions, categories);
        downloadFile(csv, `expense-tracker-${new Date().toISOString().split('T')[0]}.csv`, 'text/csv');
    };

    const handleExportJSON = () => {
        const data = {
            transactions,
            categories: categories.filter(c => !c.isDefault),
            exportDate: new Date().toISOString(),
        };
        const json = exportToJSON(data);
        downloadFile(json, `expense-tracker-${new Date().toISOString().split('T')[0]}.json`, 'application/json');
    };

    const handleClearData = async () => {
        if (confirm('Are you sure you want to clear all data? This action cannot be undone.')) {
            if (confirm('This will delete ALL transactions, budgets, and custom categories. Are you absolutely sure?')) {
                // Clear all data
                const { db } = await import('../db/database');
                await db.transactions.clear();
                await db.budgets.clear();
                await db.categories.where('isDefault').equals(0).delete();
                alert('All data has been cleared successfully.');
            }
        }
    };

    const currencies = [
        { code: 'USD', name: 'US Dollar', symbol: '$' },
        { code: 'EUR', name: 'Euro', symbol: '€' },
        { code: 'GBP', name: 'British Pound', symbol: '£' },
        { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
        { code: 'INR', name: 'Indian Rupee', symbol: '₹' },
        { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
        { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' },
        { code: 'CNY', name: 'Chinese Yuan', symbol: '¥' },
    ];

    return (
        <div className="settings-container">
            <header className="settings-header">
                <h1 className="gradient-text">Settings</h1>
                <p className="text-secondary">Customize your experience</p>
            </header>

            <div className="settings-sections">
                <section className="settings-section">
                    <h2>
                        <Sun size={20} />
                        Appearance
                    </h2>
                    <div className="setting-item">
                        <div className="setting-info">
                            <h3>Theme</h3>
                            <p>Choose your preferred color scheme</p>
                        </div>
                        <div className="theme-selector">
                            <button
                                className={`theme-btn ${theme === 'light' ? 'active' : ''}`}
                                onClick={() => handleThemeChange('light')}
                            >
                                <Sun size={18} />
                                Light
                            </button>
                            <button
                                className={`theme-btn ${theme === 'dark' ? 'active' : ''}`}
                                onClick={() => handleThemeChange('dark')}
                            >
                                <Moon size={18} />
                                Dark
                            </button>
                            <button
                                className={`theme-btn ${theme === 'auto' ? 'active' : ''}`}
                                onClick={() => handleThemeChange('auto')}
                            >
                                Auto
                            </button>
                        </div>
                    </div>
                </section>

                <section className="settings-section">
                    <h2>
                        <DollarSign size={20} />
                        Currency
                    </h2>
                    <div className="setting-item">
                        <div className="setting-info">
                            <h3>Default Currency</h3>
                            <p>Select your preferred currency</p>
                        </div>
                        <select
                            className="select"
                            value={currency}
                            onChange={(e) => handleCurrencyChange(e.target.value)}
                        >
                            {currencies.map((curr) => (
                                <option key={curr.code} value={curr.code}>
                                    {curr.symbol} {curr.name} ({curr.code})
                                </option>
                            ))}
                        </select>
                    </div>
                </section>

                <section className="settings-section">
                    <h2>
                        <Bell size={20} />
                        Notifications
                    </h2>
                    <div className="setting-item">
                        <div className="setting-info">
                            <h3>Enable Notifications</h3>
                            <p>Receive notifications for important events</p>
                        </div>
                        <label className="toggle">
                            <input
                                type="checkbox"
                                checked={notifications}
                                onChange={(e) => handleNotificationsChange(e.target.checked)}
                            />
                            <span className="toggle-slider"></span>
                        </label>
                    </div>
                    <div className="setting-item">
                        <div className="setting-info">
                            <h3>Budget Alerts</h3>
                            <p>Get notified when approaching budget limits</p>
                        </div>
                        <label className="toggle">
                            <input
                                type="checkbox"
                                checked={budgetAlerts}
                                onChange={(e) => handleBudgetAlertsChange(e.target.checked)}
                                disabled={!notifications}
                            />
                            <span className="toggle-slider"></span>
                        </label>
                    </div>
                </section>

                <section className="settings-section">
                    <h2>
                        <Download size={20} />
                        Data Management
                    </h2>
                    <div className="setting-item">
                        <div className="setting-info">
                            <h3>Export Data</h3>
                            <p>Download your data as CSV or JSON</p>
                        </div>
                        <div className="export-buttons">
                            <button className="btn btn-secondary btn-sm" onClick={handleExportCSV}>
                                <Download size={16} />
                                Export CSV
                            </button>
                            <button className="btn btn-secondary btn-sm" onClick={handleExportJSON}>
                                <Download size={16} />
                                Export JSON
                            </button>
                        </div>
                    </div>
                    <div className="setting-item danger">
                        <div className="setting-info">
                            <h3>Clear All Data</h3>
                            <p>Permanently delete all your data</p>
                        </div>
                        <button className="btn btn-danger btn-sm" onClick={handleClearData}>
                            <Trash2 size={16} />
                            Clear Data
                        </button>
                    </div>
                </section>

                <section className="settings-section">
                    <h2>
                        <Globe size={20} />
                        About
                    </h2>
                    <div className="about-info">
                        <div className="about-item">
                            <span className="label">Version</span>
                            <span className="value">1.0.0</span>
                        </div>
                        <div className="about-item">
                            <span className="label">Total Transactions</span>
                            <span className="value">{transactions.length}</span>
                        </div>
                        <div className="about-item">
                            <span className="label">Storage</span>
                            <span className="value">IndexedDB (Offline)</span>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
};

export default Settings;
