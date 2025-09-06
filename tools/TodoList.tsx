import React, { useState, useEffect, useMemo } from 'react';
import { ClipboardDocumentCheckIcon, TrashIcon, PencilIcon } from './Icons';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

interface Todo {
  id: number;
  text: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  dueDate: string | null;
  tags: string[];
}

type Priority = 'low' | 'medium' | 'high';

const priorityMap: { [key in Priority]: { color: string; name: string; value: number } } = {
  low: { color: 'bg-green-500', name: 'Low', value: 1 },
  medium: { color: 'bg-yellow-500', name: 'Medium', value: 2 },
  high: { color: 'bg-red-500', name: 'High', value: 3 },
};

const COLORS = ['#22c55e', '#eab308', '#ef4444'];

const TodoListManager: React.FC = () => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');
  const [dueDate, setDueDate] = useState('');
  const [tags, setTags] = useState('');
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('default');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValue, setEditValue] = useState('');

  useEffect(() => {
    try {
      const storedTodos = localStorage.getItem('todo-list-app-v3');
      if (storedTodos) {
        setTodos(JSON.parse(storedTodos));
      }
    } catch (error) {
      console.error('Failed to load todos from localStorage', error);
      setTodos([]);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('todo-list-app-v3', JSON.stringify(todos));
    } catch (error) {
      console.error('Failed to save todos to localStorage', error);
    }
  }, [todos]);

  // 🔔 Reminder Notifications
  useEffect(() => {
    todos.forEach((todo) => {
      if (todo.dueDate && !todo.completed) {
        const dueTime = new Date(todo.dueDate).getTime();
        const now = new Date().getTime();
        const diff = dueTime - now;
        if (diff > 0 && diff < 60000) {
          new Notification('⏰ Task Reminder', {
            body: `${todo.text} is due soon!`,
          });
        }
      }
    });
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
      tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
    };
    setTodos([newTodo, ...todos]);
    setInputValue('');
    setDueDate('');
    setPriority('medium');
    setTags('');
  };

  const handleToggleTodo = (id: number) => {
    setTodos(
      todos.map((todo) =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
      )
    );
  };

  const handleDeleteTodo = (id: number) => {
    setTodos(todos.filter((todo) => todo.id !== id));
  };

  const handleEditTodo = (id: number, text: string) => {
    setEditingId(id);
    setEditValue(text);
  };

  const handleSaveEdit = (id: number) => {
    setTodos(
      todos.map((todo) => (todo.id === id ? { ...todo, text: editValue } : todo))
    );
    setEditingId(null);
    setEditValue('');
  };

  const displayedTodos = useMemo(() => {
    const filtered = todos.filter((todo) => {
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
      return b.id - a.id;
    });
  }, [todos, filter, sortBy]);

  const completedCount = todos.filter((t) => t.completed).length;
  const progress = todos.length > 0 ? (completedCount / todos.length) * 100 : 0;

  const isOverdue = (dueDate: string | null) => {
    if (!dueDate) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return new Date(dueDate) < today;
  };

  // 📊 Chart Data
  const chartData = [
    { name: 'Low', value: todos.filter((t) => t.priority === 'low').length },
    { name: 'Medium', value: todos.filter((t) => t.priority === 'medium').length },
    { name: 'High', value: todos.filter((t) => t.priority === 'high').length },
  ];

  return (
    <div className="w-full space-y-6">
      <div className="bg-primary p-4 rounded-lg border border-slate-700">
        <div className="flex items-center gap-4 mb-4">
          <ClipboardDocumentCheckIcon className="h-8 w-8 text-accent" />
          <h2 className="text-2xl font-bold text-light">My Advanced Todo List</h2>
        </div>

        {/* Add Task */}
        <form onSubmit={handleAddTodo} className="space-y-3 bg-secondary p-3 rounded-md">
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
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as Priority)}
                className="w-full p-2 bg-primary border border-slate-600 rounded-md"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            <div className="flex-1">
              <label className="text-xs text-slate-400">Due Date</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full p-2 bg-primary border border-slate-600 rounded-md"
              />
            </div>
            <div className="flex-1">
              <label className="text-xs text-slate-400">Tags (comma separated)</label>
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                className="w-full p-2 bg-primary border border-slate-600 rounded-md"
              />
            </div>
            <button
              type="submit"
              className="sm:self-end px-4 py-2 bg-accent text-white rounded-md font-semibold btn-animated"
            >
              Add Task
            </button>
          </div>
        </form>

        {/* Filters & Sorting */}
        <div className="my-4 flex flex-col sm:flex-row justify-between items-center gap-2">
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1 text-xs rounded-full ${filter === 'all' ? 'bg-accent text-primary font-bold' : 'bg-secondary'}`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('active')}
              className={`px-3 py-1 text-xs rounded-full ${filter === 'active' ? 'bg-accent text-primary font-bold' : 'bg-secondary'}`}
            >
              Active
            </button>
            <button
              onClick={() => setFilter('completed')}
              className={`px-3 py-1 text-xs rounded-full ${filter === 'completed' ? 'bg-accent text-primary font-bold' : 'bg-secondary'}`}
            >
              Completed
            </button>
          </div>
          <div>
            <select
              onChange={(e) => setSortBy(e.target.value)}
              value={sortBy}
              className="text-xs bg-secondary border border-slate-600 rounded-full px-3 py-1"
            >
              <option value="default">Sort by: Default</option>
              <option value="dueDate">Sort by: Due Date</option>
              <option value="priority">Sort by: Priority</option>
            </select>
          </div>
        </div>

        {/* Todo List */}
        <div className="space-y-2 max-h-72 overflow-y-auto pr-2">
          {displayedTodos.length > 0 ? (
            displayedTodos.map((todo) => (
              <div
                key={todo.id}
                className="flex items-center justify-between bg-secondary p-2 rounded-md group"
              >
                <div
                  className="flex items-center gap-3 cursor-pointer flex-grow"
                  onClick={() => handleToggleTodo(todo.id)}
                >
                  <span
                    title={priorityMap[todo.priority].name}
                    className={`h-4 w-4 rounded-full ${priorityMap[todo.priority].color} flex-shrink-0`}
                  ></span>
                  <div className="flex-grow">
                    {editingId === todo.id ? (
                      <input
                        type="text"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={() => handleSaveEdit(todo.id)}
                        className="w-full p-1 bg-primary border border-slate-600 rounded-md"
                      />
                    ) : (
                      <span
                        className={`text-light ${
                          todo.completed ? 'line-through text-slate-500' : ''
                        }`}
                      >
                        {todo.text}
                      </span>
                    )}
                    {todo.dueDate && (
                      <p
                        className={`text-xs ${
                          todo.completed
                            ? 'text-slate-600'
                            : isOverdue(todo.dueDate)
                            ? 'text-red-400'
                            : 'text-slate-400'
                        }`}
                      >
                        {new Date(todo.dueDate).toLocaleDateString()}
                      </p>
                    )}
                    {todo.tags.length > 0 && (
                      <div className="flex gap-1 mt-1 flex-wrap">
                        {todo.tags.map((tag, i) => (
                          <span
                            key={i}
                            className="text-[10px] px-2 py-0.5 bg-slate-700 text-white rounded-full"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleEditTodo(todo.id, todo.text)}
                    className="text-slate-500 hover:text-blue-400"
                  >
                    <PencilIcon className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => handleDeleteTodo(todo.id)}
                    className="text-slate-500 hover:text-red-400"
                  >
                    <TrashIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <p className="text-center text-slate-500 py-8">
              No tasks found. Try a different filter!
            </p>
          )}
        </div>

        {/* Progress Bar */}
        {todos.length > 0 && (
          <div className="mt-4 border-t border-slate-700 pt-3">
            <div className="flex justify-between items-center text-sm text-slate-400 mb-1">
              <span>Progress</span>
              <span>
                {completedCount} of {todos.length} completed
              </span>
            </div>
            <div className="w-full bg-secondary rounded-full h-2.5">
              <div
                className="bg-accent h-2.5 rounded-full"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
        )}
      </div>

      {/* 📅 Calendar View */}
      <div className="bg-primary p-4 rounded-lg border border-slate-700">
        <h3 className="text-xl font-bold text-light mb-2">Calendar View</h3>
        <Calendar
          onChange={(value: Date | Date[] | null) => {
            if (!value) return;
            const date = Array.isArray(value) ? value[0] : value;
            setSelectedDate(date);
          }}
          value={selectedDate}
        />
        <div className="mt-4">
          <h4 className="text-lg font-semibold text-light mb-2">
            Tasks on {selectedDate.toDateString()}:
          </h4>
          {todos.filter(
            (todo) =>
              todo.dueDate === selectedDate.toISOString().split('T')[0]
          ).length > 0 ? (
            todos
              .filter(
                (todo) =>
                  todo.dueDate === selectedDate.toISOString().split('T')[0]
              )
              .map((todo) => (
                <div
                  key={todo.id}
                  className="p-2 bg-secondary rounded-md mb-1"
                >
                  {todo.text}
                </div>
              ))
          ) : (
            <p className="text-slate-500">No tasks on this day.</p>
          )}
        </div>
      </div>

      {/* 📊 Analytics Dashboard */}
      <div className="bg-primary p-4 rounded-lg border border-slate-700">
        <h3 className="text-xl font-bold text-light mb-2">Analytics</h3>
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="name"
              outerRadius={80}
              label
            >
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default TodoListManager;
