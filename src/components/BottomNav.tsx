import React from 'react';
import { Home, TrendingUp, Map, MoreHorizontal, Plus } from 'lucide-react';
import './BottomNav.css';

interface BottomNavProps {
    activeTab: string;
    onTabChange: (tab: string) => void;
    onAddClick: () => void;
}

const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onTabChange, onAddClick }) => {
    const navItems = [
        { id: 'home', icon: Home, label: 'Home' },
        { id: 'tasks', icon: TrendingUp, label: 'Tasks' },
        { id: 'plans', icon: Map, label: 'Plans' },
        { id: 'more', icon: MoreHorizontal, label: 'More' },
    ];

    return (
        <>
            <nav className="bottom-nav">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;

                    return (
                        <button
                            key={item.id}
                            className={`bottom-nav-item ${isActive ? 'active' : ''}`}
                            onClick={() => onTabChange(item.id)}
                            aria-label={item.label}
                        >
                            <Icon size={22} />
                            <span className="bottom-nav-label">{item.label}</span>
                        </button>
                    );
                })}
            </nav>

            <button
                className="bottom-nav-fab"
                onClick={onAddClick}
                aria-label="Add transaction"
            >
                <Plus size={24} />
            </button>
        </>
    );
};

export default BottomNav;
