import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Plus, Edit2, Trash2, AlertCircle, TrendingUp } from 'lucide-react';
import { formatCurrency, calculateBudgetProgress } from '../utils/helpers';
import { type Budget } from '../db/database';
import ConfirmDialog from '../components/ConfirmDialog';
import './Budgets.css';

const Budgets: React.FC = () => {
    const { budgets, categories, transactions, settings, addBudget, updateBudget, deleteBudget } = useApp();
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
    const [categoryId, setCategoryId] = useState<number | ''>('');
    const [amount, setAmount] = useState('');
    const [period, setPeriod] = useState<'weekly' | 'monthly' | 'yearly'>('monthly');
    const [alertThreshold, setAlertThreshold] = useState('80');
    const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; budgetId: number | null }>({ isOpen: false, budgetId: null });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!categoryId || !amount) return;

        const budgetData = {
            categoryId: categoryId as number,
            amount: parseFloat(amount),
            period,
            startDate: new Date(),
            alertThreshold: parseFloat(alertThreshold),
            currency: settings?.currency || 'USD',
        };

        if (editingBudget?.id) {
            await updateBudget(editingBudget.id, budgetData);
        } else {
            await addBudget(budgetData);
        }

        resetForm();
    };

    const resetForm = () => {
        setCategoryId('');
        setAmount('');
        setPeriod('monthly');
        setAlertThreshold('80');
        setEditingBudget(null);
        setIsFormOpen(false);
    };

    const handleEdit = (budget: Budget) => {
        setEditingBudget(budget);
        setCategoryId(budget.categoryId);
        setAmount(budget.amount.toString());
        setPeriod(budget.period);
        setAlertThreshold(budget.alertThreshold.toString());
        setIsFormOpen(true);
    };

    const handleDelete = (id: number) => {
        setDeleteConfirm({ isOpen: true, budgetId: id });
    };

    const confirmDelete = async () => {
        if (deleteConfirm.budgetId) {
            await deleteBudget(deleteConfirm.budgetId);
            setDeleteConfirm({ isOpen: false, budgetId: null });
        }
    };

    const cancelDelete = () => {
        setDeleteConfirm({ isOpen: false, budgetId: null });
    };

    return (
        <div className="budgets-container">
            <header className="budgets-header">
                <div>
                    <h1 className="gradient-text">Budgets</h1>
                    <p className="text-secondary">Set and track your spending limits</p>
                </div>
                <button className="btn btn-primary" onClick={() => setIsFormOpen(true)}>
                    <Plus size={18} />
                    Add Budget
                </button>
            </header>

            {isFormOpen && (
                <div className="budget-form-card card">
                    <h3>{editingBudget ? 'Edit Budget' : 'Create Budget'}</h3>
                    <form onSubmit={handleSubmit} className="budget-form">
                        <div className="form-row">
                            <div className="form-group">
                                <label htmlFor="category">Category</label>
                                <select
                                    id="category"
                                    className="select"
                                    value={categoryId}
                                    onChange={(e) => setCategoryId(Number(e.target.value))}
                                    required
                                >
                                    <option value="">Select category</option>
                                    {categories.filter(c => c.type === 'expense').map((cat) => (
                                        <option key={cat.id} value={cat.id}>
                                            {cat.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group">
                                <label htmlFor="amount">Budget Amount</label>
                                <input
                                    id="amount"
                                    type="number"
                                    step="0.01"
                                    className="input"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    placeholder="0.00"
                                    required
                                />
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label htmlFor="period">Period</label>
                                <select
                                    id="period"
                                    className="select"
                                    value={period}
                                    onChange={(e) => setPeriod(e.target.value as any)}
                                >
                                    <option value="weekly">Weekly</option>
                                    <option value="monthly">Monthly</option>
                                    <option value="yearly">Yearly</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label htmlFor="threshold">Alert Threshold (%)</label>
                                <input
                                    id="threshold"
                                    type="number"
                                    min="0"
                                    max="100"
                                    className="input"
                                    value={alertThreshold}
                                    onChange={(e) => setAlertThreshold(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <div className="form-actions">
                            <button type="button" className="btn btn-secondary" onClick={resetForm}>
                                Cancel
                            </button>
                            <button type="submit" className="btn btn-primary">
                                {editingBudget ? 'Update' : 'Create'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="budgets-grid">
                {budgets.length === 0 ? (
                    <div className="empty-state">
                        <TrendingUp size={48} />
                        <p>No budgets set</p>
                        <p className="text-secondary text-sm">Create your first budget to track spending</p>
                    </div>
                ) : (
                    budgets.map((budget) => {
                        const category = categories.find(c => c.id === budget.categoryId);
                        const progress = calculateBudgetProgress(budget, transactions);
                        const isWarning = progress.percentage >= budget.alertThreshold;
                        const isOverBudget = progress.isOverBudget;

                        return (
                            <div key={budget.id} className={`budget-card ${isOverBudget ? 'over-budget' : isWarning ? 'warning' : ''}`}>
                                <div className="budget-header">
                                    <div className="budget-info">
                                        <h3>{category?.name}</h3>
                                        <span className="budget-period">{budget.period}</span>
                                    </div>
                                    <div className="budget-actions">
                                        <button className="btn-icon" onClick={() => handleEdit(budget)}>
                                            <Edit2 size={18} />
                                        </button>
                                        <button className="btn-icon" onClick={() => handleDelete(budget.id!)}>
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>

                                <div className="budget-amounts">
                                    <div className="budget-spent">
                                        <span className="label">Spent</span>
                                        <span className="value">{formatCurrency(progress.spent, budget.currency)}</span>
                                    </div>
                                    <div className="budget-total">
                                        <span className="label">Budget</span>
                                        <span className="value">{formatCurrency(budget.amount, budget.currency)}</span>
                                    </div>
                                </div>

                                <div className="budget-progress">
                                    <div className="progress-bar">
                                        <div
                                            className={`progress-fill ${isOverBudget ? 'over' : isWarning ? 'warning' : ''}`}
                                            style={{ width: `${Math.min(progress.percentage, 100)}%` }}
                                        />
                                    </div>
                                    <span className="progress-text">
                                        {progress.percentage.toFixed(1)}% used
                                    </span>
                                </div>

                                {isWarning && (
                                    <div className={`budget-alert ${isOverBudget ? 'danger' : 'warning'}`}>
                                        <AlertCircle size={16} />
                                        <span>
                                            {isOverBudget
                                                ? `Over budget by ${formatCurrency(Math.abs(progress.remaining), budget.currency)}`
                                                : `${formatCurrency(progress.remaining, budget.currency)} remaining`}
                                        </span>
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
            </div>

            <ConfirmDialog
                isOpen={deleteConfirm.isOpen}
                title="Delete Budget"
                message="Are you sure you want to delete this budget? This action cannot be undone."
                confirmText="Delete"
                cancelText="Cancel"
                variant="danger"
                onConfirm={confirmDelete}
                onCancel={cancelDelete}
            />
        </div>
    );
};

export default Budgets;
