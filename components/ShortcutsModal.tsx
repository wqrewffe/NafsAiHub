import React from 'react';
import { XCircleIcon } from '../tools/Icons';

interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const shortcuts = [
    { keys: 'Ctrl / Cmd + Enter', description: 'Generate result in any tool' },
    { keys: 'Esc', description: 'Close this modal' },
];

const ShortcutsModal: React.FC<ShortcutsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">Keyboard Shortcuts</h2>
            <button onClick={onClose} aria-label="Close shortcuts modal" className="text-slate-400 hover:text-white">
                <XCircleIcon className="h-7 w-7"/>
            </button>
        </div>
        <div className="space-y-3">
            {shortcuts.map(shortcut => (
                <div key={shortcut.keys} className="flex justify-between items-center bg-primary p-3 rounded-md">
                    <p className="text-slate-300">{shortcut.description}</p>
                    <kbd className="px-2 py-1.5 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-lg">
                        {shortcut.keys}
                    </kbd>
                </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default ShortcutsModal;
