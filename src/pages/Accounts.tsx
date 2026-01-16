import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Plus, Edit2, Trash2, ArrowRightLeft, Wallet } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { formatCurrency } from '../utils/helpers';
import { type Account } from '../db/database';
import ConfirmDialog from '../components/ConfirmDialog';
import './Accounts.css';

const Accounts: React.FC = () => {
    const { accounts, settings, addAccount, updateAccount, deleteAccount } = useApp();
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [, setIsTransferOpen] = useState(false); // Unused state variable ignored
    const [editingAccount, setEditingAccount] = useState<Account | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; accountId: number | null }>({ isOpen: false, accountId: null });

    // Form state
    const [name, setName] = useState('');
    const [type, setType] = useState<Account['type']>('cash');
    const [balance, setBalance] = useState('');
    const [icon, setIcon] = useState('Wallet');
    const [color, setColor] = useState('#10b981');

    const accountTypes = [
        { value: 'cash', label: 'Cash', icon: 'Wallet', color: '#10b981' },
        { value: 'bank', label: 'Bank Account', icon: 'Building2', color: '#3b82f6' },
        { value: 'credit_card', label: 'Credit Card', icon: 'CreditCard', color: '#8b5cf6' },
        { value: 'digital_wallet', label: 'Digital Wallet', icon: 'Smartphone', color: '#ec4899' },
        { value: 'investment', label: 'Investment', icon: 'TrendingUp', color: '#f59e0b' },
        { value: 'other', label: 'Other', icon: 'MoreHorizontal', color: '#6b7280' },
    ];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !balance) return;

        const accountData = {
            name,
            type,
            balance: parseFloat(balance),
            currency: settings?.currency || 'USD',
            icon,
            color,
            isDefault: false,
        };

        try {
            if (editingAccount?.id) {
                await updateAccount(editingAccount.id, accountData);
            } else {
                await addAccount(accountData);
            }
            resetForm();
        } catch (error) {
            console.error('Failed to save account:', error);
            alert(error instanceof Error ? error.message : 'Failed to save account');
        }
    };

    const resetForm = () => {
        setName('');
        setType('cash');
        setBalance('');
        setIcon('Wallet');
        setColor('#10b981');
        setEditingAccount(null);
        setIsFormOpen(false);
    };

    const handleEdit = (account: Account) => {
        setEditingAccount(account);
        setName(account.name);
        setType(account.type);
        setBalance(account.balance.toString());
        setIcon(account.icon);
        setColor(account.color);
        setIsFormOpen(true);
    };

    const handleDelete = (id: number) => {
        setDeleteConfirm({ isOpen: true, accountId: id });
    };

    const confirmDelete = async () => {
        if (deleteConfirm.accountId) {
            try {
                await deleteAccount(deleteConfirm.accountId);
                setDeleteConfirm({ isOpen: false, accountId: null });
            } catch (error) {
                alert(error instanceof Error ? error.message : 'Failed to delete account');
                setDeleteConfirm({ isOpen: false, accountId: null });
            }
        }
    };

    const cancelDelete = () => {
        setDeleteConfirm({ isOpen: false, accountId: null });
    };

    const handleTypeChange = (newType: Account['type']) => {
        setType(newType);
        const typeConfig = accountTypes.find(t => t.value === newType);
        if (typeConfig) {
            setIcon(typeConfig.icon);
            setColor(typeConfig.color);
        }
    };

    const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0);

    return (
        <div className="accounts-container">
            <header className="accounts-header">
                <div>
                    <h1 className="gradient-text">Accounts</h1>
                    <p className="text-secondary">Manage your wallets and accounts</p>
                </div>
                <div className="header-actions">
                    <button className="btn btn-secondary btn-sm" onClick={() => setIsTransferOpen(true)}>
                        <ArrowRightLeft size={18} />
                        Transfer
                    </button>
                    <button className="btn btn-primary btn-sm" onClick={() => setIsFormOpen(true)}>
                        <Plus size={18} />
                        Add Account
                    </button>
                </div>
            </header>

            {/* Total Balance Card */}
            <div className="total-balance-card">
                <div className="total-balance-content">
                    <span className="total-balance-label">Total Balance</span>
                    <h2 className="total-balance-value">{formatCurrency(totalBalance, settings?.currency)}</h2>
                    <span className="total-balance-accounts">{accounts.length} {accounts.length === 1 ? 'Account' : 'Accounts'}</span>
                </div>
            </div>

            {/* Account Form */}
            {isFormOpen && (
                <div className="account-form-card card">
                    <h3>{editingAccount ? 'Edit Account' : 'Create Account'}</h3>
                    <form onSubmit={handleSubmit} className="account-form">
                        <div className="form-group">
                            <label htmlFor="name">Account Name</label>
                            <input
                                id="name"
                                type="text"
                                className="input"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="e.g., My Wallet"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>Account Type</label>
                            <div className="account-type-grid">
                                {accountTypes.map((accountType) => {
                                    const IconComponent = (LucideIcons as any)[accountType.icon];
                                    return (
                                        <button
                                            key={accountType.value}
                                            type="button"
                                            className={`account-type-card ${type === accountType.value ? 'active' : ''}`}
                                            onClick={() => handleTypeChange(accountType.value as Account['type'])}
                                            style={{ '--account-color': accountType.color } as React.CSSProperties}
                                        >
                                            {IconComponent && <IconComponent size={24} />}
                                            <span>{accountType.label}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="form-group">
                            <label htmlFor="balance">Initial Balance</label>
                            <input
                                id="balance"
                                type="number"
                                step="0.01"
                                className="input"
                                value={balance}
                                onChange={(e) => setBalance(e.target.value)}
                                placeholder="0.00"
                                required
                            />
                        </div>

                        <div className="form-actions">
                            <button type="button" className="btn btn-secondary" onClick={resetForm}>
                                Cancel
                            </button>
                            <button type="submit" className="btn btn-primary">
                                {editingAccount ? 'Update' : 'Create'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Accounts Grid */}
            <div className="accounts-grid">
                {accounts.length === 0 ? (
                    <div className="empty-state">
                        <Wallet size={48} />
                        <p>No accounts yet</p>
                        <p className="text-secondary text-sm">Create your first account to get started</p>
                    </div>
                ) : (
                    accounts.map((account) => {
                        const IconComponent = (LucideIcons as any)[account.icon];
                        const isNegative = account.balance < 0;

                        return (
                            <div key={account.id} className="account-card">
                                <div className="account-card-header">
                                    <div className="account-icon" style={{ backgroundColor: account.color }}>
                                        {IconComponent && <IconComponent size={24} color="white" />}
                                    </div>
                                    <div className="account-actions">
                                        <button className="btn-icon" onClick={() => handleEdit(account)}>
                                            <Edit2 size={16} />
                                        </button>
                                        {!account.isDefault && (
                                            <button className="btn-icon" onClick={() => handleDelete(account.id!)}>
                                                <Trash2 size={16} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                                <div className="account-card-body">
                                    <h3>{account.name}</h3>
                                    <p className="account-type-label">{accountTypes.find(t => t.value === account.type)?.label}</p>
                                    <div className={`account-balance ${isNegative ? 'negative' : ''}`}>
                                        {formatCurrency(account.balance, account.currency)}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            <ConfirmDialog
                isOpen={deleteConfirm.isOpen}
                title="Delete Account"
                message="Are you sure you want to delete this account? You cannot delete accounts with existing transactions."
                confirmText="Delete"
                cancelText="Cancel"
                variant="danger"
                onConfirm={confirmDelete}
                onCancel={cancelDelete}
            />
        </div>
    );
};

export default Accounts;
