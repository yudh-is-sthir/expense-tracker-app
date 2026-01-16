import { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Plus, CheckCircle2, Circle, Clock, AlertCircle, Edit2, Trash2, Calendar } from 'lucide-react';
import { type Task } from '../db/database';
import { formatDate } from '../utils/helpers';
import ConfirmDialog from '../components/ConfirmDialog';
import './Tasks.css';

const Tasks: React.FC = () => {
    const { tasks, addTask, updateTask, deleteTask, toggleTaskStatus } = useApp();
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingTask, setEditingTask] = useState<Task | null>(null);
    const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'completed'>('all');
    const [filterPriority, setFilterPriority] = useState<'all' | 'high' | 'medium' | 'low'>('all');
    const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; taskId: number | null }>({ isOpen: false, taskId: null });

    // Form state
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState<Task['category']>('personal');
    const [priority, setPriority] = useState<Task['priority']>('medium');
    const [dueDate, setDueDate] = useState('');

    const categories = [
        { value: 'work', label: 'Work', icon: '💼', color: '#3b82f6' },
        { value: 'personal', label: 'Personal', icon: '👤', color: '#8b5cf6' },
        { value: 'health', label: 'Health', icon: '❤️', color: '#ef4444' },
        { value: 'shopping', label: 'Shopping', icon: '🛒', color: '#10b981' },
        { value: 'finance', label: 'Finance', icon: '💰', color: '#f59e0b' },
        { value: 'other', label: 'Other', icon: '📌', color: '#6b7280' },
    ];

    const priorities = [
        { value: 'high', label: 'High', color: '#ef4444' },
        { value: 'medium', label: 'Medium', color: '#f59e0b' },
        { value: 'low', label: 'Low', color: '#10b981' },
    ];

    // Filter tasks
    const filteredTasks = useMemo(() => {
        return tasks.filter(task => {
            const statusMatch = filterStatus === 'all' || task.status === filterStatus;
            const priorityMatch = filterPriority === 'all' || task.priority === filterPriority;
            return statusMatch && priorityMatch;
        });
    }, [tasks, filterStatus, filterPriority]);

    // Group tasks
    const pendingTasks = filteredTasks.filter(t => t.status !== 'completed');
    const completedTasks = filteredTasks.filter(t => t.status === 'completed');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) return;

        const taskData = {
            title: title.trim(),
            description: description.trim(),
            category,
            priority,
            status: 'pending' as const,
            dueDate: dueDate ? new Date(dueDate) : undefined,
            tags: [],
        };

        try {
            if (editingTask?.id) {
                await updateTask(editingTask.id, taskData);
            } else {
                await addTask(taskData);
            }
            resetForm();
        } catch (error) {
            console.error('Failed to save task:', error);
            alert(error instanceof Error ? error.message : 'Failed to save task');
        }
    };

    const resetForm = () => {
        setTitle('');
        setDescription('');
        setCategory('personal');
        setPriority('medium');
        setDueDate('');
        setEditingTask(null);
        setIsFormOpen(false);
    };

    const handleEdit = (task: Task) => {
        setEditingTask(task);
        setTitle(task.title);
        setDescription(task.description);
        setCategory(task.category);
        setPriority(task.priority);
        setDueDate(task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '');
        setIsFormOpen(true);
    };

    const handleDelete = (id: number) => {
        setDeleteConfirm({ isOpen: true, taskId: id });
    };

    const confirmDelete = async () => {
        if (deleteConfirm.taskId) {
            try {
                await deleteTask(deleteConfirm.taskId);
                setDeleteConfirm({ isOpen: false, taskId: null });
            } catch (error) {
                alert(error instanceof Error ? error.message : 'Failed to delete task');
                setDeleteConfirm({ isOpen: false, taskId: null });
            }
        }
    };

    const cancelDelete = () => {
        setDeleteConfirm({ isOpen: false, taskId: null });
    };

    const handleToggleStatus = async (id: number) => {
        try {
            await toggleTaskStatus(id);
        } catch (error) {
            console.error('Failed to toggle task status:', error);
        }
    };

    const getCategoryConfig = (cat: Task['category']) => {
        return categories.find(c => c.value === cat) || categories[categories.length - 1];
    };

    const getPriorityConfig = (pri: Task['priority']) => {
        return priorities.find(p => p.value === pri) || priorities[1];
    };

    const isOverdue = (task: Task) => {
        if (!task.dueDate || task.status === 'completed') return false;
        return new Date(task.dueDate) < new Date();
    };

    return (
        <div className="tasks-container">
            <header className="tasks-header">
                <div>
                    <h1 className="gradient-text">Tasks</h1>
                    <p className="text-secondary">Manage your daily tasks</p>
                </div>
                <button className="btn btn-primary btn-sm" onClick={() => setIsFormOpen(true)}>
                    <Plus size={18} />
                    Add Task
                </button>
            </header>

            {/* Stats Cards */}
            <div className="task-stats">
                <div className="stat-card">
                    <div className="stat-icon pending">
                        <Clock size={20} />
                    </div>
                    <div className="stat-content">
                        <span className="stat-label">Pending</span>
                        <span className="stat-value">{pendingTasks.length}</span>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon completed">
                        <CheckCircle2 size={20} />
                    </div>
                    <div className="stat-content">
                        <span className="stat-label">Completed</span>
                        <span className="stat-value">{completedTasks.length}</span>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="task-filters">
                <div className="filter-group">
                    <button
                        className={`filter-btn ${filterStatus === 'all' ? 'active' : ''}`}
                        onClick={() => setFilterStatus('all')}
                    >
                        All
                    </button>
                    <button
                        className={`filter-btn ${filterStatus === 'pending' ? 'active' : ''}`}
                        onClick={() => setFilterStatus('pending')}
                    >
                        Pending
                    </button>
                    <button
                        className={`filter-btn ${filterStatus === 'completed' ? 'active' : ''}`}
                        onClick={() => setFilterStatus('completed')}
                    >
                        Completed
                    </button>
                </div>
                <div className="filter-group">
                    <button
                        className={`filter-btn priority ${filterPriority === 'all' ? 'active' : ''}`}
                        onClick={() => setFilterPriority('all')}
                    >
                        All Priority
                    </button>
                    <button
                        className={`filter-btn priority high ${filterPriority === 'high' ? 'active' : ''}`}
                        onClick={() => setFilterPriority('high')}
                    >
                        High
                    </button>
                    <button
                        className={`filter-btn priority medium ${filterPriority === 'medium' ? 'active' : ''}`}
                        onClick={() => setFilterPriority('medium')}
                    >
                        Medium
                    </button>
                    <button
                        className={`filter-btn priority low ${filterPriority === 'low' ? 'active' : ''}`}
                        onClick={() => setFilterPriority('low')}
                    >
                        Low
                    </button>
                </div>
            </div>

            {/* Task Form */}
            {isFormOpen && (
                <div className="task-form-card card">
                    <h3>{editingTask ? 'Edit Task' : 'Create Task'}</h3>
                    <form onSubmit={handleSubmit} className="task-form">
                        <div className="form-group">
                            <label htmlFor="title">Task Title *</label>
                            <input
                                id="title"
                                type="text"
                                className="input"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="e.g., Buy groceries"
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
                                placeholder="Add details about this task..."
                                rows={3}
                            />
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>Category</label>
                                <div className="category-grid">
                                    {categories.map((cat) => (
                                        <button
                                            key={cat.value}
                                            type="button"
                                            className={`category-btn ${category === cat.value ? 'active' : ''}`}
                                            onClick={() => setCategory(cat.value as Task['category'])}
                                            style={{ '--category-color': cat.color } as React.CSSProperties}
                                        >
                                            <span className="category-icon">{cat.icon}</span>
                                            <span className="category-label">{cat.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>Priority</label>
                                <div className="priority-buttons">
                                    {priorities.map((pri) => (
                                        <button
                                            key={pri.value}
                                            type="button"
                                            className={`priority-btn ${priority === pri.value ? 'active' : ''}`}
                                            onClick={() => setPriority(pri.value as Task['priority'])}
                                            style={{ '--priority-color': pri.color } as React.CSSProperties}
                                        >
                                            {pri.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="form-group">
                                <label htmlFor="dueDate">Due Date</label>
                                <input
                                    id="dueDate"
                                    type="date"
                                    className="input"
                                    value={dueDate}
                                    onChange={(e) => setDueDate(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="form-actions">
                            <button type="button" className="btn btn-secondary" onClick={resetForm}>
                                Cancel
                            </button>
                            <button type="submit" className="btn btn-primary">
                                {editingTask ? 'Update Task' : 'Create Task'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Task List */}
            <div className="tasks-list">
                {filteredTasks.length === 0 ? (
                    <div className="empty-state">
                        <CheckCircle2 size={48} />
                        <p>No tasks found</p>
                        <p className="text-secondary text-sm">Create your first task to get started</p>
                    </div>
                ) : (
                    <>
                        {pendingTasks.length > 0 && (
                            <div className="task-section">
                                <h3 className="section-title">Pending Tasks ({pendingTasks.length})</h3>
                                {pendingTasks.map((task) => {
                                    const categoryConfig = getCategoryConfig(task.category);
                                    const priorityConfig = getPriorityConfig(task.priority);
                                    const overdue = isOverdue(task);

                                    return (
                                        <div key={task.id} className={`task-card ${overdue ? 'overdue' : ''}`}>
                                            <div className="task-checkbox">
                                                <button
                                                    className="checkbox-btn"
                                                    onClick={() => handleToggleStatus(task.id!)}
                                                    aria-label="Mark as complete"
                                                >
                                                    <Circle size={24} />
                                                </button>
                                            </div>
                                            <div className="task-content">
                                                <div className="task-header">
                                                    <h4>{task.title}</h4>
                                                    <div className="task-actions">
                                                        <button className="btn-icon" onClick={() => handleEdit(task)}>
                                                            <Edit2 size={16} />
                                                        </button>
                                                        <button className="btn-icon" onClick={() => handleDelete(task.id!)}>
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                </div>
                                                {task.description && <p className="task-description">{task.description}</p>}
                                                <div className="task-meta">
                                                    <span className="task-category" style={{ backgroundColor: categoryConfig.color }}>
                                                        {categoryConfig.icon} {categoryConfig.label}
                                                    </span>
                                                    <span className="task-priority" style={{ color: priorityConfig.color }}>
                                                        {priorityConfig.label}
                                                    </span>
                                                    {task.dueDate && (
                                                        <span className={`task-due ${overdue ? 'overdue' : ''}`}>
                                                            {overdue && <AlertCircle size={14} />}
                                                            <Calendar size={14} />
                                                            {formatDate(task.dueDate)}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {completedTasks.length > 0 && (
                            <div className="task-section">
                                <h3 className="section-title">Completed Tasks ({completedTasks.length})</h3>
                                {completedTasks.map((task) => {
                                    const categoryConfig = getCategoryConfig(task.category);

                                    return (
                                        <div key={task.id} className="task-card completed">
                                            <div className="task-checkbox">
                                                <button
                                                    className="checkbox-btn checked"
                                                    onClick={() => handleToggleStatus(task.id!)}
                                                    aria-label="Mark as pending"
                                                >
                                                    <CheckCircle2 size={24} />
                                                </button>
                                            </div>
                                            <div className="task-content">
                                                <div className="task-header">
                                                    <h4>{task.title}</h4>
                                                    <div className="task-actions">
                                                        <button className="btn-icon" onClick={() => handleDelete(task.id!)}>
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                </div>
                                                {task.description && <p className="task-description">{task.description}</p>}
                                                <div className="task-meta">
                                                    <span className="task-category" style={{ backgroundColor: categoryConfig.color }}>
                                                        {categoryConfig.icon} {categoryConfig.label}
                                                    </span>
                                                    {task.completedAt && (
                                                        <span className="task-completed-at text-sm">
                                                            Completed {formatDate(task.completedAt)}
                                                        </span>
                                                    )}
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

            <ConfirmDialog
                isOpen={deleteConfirm.isOpen}
                title="Delete Task"
                message="Are you sure you want to delete this task? This action cannot be undone."
                confirmText="Delete"
                cancelText="Cancel"
                variant="danger"
                onConfirm={confirmDelete}
                onCancel={cancelDelete}
            />
        </div>
    );
};

export default Tasks;
