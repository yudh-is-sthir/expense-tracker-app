import { useMemo } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useApp } from '../context/AppContext';
import { TrendingUp, TrendingDown, DollarSign, PieChart as PieChartIcon } from 'lucide-react';
import { formatCurrency } from '../utils/helpers';
import './Analytics.css';

const Analytics: React.FC = () => {
    const { transactions, categories, budgets, settings } = useApp();

    // Calculate analytics data
    const analyticsData = useMemo(() => {
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        // Filter current month transactions
        const monthTransactions = transactions.filter(t => {
            const date = new Date(t.date);
            return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
        });

        // Calculate totals
        const totalIncome = monthTransactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + t.amount, 0);

        const totalExpenses = monthTransactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0);

        // Expense by category
        const expensesByCategory = monthTransactions
            .filter(t => t.type === 'expense')
            .reduce((acc, t) => {
                const category = categories.find(c => c.id === t.categoryId);
                const categoryName = category?.name || 'Uncategorized';
                acc[categoryName] = (acc[categoryName] || 0) + t.amount;
                return acc;
            }, {} as Record<string, number>);

        const categoryData = Object.entries(expensesByCategory).map(([name, value]) => ({
            name,
            value,
        }));

        // Income vs Expenses comparison
        const comparisonData = [
            { name: 'Income', amount: totalIncome, fill: '#10b981' },
            { name: 'Expenses', amount: totalExpenses, fill: '#ef4444' },
        ];

        // Budget progress
        const budgetProgress = budgets.map(budget => {
            const category = categories.find(c => c.id === budget.categoryId);
            const spent = monthTransactions
                .filter(t => t.type === 'expense' && t.categoryId === budget.categoryId)
                .reduce((sum, t) => sum + t.amount, 0);

            const percentage = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;

            return {
                category: category?.name || 'Unknown',
                spent,
                budget: budget.amount,
                percentage,
                remaining: budget.amount - spent,
            };
        });

        return {
            totalIncome,
            totalExpenses,
            balance: totalIncome - totalExpenses,
            categoryData,
            comparisonData,
            budgetProgress,
        };
    }, [transactions, categories, budgets]);

    const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#6b7280', '#ec4899', '#14b8a6'];

    return (
        <div className="analytics-container">
            <h2 className="analytics-title">📊 Analytics</h2>

            {/* Summary Cards */}
            <div className="analytics-summary">
                <div className="summary-card income">
                    <div className="summary-icon">
                        <TrendingUp size={24} />
                    </div>
                    <div className="summary-content">
                        <span className="summary-label">Total Income</span>
                        <span className="summary-value">{formatCurrency(analyticsData.totalIncome, settings?.currency || 'USD')}</span>
                    </div>
                </div>

                <div className="summary-card expense">
                    <div className="summary-icon">
                        <TrendingDown size={24} />
                    </div>
                    <div className="summary-content">
                        <span className="summary-label">Total Expenses</span>
                        <span className="summary-value">{formatCurrency(analyticsData.totalExpenses, settings?.currency || 'USD')}</span>
                    </div>
                </div>

                <div className={`summary-card balance ${analyticsData.balance >= 0 ? 'positive' : 'negative'}`}>
                    <div className="summary-icon">
                        <DollarSign size={24} />
                    </div>
                    <div className="summary-content">
                        <span className="summary-label">Net Balance</span>
                        <span className="summary-value">{formatCurrency(analyticsData.balance, settings?.currency || 'USD')}</span>
                    </div>
                </div>
            </div>

            {/* Charts Grid */}
            <div className="charts-grid">
                {/* Expense by Category - Pie Chart */}
                {analyticsData.categoryData.length > 0 && (
                    <div className="chart-card">
                        <h3 className="chart-title">
                            <PieChartIcon size={18} />
                            Expenses by Category
                        </h3>
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={analyticsData.categoryData}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    dataKey="value"
                                >
                                    {analyticsData.categoryData.map((_entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(value) => formatCurrency(Number(value), settings?.currency || 'USD')} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                )}

                {/* Income vs Expenses - Bar Chart */}
                <div className="chart-card">
                    <h3 className="chart-title">
                        <TrendingUp size={18} />
                        Income vs Expenses
                    </h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={analyticsData.comparisonData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                            <XAxis dataKey="name" stroke="#6b7280" />
                            <YAxis stroke="#6b7280" />
                            <Tooltip formatter={(value) => formatCurrency(Number(value), settings?.currency || 'USD')} />
                            <Bar dataKey="amount" fill="#8884d8" radius={[8, 8, 0, 0]}>
                                {analyticsData.comparisonData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.fill} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Budget Progress */}
            {analyticsData.budgetProgress.length > 0 && (
                <div className="budget-progress-section">
                    <h3 className="section-title">Budget Progress</h3>
                    <div className="budget-list">
                        {analyticsData.budgetProgress.map((budget, index) => (
                            <div key={index} className="budget-item">
                                <div className="budget-header">
                                    <span className="budget-category">{budget.category}</span>
                                    <span className="budget-amounts">
                                        {formatCurrency(budget.spent, settings?.currency || 'USD')} / {formatCurrency(budget.budget, settings?.currency || 'USD')}
                                    </span>
                                </div>
                                <div className="budget-bar">
                                    <div
                                        className="budget-fill"
                                        style={{
                                            width: `${Math.min(budget.percentage, 100)}%`,
                                            backgroundColor: budget.percentage > 100 ? '#ef4444' : budget.percentage > 80 ? '#f59e0b' : '#10b981'
                                        }}
                                    />
                                </div>
                                <div className="budget-footer">
                                    <span className={`budget-percentage ${budget.percentage > 100 ? 'over' : ''}`}>
                                        {budget.percentage.toFixed(0)}% used
                                    </span>
                                    <span className="budget-remaining">
                                        {budget.remaining >= 0 ? 'Remaining' : 'Over'}: {formatCurrency(Math.abs(budget.remaining), settings?.currency || 'USD')}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Empty State */}
            {analyticsData.categoryData.length === 0 && analyticsData.totalIncome === 0 && analyticsData.totalExpenses === 0 && (
                <div className="analytics-empty">
                    <PieChartIcon size={48} />
                    <p>No data to display</p>
                    <p className="text-secondary text-sm">Add some transactions to see analytics</p>
                </div>
            )}
        </div>
    );
};

export default Analytics;
