import React, { useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Chart as ChartJS, ArcElement, CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend } from 'chart.js';
import { Doughnut, Line } from 'react-chartjs-2';
import { formatCurrency, calculateCategoryTotals, getMonthlyTrend, getDateRange, filterTransactionsByDateRange } from '../utils/helpers';
import './Analytics.css';

ChartJS.register(ArcElement, CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend);

const Analytics: React.FC = () => {
    const { transactions, categories, settings } = useApp();

    const { start, end } = getDateRange('month');
    const monthTransactions = useMemo(
        () => filterTransactionsByDateRange(transactions, start, end),
        [transactions, start, end]
    );

    const expenseCategories = useMemo(
        () => calculateCategoryTotals(
            monthTransactions.filter(t => t.type === 'expense'),
            categories.filter(c => c.type === 'expense')
        ),
        [monthTransactions, categories]
    );

    const incomeCategories = useMemo(
        () => calculateCategoryTotals(
            monthTransactions.filter(t => t.type === 'income'),
            categories.filter(c => c.type === 'income')
        ),
        [monthTransactions, categories]
    );

    const monthlyTrend = useMemo(() => getMonthlyTrend(transactions, 6), [transactions]);

    const expensePieData = {
        labels: expenseCategories.map(c => c.category.name),
        datasets: [{
            data: expenseCategories.map(c => c.total),
            backgroundColor: expenseCategories.map(c => c.category.color),
            borderWidth: 0,
        }],
    };

    const incomePieData = {
        labels: incomeCategories.map(c => c.category.name),
        datasets: [{
            data: incomeCategories.map(c => c.total),
            backgroundColor: incomeCategories.map(c => c.category.color),
            borderWidth: 0,
        }],
    };

    const trendLineData = {
        labels: monthlyTrend.map(m => m.month),
        datasets: [
            {
                label: 'Income',
                data: monthlyTrend.map(m => m.income),
                borderColor: 'rgb(16, 185, 129)',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                tension: 0.4,
                fill: true,
            },
            {
                label: 'Expenses',
                data: monthlyTrend.map(m => m.expense),
                borderColor: 'rgb(239, 68, 68)',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                tension: 0.4,
                fill: true,
            },
        ],
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'bottom' as const,
                labels: {
                    padding: 15,
                    usePointStyle: true,
                    font: {
                        size: 12,
                        family: 'Inter',
                    },
                },
            },
            tooltip: {
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                padding: 12,
                titleFont: {
                    size: 14,
                    family: 'Inter',
                },
                bodyFont: {
                    size: 13,
                    family: 'Inter',
                },
                callbacks: {
                    label: (context: any) => {
                        const label = context.label || '';
                        const value = formatCurrency(context.parsed || context.parsed.y, settings?.currency);
                        return `${label}: ${value}`;
                    },
                },
            },
        },
    };

    return (
        <div className="analytics-container">
            <header className="analytics-header">
                <h1 className="gradient-text">Analytics</h1>
                <p className="text-secondary">Visualize your spending patterns</p>
            </header>

            <div className="charts-grid">
                <div className="chart-card">
                    <h3>Monthly Trend</h3>
                    <div className="chart-wrapper" style={{ height: '300px' }}>
                        <Line data={trendLineData} options={chartOptions} />
                    </div>
                </div>

                <div className="chart-card">
                    <h3>Expense Breakdown</h3>
                    <div className="chart-wrapper" style={{ height: '300px' }}>
                        {expenseCategories.length > 0 ? (
                            <Doughnut data={expensePieData} options={chartOptions} />
                        ) : (
                            <div className="empty-chart">
                                <p>No expense data available</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="chart-card">
                    <h3>Income Breakdown</h3>
                    <div className="chart-wrapper" style={{ height: '300px' }}>
                        {incomeCategories.length > 0 ? (
                            <Doughnut data={incomePieData} options={chartOptions} />
                        ) : (
                            <div className="empty-chart">
                                <p>No income data available</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="category-breakdown">
                <h2>Top Spending Categories</h2>
                <div className="category-list">
                    {expenseCategories.slice(0, 5).map((item) => (
                        <div key={item.category.id} className="category-breakdown-item">
                            <div className="category-info">
                                <div
                                    className="category-color"
                                    style={{ backgroundColor: item.category.color }}
                                />
                                <span className="category-name">{item.category.name}</span>
                            </div>
                            <div className="category-stats">
                                <span className="category-amount">
                                    {formatCurrency(item.total, settings?.currency)}
                                </span>
                                <span className="category-percentage">
                                    {item.percentage.toFixed(1)}%
                                </span>
                            </div>
                            <div className="category-bar">
                                <div
                                    className="category-bar-fill"
                                    style={{
                                        width: `${item.percentage}%`,
                                        backgroundColor: item.category.color,
                                    }}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Analytics;
