import { useState, useMemo, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Plus, MapPin, Calendar, DollarSign, Edit2, Trash2, Plane, Target, Package, PieChart, Palmtree } from 'lucide-react';
import { type Plan } from '../db/database';
import { formatDate, formatCurrency } from '../utils/helpers';
import ConfirmDialog from '../components/ConfirmDialog';
import './Plans.css';

const Plans: React.FC = () => {
    const { plans, holidayBalance, addPlan, updatePlan, deletePlan, updateHolidayBalance, settings } = useApp();
    const [activeSection, setActiveSection] = useState<'budgets' | 'holidays' | 'plans'>('budgets');
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isHolidayFormOpen, setIsHolidayFormOpen] = useState(false);
    const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
    const [filterStatus, setFilterStatus] = useState<'all' | 'planning' | 'confirmed' | 'ongoing' | 'completed'>('all');
    const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; planId: number | null }>({ isOpen: false, planId: null });

    // Form state
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [type, setType] = useState<Plan['type']>('trip');
    const [destination, setDestination] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [budget, setBudget] = useState('');
    const [holidaysUsed, setHolidaysUsed] = useState('0');

    // Holiday balance form
    const [totalDays, setTotalDays] = useState('20');
    const [usedDays, setUsedDays] = useState('0');

    const planTypes = [
        { value: 'trip', label: 'Trip', icon: Plane, color: '#3b82f6' },
        { value: 'event', label: 'Event', icon: Calendar, color: '#8b5cf6' },
        { value: 'goal', label: 'Goal', icon: Target, color: '#10b981' },
        { value: 'project', label: 'Project', icon: Package, color: '#f59e0b' },
    ];

    // Initialize holiday balance if not exists
    useEffect(() => {
        if (!holidayBalance) {
            updateHolidayBalance({ totalDays: 20, usedDays: 0, plannedDays: 0 });
        }
    }, [holidayBalance, updateHolidayBalance]);

    // Filter plans
    const filteredPlans = useMemo(() => {
        return plans.filter(plan => {
            if (filterStatus === 'all') return true;
            return plan.status === filterStatus;
        });
    }, [plans, filterStatus]);

    // Group plans by status
    const activePlans = filteredPlans.filter(p => ['planning', 'confirmed', 'ongoing'].includes(p.status));
    const completedPlans = filteredPlans.filter(p => p.status === 'completed');

    // Calculate total planned days
    const plannedDays = useMemo(() => {
        return plans
            .filter(p => p.status === 'confirmed' && p.type === 'trip')
            .reduce((sum, p) => sum + p.holidaysUsed, 0);
    }, [plans]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim() || !startDate || !endDate) return;

        const planData = {
            title: title.trim(),
            description: description.trim(),
            type,
            destination: destination.trim(),
            startDate: new Date(startDate),
            endDate: new Date(endDate),
            budget: parseFloat(budget) || 0,
            spent: 0,
            currency: settings?.currency || 'USD',
            status: 'planning' as const,
            checklist: [],
            itinerary: [],
            notes: '',
            tags: [],
            holidaysUsed: parseInt(holidaysUsed) || 0,
        };

        try {
            if (editingPlan?.id) {
                await updatePlan(editingPlan.id, planData);
            } else {
                await addPlan(planData);
            }
            resetForm();
        } catch (error) {
            console.error('Failed to save plan:', error);
            alert(error instanceof Error ? error.message : 'Failed to save plan');
        }
    };

    const handleHolidaySubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await updateHolidayBalance({
                totalDays: parseInt(totalDays),
                usedDays: parseInt(usedDays),
                plannedDays,
            });
            setIsHolidayFormOpen(false);
        } catch (error) {
            alert(error instanceof Error ? error.message : 'Failed to update holiday balance');
        }
    };

    const resetForm = () => {
        setTitle('');
        setDescription('');
        setType('trip');
        setDestination('');
        setStartDate('');
        setEndDate('');
        setBudget('');
        setHolidaysUsed('0');
        setEditingPlan(null);
        setIsFormOpen(false);
    };

    const handleEdit = (plan: Plan) => {
        setEditingPlan(plan);
        setTitle(plan.title);
        setDescription(plan.description);
        setType(plan.type);
        setDestination(plan.destination || '');
        setStartDate(new Date(plan.startDate).toISOString().split('T')[0]);
        setEndDate(new Date(plan.endDate).toISOString().split('T')[0]);
        setBudget(plan.budget.toString());
        setHolidaysUsed(plan.holidaysUsed.toString());
        setIsFormOpen(true);
    };

    const handleDelete = (id: number) => {
        setDeleteConfirm({ isOpen: true, planId: id });
    };

    const confirmDelete = async () => {
        if (deleteConfirm.planId) {
            try {
                await deletePlan(deleteConfirm.planId);
                setDeleteConfirm({ isOpen: false, planId: null });
            } catch (error) {
                alert(error instanceof Error ? error.message : 'Failed to delete plan');
                setDeleteConfirm({ isOpen: false, planId: null });
            }
        }
    };

    const cancelDelete = () => {
        setDeleteConfirm({ isOpen: false, planId: null });
    };

    const getTypeConfig = (planType: Plan['type']) => {
        return planTypes.find(t => t.value === planType) || planTypes[0];
    };

    const calculateDuration = (start: Date, end: Date) => {
        const days = Math.ceil((new Date(end).getTime() - new Date(start).getTime()) / (1000 * 60 * 60 * 24));
        return days + 1;
    };

    const availableDays = (holidayBalance?.totalDays || 20) - (holidayBalance?.usedDays || 0) - plannedDays;

    return (
        <div className="plans-container">
            <header className="plans-header">
                <div>
                    <h1 className="gradient-text">Plans</h1>
                    <p className="text-secondary">Budgets, Holidays & Trips</p>
                </div>
                {activeSection === 'plans' && (
                    <button className="btn btn-primary btn-sm" onClick={() => setIsFormOpen(true)}>
                        <Plus size={18} />
                        Add Plan
                    </button>
                )}
            </header>

            {/* Section Tabs */}
            <div className="section-tabs">
                <button
                    className={`section-tab ${activeSection === 'budgets' ? 'active' : ''}`}
                    onClick={() => setActiveSection('budgets')}
                >
                    <PieChart size={18} />
                    <span>Budgets</span>
                </button>
                <button
                    className={`section-tab ${activeSection === 'holidays' ? 'active' : ''}`}
                    onClick={() => setActiveSection('holidays')}
                >
                    <Palmtree size={18} />
                    <span>Holidays</span>
                </button>
                <button
                    className={`section-tab ${activeSection === 'plans' ? 'active' : ''}`}
                    onClick={() => setActiveSection('plans')}
                >
                    <MapPin size={18} />
                    <span>Plans</span>
                </button>
            </div>

            {/* Budgets Section */}
            {activeSection === 'budgets' && (
                <div className="section-content">
                    <div className="empty-state">
                        <PieChart size={48} />
                        <p>Budget Management</p>
                        <p className="text-secondary text-sm">View and manage your spending budgets by category</p>
                        <p className="text-secondary text-sm" style={{ marginTop: '1rem' }}>
                            💡 Tip: Go to Home → Budgets tab for full budget management
                        </p>
                    </div>
                </div>
            )}

            {/* Holidays Section */}
            {activeSection === 'holidays' && (
                <div className="section-content">
                    {/* Holiday Balance Card */}
                    <div className="holiday-balance-card">
                        <div className="holiday-header">
                            <h3>🏖️ Holiday Balance {new Date().getFullYear()}</h3>
                            <button className="btn-icon" onClick={() => {
                                setTotalDays((holidayBalance?.totalDays || 20).toString());
                                setUsedDays((holidayBalance?.usedDays || 0).toString());
                                setIsHolidayFormOpen(true);
                            }}>
                                <Edit2 size={16} />
                            </button>
                        </div>
                        <div className="holiday-stats">
                            <div className="holiday-stat">
                                <span className="stat-label">Total</span>
                                <span className="stat-value">{holidayBalance?.totalDays || 20} days</span>
                            </div>
                            <div className="holiday-stat">
                                <span className="stat-label">Used</span>
                                <span className="stat-value used">{holidayBalance?.usedDays || 0} days</span>
                            </div>
                            <div className="holiday-stat">
                                <span className="stat-label">Planned</span>
                                <span className="stat-value planned">{plannedDays} days</span>
                            </div>
                            <div className="holiday-stat">
                                <span className="stat-label">Available</span>
                                <span className="stat-value available">{availableDays} days</span>
                            </div>
                        </div>
                        <div className="holiday-progress">
                            <div className="progress-bar">
                                <div
                                    className="progress-fill used"
                                    style={{ width: `${((holidayBalance?.usedDays || 0) / (holidayBalance?.totalDays || 20)) * 100}%` }}
                                />
                                <div
                                    className="progress-fill planned"
                                    style={{ width: `${(plannedDays / (holidayBalance?.totalDays || 20)) * 100}%` }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Holiday Form */}
                    {isHolidayFormOpen && (
                        <div className="plan-form-card card">
                            <h3>Update Holiday Balance</h3>
                            <form onSubmit={handleHolidaySubmit} className="plan-form">
                                <div className="form-row">
                                    <div className="form-group">
                                        <label htmlFor="totalDays">Total Days</label>
                                        <input
                                            id="totalDays"
                                            type="number"
                                            className="input"
                                            value={totalDays}
                                            onChange={(e) => setTotalDays(e.target.value)}
                                            min="0"
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="usedDays">Used Days</label>
                                        <input
                                            id="usedDays"
                                            type="number"
                                            className="input"
                                            value={usedDays}
                                            onChange={(e) => setUsedDays(e.target.value)}
                                            min="0"
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="form-actions">
                                    <button type="button" className="btn btn-secondary" onClick={() => setIsHolidayFormOpen(false)}>
                                        Cancel
                                    </button>
                                    <button type="submit" className="btn btn-primary">
                                        Update
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}
                </div>
            )}

            {/* Plans Section */}
            {activeSection === 'plans' && (
                <div className="section-content">
                    {/* Filters */}
                    <div className="plan-filters">
                        <button
                            className={`filter-btn ${filterStatus === 'all' ? 'active' : ''}`}
                            onClick={() => setFilterStatus('all')}
                        >
                            All
                        </button>
                        <button
                            className={`filter-btn ${filterStatus === 'planning' ? 'active' : ''}`}
                            onClick={() => setFilterStatus('planning')}
                        >
                            Planning
                        </button>
                        <button
                            className={`filter-btn ${filterStatus === 'confirmed' ? 'active' : ''}`}
                            onClick={() => setFilterStatus('confirmed')}
                        >
                            Confirmed
                        </button>
                        <button
                            className={`filter-btn ${filterStatus === 'ongoing' ? 'active' : ''}`}
                            onClick={() => setFilterStatus('ongoing')}
                        >
                            Ongoing
                        </button>
                        <button
                            className={`filter-btn ${filterStatus === 'completed' ? 'active' : ''}`}
                            onClick={() => setFilterStatus('completed')}
                        >
                            Completed
                        </button>
                    </div>

                    {/* Plan Form */}
                    {isFormOpen && (
                        <div className="plan-form-card card">
                            <h3>{editingPlan ? 'Edit Plan' : 'Create Plan'}</h3>
                            <form onSubmit={handleSubmit} className="plan-form">
                                <div className="form-group">
                                    <label htmlFor="title">Plan Title *</label>
                                    <input
                                        id="title"
                                        type="text"
                                        className="input"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        placeholder="e.g., Trip to Goa"
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label htmlFor="description">Description</label>
                                    <textarea
                                        id="description"
                                        className="textarea"
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        placeholder="Add details about this plan..."
                                        rows={3}
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Plan Type</label>
                                    <div className="type-grid">
                                        {planTypes.map((planType) => {
                                            const Icon = planType.icon;
                                            return (
                                                <button
                                                    key={planType.value}
                                                    type="button"
                                                    className={`type-btn ${type === planType.value ? 'active' : ''}`}
                                                    onClick={() => setType(planType.value as Plan['type'])}
                                                    style={{ '--type-color': planType.color } as React.CSSProperties}
                                                >
                                                    <Icon size={20} />
                                                    <span>{planType.label}</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {type === 'trip' && (
                                    <div className="form-group">
                                        <label htmlFor="destination">Destination</label>
                                        <input
                                            id="destination"
                                            type="text"
                                            className="input"
                                            value={destination}
                                            onChange={(e) => setDestination(e.target.value)}
                                            placeholder="e.g., Goa, India"
                                        />
                                    </div>
                                )}

                                <div className="form-row">
                                    <div className="form-group">
                                        <label htmlFor="startDate">Start Date *</label>
                                        <input
                                            id="startDate"
                                            type="date"
                                            className="input"
                                            value={startDate}
                                            onChange={(e) => setStartDate(e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="endDate">End Date *</label>
                                        <input
                                            id="endDate"
                                            type="date"
                                            className="input"
                                            value={endDate}
                                            onChange={(e) => setEndDate(e.target.value)}
                                            min={startDate}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label htmlFor="budget">Budget</label>
                                        <input
                                            id="budget"
                                            type="number"
                                            className="input"
                                            value={budget}
                                            onChange={(e) => setBudget(e.target.value)}
                                            placeholder="0"
                                            min="0"
                                            step="0.01"
                                        />
                                    </div>
                                    {type === 'trip' && (
                                        <div className="form-group">
                                            <label htmlFor="holidaysUsed">Holidays Used</label>
                                            <input
                                                id="holidaysUsed"
                                                type="number"
                                                className="input"
                                                value={holidaysUsed}
                                                onChange={(e) => setHolidaysUsed(e.target.value)}
                                                min="0"
                                            />
                                        </div>
                                    )}
                                </div>

                                <div className="form-actions">
                                    <button type="button" className="btn btn-secondary" onClick={resetForm}>
                                        Cancel
                                    </button>
                                    <button type="submit" className="btn btn-primary">
                                        {editingPlan ? 'Update Plan' : 'Create Plan'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {/* Plans List */}
                    <div className="plans-list">
                        {filteredPlans.length === 0 ? (
                            <div className="empty-state">
                                <MapPin size={48} />
                                <p>No plans found</p>
                                <p className="text-secondary text-sm">Create your first plan to get started</p>
                            </div>
                        ) : (
                            <>
                                {activePlans.length > 0 && (
                                    <div className="plan-section">
                                        <h3 className="section-title">Active Plans ({activePlans.length})</h3>
                                        {activePlans.map((plan) => {
                                            const typeConfig = getTypeConfig(plan.type);
                                            const Icon = typeConfig.icon;
                                            const duration = calculateDuration(plan.startDate, plan.endDate);
                                            const budgetUsed = plan.budget > 0 ? (plan.spent / plan.budget) * 100 : 0;

                                            return (
                                                <div key={plan.id} className="plan-card">
                                                    <div className="plan-icon" style={{ backgroundColor: typeConfig.color }}>
                                                        <Icon size={24} color="white" />
                                                    </div>
                                                    <div className="plan-content">
                                                        <div className="plan-header">
                                                            <div>
                                                                <h4>{plan.title}</h4>
                                                                {plan.destination && (
                                                                    <p className="plan-destination">
                                                                        <MapPin size={14} />
                                                                        {plan.destination}
                                                                    </p>
                                                                )}
                                                            </div>
                                                            <div className="plan-actions">
                                                                <button className="btn-icon" onClick={() => handleEdit(plan)}>
                                                                    <Edit2 size={16} />
                                                                </button>
                                                                <button className="btn-icon" onClick={() => handleDelete(plan.id!)}>
                                                                    <Trash2 size={16} />
                                                                </button>
                                                            </div>
                                                        </div>
                                                        {plan.description && <p className="plan-description">{plan.description}</p>}
                                                        <div className="plan-meta">
                                                            <span className="meta-item">
                                                                <Calendar size={14} />
                                                                {formatDate(plan.startDate)} - {formatDate(plan.endDate)} ({duration} days)
                                                            </span>
                                                            {plan.budget > 0 && (
                                                                <span className="meta-item">
                                                                    <DollarSign size={14} />
                                                                    {formatCurrency(plan.spent, plan.currency)} / {formatCurrency(plan.budget, plan.currency)}
                                                                </span>
                                                            )}
                                                            {plan.type === 'trip' && plan.holidaysUsed > 0 && (
                                                                <span className="meta-item">
                                                                    🏖️ {plan.holidaysUsed} days
                                                                </span>
                                                            )}
                                                        </div>
                                                        {plan.budget > 0 && (
                                                            <div className="budget-progress">
                                                                <div className="progress-bar">
                                                                    <div
                                                                        className="progress-fill"
                                                                        style={{
                                                                            width: `${Math.min(budgetUsed, 100)}%`,
                                                                            backgroundColor: budgetUsed > 100 ? '#ef4444' : '#10b981'
                                                                        }}
                                                                    />
                                                                </div>
                                                                <span className="progress-text">{budgetUsed.toFixed(0)}% used</span>
                                                            </div>
                                                        )}
                                                        <div className="plan-status">
                                                            <span className={`status-badge ${plan.status}`}>{plan.status}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}

                                {completedPlans.length > 0 && (
                                    <div className="plan-section">
                                        <h3 className="section-title">Completed Plans ({completedPlans.length})</h3>
                                        {completedPlans.map((plan) => {
                                            const typeConfig = getTypeConfig(plan.type);
                                            const Icon = typeConfig.icon;

                                            return (
                                                <div key={plan.id} className="plan-card completed">
                                                    <div className="plan-icon" style={{ backgroundColor: typeConfig.color }}>
                                                        <Icon size={24} color="white" />
                                                    </div>
                                                    <div className="plan-content">
                                                        <div className="plan-header">
                                                            <div>
                                                                <h4>{plan.title}</h4>
                                                                {plan.destination && (
                                                                    <p className="plan-destination">
                                                                        <MapPin size={14} />
                                                                        {plan.destination}
                                                                    </p>
                                                                )}
                                                            </div>
                                                            <div className="plan-actions">
                                                                <button className="btn-icon" onClick={() => handleDelete(plan.id!)}>
                                                                    <Trash2 size={16} />
                                                                </button>
                                                            </div>
                                                        </div>
                                                        <div className="plan-meta">
                                                            <span className="meta-item">
                                                                <Calendar size={14} />
                                                                {formatDate(plan.startDate)} - {formatDate(plan.endDate)}
                                                            </span>
                                                            {plan.budget > 0 && (
                                                                <span className="meta-item">
                                                                    <DollarSign size={14} />
                                                                    Spent: {formatCurrency(plan.spent, plan.currency)}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="plan-status">
                                                            <span className="status-badge completed">✓ Completed</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            )}

            <ConfirmDialog
                isOpen={deleteConfirm.isOpen}
                title="Delete Plan"
                message="Are you sure you want to delete this plan? This action cannot be undone."
                confirmText="Delete"
                cancelText="Cancel"
                variant="danger"
                onConfirm={confirmDelete}
                onCancel={cancelDelete}
            />
        </div>
    );
};

export default Plans;
