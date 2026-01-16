import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import {
    TrendingUp,
    TrendingDown,
    Wallet,
    Search,
    Edit2,
    Trash2,
    MoreVertical
} from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import {
    formatCurrency,
    formatDate,
    calculateTotal,
    getDateRange,
    filterTransactionsByDateRange
} from '../utils/helpers';
import ConfirmDialog from '../components/ConfirmDialog';
import Analytics from '../components/Analytics';
import './Home.css';

interface HomeProps {
    onEditTransaction: (id: number) => void;
}

const Home: React.FC<HomeProps> = ({ onEditTransaction }) => {
    const { transactions, categories, settings, deleteTransaction } = useApp();
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState<'all' | 'expense' | 'income'>('all');
    const [period, setPeriod] = useState<'week' | 'month' | 'year'>('month');
    const [activeMenu, setActiveMenu] = useState<number | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; transactionId: number | null }>({ isOpen: false, transactionId: null });

    const { start, end } = getDateRange(period);
    const periodTransactions = useMemo(
        () => filterTransactionsByDateRange(transactions, start, end),
        [transactions, start, end]
    );

    const totalIncome = useMemo(
        () => calculateTotal(periodTransactions, 'income'),
        [periodTransactions]
    );

    const totalExpense = useMemo(
        () => calculateTotal(periodTransactions, 'expense'),
        [periodTransactions]
    );

    const balance = totalIncome - totalExpense;

    const filteredTransactions = useMemo(() => {
        let filtered = transactions;

        if (filterType !== 'all') {
            filtered = filtered.filter(t => t.type === filterType);
        }

        if (searchQuery) {
            filtered = filtered.filter(t =>
                t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                t.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
                t.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
            );
        }

        return filtered;
    }, [transactions, filterType, searchQuery]);

    const handleDelete = (id: number) => {
        setActiveMenu(null);
        setDeleteConfirm({ isOpen: true, transactionId: id });
    };

    const confirmDelete = async () => {
        if (deleteConfirm.transactionId) {
            await deleteTransaction(deleteConfirm.transactionId);
            setDeleteConfirm({ isOpen: false, transactionId: null });
        }
    };

    const cancelDelete = () => {
        setDeleteConfirm({ isOpen: false, transactionId: null });
    };

    return (
        <div className="home-container">
            <header className="home-header">
                <div>
                    <h1 className="gradient-text">Expense Tracker</h1>
                    <p className="text-secondary">Track your finances effortlessly</p>
                </div>
            </header>

            <div className="period-selector">
                {(['week', 'month', 'year'] as const).map((p) => (
                    <button
                        key={p}
                        className={`period - btn ${period === p ? 'active' : ''} `}
                        onClick={() => setPeriod(p)}
                    >
                        {p.charAt(0).toUpperCase() + p.slice(1)}
                    </button>
                ))}
            </div>

            <div className="stats-grid">
                <div className="stat-card balance">
                    <div className="stat-icon">
                        <Wallet size={24} />
                    </div>
                    <div className="stat-content">
                        <p className="stat-label">Balance</p>
                        <h3 className="stat-value">{formatCurrency(balance, settings?.currency)}</h3>
                    </div>
                </div>

                <div className="stat-card income">
                    <div className="stat-icon">
                        <TrendingUp size={24} />
                    </div>
                    <div className="stat-content">
                        <p className="stat-label">Income</p>
                        <h3 className="stat-value">{formatCurrency(totalIncome, settings?.currency)}</h3>
                    </div>
                </div>

                <div className="stat-card expense">
                    <div className="stat-icon">
                        <TrendingDown size={24} />
                    </div>
                    <div className="stat-content">
                        <p className="stat-label">Expenses</p>
                        <h3 className="stat-value">{formatCurrency(totalExpense, settings?.currency)}</h3>
                    </div>
                </div>
            </div>

            {/* Analytics Section */}
            <Analytics />

            <div className="transactions-section">
                <div className="section-header">
                    <h2>Transactions</h2>
                    <div className="search-filter">
                        <div className="search-box">
                            <Search size={18} />
                            <input
                                type="text"
                                placeholder="Search transactions..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="search-input"
                            />
                        </div>
                        <div className="filter-buttons">
                            {(['all', 'expense', 'income'] as const).map((type) => (
                                <button
                                    key={type}
                                    className={`filter - btn ${filterType === type ? 'active' : ''} `}
                                    onClick={() => setFilterType(type)}
                                >
                                    {type.charAt(0).toUpperCase() + type.slice(1)}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="transactions-list">
                    {filteredTransactions.length === 0 ? (
                        <div className="empty-state">
                            <Wallet size={48} />
                            <p>No transactions found</p>
                            <p className="text-secondary text-sm">Start by adding your first transaction</p>
                        </div>
                    ) : (
                        filteredTransactions.map((transaction) => {
                            const category = categories.find(c => c.id === transaction.categoryId);
                            const IconComponent = category ? (LucideIcons as any)[category.icon] : null;

                            return (
                                <div key={transaction.id} className="transaction-item">
                                    <div
                                        className="transaction-icon"
                                        style={{ backgroundColor: category?.color || '#ccc' }}
                                    >
                                        {IconComponent && <IconComponent size={20} color="white" />}
                                    </div>
                                    <div className="transaction-details">
                                        <div className="transaction-main">
                                            <h4>{transaction.category}</h4>
                                            <p className={`transaction - amount ${transaction.type} `}>
                                                {transaction.type === 'expense' ? '-' : '+'}
                                                {formatCurrency(transaction.amount, transaction.currency)}
                                            </p>
                                        </div>
                                        <div className="transaction-meta">
                                            <span className="text-secondary text-sm">
                                                {transaction.description || 'No description'}
                                            </span>
                                            <span className="text-tertiary text-xs">
                                                {formatDate(new Date(transaction.date))}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="transaction-actions">
                                        <button
                                            className="btn-icon"
                                            onClick={() => setActiveMenu(activeMenu === transaction.id ? null : transaction.id!)}
                                        >
                                            <MoreVertical size={18} />
                                        </button>
                                        {activeMenu === transaction.id && (
                                            <div className="action-menu">
                                                <button onClick={() => {
                                                    onEditTransaction(transaction.id!);
                                                    setActiveMenu(null);
                                                }}>
                                                    <Edit2 size={16} />
                                                    Edit
                                                </button>
                                                <button onClick={() => handleDelete(transaction.id!)} className="danger">
                                                    <Trash2 size={16} />
                                                    Delete
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            <ConfirmDialog
                isOpen={deleteConfirm.isOpen}
                title="Delete Transaction"
                message="Are you sure you want to delete this transaction? This action cannot be undone."
                confirmText="Delete"
                cancelText="Cancel"
                variant="danger"
                onConfirm={confirmDelete}
                onCancel={cancelDelete}
            />
        </div>
    );
};

export default Home;
