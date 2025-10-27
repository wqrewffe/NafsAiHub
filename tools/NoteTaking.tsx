import React, { useState, useEffect, useMemo, useRef } from 'react';
import { PencilIcon, TrashIcon, DocumentPlusIcon, CodeBracketIcon } from './Icons';

interface Note {
    id: string;
    title: string;
    content: string;
    lastModified: number;
}

const MarkdownPreview: React.FC<{ content: string }> = ({ content }) => {
    const previewText = content.split('\n')[0] || 'No content';
    
    const formatted = previewText
        .replace(/\*\*(.*?)\*\*/g, '$1') // remove bold
        .replace(/\*(.*?)\*/g, '$1') // remove italic
        .replace(/```/g, ''); // remove code ticks

    return <p className="text-xs text-slate-400 truncate">{formatted}</p>;
};

const NotesManager: React.FC = () => {
    const [notes, setNotes] = useState<Note[]>([]);
    const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
    const editorRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        try {
            const storedNotes = localStorage.getItem('note-taking-app-v2');
            if (storedNotes) {
                const parsedNotes: Note[] = JSON.parse(storedNotes);
                setNotes(parsedNotes);
                if (parsedNotes.length > 0) {
                    const sorted = [...parsedNotes].sort((a, b) => b.lastModified - a.lastModified);
                    setActiveNoteId(sorted[0].id);
                }
            }
        } catch (error) {
            console.error("Failed to load notes from localStorage", error);
        }
    }, []);

    useEffect(() => {
        try {
            localStorage.setItem('note-taking-app-v2', JSON.stringify(notes));
        } catch (error) {
            console.error("Failed to save notes to localStorage", error);
        }
    }, [notes]);
    
    const sortedNotes = useMemo(() => {
        return [...notes].sort((a, b) => b.lastModified - a.lastModified);
    }, [notes]);

    const activeNote = useMemo(() => {
        return notes.find(note => note.id === activeNoteId);
    }, [notes, activeNoteId]);

    const handleAddNote = () => {
        const newNote: Note = {
            id: Date.now().toString(),
            title: 'Untitled Note',
            content: '',
            lastModified: Date.now(),
        };
        setNotes([newNote, ...notes]);
        setActiveNoteId(newNote.id);
    };

    const handleDeleteNote = (id: string) => {
        const newNotes = notes.filter(note => note.id !== id);
        setNotes(newNotes);
        if (activeNoteId === id) {
             const newSortedNotes = [...newNotes].sort((a, b) => b.lastModified - a.lastModified);
             setActiveNoteId(newSortedNotes.length > 0 ? newSortedNotes[0].id : null);
        }
    };

    const handleUpdateNote = (field: 'title' | 'content', value: string) => {
        if (!activeNoteId) return;
        setNotes(notes.map(note =>
            note.id === activeNoteId
                ? { ...note, [field]: value, lastModified: Date.now() }
                : note
        ));
    };

    const handleFormat = (formatType: 'bold' | 'italic' | 'code') => {
        const editor = editorRef.current;
        if (!editor || !activeNote) return;

        const { selectionStart, selectionEnd, value } = editor;
        const selectedText = value.substring(selectionStart, selectionEnd);
        let newText;

        switch(formatType) {
            case 'bold':
                newText = `**${selectedText}**`;
                break;
            case 'italic':
                newText = `*${selectedText}*`;
                break;
            case 'code':
                newText = "```\n" + selectedText + "\n```";
                break;
        }

        const newValue = value.substring(0, selectionStart) + newText + value.substring(selectionEnd);
        handleUpdateNote('content', newValue);
    };

    return (
        <div className="flex flex-col md:flex-row gap-4 h-[65vh]">
            {/* Sidebar */}
            <div className="w-full md:w-1/3 bg-primary p-3 rounded-lg flex flex-col border border-slate-700">
                <div className="flex justify-between items-center mb-3">
                    <h3 className="text-xl font-bold text-light">My Notes</h3>
                    <button onClick={handleAddNote} className="p-2 text-accent hover:bg-secondary rounded-full" title="New Note">
                        <DocumentPlusIcon className="h-6 w-6" />
                    </button>
                </div>
                <div className="flex-grow overflow-y-auto pr-1">
                    {sortedNotes.length > 0 ? sortedNotes.map(note => (
                        <div
                            key={note.id}
                            onClick={() => setActiveNoteId(note.id)}
                            className={`p-3 rounded-md cursor-pointer mb-2 transition-colors ${activeNoteId === note.id ? 'bg-accent/20' : 'hover:bg-secondary'}`}
                        >
                            <h4 className="font-bold text-light truncate">{note.title || 'Untitled'}</h4>
                            <MarkdownPreview content={note.content} />
                        </div>
                    )) : <p className="text-center text-sm text-slate-500 mt-8">No notes yet. Create one!</p>}
                </div>
            </div>

            {/* Main Editor */}
            <div className="w-full md:w-2/3 bg-primary p-4 rounded-lg flex flex-col border border-slate-700">
                {activeNote ? (
                    <>
                        <div className="flex justify-between items-center mb-3 pb-2 border-b border-slate-700">
                            <input
                                type="text"
                                value={activeNote.title}
                                onChange={(e) => handleUpdateNote('title', e.target.value)}
                                placeholder="Note Title"
                                className="w-full text-2xl font-bold bg-transparent text-light focus:outline-none"
                            />
                            <button onClick={() => handleDeleteNote(activeNote.id)} className="p-2 text-slate-500 hover:text-red-400 rounded-full" title="Delete Note">
                                <TrashIcon className="h-6 w-6" />
                            </button>
                        </div>
                        <div className="flex items-center gap-2 mb-2 p-1 bg-secondary rounded-md">
                            <button onClick={() => handleFormat('bold')} className="p-2 hover:bg-primary rounded-md" title="Bold"><strong>B</strong></button>
                            <button onClick={() => handleFormat('italic')} className="p-2 hover:bg-primary rounded-md" title="Italic"><em>I</em></button>
                             <button onClick={() => handleFormat('code')} className="p-2 hover:bg-primary rounded-md" title="Code Block"><CodeBracketIcon className="h-5 w-5"/></button>
                        </div>
                        <textarea
                            ref={editorRef}
                            value={activeNote.content}
                            onChange={(e) => handleUpdateNote('content', e.target.value)}
                            placeholder="Start writing..."
                            className="w-full h-full p-2 bg-secondary border border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-accent resize-none"
                        />
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-slate-500">
                        <PencilIcon className="h-16 w-16 mb-4"/>
                        <p>Select a note or create a new one to begin.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default NotesManager;
