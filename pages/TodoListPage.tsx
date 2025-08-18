import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import { onTodosSnapshot, addTodo, updateTodo, deleteTodo, updateSubtask } from '../services/firebaseService';
import { generateSubtasks } from '../services/geminiService';
import { Todo, Priority, Subtask, RecurringInterval } from '../types';
import { ClipboardDocumentCheckIcon, TrashIcon, SparklesIcon, DocumentPlusIcon, ChartBarIcon, CalendarIcon, ChevronDownIcon, ChevronRightIcon } from '../tools/Icons';
import Spinner from '../components/Spinner';
import Modal from '../components/Modal';
import { serverTimestamp } from 'firebase/firestore';

const priorityMap: { [key in Priority]: { color: string, name: string, value: number } } = {
    low: { color: 'bg-green-600', name: 'Low', value: 1 },
    medium: { color: 'bg-yellow-600', name: 'Medium', value: 2 },
    high: { color: 'bg-red-600', name: 'High', value: 3 },
};

const AddTaskModal: React.FC<{ isOpen: boolean; onClose: () => void; onAddTask: (data: any) => Promise<void>; }> = ({ isOpen, onClose, onAddTask }) => {
    const [inputValue, setInputValue] = useState('');
    const [priority, setPriority] = useState<Priority>('medium');
    const [dueDate, setDueDate] = useState('');
    const [tags, setTags] = useState('');
    const [recurring, setRecurring] = useState<RecurringInterval>('none');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (inputValue.trim() === '') return;
        const tagsArray = tags.split(',').map(t => t.trim()).filter(Boolean);
        onAddTask({ text: inputValue, priority, dueDate, tags: tagsArray, recurring });
        onClose();
        setInputValue('');
        setPriority('medium');
        setDueDate('');
        setTags('');
        setRecurring('none');
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Add New Task">
            <form onSubmit={handleSubmit} className="space-y-4">
                <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="Task description..."
                    className="w-full p-2 bg-primary border border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
                />
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="text-xs text-slate-400">Priority</label>
                        <select value={priority} onChange={(e) => setPriority(e.target.value as Priority)} className="w-full p-2 bg-primary border border-slate-600 rounded-md">
                            {Object.entries(priorityMap).map(([key, {name}]) => <option key={key} value={key}>{name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="text-xs text-slate-400">Due Date</label>
                        <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="w-full p-2 bg-primary border border-slate-600 rounded-md" />
                    </div>
                     <div>
                        <label className="text-xs text-slate-400">Tags (comma-separated)</label>
                        <input type="text" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="e.g. work, personal" className="w-full p-2 bg-primary border border-slate-600 rounded-md" />
                    </div>
                    <div>
                        <label className="text-xs text-slate-400">Recurring</label>
                        <select value={recurring} onChange={(e) => setRecurring(e.target.value as RecurringInterval)} className="w-full p-2 bg-primary border border-slate-600 rounded-md">
                            <option value="none">None</option>
                            <option value="daily">Daily</option>
                            <option value="weekly">Weekly</option>
                            <option value="monthly">Monthly</option>
                        </select>
                    </div>
                </div>
                <button type="submit" className="w-full px-4 py-2 bg-accent text-white rounded-md font-semibold btn-animated">
                    Add Task
                </button>
            </form>
        </Modal>
    );
};

const TodoItem: React.FC<{ todo: Todo; onToggle: (todo: Todo) => void; onDelete: (id: string) => void; onSubtaskToggle: (todoId: string, subtaskId: string, completed: boolean) => void; onBreakdown: (todo: Todo) => void; aiLoading: boolean; }> = ({ todo, onToggle, onDelete, onSubtaskToggle, onBreakdown, aiLoading }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    const timeRemaining = useMemo(() => {
        if (!todo.dueDate || todo.completed) return '';
        const today = new Date();
        today.setHours(0,0,0,0);
        const dueDate = new Date(todo.dueDate);
        dueDate.setHours(0,0,0,0);
        
        const diffTime = dueDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays < 0) return { text: `Overdue by ${Math.abs(diffDays)} day(s)`, color: 'text-red-400' };
        if (diffDays === 0) return { text: 'Due today', color: 'text-amber-400' };
        if (diffDays === 1) return { text: 'Due tomorrow', color: 'text-sky-400' };
        return { text: `Due in ${diffDays} days`, color: 'text-slate-400' };
    }, [todo.dueDate, todo.completed]);

    const subtaskProgress = useMemo(() => {
        if (todo.subtasks.length === 0) return 0;
        return (todo.subtasks.filter(s => s.completed).length / todo.subtasks.length) * 100;
    }, [todo.subtasks]);

    return (
        <div className="bg-secondary p-3 rounded-md group">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 cursor-pointer flex-grow" onClick={() => onToggle(todo)}>
                    <input type="checkbox" checked={todo.completed} readOnly className="h-5 w-5 rounded bg-primary border-slate-500 text-accent focus:ring-accent" />
                    <div className="flex-grow">
                        <span className={`text-light ${todo.completed ? 'line-through text-slate-500' : ''}`}>{todo.text}</span>
                        {timeRemaining && <p className={`text-xs ${timeRemaining.color}`}>{timeRemaining.text}</p>}
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {todo.subtasks.length > 0 && (
                        <button onClick={() => setIsExpanded(!isExpanded)} className="p-1 hover:bg-primary rounded-full"><ChevronDownIcon className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} /></button>
                    )}
                    <button onClick={() => onBreakdown(todo)} disabled={aiLoading} className="p-1 hover:bg-primary rounded-full text-slate-400 hover:text-accent disabled:opacity-50" title="AI Breakdown">
                        <SparklesIcon className="h-5 w-5"/>
                    </button>
                    <button onClick={() => onDelete(todo.id)} className="text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">
                        <TrashIcon className="h-5 w-5" />
                    </button>
                </div>
            </div>
             {(isExpanded && todo.subtasks.length > 0) && (
                <div className="pl-8 pt-2 mt-2 border-t border-slate-700 space-y-2">
                     <div className="w-full bg-primary rounded-full h-1.5"><div className="bg-accent h-1.5 rounded-full" style={{ width: `${subtaskProgress}%` }}></div></div>
                    {todo.subtasks.map(sub => (
                        <div key={sub.id} className="flex items-center gap-2 text-sm">
                             <input type="checkbox" checked={sub.completed} onChange={() => onSubtaskToggle(todo.id, sub.id, !sub.completed)} className="h-4 w-4 rounded bg-primary border-slate-500 text-accent focus:ring-accent" />
                            <span className={sub.completed ? 'line-through text-slate-500' : 'text-slate-300'}>{sub.text}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

const TodoListPage: React.FC = () => {
    const { currentUser } = useAuth();
    const [todos, setTodos] = useState<Todo[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [aiLoading, setAiLoading] = useState(false);
    
    const [view, setView] = useState('all'); // all, today, week, month
    const [searchTerm, setSearchTerm] = useState('');

    const [isAddModalOpen, setAddModalOpen] = useState(false);
    const [isStatsModalOpen, setStatsModalOpen] = useState(false);

    useEffect(() => {
        if (!currentUser) {
            setLoading(false);
            setTodos([]);
            return;
        }
        setLoading(true);
        setError('');
        const unsubscribe = onTodosSnapshot(currentUser.uid, 
            (fetchedTodos) => { setTodos(fetchedTodos); setLoading(false); },
            (err) => { setError('Could not fetch todos.'); console.error(err); setLoading(false); }
        );
        return () => unsubscribe();
    }, [currentUser?.uid]);

    const handleAddTask = async (data: any) => {
        if (!currentUser) return;
        try {
            const newTodoData = {
                text: data.text,
                completed: false,
                priority: data.priority,
                dueDate: data.dueDate || null,
                tags: data.tags,
                recurring: data.recurring,
                subtasks: [],
            };
            await addTodo(currentUser.uid, newTodoData as Omit<Todo, 'id' | 'createdAt' | 'completedAt'>);
        } catch (err) { setError("Failed to add task."); }
    };

    const handleToggleTodo = async (todo: Todo) => {
        if (!currentUser) return;
        const { id, completed, recurring, dueDate, text, priority, tags } = todo;

        if (!completed && recurring !== 'none' && dueDate) {
            try {
                // Archive current recurring task by detaching it
                await updateTodo(currentUser.uid, id, { completed: true, recurring: 'none' });
                
                const newDueDate = new Date(dueDate);
                newDueDate.setDate(newDueDate.getDate() + 1); // Adjust for timezone issues with just date strings
                if (recurring === 'daily') newDueDate.setDate(newDueDate.getDate() + 1);
                if (recurring === 'weekly') newDueDate.setDate(newDueDate.getDate() + 7);
                if (recurring === 'monthly') newDueDate.setMonth(newDueDate.getMonth() + 1);

                const newTodoData: Omit<Todo, 'id' | 'createdAt' | 'completedAt'> = {
                    text, priority, tags, recurring, subtasks: [], completed: false,
                    dueDate: newDueDate.toISOString().split('T')[0],
                };
                await addTodo(currentUser.uid, newTodoData);
            } catch (err) { setError("Failed to create next recurring task."); }
        } else {
            try {
                await updateTodo(currentUser.uid, id, { completed: !completed });
            } catch (err) { setError("Failed to update task."); }
        }
    };
    
    const handleDeleteTodo = async (id: string) => {
        if (!currentUser) return;
        try {
            await deleteTodo(currentUser.uid, id);
        } catch (err) { setError("Failed to delete task."); }
    };

    const handleSubtaskToggle = async (todoId: string, subtaskId: string, completed: boolean) => {
        if (!currentUser) return;
        try {
            await updateSubtask(currentUser.uid, todoId, subtaskId, completed);
        } catch (err) { setError("Failed to update subtask."); }
    };

    const handleAiBreakdown = async (todo: Todo) => {
        if (!currentUser) return;
        setAiLoading(true);
        try {
            const subtaskStrings = await generateSubtasks(todo.text);
            const newSubtasks: Subtask[] = subtaskStrings.map(s => ({
                id: Math.random().toString(36).substring(2, 9),
                text: s,
                completed: false
            }));
            await updateTodo(currentUser.uid, todo.id, { subtasks: [...todo.subtasks, ...newSubtasks] });
        } catch (err) {
            setError("AI breakdown failed.");
        } finally {
            setAiLoading(false);
        }
    };

    const filteredAndSortedTodos = useMemo(() => {
        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const endOfWeek = new Date(startOfToday);
        endOfWeek.setDate(endOfWeek.getDate() + (6 - startOfToday.getDay()) + 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

        return todos.filter(todo => {
            const term = searchTerm.toLowerCase();
            const matchesSearch = todo.text.toLowerCase().includes(term) || todo.tags.some(t => t.toLowerCase().includes(term));
            if (!matchesSearch) return false;

            if (view === 'all' || !todo.dueDate) return true;
            const dueDate = new Date(todo.dueDate);

            if (view === 'today') return dueDate >= startOfToday && dueDate < new Date(startOfToday.getTime() + 24 * 60 * 60 * 1000);
            if (view === 'week') return dueDate >= startOfToday && dueDate <= endOfWeek;
            if (view === 'month') return dueDate >= startOfToday && dueDate <= endOfMonth;
            return true;
        }).sort((a,b) => (a.completed ? 1 : -1) - (b.completed ? 1 : -1) || priorityMap[b.priority].value - priorityMap[a.priority].value || (new Date(a.dueDate || 0).getTime() - new Date(b.dueDate || 0).getTime()));
    }, [todos, view, searchTerm]);
    
    const stats = useMemo(() => {
        const today = new Date().toISOString().slice(0, 10);
        const startOfWeek = new Date();
        startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
        
        const overdue = todos.filter(t => !t.completed && t.dueDate && t.dueDate < today).length;
        const forToday = todos.filter(t => !t.completed && t.dueDate === today).length;
        const completedThisWeek = todos.filter(t => t.completed && t.completedAt && t.completedAt.toDate() >= startOfWeek).length;
        return { overdue, forToday, completedThisWeek };
    }, [todos]);

    if (loading) return <div className="flex justify-center items-center h-64"><Spinner /></div>;
    
    return (
        <div className="max-w-6xl mx-auto">
            <AddTaskModal isOpen={isAddModalOpen} onClose={() => setAddModalOpen(false)} onAddTask={handleAddTask} />
            
            <div className="flex items-center gap-4 mb-6">
                <ClipboardDocumentCheckIcon className="h-10 w-10 text-accent" />
                <div>
                    <h1 className="text-3xl font-bold">Productivity Hub</h1>
                    <p className="text-slate-400">Your advanced to-do list for managing tasks.</p>
                </div>
            </div>
            {error && <p className="bg-red-500/20 text-red-400 p-3 rounded-md mb-4 text-center">{error}</p>}
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="bg-secondary p-3 rounded-lg text-center"><span className="font-bold text-amber-400">{stats.forToday}</span> tasks for today</div>
                <div className="bg-secondary p-3 rounded-lg text-center"><span className="font-bold text-red-400">{stats.overdue}</span> tasks overdue</div>
                <div className="bg-secondary p-3 rounded-lg text-center"><span className="font-bold text-green-400">{stats.completedThisWeek}</span> tasks completed this week</div>
            </div>

            <div className="bg-secondary p-4 rounded-lg border border-slate-700">
                 <div className="flex flex-col md:flex-row gap-4 mb-4">
                     <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search tasks or #tags..."
                        className="w-full p-2 bg-primary border border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
                    />
                    <div className="flex-shrink-0 flex gap-2">
                        <button onClick={() => setAddModalOpen(true)} className="flex-1 md:flex-none flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-md font-semibold btn-animated"><DocumentPlusIcon className="h-5 w-5"/>Add Task</button>
                        <button className="flex-1 md:flex-none flex items-center gap-2 px-4 py-2 bg-primary text-light rounded-md font-semibold"><ChartBarIcon className="h-5 w-5"/>Stats</button>
                    </div>
                 </div>

                <div className="flex gap-2 mb-4 border-b border-slate-700 pb-2">
                    {(['all', 'today', 'week', 'month'] as const).map(v => (
                        <button key={v} onClick={() => setView(v)} className={`px-3 py-1 text-sm rounded-full capitalize ${view === v ? 'bg-accent text-primary font-bold' : 'bg-primary'}`}>{v}</button>
                    ))}
                </div>
                
                <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-2">
                    {filteredAndSortedTodos.length > 0 ? filteredAndSortedTodos.map(todo => (
                        <TodoItem key={todo.id} todo={todo} onToggle={handleToggleTodo} onDelete={handleDeleteTodo} onSubtaskToggle={handleSubtaskToggle} onBreakdown={handleAiBreakdown} aiLoading={aiLoading} />
                    )) : <p className="text-center text-slate-500 py-8">No tasks found. Try a different view or add a new task!</p>}
                </div>
            </div>
        </div>
    );
};

export default TodoListPage;