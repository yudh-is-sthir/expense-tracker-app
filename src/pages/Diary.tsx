import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Plus, Edit2, Trash2, Calendar, Smile, Meh, Frown, Angry, AlertCircle } from 'lucide-react';
import { type DiaryEntry } from '../db/database';
import { formatDate } from '../utils/helpers';
import ConfirmDialog from '../components/ConfirmDialog';
import './Diary.css';

const Diary: React.FC = () => {
    const { diaryEntries, addDiaryEntry, updateDiaryEntry, deleteDiaryEntry } = useApp();
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingEntry, setEditingEntry] = useState<DiaryEntry | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; entryId: number | null }>({ isOpen: false, entryId: null });

    // Form state
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [mood, setMood] = useState<DiaryEntry['mood']>('okay');
    const [tags, setTags] = useState('');

    const moodOptions = [
        { value: 'great', label: 'Great', icon: Smile, color: '#10b981' },
        { value: 'good', label: 'Good', icon: Smile, color: '#3b82f6' },
        { value: 'okay', label: 'Okay', icon: Meh, color: '#6b7280' },
        { value: 'bad', label: 'Bad', icon: Frown, color: '#f59e0b' },
        { value: 'terrible', label: 'Terrible', icon: Angry, color: '#ef4444' },
    ];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim() || !content.trim()) return;

        const entryData = {
            date: new Date(date),
            title: title.trim(),
            content: content.trim(),
            mood,
            tags: tags.split(',').map(t => t.trim()).filter(Boolean),
        };

        try {
            if (editingEntry?.id) {
                await updateDiaryEntry(editingEntry.id, entryData);
            } else {
                await addDiaryEntry(entryData);
            }
            resetForm();
        } catch (error) {
            console.error('Failed to save entry:', error);
            alert(error instanceof Error ? error.message : 'Failed to save entry');
        }
    };

    const resetForm = () => {
        setDate(new Date().toISOString().split('T')[0]);
        setTitle('');
        setContent('');
        setMood('okay');
        setTags('');
        setEditingEntry(null);
        setIsFormOpen(false);
    };

    const handleEdit = (entry: DiaryEntry) => {
        setEditingEntry(entry);
        setDate(new Date(entry.date).toISOString().split('T')[0]);
        setTitle(entry.title);
        setContent(entry.content);
        setMood(entry.mood);
        setTags(entry.tags.join(', '));
        setIsFormOpen(true);
    };

    const handleDelete = (id: number) => {
        setDeleteConfirm({ isOpen: true, entryId: id });
    };

    const confirmDelete = async () => {
        if (deleteConfirm.entryId) {
            try {
                await deleteDiaryEntry(deleteConfirm.entryId);
                setDeleteConfirm({ isOpen: false, entryId: null });
            } catch (error) {
                alert(error instanceof Error ? error.message : 'Failed to delete entry');
                setDeleteConfirm({ isOpen: false, entryId: null });
            }
        }
    };

    const cancelDelete = () => {
        setDeleteConfirm({ isOpen: false, entryId: null });
    };

    const getMoodConfig = (entryMood: DiaryEntry['mood']) => {
        return moodOptions.find(m => m.value === entryMood) || moodOptions[2];
    };

    return (
        <div className="diary-container">
            <header className="diary-header">
                <div>
                    <h1 className="gradient-text">Personal Diary</h1>
                    <p className="text-secondary">Your daily journal and thoughts</p>
                </div>
                <button className="btn btn-primary btn-sm" onClick={() => setIsFormOpen(true)}>
                    <Plus size={18} />
                    New Entry
                </button>
            </header>

            {/* Entry Form */}
            {isFormOpen && (
                <div className="diary-form-card card">
                    <h3>{editingEntry ? 'Edit Entry' : 'New Entry'}</h3>
                    <form onSubmit={handleSubmit} className="diary-form">
                        <div className="form-row">
                            <div className="form-group">
                                <label htmlFor="date">Date *</label>
                                <input
                                    id="date"
                                    type="date"
                                    className="input"
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label htmlFor="title">Title *</label>
                            <input
                                id="title"
                                type="text"
                                className="input"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="e.g., A wonderful day"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>Mood</label>
                            <div className="mood-grid">
                                {moodOptions.map((moodOption) => {
                                    const Icon = moodOption.icon;
                                    return (
                                        <button
                                            key={moodOption.value}
                                            type="button"
                                            className={`mood-btn ${mood === moodOption.value ? 'active' : ''}`}
                                            onClick={() => setMood(moodOption.value as DiaryEntry['mood'])}
                                            style={{ '--mood-color': moodOption.color } as React.CSSProperties}
                                        >
                                            <Icon size={20} />
                                            <span>{moodOption.label}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="form-group">
                            <label htmlFor="content">Content *</label>
                            <textarea
                                id="content"
                                className="textarea"
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                placeholder="Write your thoughts..."
                                rows={6}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="tags">Tags (comma-separated)</label>
                            <input
                                id="tags"
                                type="text"
                                className="input"
                                value={tags}
                                onChange={(e) => setTags(e.target.value)}
                                placeholder="e.g., work, family, travel"
                            />
                        </div>

                        <div className="form-actions">
                            <button type="button" className="btn btn-secondary" onClick={resetForm}>
                                Cancel
                            </button>
                            <button type="submit" className="btn btn-primary">
                                {editingEntry ? 'Update Entry' : 'Save Entry'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Entries List */}
            <div className="diary-entries">
                {diaryEntries.length === 0 ? (
                    <div className="empty-state">
                        <AlertCircle size={48} />
                        <p>No diary entries yet</p>
                        <p className="text-secondary text-sm">Start journaling your thoughts and feelings</p>
                    </div>
                ) : (
                    diaryEntries.map((entry) => {
                        const moodConfig = getMoodConfig(entry.mood);
                        const MoodIcon = moodConfig.icon;

                        return (
                            <div key={entry.id} className="diary-entry-card">
                                <div className="entry-header">
                                    <div className="entry-date">
                                        <Calendar size={16} />
                                        <span>{formatDate(entry.date)}</span>
                                    </div>
                                    <div className="entry-actions">
                                        <button className="btn-icon" onClick={() => handleEdit(entry)}>
                                            <Edit2 size={16} />
                                        </button>
                                        <button className="btn-icon" onClick={() => handleDelete(entry.id!)}>
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>

                                <div className="entry-mood" style={{ color: moodConfig.color }}>
                                    <MoodIcon size={20} />
                                    <span>{moodConfig.label}</span>
                                </div>

                                <h3 className="entry-title">{entry.title}</h3>
                                <p className="entry-content">{entry.content}</p>

                                {entry.tags.length > 0 && (
                                    <div className="entry-tags">
                                        {entry.tags.map((tag, index) => (
                                            <span key={index} className="tag">{tag}</span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
            </div>

            <ConfirmDialog
                isOpen={deleteConfirm.isOpen}
                title="Delete Entry"
                message="Are you sure you want to delete this diary entry? This action cannot be undone."
                confirmText="Delete"
                cancelText="Cancel"
                variant="danger"
                onConfirm={confirmDelete}
                onCancel={cancelDelete}
            />
        </div>
    );
};

export default Diary;
