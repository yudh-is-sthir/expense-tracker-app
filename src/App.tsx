import { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import BottomNav from './components/BottomNav';
import TransactionModal from './components/TransactionModal';
import VoiceCommand from './components/VoiceCommand';
import Home from './pages/Home';
import Tasks from './pages/Tasks';
import Plans from './pages/Plans';
import More from './pages/More';
import Settings from './pages/Settings';
import Diary from './pages/Diary';
import './App.css';

function AppContent() {
  const [activeTab, setActiveTab] = useState('home');
  const [activePage, setActivePage] = useState('home');
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isVoiceOpen, setIsVoiceOpen] = useState(false);
  const [editingTransactionId, setEditingTransactionId] = useState<number | null>(null);
  const { transactions, isLoading } = useApp();

  const handleEditTransaction = (id: number) => {
    setEditingTransactionId(id);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingTransactionId(null);
  };

  const handleTabChange = (tab: string) => {
    if (tab === 'more') {
      setIsMoreOpen(prev => !prev);
    } else {
      setActiveTab(tab);
      setActivePage(tab);
      setIsMoreOpen(false);
    }
  };

  const handleMoreNavigation = (page: string) => {
    if (page === 'voice') {
      setIsVoiceOpen(true);
      setIsMoreOpen(false);
    } else {
      setActivePage(page);
      setActiveTab('more');
    }
  };

  const handleMoreClose = () => {
    setIsMoreOpen(false);
  };

  const editingTransaction = editingTransactionId
    ? transactions.find(t => t.id === editingTransactionId)
    : undefined;

  if (isLoading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <h2 className="gradient-text">Expense Tracker</h2>
        <p className="text-secondary">Loading your data...</p>
      </div>
    );
  }

  return (
    <div className="app">
      <main className="app-main">
        {activePage === 'home' && <Home onEditTransaction={handleEditTransaction} />}
        {activePage === 'tasks' && <Tasks />}
        {activePage === 'plans' && <Plans />}
        {activePage === 'diary' && <Diary />}
        {activePage === 'settings' && <Settings />}
      </main>

      <BottomNav
        activeTab={activeTab}
        onTabChange={handleTabChange}
        onAddClick={() => setIsModalOpen(true)}
      />

      <More
        isOpen={isMoreOpen}
        onClose={handleMoreClose}
        onNavigate={handleMoreNavigation}
      />

      <TransactionModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        transaction={editingTransaction}
      />

      <VoiceCommand
        isOpen={isVoiceOpen}
        onClose={() => setIsVoiceOpen(false)}
      />
    </div>
  );
}

function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default App;
