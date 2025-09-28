
import React, { useState, useEffect } from 'react';
import { AITool } from '../types';

interface SubmissionFormProps {
  onSubmit: (tool: Omit<AITool, 'id' | 'status' | 'submittedBy'>) => Promise<void>;
  onCancel: () => void;
  isAdmin: boolean;
  // Optional: edit mode
  initialTool?: AITool | null;
  onUpdate?: (toolId: string, tool: Omit<AITool, 'id' | 'status' | 'submittedBy' | 'createdAt'>) => Promise<void>;
}

const SubmissionForm: React.FC<SubmissionFormProps> = ({ onSubmit, onCancel, isAdmin, initialTool, onUpdate }) => {
  const [name, setName] = useState('');
  const [link, setLink] = useState('');
  const [description, setDescription] = useState('');
  const [keywords, setKeywords] = useState('');
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionSuccess, setSubmissionSuccess] = useState(false);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // 2MB limit
        setError('Image file is too large. Please select an image under 2MB.');
        e.target.value = ''; // Reset file input
        setImageBase64(null);
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageBase64(reader.result as string);
        setError(null);
      };
      reader.onerror = () => {
        setError('Failed to read image file.');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!name || !link || !description || !keywords || !imageBase64) {
      setError('All fields, including an image, are required.');
      return;
    }
    setError(null);
    setIsSubmitting(true);

    try {
      const payload = {
        name,
        link,
        description,
        keywords: keywords.split(',').map(kw => kw.trim()).filter(Boolean),
        imageBase64,
      } as Omit<AITool, 'id' | 'status' | 'submittedBy' | 'createdAt'>;

      if (initialTool && onUpdate) {
        await onUpdate(initialTool.id, payload);
      } else {
        await onSubmit(payload);
      }
      setSubmissionSuccess(true);
      setTimeout(() => {
        onCancel();
      }, 2500);
    } catch (err) {
      const e = err as any;
      if (e?.code === 'DUPLICATE_URL') {
        setError('This tool link was already added. Please submit a different link.');
      } else {
        setError('An unexpected error occurred during submission. Please try again.');
      }
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // If initialTool is provided, prefill the form
  useEffect(() => {
    if (initialTool) {
      setName(initialTool.name || '');
      setLink(initialTool.link || '');
      setDescription(initialTool.description || '');
      setKeywords((initialTool.keywords || []).join(', '));
      setImageBase64(initialTool.imageBase64 || null);
    }
  }, [initialTool]);

  if (submissionSuccess) {
    return (
      <div className="max-w-2xl mx-auto bg-card p-8 rounded-lg shadow-2xl border border-border text-center animate-fade-in">
        <h2 className="text-3xl font-bold mb-4 text-green-400">Submission Successful!</h2>
        <p className="text-text-secondary">
          {isAdmin 
            ? "The tool has been added to the showcase." 
            : "Thank you for your submission! It will be reviewed by an admin shortly."}
        </p>
        <p className="text-text-secondary mt-4">You will be redirected back to the home page.</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto bg-card p-8 rounded-lg shadow-2xl border border-border">
      <h2 className="text-3xl font-bold mb-6 text-center text-accent">Submit a New AI Tool</h2>
      {error && <div className="bg-red-500/20 text-red-400 p-3 rounded-md mb-4">{error}</div>}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-text-secondary mb-1">Tool Name</label>
          <input type="text" id="name" value={name} onChange={e => setName(e.target.value)} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-text-primary focus:ring-2 focus:ring-accent focus:outline-none transition" required />
        </div>
        <div>
          <label htmlFor="link" className="block text-sm font-medium text-text-secondary mb-1">Tool Link</label>
          <input type="url" id="link" value={link} onChange={e => setLink(e.target.value)} placeholder="https://example.com" className="w-full bg-background border border-border rounded-lg px-3 py-2 text-text-primary focus:ring-2 focus:ring-accent focus:outline-none transition" required />
        </div>
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-text-secondary mb-1">Description / Uses</label>
          <textarea id="description" value={description} onChange={e => setDescription(e.target.value)} rows={4} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-text-primary focus:ring-2 focus:ring-accent focus:outline-none transition" required />
        </div>
        <div>
          <label htmlFor="keywords" className="block text-sm font-medium text-text-secondary mb-1">Keywords (comma-separated)</label>
          <input type="text" id="keywords" value={keywords} onChange={e => setKeywords(e.target.value)} placeholder="e.g. image generation, llm, productivity" className="w-full bg-background border border-border rounded-lg px-3 py-2 text-text-primary focus:ring-2 focus:ring-accent focus:outline-none transition" required />
        </div>
        <div>
          <label htmlFor="image" className="block text-sm font-medium text-text-secondary mb-1">Tool Image</label>
          <input type="file" id="image" accept="image/png, image/jpeg, image/webp" onChange={handleImageChange} className="w-full text-sm text-text-secondary file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-secondary" required />
          <p className="text-xs text-gray-500 mt-1">PNG, JPG, or WEBP. Max 2MB.</p>
        </div>
        {imageBase64 && (
          <div className="text-center">
            <p className="text-sm text-text-secondary mb-2">Image Preview:</p>
            <img src={imageBase64} alt="Preview" className="mx-auto max-h-40 rounded-lg border border-border" />
          </div>
        )}
        <div className="flex justify-end gap-4 pt-4">
          <button type="button" onClick={onCancel} disabled={isSubmitting} className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed">Cancel</button>
          <button type="submit" disabled={isSubmitting} className="bg-primary hover:bg-secondary text-white font-bold py-2 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
            {isSubmitting ? 'Submitting...' : (isAdmin ? "Add Tool" : "Submit for Approval")}
          </button>
        </div>
      </form>
    </div>
  );
};

export default SubmissionForm;