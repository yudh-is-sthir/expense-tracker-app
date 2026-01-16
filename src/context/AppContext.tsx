import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Transaction, type Category, type Budget, type Settings, type Account, type Task, type Plan, type HolidayBalance, type DiaryEntry, initializeDefaultData } from '../db/database';

interface AppContextType {
    transactions: Transaction[];
    categories: Category[];
    budgets: Budget[];
    settings: Settings | undefined;
    accounts: Account[];
    tasks: Task[];
    plans: Plan[];
    holidayBalance: HolidayBalance | undefined;
    diaryEntries: DiaryEntry[]; // New: Diary entries
    addTransaction: (transaction: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>) => Promise<number>;
    updateTransaction: (id: number, transaction: Partial<Transaction>) => Promise<number>;
    deleteTransaction: (id: number) => Promise<void>;
    addCategory: (category: Omit<Category, 'id'>) => Promise<number>;
    updateCategory: (id: number, category: Partial<Category>) => Promise<number>;
    deleteCategory: (id: number) => Promise<void>;
    addBudget: (budget: Omit<Budget, 'id'>) => Promise<number>;
    updateBudget: (id: number, budget: Partial<Budget>) => Promise<number>;
    deleteBudget: (id: number) => Promise<void>;
    updateSettings: (settings: Partial<Settings>) => Promise<number>;
    addAccount: (account: Omit<Account, 'id' | 'createdAt' | 'updatedAt'>) => Promise<number>;
    updateAccount: (id: number, account: Partial<Account>) => Promise<number>;
    deleteAccount: (id: number) => Promise<void>;
    updateAccountBalance: (id: number, amount: number, operation: 'add' | 'subtract') => Promise<void>;
    transferBetweenAccounts: (fromAccountId: number, toAccountId: number, amount: number, description: string) => Promise<void>;
    addTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => Promise<number>;
    updateTask: (id: number, task: Partial<Task>) => Promise<number>;
    deleteTask: (id: number) => Promise<void>;
    toggleTaskStatus: (id: number) => Promise<void>;
    addPlan: (plan: Omit<Plan, 'id' | 'createdAt' | 'updatedAt'>) => Promise<number>;
    updatePlan: (id: number, plan: Partial<Plan>) => Promise<number>;
    deletePlan: (id: number) => Promise<void>;
    updateHolidayBalance: (balance: Partial<HolidayBalance>) => Promise<void>;
    // Diary operations
    addDiaryEntry: (entry: Omit<DiaryEntry, 'id' | 'createdAt' | 'updatedAt'>) => Promise<number>;
    updateDiaryEntry: (id: number, entry: Partial<DiaryEntry>) => Promise<number>;
    deleteDiaryEntry: (id: number) => Promise<void>;
    isLoading: boolean;
}


