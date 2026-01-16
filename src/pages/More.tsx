import { Settings, BookOpen, BarChart3, Mic } from 'lucide-react';
import './More.css';

interface MoreProps {
    isOpen: boolean;
    onClose: () => void;
    onNavigate: (page: string) => void;
}

const More: React.FC<MoreProps> = ({ isOpen, onClose, onNavigate }) => {
    const menuItems = [
        {
            id: 'settings',
            icon: Settings,
            label: 'Settings',
            available: true,
            color: '#6b7280',
        },
        {
            id: 'diary',
            icon: BookOpen,
            label: 'Diary',
            available: true,
            color: '#8b5cf6',
        },
        {
            id: 'analytics',
            icon: BarChart3,
            label: 'Analytics',
            available: false,
            color: '#3b82f6',
        },
        {
            id: 'voice',
            icon: Mic,
            label: 'Quick Add',
            available: true,
            color: '#10b981',
        },
    ];

    const handleItemClick = (item: typeof menuItems[0]) => {
        if (item.available) {
            onNavigate(item.id);
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <>
            {/* Backdrop */}
            <div className="more-backdrop" onClick={onClose} />

            {/* Compact Floating Grid */}
            <div className="more-speed-dial">
                {menuItems.map((item, index) => {
                    const Icon = item.icon;
                    return (
                        <button
                            key={item.id}
                            className={`speed-dial-item ${!item.available ? 'disabled' : ''}`}
                            onClick={() => handleItemClick(item)}
                            disabled={!item.available}
                            style={{
                                animationDelay: `${index * 50}ms`,
                                '--item-color': item.color
                            } as React.CSSProperties}
                        >
                            <div className="speed-dial-icon">
                                <Icon size={24} />
                                {!item.available && <span className="coming-soon-badge">Soon</span>}
                            </div>
                            <span className="speed-dial-label">{item.label}</span>
                        </button>
                    );
                })}
            </div>
        </>
    );
};

export default More;
