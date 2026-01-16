import { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Loader, CheckCircle, XCircle, Keyboard } from 'lucide-react';
import { useApp } from '../context/AppContext';
import './VoiceCommand.css';

interface VoiceCommandProps {
    isOpen: boolean;
    onClose: () => void;
}

interface ParsedCommand {
    type: 'task' | 'expense' | 'income' | 'diary' | 'budget' | 'unknown';
    data: any;
    confidence: number;
}

const VoiceCommand: React.FC<VoiceCommandProps> = ({ isOpen, onClose }) => {
    const { addTask, addTransaction, addDiaryEntry, addBudget, categories } = useApp();
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [manualInput, setManualInput] = useState('');
    const [inputMode, setInputMode] = useState<'voice' | 'text'>('voice');
    const [status, setStatus] = useState<'idle' | 'listening' | 'processing' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');
    const recognitionRef = useRef<any>(null);

    const transcriptRef = useRef('');

    useEffect(() => {
        // Initialize Speech Recognition
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

        if (SpeechRecognition) {
            const recognition = new SpeechRecognition();
            recognition.continuous = false;
            recognition.interimResults = true;
            recognition.lang = 'en-US';

            recognition.onstart = () => {
                setIsListening(true);
                setStatus('listening');
                setMessage('Listening...');
                transcriptRef.current = '';
            };

            recognition.onresult = (event: any) => {
                const current = event.resultIndex;
                const transcriptText = event.results[current][0].transcript;
                transcriptRef.current = transcriptText;
                setTranscript(transcriptText);
            };

            recognition.onend = () => {
                setIsListening(false);
                const finalTranscript = transcriptRef.current;
                if (finalTranscript && finalTranscript.trim()) {
                    processCommand(finalTranscript);
                } else if (status === 'listening') {
                    setStatus('idle');
                    setMessage('No speech detected. Try typing instead!');
                    setInputMode('text');
                }
            };

            recognition.onerror = (event: any) => {
                setIsListening(false);
                if (event.error === 'no-speech') {
                    setStatus('idle');
                    setMessage('No speech detected. Try typing instead!');
                    setInputMode('text');
                } else if (event.error === 'not-allowed') {
                    setStatus('error');
                    setMessage('Microphone access denied. Please enable microphone permissions.');
                } else {
                    setStatus('error');
                    setMessage(`Error: ${event.error}. Try typing instead!`);
                    setInputMode('text');
                }
            };

            recognitionRef.current = recognition;
        } else {
            setStatus('error');
            setMessage('Speech recognition not supported. Use text mode instead.');
            setInputMode('text');
        }

        return () => {
            if (recognitionRef.current) {
                try {
                    recognitionRef.current.stop();
                } catch (e) {
                    // Ignore errors on cleanup
                }
            }
        };
    }, []); // Empty dependency array - only initialize once

    const startListening = () => {
        setTranscript('');
        transcriptRef.current = '';
        setMessage('Starting...');

        if (recognitionRef.current) {
            try {
                // Set listening state BEFORE starting recognition
                setIsListening(true);
                setStatus('listening');
                setMessage('Listening...');
                recognitionRef.current.start();
            } catch (e: any) {
                setIsListening(false);
                setStatus('error');
                setMessage('Failed to start voice recognition. Try text mode instead.');
                setInputMode('text');
                console.error('Speech recognition error:', e);
            }
        } else {
            setStatus('error');
            setMessage('Voice recognition not available. Use text mode instead.');
            setInputMode('text');
        }
    };

    const stopListening = () => {
        if (recognitionRef.current) {
            try {
                recognitionRef.current.stop();
            } catch (e) {
                // Ignore errors
            }
        }
    };

    const parseCommand = (text: string): ParsedCommand => {
        const lowerText = text.toLowerCase();

        // Task patterns
        if (lowerText.includes('task') || lowerText.includes('todo') || lowerText.includes('to do')) {
            return parseTaskCommand(text);
        }

        // Expense patterns
        if (lowerText.includes('spent') || lowerText.includes('paid') || lowerText.includes('expense')) {
            return parseExpenseCommand(text);
        }

        // Income patterns
        if (lowerText.includes('received') || lowerText.includes('earned') || lowerText.includes('income') || lowerText.includes('salary')) {
            return parseIncomeCommand(text);
        }

        // Diary patterns
        if (lowerText.includes('feel') || lowerText.includes('diary') || lowerText.includes('journal') || lowerText.includes('today was')) {
            return parseDiaryCommand(text);
        }

        // Budget patterns
        if (lowerText.includes('budget') || lowerText.includes('set budget')) {
            return parseBudgetCommand(text);
        }

        return { type: 'unknown', data: null, confidence: 0 };
    };

    const parseTaskCommand = (text: string): ParsedCommand => {
        const lowerText = text.toLowerCase();

        // Extract task description
        let description = text;
        const taskMatch = text.match(/task is to (.+?)(?:\s+with|\s+deadline|\s+priority|$)/i);
        if (taskMatch) {
            description = taskMatch[1].trim();
        }

        // Extract priority
        let priority: 'low' | 'medium' | 'high' = 'medium';
        if (lowerText.includes('high priority') || lowerText.includes('urgent')) {
            priority = 'high';
        } else if (lowerText.includes('low priority')) {
            priority = 'low';
        }

        // Extract deadline
        let dueDate: Date | undefined;
        const today = new Date();
        if (lowerText.includes('today')) {
            dueDate = today;
        } else if (lowerText.includes('tomorrow')) {
            dueDate = new Date(today.setDate(today.getDate() + 1));
        } else if (lowerText.includes('next week')) {
            dueDate = new Date(today.setDate(today.getDate() + 7));
        }

        return {
            type: 'task',
            data: {
                title: description,
                description: '',
                priority,
                status: 'todo' as const,
                dueDate,
                category: 'work',
            },
            confidence: 0.9,
        };
    };

    const parseExpenseCommand = (text: string): ParsedCommand => {
        // Extract amount
        const amountMatch = text.match(/(\d+)\s*(?:rupees|rs|dollars|\$)/i);
        const amount = amountMatch ? parseFloat(amountMatch[1]) : 0;

        // Extract category
        let category = 'Other';
        const lowerText = text.toLowerCase();
        if (lowerText.includes('food') || lowerText.includes('lunch') || lowerText.includes('dinner')) {
            category = 'Food';
        } else if (lowerText.includes('transport') || lowerText.includes('uber') || lowerText.includes('taxi')) {
            category = 'Transportation';
        } else if (lowerText.includes('shopping') || lowerText.includes('clothes')) {
            category = 'Shopping';
        } else if (lowerText.includes('entertainment') || lowerText.includes('movie')) {
            category = 'Entertainment';
        }

        // Find category ID
        const categoryObj = categories.find(c => c.name === category && c.type === 'expense');
        const expenseCategory = categoryObj || categories.find(c => c.type === 'expense');

        return {
            type: 'expense',
            data: {
                type: 'expense' as const,
                amount,
                categoryId: expenseCategory?.id || 1,
                accountId: 1, // Default account
                description: text,
                date: new Date(),
                currency: 'INR',
            },
            confidence: amount > 0 ? 0.9 : 0.5,
        };
    };

    const parseIncomeCommand = (text: string): ParsedCommand => {
        const amountMatch = text.match(/(\d+)\s*(?:rupees|rs|dollars|\$)/i);
        const amount = amountMatch ? parseFloat(amountMatch[1]) : 0;

        let category = 'Salary';
        const lowerText = text.toLowerCase();
        if (lowerText.includes('freelance') || lowerText.includes('project')) {
            category = 'Freelance';
        } else if (lowerText.includes('investment') || lowerText.includes('dividend')) {
            category = 'Investments';
        }

        const categoryObj = categories.find(c => c.name === category && c.type === 'income');
        const incomeCategory = categoryObj || categories.find(c => c.type === 'income');

        return {
            type: 'income',
            data: {
                type: 'income' as const,
                amount,
                categoryId: incomeCategory?.id || 1,
                accountId: 1, // Default account
                description: text,
                date: new Date(),
                currency: 'INR',
            },
            confidence: amount > 0 ? 0.9 : 0.5,
        };
    };

    const parseDiaryCommand = (text: string): ParsedCommand => {
        const lowerText = text.toLowerCase();

        // Detect mood
        let mood: 'great' | 'good' | 'okay' | 'bad' | 'terrible' = 'okay';
        if (lowerText.includes('great') || lowerText.includes('amazing') || lowerText.includes('wonderful') || lowerText.includes('excellent')) {
            mood = 'great';
        } else if (lowerText.includes('good') || lowerText.includes('happy') || lowerText.includes('nice')) {
            mood = 'good';
        } else if (lowerText.includes('bad') || lowerText.includes('sad') || lowerText.includes('difficult')) {
            mood = 'bad';
        } else if (lowerText.includes('terrible') || lowerText.includes('awful') || lowerText.includes('horrible')) {
            mood = 'terrible';
        }

        // Generate title from first few words
        const words = text.split(' ').slice(0, 5).join(' ');
        const title = words.length > 30 ? words.substring(0, 30) + '...' : words;

        return {
            type: 'diary',
            data: {
                title,
                content: text,
                mood,
                date: new Date(),
                tags: [],
            },
            confidence: 0.8,
        };
    };

    const parseBudgetCommand = (text: string): ParsedCommand => {
        const amountMatch = text.match(/(\d+)\s*(?:rupees|rs|dollars|\$)/i);
        const amount = amountMatch ? parseFloat(amountMatch[1]) : 0;

        let category = 'Other';
        const lowerText = text.toLowerCase();
        if (lowerText.includes('food') || lowerText.includes('groceries')) {
            category = 'Food';
        } else if (lowerText.includes('transport')) {
            category = 'Transportation';
        } else if (lowerText.includes('entertainment')) {
            category = 'Entertainment';
        }

        const categoryObj = categories.find(c => c.name === category);

        return {
            type: 'budget',
            data: {
                categoryId: categoryObj?.id || categories[0]?.id,
                amount,
                period: 'monthly' as const,
                startDate: new Date(),
            },
            confidence: amount > 0 ? 0.8 : 0.4,
        };
    };

    const processCommand = async (text: string) => {
        setStatus('processing');
        setMessage('Processing command...');

        const parsed = parseCommand(text);

        if (parsed.type === 'unknown' || parsed.confidence < 0.5) {
            setStatus('error');
            setMessage('Could not understand the command. Please try again.');
            return;
        }

        try {
            switch (parsed.type) {
                case 'task':
                    await addTask(parsed.data);
                    setStatus('success');
                    setMessage('✅ Task created successfully!');
                    break;

                case 'expense':
                    await addTransaction(parsed.data);
                    setStatus('success');
                    setMessage(`✅ Expense of ₹${parsed.data.amount} recorded!`);
                    break;

                case 'income':
                    await addTransaction(parsed.data);
                    setStatus('success');
                    setMessage(`✅ Income of ₹${parsed.data.amount} recorded!`);
                    break;

                case 'diary':
                    await addDiaryEntry(parsed.data);
                    setStatus('success');
                    setMessage('✅ Diary entry saved!');
                    break;

                case 'budget':
                    await addBudget(parsed.data);
                    setStatus('success');
                    setMessage(`✅ Budget of ₹${parsed.data.amount} set!`);
                    break;
            }

            setTimeout(() => {
                onClose();
            }, 2000);
        } catch (error) {
            setStatus('error');
            setMessage('Failed to execute command. Please try again.');
        }
    };

    if (!isOpen) return null;

    const handleManualSubmit = () => {
        if (manualInput.trim()) {
            processCommand(manualInput);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleManualSubmit();
        }
    };

    return (
        <>
            <div className="voice-backdrop" onClick={onClose} />
            <div className="voice-modal">
                <div className="voice-header">
                    <h2>⚡ Quick Add</h2>
                    <button className="voice-close" onClick={onClose}>×</button>
                </div>

                <div className="voice-content">
                    {/* Mode Toggle */}
                    <div className="mode-toggle">
                        <button
                            className={`mode-btn ${inputMode === 'voice' ? 'active' : ''}`}
                            onClick={() => setInputMode('voice')}
                        >
                            <Mic size={18} />
                            Voice
                        </button>
                        <button
                            className={`mode-btn ${inputMode === 'text' ? 'active' : ''}`}
                            onClick={() => setInputMode('text')}
                        >
                            <Keyboard size={18} />
                            Text
                        </button>
                    </div>

                    {inputMode === 'voice' ? (
                        <>
                            <div className={`voice-visualizer ${isListening ? 'active' : ''}`}>
                                {status === 'listening' && <Mic size={48} className="pulse" />}
                                {status === 'processing' && <Loader size={48} className="spin" />}
                                {status === 'success' && <CheckCircle size={48} />}
                                {status === 'error' && <XCircle size={48} />}
                                {status === 'idle' && <Mic size={48} />}
                            </div>

                            <p className="voice-status">{message || 'Click the button to start'}</p>

                            {transcript && (
                                <div className="voice-transcript">
                                    <strong>You said:</strong>
                                    <p>"{transcript}"</p>
                                </div>
                            )}
                        </>
                    ) : (
                        <>
                            <div className="text-input-container">
                                <textarea
                                    className="text-input"
                                    value={manualInput}
                                    onChange={(e) => setManualInput(e.target.value)}
                                    onKeyPress={handleKeyPress}
                                    placeholder="Type your command here...&#10;&#10;Examples:&#10;• My task is to complete the report with high priority deadline tomorrow&#10;• Today I spent 100 rupees for food&#10;• I received 5000 rupees as salary&#10;• I feel great today, had a wonderful meeting&#10;• Set budget of 10000 rupees for groceries"
                                    rows={6}
                                />
                            </div>

                            {status === 'processing' && (
                                <div className="processing-indicator">
                                    <Loader size={24} className="spin" />
                                    <span>Processing...</span>
                                </div>
                            )}

                            {status === 'success' && (
                                <div className="success-indicator">
                                    <CheckCircle size={24} />
                                    <span>{message}</span>
                                </div>
                            )}

                            {status === 'error' && (
                                <div className="error-indicator">
                                    <XCircle size={24} />
                                    <span>{message}</span>
                                </div>
                            )}
                        </>
                    )}

                    <div className="voice-examples">
                        <h4>Supported commands:</h4>
                        <ul>
                            <li>📋 Tasks - "My task is to [description] with [priority] deadline [date]"</li>
                            <li>💰 Expenses - "Today I spent [amount] rupees for [category]"</li>
                            <li>💵 Income - "I received [amount] rupees as [source]"</li>
                            <li>📔 Diary - "I feel [mood] today, [your thoughts]"</li>
                            <li>📊 Budget - "Set budget of [amount] rupees for [category]"</li>
                        </ul>
                    </div>
                </div>

                <div className="voice-actions">
                    {inputMode === 'voice' ? (
                        <>
                            {!isListening && status !== 'processing' && (
                                <button className="btn btn-primary btn-lg" onClick={startListening}>
                                    <Mic size={20} />
                                    Start Listening
                                </button>
                            )}
                            {isListening && (
                                <button className="btn btn-danger btn-lg" onClick={stopListening}>
                                    <MicOff size={20} />
                                    Stop
                                </button>
                            )}
                        </>
                    ) : (
                        <button
                            className="btn btn-primary btn-lg"
                            onClick={handleManualSubmit}
                            disabled={!manualInput.trim() || status === 'processing'}
                        >
                            <Keyboard size={20} />
                            Submit Command
                        </button>
                    )}
                </div>
            </div>
        </>
    );
};

export default VoiceCommand;
