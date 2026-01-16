import Dexie, { type Table } from 'dexie';

export interface Category {
    id?: number;
    name: string;
    icon: string;
    color: string;
    type: 'expense' | 'income';
    isDefault: boolean;
}

export interface Account {
    id?: number;
    name: string;
    type: 'cash' | 'bank' | 'credit_card' | 'digital_wallet' | 'investment' | 'other';
    balance: number;
    currency: string;
    icon: string;
    color: string;
    isDefault: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface Transaction {
    id?: number;
    amount: number;
    category: string;
    categoryId: number;
    accountId: number; // New: Link to account
    type: 'expense' | 'income' | 'transfer'; // New: Added transfer type
    description: string;
    date: Date;
    recurring?: {
        frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
        endDate?: Date;
    };
    receipt?: string; // base64 image
    tags: string[];
    currency: string;
    // Transfer specific fields
    toAccountId?: number; // For transfers
    fromAccountId?: number; // For transfers
    createdAt: Date;
    updatedAt: Date;
}

export interface Budget {
    id?: number;
    categoryId: number;
    amount: number;
    period: 'weekly' | 'monthly' | 'yearly';
    startDate: Date;
    alertThreshold: number; // percentage (e.g., 80 for 80%)
    currency: string;
}

export interface Settings {
    id?: number;
    currency: string;
    theme: 'light' | 'dark' | 'auto';
    notifications: boolean;
    budgetAlerts: boolean;
    language: string;
}

export interface Task {
    id?: number;
    title: string;
    description: string;
    category: 'work' | 'personal' | 'health' | 'shopping' | 'finance' | 'other';
    priority: 'high' | 'medium' | 'low';
    status: 'pending' | 'in-progress' | 'completed';
    dueDate?: Date;
    completedAt?: Date;
    recurring?: {
        frequency: 'daily' | 'weekly' | 'monthly';
        endDate?: Date;
    };
    tags: string[];
    reminder?: Date;
    createdAt: Date;
    updatedAt: Date;
}

export interface ChecklistItem {
    id: string;
    text: string;
    completed: boolean;
}

export interface ItineraryDay {
    day: number;
    date: Date;
    activities: string[];
    notes: string;
}

export interface Plan {
    id?: number;
    title: string;
    description: string;
    type: 'trip' | 'event' | 'goal' | 'project';
    destination?: string;
    startDate: Date;
    endDate: Date;
    budget: number;
    spent: number;
    currency: string;
    status: 'planning' | 'confirmed' | 'ongoing' | 'completed' | 'cancelled';
    checklist: ChecklistItem[];
    itinerary: ItineraryDay[];
    notes: string;
    tags: string[];
    holidaysUsed: number; // Number of leave days used
    createdAt: Date;
    updatedAt: Date;
}

export interface HolidayBalance {
    id?: number;
    year: number;
    totalDays: number;
    usedDays: number;
    plannedDays: number;
    availableDays: number;
    createdAt: Date;
    updatedAt: Date;
}

export interface DiaryEntry {
    id?: number;
    date: Date;
    title: string;
    content: string;
    mood: 'great' | 'good' | 'okay' | 'bad' | 'terrible';
    tags: string[];
    createdAt: Date;
    updatedAt: Date;
}

export class ExpenseTrackerDB extends Dexie {
    transactions!: Table<Transaction>;
    categories!: Table<Category>;
    budgets!: Table<Budget>;
    settings!: Table<Settings>;
    accounts!: Table<Account>;
    tasks!: Table<Task>;
    plans!: Table<Plan>;
    holidayBalance!: Table<HolidayBalance>;
    diary!: Table<DiaryEntry>; // New: Diary table

    constructor() {
        super('ExpenseTrackerDB');
        this.version(5).stores({
            transactions: '++id, date, type, categoryId, accountId, amount, currency, createdAt',
            categories: '++id, name, type, isDefault',
            budgets: '++id, categoryId, period, startDate',
            settings: '++id',
            accounts: '++id, name, type, isDefault, createdAt',
            tasks: '++id, status, priority, category, dueDate, createdAt',
            plans: '++id, status, type, startDate, endDate, createdAt',
            holidayBalance: '++id, year',
            diary: '++id, date, mood, createdAt',
        });
    }
}

export const db = new ExpenseTrackerDB();

// Initialize default categories and accounts
export const initializeDefaultData = async () => {
    const categoriesCount = await db.categories.count();

    if (categoriesCount === 0) {
        const defaultCategories: Category[] = [
            // Expense categories
            { name: 'Food & Dining', icon: 'UtensilsCrossed', color: '#FF6B6B', type: 'expense', isDefault: true },
            { name: 'Transportation', icon: 'Car', color: '#4ECDC4', type: 'expense', isDefault: true },
            { name: 'Shopping', icon: 'ShoppingBag', color: '#95E1D3', type: 'expense', isDefault: true },
            { name: 'Entertainment', icon: 'Film', color: '#F38181', type: 'expense', isDefault: true },
            { name: 'Bills & Utilities', icon: 'Receipt', color: '#AA96DA', type: 'expense', isDefault: true },
            { name: 'Healthcare', icon: 'Heart', color: '#FCBAD3', type: 'expense', isDefault: true },
            { name: 'Education', icon: 'GraduationCap', color: '#A8D8EA', type: 'expense', isDefault: true },
            { name: 'Travel', icon: 'Plane', color: '#FFD93D', type: 'expense', isDefault: true },
            { name: 'Fitness', icon: 'Dumbbell', color: '#6BCB77', type: 'expense', isDefault: true },
            { name: 'Other', icon: 'MoreHorizontal', color: '#95A5A6', type: 'expense', isDefault: true },

            // Income categories
            { name: 'Salary', icon: 'Briefcase', color: '#2ECC71', type: 'income', isDefault: true },
            { name: 'Freelance', icon: 'Laptop', color: '#3498DB', type: 'income', isDefault: true },
            { name: 'Investment', icon: 'TrendingUp', color: '#9B59B6', type: 'income', isDefault: true },
            { name: 'Gift', icon: 'Gift', color: '#E74C3C', type: 'income', isDefault: true },
            { name: 'Other Income', icon: 'DollarSign', color: '#1ABC9C', type: 'income', isDefault: true },
        ];

        await db.categories.bulkAdd(defaultCategories);
    }

    // Initialize default accounts
    const accountsCount = await db.accounts.count();
    if (accountsCount === 0) {
        const now = new Date();
        const defaultAccounts: Account[] = [
            {
                name: 'Cash',
                type: 'cash',
                balance: 0,
                currency: 'USD',
                icon: 'Wallet',
                color: '#10b981',
                isDefault: true,
                createdAt: now,
                updatedAt: now,
            },
            {
                name: 'Bank Account',
                type: 'bank',
                balance: 0,
                currency: 'USD',
                icon: 'Building2',
                color: '#3b82f6',
                isDefault: true,
                createdAt: now,
                updatedAt: now,
            },
            {
                name: 'Credit Card',
                type: 'credit_card',
                balance: 0,
                currency: 'USD',
                icon: 'CreditCard',
                color: '#8b5cf6',
                isDefault: true,
                createdAt: now,
                updatedAt: now,
            },
        ];

        await db.accounts.bulkAdd(defaultAccounts);
    }

    const settingsCount = await db.settings.count();
    if (settingsCount === 0) {
        await db.settings.add({
            currency: 'USD',
            theme: 'auto',
            notifications: true,
            budgetAlerts: true,
            language: 'en',
        });
    }
};
