import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
import { onNotesSnapshot, addNote, updateNote, deleteNote } from '../services/firebaseService';
import { Note } from '../types';
import { PencilIcon, TrashIcon, DocumentPlusIcon, CodeBracketIcon } from '../tools/Icons';
import Spinner from '../components/Spinner';


const MarkdownPreview: React.FC<{ content: string }> = ({ content }) => {
    const previewText = content.split('\n')[0] || 'No content';
    
    const formatted = previewText
        .replace(/\*\*(.*?)\*\*/g, '$1') // remove bold
        .replace(/\*(.*?)\*/g, '$1') // remove italic
        .replace(/```/g, ''); // remove code ticks

    return <p className="text-xs text-slate-400 truncate">{formatted}</p>;
};

const NoteTakingPage: React.FC = () => {
    const { currentUser } = useAuth();
    const [notes, setNotes] = useState<Note[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
    const editorRef = useRef<HTMLTextAreaElement>(null);
    const updateTimeoutRef = useRef<number | null>(null);

    useEffect(() => {
        if (!currentUser) {
            setLoading(false);
            setNotes([]);
            setActiveNoteId(null);
            return;
        }
        setLoading(true);
        setError('');
        const unsubscribe = onNotesSnapshot(
            currentUser.uid, 
            (fetchedNotes) => {
                setNotes(fetchedNotes);
                setActiveNoteId(prevActiveId => {
                    if (!prevActiveId && fetchedNotes.length > 0) return fetchedNotes[0].id;
                    if (prevActiveId && !fetchedNotes.some(n => n.id === prevActiveId)) {
                        return fetchedNotes.length > 0 ? fetchedNotes[0].id : null;
                    }
                    return prevActiveId;
                });
                setLoading(false);
            },
            (err) => {
                setError('Could not fetch your notes. This might be due to a database permissions issue or a missing index. Please check your Firestore configuration.');
                console.error(err);
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, [currentUser?.uid]);

    const activeNote = useMemo(() => {
        return notes.find(note => note.id === activeNoteId);
    }, [notes, activeNoteId]);

    const handleAddNote = async () => {
        if (!currentUser) return;
        setError('');
        try {
            const newNoteData: Omit<Note, 'id'> = {
                title: 'Untitled Note',
                content: '',
                lastModified: Date.now(),
            };
            const newId = await addNote(currentUser.uid, newNoteData);
            setActiveNoteId(newId);
        } catch (err) {
            console.error("Failed to add note:", err);
            setError("Failed to create a new note. Please try again.");
        }
    };

    const handleDeleteNote = async (id: string) => {
        if (!currentUser) return;
        setError('');
        try {
            await deleteNote(currentUser.uid, id);
        } catch (err) {
            console.error("Failed to delete note:", err);
            setError("Failed to delete the note. Please try again.");
        }
    };

    const handleUpdateNote = (field: 'title' | 'content', value: string) => {
        if (!activeNoteId || !currentUser) return;

        // Optimistic UI update
        setNotes(notes.map(note =>
            note.id === activeNoteId
                ? { ...note, [field]: value, lastModified: Date.now() }
                : note
        ));
        
        setError('');

        if (updateTimeoutRef.current) {
            clearTimeout(updateTimeoutRef.current);
        }
        
        updateTimeoutRef.current = window.setTimeout(async () => {
            try {
                await updateNote(currentUser.uid, activeNoteId, { [field]: value });
            } catch (err) {
                console.error("Failed to save note:", err);
                setError("Failed to save changes. Please check your connection.");
            }
        }, 500);
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

    if (loading) {
        return <div className="flex justify-center items-center h-64"><Spinner /></div>;
    }

    return (
        <div>
            <div className="flex items-center gap-4 mb-6">
                <PencilIcon className="h-10 w-10 text-accent" />
                <div>
                    <h1 className="text-3xl font-bold">Notes</h1>
                    <p className="text-slate-400">Capture your thoughts, ideas, and reminders.</p>
                </div>
            </div>
            {error && <p className="bg-red-500/20 text-red-400 p-3 rounded-md mb-4 text-center">{error}</p>}
            <div className="flex flex-col md:flex-row gap-4 md:h-[70vh]">
                {/* Sidebar */}
                <div className="w-full md:w-1/3 bg-secondary p-3 rounded-lg flex flex-col border border-slate-700 h-64 md:h-full">
                    <div className="flex justify-between items-center mb-3">
                        <h3 className="text-xl font-bold text-light">My Notes</h3>
                        <button onClick={handleAddNote} className="p-2 text-accent hover:bg-primary rounded-full" title="New Note">
                            <DocumentPlusIcon className="h-6 w-6" />
                        </button>
                    </div>
                    <div className="flex-grow overflow-y-auto pr-1">
                        {notes.length > 0 ? notes.map(note => (
                            <div
                                key={note.id}
                                onClick={() => setActiveNoteId(note.id)}
                                className={`p-3 rounded-md cursor-pointer mb-2 transition-colors ${activeNoteId === note.id ? 'bg-accent/20' : 'hover:bg-primary'}`}
                            >
                                <h4 className="font-bold text-light truncate">{note.title || 'Untitled'}</h4>
                                <MarkdownPreview content={note.content} />
                            </div>
                        )) : <p className="text-center text-sm text-slate-500 mt-8">No notes yet. Create one!</p>}
                    </div>
                </div>

                {/* Main Editor */}
                <div className="w-full md:w-2/3 bg-secondary p-4 rounded-lg flex flex-col border border-slate-700 h-[60vh] md:h-full">
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
                            <div className="flex items-center gap-2 mb-2 p-1 bg-primary rounded-md">
                                <button onClick={() => handleFormat('bold')} className="p-2 hover:bg-secondary rounded-md" title="Bold"><strong>B</strong></button>
                                <button onClick={() => handleFormat('italic')} className="p-2 hover:bg-secondary rounded-md" title="Italic"><em>I</em></button>
                                <button onClick={() => handleFormat('code')} className="p-2 hover:bg-secondary rounded-md" title="Code Block"><CodeBracketIcon className="h-5 w-5"/></button>
                            </div>
                            <textarea
                                ref={editorRef}
                                value={activeNote.content}
                                onChange={(e) => handleUpdateNote('content', e.target.value)}
                                placeholder="Start writing..."
                                className="w-full h-full p-2 bg-primary border border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-accent resize-none"
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
        </div>
    );
};

export default NoteTakingPage;