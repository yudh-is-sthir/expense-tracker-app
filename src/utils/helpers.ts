import { type Transaction, type Category, type Budget } from '../db/database';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, startOfYear, endOfYear, isWithinInterval } from 'date-fns';

export const formatCurrency = (amount: number, currency: string = 'USD'): string => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(amount);
};

export const formatDate = (date: Date, formatStr: string = 'MMM dd, yyyy'): string => {
    return format(date, formatStr);
};

export const getDateRange = (period: 'week' | 'month' | 'year', date: Date = new Date()) => {
    switch (period) {
        case 'week':
            return {
                start: startOfWeek(date, { weekStartsOn: 1 }),
                end: endOfWeek(date, { weekStartsOn: 1 }),
            };
        case 'month':
            return {
                start: startOfMonth(date),
                end: endOfMonth(date),
            };
        case 'year':
            return {
                start: startOfYear(date),
                end: endOfYear(date),
            };
    }
};

export const filterTransactionsByDateRange = (
    transactions: Transaction[],
    start: Date,
    end: Date
): Transaction[] => {
    return transactions.filter(t =>
        isWithinInterval(new Date(t.date), { start, end })
    );
};

export const calculateTotal = (transactions: Transaction[], type?: 'expense' | 'income'): number => {
    return transactions
        .filter(t => !type || t.type === type)
        .reduce((sum, t) => sum + t.amount, 0);
};

export const calculateCategoryTotals = (
    transactions: Transaction[],
    categories: Category[]
): { category: Category; total: number; percentage: number }[] => {
    const total = calculateTotal(transactions);

    const categoryTotals = categories.map(category => {
        const categoryTransactions = transactions.filter(
            t => t.categoryId === category.id && t.type === category.type
        );
        const categoryTotal = calculateTotal(categoryTransactions);

        return {
            category,
            total: categoryTotal,
            percentage: total > 0 ? (categoryTotal / total) * 100 : 0,
        };
    });

    return categoryTotals
        .filter(ct => ct.total > 0)
        .sort((a, b) => b.total - a.total);
};

export const calculateBudgetProgress = (
    budget: Budget,
    transactions: Transaction[]
): { spent: number; remaining: number; percentage: number; isOverBudget: boolean } => {
    // Convert budget period format to getDateRange format
    const periodMap: Record<'weekly' | 'monthly' | 'yearly', 'week' | 'month' | 'year'> = {
        weekly: 'week',
        monthly: 'month',
        yearly: 'year',
    };
    const { start, end } = getDateRange(periodMap[budget.period], budget.startDate);
    const relevantTransactions = filterTransactionsByDateRange(transactions, start, end)
        .filter(t => t.categoryId === budget.categoryId && t.type === 'expense');

    const spent = calculateTotal(relevantTransactions);
    const remaining = budget.amount - spent;
    const percentage = (spent / budget.amount) * 100;
    const isOverBudget = spent > budget.amount;

    return { spent, remaining, percentage, isOverBudget };
};

export const exportToCSV = (transactions: Transaction[], categories: Category[]): string => {
    const headers = ['Date', 'Type', 'Category', 'Amount', 'Description', 'Tags', 'Currency'];
    const rows = transactions.map(t => {
        const category = categories.find(c => c.id === t.categoryId);
        return [
            formatDate(new Date(t.date), 'yyyy-MM-dd'),
            t.type,
            category?.name || 'Unknown',
            t.amount.toString(),
            t.description,
            t.tags.join('; '),
            t.currency,
        ];
    });

    return [headers, ...rows].map(row => row.join(',')).join('\n');
};

export const exportToJSON = (data: any): string => {
    return JSON.stringify(data, null, 2);
};

export const downloadFile = (content: string, filename: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};

export const compressImage = async (file: File, maxWidth: number = 800): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target?.result as string;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                if (width > maxWidth) {
                    height = (height * maxWidth) / width;
                    width = maxWidth;
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx?.drawImage(img, 0, 0, width, height);

                resolve(canvas.toDataURL('image/jpeg', 0.7));
            };
            img.onerror = reject;
        };
        reader.onerror = reject;
    });
};

export const getMonthlyTrend = (transactions: Transaction[], months: number = 6) => {
    const now = new Date();
    const monthlyData = [];

    for (let i = months - 1; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const { start, end } = getDateRange('month', date);
        const monthTransactions = filterTransactionsByDateRange(transactions, start, end);

        monthlyData.push({
            month: format(date, 'MMM yyyy'),
            income: calculateTotal(monthTransactions, 'income'),
            expense: calculateTotal(monthTransactions, 'expense'),
        });
    }

    return monthlyData;
};

export const getCategoryIcon = (iconName: string) => {
    // This will be used with lucide-react icons
    return iconName;
};

export const generateId = (): string => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

export const debounce = <T extends (...args: any[]) => any>(
    func: T,
    wait: number
): ((...args: Parameters<T>) => void) => {
    let timeout: ReturnType<typeof setTimeout>;
    return (...args: Parameters<T>) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
};
