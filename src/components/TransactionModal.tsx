import React, { useState, useEffect } from 'react';
import { X, Camera, Tag, Calendar, DollarSign } from 'lucide-react';
import { useApp } from '../context/AppContext';
import type { Transaction } from '../db/database';
import { compressImage } from '../utils/helpers';
import * as LucideIcons from 'lucide-react';
import './TransactionModal.css';

interface TransactionModalProps {
    isOpen: boolean;
    onClose: () => void;
    transaction?: Transaction;
}

const TransactionModal: React.FC<TransactionModalProps> = ({ isOpen, onClose, transaction }) => {
    const { categories, settings, addTransaction, updateTransaction } = useApp();
    const [type, setType] = useState<'expense' | 'income'>('expense');
    const [amount, setAmount] = useState('');
    const [categoryId, setCategoryId] = useState<number | ''>('');
    const [description, setDescription] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [tags, setTags] = useState<string[]>([]);
    const [tagInput, setTagInput] = useState('');
    const [receipt, setReceipt] = useState<string>('');
    const [isRecurring, setIsRecurring] = useState(false);
    const [recurringFrequency, setRecurringFrequency] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('monthly');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (transaction) {
            setType(transaction.type as 'expense' | 'income');
            setAmount(transaction.amount.toString());
            setCategoryId(transaction.categoryId);
            setDescription(transaction.description);
            setDate(new Date(transaction.date).toISOString().split('T')[0]);
            setTags(transaction.tags || []); // Handle optional tags
            setReceipt(transaction.receipt || '');
            setIsRecurring(!!transaction.recurring);
            if (transaction.recurring) {
                setRecurringFrequency(transaction.recurring.frequency);
            }
        } else {
            resetForm();
        }
    }, [transaction, isOpen]);

    const resetForm = () => {
        setType('expense');
        setAmount('');
        setCategoryId('');
        setDescription('');
        setDate(new Date().toISOString().split('T')[0]);
        setTags([]);
        setTagInput('');
        setReceipt('');
        setIsRecurring(false);
        setRecurringFrequency('monthly');
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            try {
                const compressed = await compressImage(file);
                setReceipt(compressed);
            } catch (error) {
                console.error('Failed to compress image:', error);
            }
        }
    };

    const handleAddTag = () => {
        if (tagInput.trim() && !tags.includes(tagInput.trim())) {
            setTags([...tags, tagInput.trim()]);
            setTagInput('');
        }
    };

    const handleRemoveTag = (tag: string) => {
        setTags(tags.filter(t => t !== tag));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!amount || !categoryId) return;

        setIsSubmitting(true);
        try {
            const category = categories.find(c => c.id === categoryId);
            const transactionData = {
                amount: parseFloat(amount),
                category: category?.name || '',
                categoryId: categoryId as number,
                accountId: 1, // Default account
                type,
                description,
                date: new Date(date),
                tags,
                receipt,
                currency: settings?.currency || 'USD',
                recurring: isRecurring ? {
                    frequency: recurringFrequency,
                } : undefined,
            };

            if (transaction?.id) {
                await updateTransaction(transaction.id, transactionData);
            } else {
                await addTransaction(transactionData);
            }

            onClose();
            resetForm();
        } catch (error) {
            console.error('Failed to save transaction:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const filteredCategories = categories.filter(c => c.type === type);

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>{transaction ? 'Edit Transaction' : 'Add Transaction'}</h2>
                    <button className="btn-icon" onClick={onClose}>
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="transaction-form">
                    <div className="type-selector">
                        <button
                            type="button"
                            className={`type-btn ${type === 'expense' ? 'active expense' : ''}`}
                            onClick={() => setType('expense')}
                        >
                            Expense
                        </button>
                        <button
                            type="button"
                            className={`type-btn ${type === 'income' ? 'active income' : ''}`}
                            onClick={() => setType('income')}
                        >
                            Income
                        </button>
                    </div>

                    <div className="form-group">
                        <label htmlFor="amount">
                            <DollarSign size={18} />
                            Amount
                        </label>
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
                            {filteredCategories.map((cat) => {
                                return (
                                    <option key={cat.id} value={cat.id}>
                                        {cat.name}
                                    </option>
                                );
                            })}
                        </select>
                    </div>

                    <div className="category-grid">
                        {filteredCategories.map((cat) => {
                            const IconComponent = (LucideIcons as any)[cat.icon];
                            return (
                                <button
                                    key={cat.id}
                                    type="button"
                                    className={`category-card ${categoryId === cat.id ? 'active' : ''}`}
                                    onClick={() => setCategoryId(cat.id!)}
                                    style={{ '--category-color': cat.color } as React.CSSProperties}
                                >
                                    {IconComponent && <IconComponent size={20} />}
                                    <span>{cat.name}</span>
                                </button>
                            );
                        })}
                    </div>

                    <div className="form-group">
                        <label htmlFor="description">Description</label>
                        <textarea
                            id="description"
                            className="textarea"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Add a note..."
                            rows={3}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="date">
                            <Calendar size={18} />
                            Date
                        </label>
                        <input
                            id="date"
                            type="date"
                            className="input"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="tags">
                            <Tag size={18} />
                            Tags
                        </label>
                        <div className="tag-input-wrapper">
                            <input
                                id="tags"
                                type="text"
                                className="input"
                                value={tagInput}
                                onChange={(e) => setTagInput(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                                placeholder="Add tags..."
                            />
                            <button type="button" className="btn btn-sm btn-secondary" onClick={handleAddTag}>
                                Add
                            </button>
                        </div>
                        {tags.length > 0 && (
                            <div className="tags-list">
                                {tags.map((tag) => (
                                    <span key={tag} className="badge badge-primary">
                                        {tag}
                                        <button type="button" onClick={() => handleRemoveTag(tag)}>
                                            <X size={12} />
                                        </button>
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="form-group">
                        <label htmlFor="receipt">
                            <Camera size={18} />
                            Receipt
                        </label>
                        <input
                            id="receipt"
                            type="file"
                            accept="image/*"
                            capture="environment"
                            onChange={handleImageUpload}
                            className="file-input"
                        />
                        {receipt && (
                            <div className="receipt-preview">
                                <img src={receipt} alt="Receipt" />
                                <button type="button" className="btn-icon" onClick={() => setReceipt('')}>
                                    <X size={16} />
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="form-group">
                        <label className="checkbox-label">
                            <input
                                type="checkbox"
                                checked={isRecurring}
                                onChange={(e) => setIsRecurring(e.target.checked)}
                            />
                            <span>Recurring Transaction</span>
                        </label>
                    </div>

                    {isRecurring && (
                        <div className="form-group">
                            <label htmlFor="frequency">Frequency</label>
                            <select
                                id="frequency"
                                className="select"
                                value={recurringFrequency}
                                onChange={(e) => setRecurringFrequency(e.target.value as any)}
                            >
                                <option value="daily">Daily</option>
                                <option value="weekly">Weekly</option>
                                <option value="monthly">Monthly</option>
                                <option value="yearly">Yearly</option>
                            </select>
                        </div>
                    )}

                    <div className="modal-actions">
                        <button type="button" className="btn btn-secondary" onClick={onClose}>
                            Cancel
                        </button>
                        <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                            {isSubmitting ? 'Saving...' : transaction ? 'Update' : 'Add'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default TransactionModal;