const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [isLoading, setIsLoading] = useState(true);

    // Initialize database
    useEffect(() => {
        const init = async () => {
            try {
                await initializeDefaultData();
                setIsLoading(false);
            } catch (error) {
                console.error('Failed to initialize database:', error);
                setIsLoading(false);
            }
        };
        init();
    }, []);

    // Live queries
    const transactions = useLiveQuery(() =>
        db.transactions.orderBy('date').reverse().toArray(),
        []
    ) || [];

    const categories = useLiveQuery(() =>
        db.categories.toArray(),
        []
    ) || [];

    const budgets = useLiveQuery(() =>
        db.budgets.toArray(),
        []
    ) || [];

    const settings = useLiveQuery(() =>
        db.settings.toCollection().first(),
        []
    );

    const accounts = useLiveQuery(() =>
        db.accounts.toArray(),
        []
    ) || [];

    const tasks = useLiveQuery(() =>
        db.tasks.orderBy('createdAt').reverse().toArray(),
        []
    ) || [];

    const plans = useLiveQuery(() =>
        db.plans.orderBy('startDate').reverse().toArray(),
        []
    ) || [];


    const holidayBalance = useLiveQuery(() =>
        db.holidayBalance.toCollection().first(),
        []
    );

    const diaryEntries = useLiveQuery(() =>
        db.diary.orderBy('date').reverse().toArray(),
        []
    ) || [];

    // Transaction operations
    const addTransaction = async (transaction: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>) => {
        const now = new Date();
        return await db.transactions.add({
            ...transaction,
            createdAt: now,
            updatedAt: now,
        });
    };

    const updateTransaction = async (id: number, transaction: Partial<Transaction>) => {
        return await db.transactions.update(id, {
            ...transaction,
            updatedAt: new Date(),
        });
    };

    const deleteTransaction = async (id: number) => {
        await db.transactions.delete(id);
    };

    // Category operations
    const addCategory = async (category: Omit<Category, 'id'>) => {
        return await db.categories.add(category);
    };

    const updateCategory = async (id: number, category: Partial<Category>) => {
        return await db.categories.update(id, category);
    };

    const deleteCategory = async (id: number) => {
        // Don't allow deleting default categories
        const category = await db.categories.get(id);
        if (category?.isDefault) {
            throw new Error('Cannot delete default categories');
        }
        await db.categories.delete(id);
    };

    // Budget operations
    const addBudget = async (budget: Omit<Budget, 'id'>) => {
        return await db.budgets.add(budget);
    };

    const updateBudget = async (id: number, budget: Partial<Budget>) => {
        return await db.budgets.update(id, budget);
    };

    const deleteBudget = async (id: number) => {
        await db.budgets.delete(id);
    };

    // Settings operations
    const updateSettings = async (newSettings: Partial<Settings>) => {
        const current = await db.settings.toCollection().first();
        if (current?.id) {
            return await db.settings.update(current.id, newSettings);
        }
        return await db.settings.add(newSettings as Settings);
    };

    // Account operations
    const addAccount = async (account: Omit<Account, 'id' | 'createdAt' | 'updatedAt'>) => {
        const now = new Date();
        return await db.accounts.add({
            ...account,
            createdAt: now,
            updatedAt: now,
        });
    };

    const updateAccount = async (id: number, account: Partial<Account>) => {
        return await db.accounts.update(id, {
            ...account,
            updatedAt: new Date(),
        });
    };

    const deleteAccount = async (id: number) => {
        // Don't allow deleting default accounts if they have transactions
        // const account = await db.accounts.get(id); // Unused
        const accountTransactions = await db.transactions.where('accountId').equals(id).count();

        if (accountTransactions > 0) {
            throw new Error('Cannot delete account with existing transactions');
        }

        await db.accounts.delete(id);
    };

    const updateAccountBalance = async (id: number, amount: number, operation: 'add' | 'subtract') => {
        const account = await db.accounts.get(id);
        if (!account) throw new Error('Account not found');

        const newBalance = operation === 'add'
            ? account.balance + amount
            : account.balance - amount;

        await updateAccount(id, { balance: newBalance });
    };

    const transferBetweenAccounts = async (
        fromAccountId: number,
        toAccountId: number,
        amount: number,
        description: string
    ) => {
        const fromAccount = await db.accounts.get(fromAccountId);
        const toAccount = await db.accounts.get(toAccountId);

        if (!fromAccount || !toAccount) {
            throw new Error('Account not found');
        }

        // Update balances
        await updateAccount(fromAccountId, { balance: fromAccount.balance - amount });
        await updateAccount(toAccountId, { balance: toAccount.balance + amount });

        // Create transfer transaction
        const now = new Date();
        await db.transactions.add({
            amount,
            category: 'Transfer',
            categoryId: 0, // Special category for transfers
            accountId: fromAccountId,
            type: 'transfer',
            description,
            date: now,
            tags: ['transfer'],
            currency: fromAccount.currency,
            fromAccountId,
            toAccountId,
            createdAt: now,
            updatedAt: now,
        });
    };

    // Task operations
    const addTask = async (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => {
        const now = new Date();
        return await db.tasks.add({
            ...task,
            createdAt: now,
            updatedAt: now,
        });
    };

    const updateTask = async (id: number, task: Partial<Task>) => {
        return await db.tasks.update(id, {
            ...task,
            updatedAt: new Date(),
        });
    };

    const deleteTask = async (id: number) => {
        await db.tasks.delete(id);
    };

    const toggleTaskStatus = async (id: number) => {
        const task = await db.tasks.get(id);
        if (!task) throw new Error('Task not found');

        const newStatus = task.status === 'completed' ? 'pending' : 'completed';
        const completedAt = newStatus === 'completed' ? new Date() : undefined;

        await updateTask(id, {
            status: newStatus,
            completedAt
        });
    };

    // Plan operations
    const addPlan = async (plan: Omit<Plan, 'id' | 'createdAt' | 'updatedAt'>) => {
        const now = new Date();
        return await db.plans.add({
            ...plan,
            createdAt: now,
            updatedAt: now,
        });
    };

    const updatePlan = async (id: number, plan: Partial<Plan>) => {
        return await db.plans.update(id, {
            ...plan,
            updatedAt: new Date(),
        });
    };

    const deletePlan = async (id: number) => {
        await db.plans.delete(id);
    };

    const updateHolidayBalance = async (balance: Partial<HolidayBalance>) => {
        const currentYear = new Date().getFullYear();
        const existing = await db.holidayBalance.where('year').equals(currentYear).first();

        if (existing?.id) {
            await db.holidayBalance.update(existing.id, {
                ...balance,
                updatedAt: new Date(),
            });
        } else {
            const now = new Date();
            await db.holidayBalance.add({
                year: currentYear,
                totalDays: balance.totalDays || 20,
                usedDays: balance.usedDays || 0,
                plannedDays: balance.plannedDays || 0,
                availableDays: (balance.totalDays || 20) - (balance.usedDays || 0) - (balance.plannedDays || 0),
                createdAt: now,
                updatedAt: now,
            });
        }
    };

    // Diary operations
    const addDiaryEntry = async (entry: Omit<DiaryEntry, 'id' | 'createdAt' | 'updatedAt'>) => {
        const now = new Date();
        return await db.diary.add({
            ...entry,
            createdAt: now,
            updatedAt: now,
        });
    };

    const updateDiaryEntry = async (id: number, entry: Partial<DiaryEntry>) => {
        return await db.diary.update(id, {
            ...entry,
            updatedAt: new Date(),
        });
    };

    const deleteDiaryEntry = async (id: number) => {
        await db.diary.delete(id);
    };

    const value: AppContextType = {
        transactions,
        categories,
        budgets,
        settings,
        accounts,
        tasks,
        plans,
        holidayBalance,
        diaryEntries,
        addTransaction,
        updateTransaction,
        deleteTransaction,
        addCategory,
        updateCategory,
        deleteCategory,
        addBudget,
        updateBudget,
        deleteBudget,
        updateSettings,
        addAccount,
        updateAccount,
        deleteAccount,
        updateAccountBalance,
        transferBetweenAccounts,
        addTask,
        updateTask,
        deleteTask,
        toggleTaskStatus,
        addPlan,
        updatePlan,
        deletePlan,
        updateHolidayBalance,
        addDiaryEntry,
        updateDiaryEntry,
        deleteDiaryEntry,
        isLoading,
    };

    return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = () => {
    const context = useContext(AppContext);
    if (context === undefined) {
        throw new Error('useApp must be used within an AppProvider');
    }
    return context;
};
