import React, { useEffect, ReactNode } from 'react';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: ReactNode;
    size?: 'default' | 'large';
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, size = 'default' }) => {
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [onClose]);

    if (!isOpen) return null;

    const sizeClass = size === 'large' ? 'max-w-6xl' : 'max-w-3xl';

    return (
        <div 
            className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-[100] fade-in backdrop-blur-sm"
            onClick={onClose}
            aria-modal="true"
            role="dialog"
        >
            <div 
                className={`bg-secondary rounded-lg shadow-xl w-full ${sizeClass} max-h-[90vh] flex flex-col m-4`}
                onClick={e => e.stopPropagation()}
            >
                <div className="flex justify-between items-center p-4 border-b border-slate-700 flex-shrink-0">
                    <h2 className="text-xl font-bold text-light">{title}</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-white text-3xl font-bold leading-none">&times;</button>
                </div>
                <div className="p-4 sm:p-6 overflow-y-auto flex-grow">
                    {children}
                </div>
            </div>
        </div>
    );
};

export default Modal;
