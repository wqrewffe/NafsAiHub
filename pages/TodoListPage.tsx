import React, { useState, useEffect, useMemo } from 'react';
import { ClipboardDocumentCheckIcon, TrashIcon } from '../tools/Icons';

interface Todo {
    id: number;
    text: string;
    completed: boolean;
    priority: 'low' | 'medium' | 'high';
    dueDate: string | null;
}

type Priority = 'low' | 'medium' | 'high';

const priorityMap: { [key in Priority]: { color: string, name: string, value: number } } = {
    low: { color: 'bg-green-500', name: 'Low', value: 1 },
    medium: { color: 'bg-yellow-500', name: 'Medium', value: 2 },
    high: { color: 'bg-red-500', name: 'High', value: 3 },
};

const TodoListPage: React.FC = () => {
    const [todos, setTodos] = useState<Todo[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [priority, setPriority] = useState<Priority>('medium');
    const [dueDate, setDueDate] = useState('');
    const [filter, setFilter] = useState('all'); // 'all', 'active', 'completed'
    const [sortBy, setSortBy] = useState('default'); // 'default', 'dueDate', 'priority'

    useEffect(() => {
        try {
            const storedTodos = localStorage.getItem('todo-list-app-v2');
            if (storedTodos) {
                setTodos(JSON.parse(storedTodos));
            }
        } catch (error) {
            console.error("Failed to load todos from localStorage", error);
            setTodos([]);
        }
    }, []);

    useEffect(() => {
        try {
            localStorage.setItem('todo-list-app-v2', JSON.stringify(todos));
        } catch (error) {
            console.error("Failed to save todos to localStorage", error);
        }
    }, [todos]);

    const handleAddTodo = (e: React.FormEvent) => {
        e.preventDefault();
        if (inputValue.trim() === '') return;
        const newTodo: Todo = {
            id: Date.now(),
            text: inputValue,
            completed: false,
            priority,
            dueDate: dueDate || null,
        };
        setTodos([newTodo, ...todos]);
        setInputValue('');
        setDueDate('');
        setPriority('medium');
    };

    const handleToggleTodo = (id: number) => {
        setTodos(
            todos.map(todo =>
                todo.id === id ? { ...todo, completed: !todo.completed } : todo
            )
        );
    };

    const handleDeleteTodo = (id: number) => {
        setTodos(todos.filter(todo => todo.id !== id));
    };

    const displayedTodos = useMemo(() => {
        const filtered = todos.filter(todo => {
            if (filter === 'active') return !todo.completed;
            if (filter === 'completed') return todo.completed;
            return true;
        });

        return filtered.sort((a, b) => {
            if (sortBy === 'dueDate') {
                if (!a.dueDate) return 1;
                if (!b.dueDate) return -1;
                return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
            }
            if (sortBy === 'priority') {
                return priorityMap[b.priority].value - priorityMap[a.priority].value;
            }
            return b.id - a.id; // Default sort by creation time (newest first)
        });
    }, [todos, filter, sortBy]);

    const completedCount = todos.filter(t => t.completed).length;
    const progress = todos.length > 0 ? (completedCount / todos.length) * 100 : 0;
    
    const isOverdue = (dueDate: string | null) => {
        if (!dueDate) return false;
        const today = new Date();
        today.setHours(0,0,0,0);
        return new Date(dueDate) < today;
    }

    return (
        <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-4 mb-6">
                <ClipboardDocumentCheckIcon className="h-10 w-10 text-accent" />
                <div>
                    <h1 className="text-3xl font-bold">Todo List</h1>
                    <p className="text-slate-400">Organize your tasks to stay productive.</p>
                </div>
            </div>
            <div className="bg-secondary p-4 rounded-lg border border-slate-700">
                <form onSubmit={handleAddTodo} className="space-y-3 bg-primary p-3 rounded-md">
                    <input
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        placeholder="What needs to be done?"
                        className="w-full p-2 bg-primary border border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
                    />
                    <div className="flex flex-col sm:flex-row gap-3">
                         <div className="flex-1">
                            <label className="text-xs text-slate-400">Priority</label>
                            <select value={priority} onChange={(e) => setPriority(e.target.value as Priority)} className="w-full p-2 bg-primary border border-slate-600 rounded-md">
                                <option value="low">Low</option>
                                <option value="medium">Medium</option>
                                <option value="high">High</option>
                            </select>
                        </div>
                        <div className="flex-1">
                            <label className="text-xs text-slate-400">Due Date</label>
                            <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="w-full p-2 bg-primary border border-slate-600 rounded-md" />
                        </div>
                        <button type="submit" className="sm:self-end px-4 py-2 bg-accent text-white rounded-md font-semibold btn-animated">
                            Add Task
                        </button>
                    </div>
                </form>

                <div className="my-4 flex flex-col sm:flex-row justify-between items-center gap-2">
                    <div className="flex gap-2">
                        <button onClick={() => setFilter('all')} className={`px-3 py-1 text-xs rounded-full ${filter === 'all' ? 'bg-accent text-primary font-bold' : 'bg-primary'}`}>All</button>
                        <button onClick={() => setFilter('active')} className={`px-3 py-1 text-xs rounded-full ${filter === 'active' ? 'bg-accent text-primary font-bold' : 'bg-primary'}`}>Active</button>
                        <button onClick={() => setFilter('completed')} className={`px-3 py-1 text-xs rounded-full ${filter === 'completed' ? 'bg-accent text-primary font-bold' : 'bg-primary'}`}>Completed</button>
                    </div>
                    <div>
                        <select onChange={(e) => setSortBy(e.target.value)} value={sortBy} className="text-xs bg-primary border border-slate-600 rounded-full px-3 py-1">
                             <option value="default">Sort by: Default</option>
                             <option value="dueDate">Sort by: Due Date</option>
                             <option value="priority">Sort by: Priority</option>
                        </select>
                    </div>
                </div>

                <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
                    {displayedTodos.length > 0 ? displayedTodos.map(todo => (
                        <div key={todo.id} className="flex items-center justify-between bg-primary p-2 rounded-md group">
                            <div className="flex items-center gap-3 cursor-pointer flex-grow" onClick={() => handleToggleTodo(todo.id)}>
                                <span title={priorityMap[todo.priority].name} className={`h-4 w-4 rounded-full ${priorityMap[todo.priority].color} flex-shrink-0`}></span>
                                <div className="flex-grow">
                                    <span className={`text-light ${todo.completed ? 'line-through text-slate-500' : ''}`}>{todo.text}</span>
                                    {todo.dueDate && <p className={`text-xs ${todo.completed ? 'text-slate-600' : isOverdue(todo.dueDate) ? 'text-red-400' : 'text-slate-400'}`}>{new Date(todo.dueDate).toLocaleDateString()}</p>}
                                </div>
                            </div>
                            <button onClick={() => handleDeleteTodo(todo.id)} className="text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                                <TrashIcon className="h-5 w-5" />
                            </button>
                        </div>
                    )) : (
                        <p className="text-center text-slate-500 py-8">No tasks found. Try a different filter!</p>
                    )}
                </div>
                
                {todos.length > 0 && (
                    <div className="mt-4 border-t border-slate-700 pt-3">
                        <div className="flex justify-between items-center text-sm text-slate-400 mb-1">
                            <span>Progress</span>
                             <span>{completedCount} of {todos.length} completed</span>
                        </div>
                        <div className="w-full bg-primary rounded-full h-2.5">
                            <div className="bg-accent h-2.5 rounded-full" style={{ width: `${progress}%` }}></div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TodoListPage;
