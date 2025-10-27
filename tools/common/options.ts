import type { ToolOptionConfig } from '../../types';

export const languageOptions: ToolOptionConfig = {
    name: 'language',
    label: 'Output Language',
    type: 'select',
    defaultValue: 'English',
    options: [
        { value: 'English', label: 'English' },
        { value: 'Spanish', label: 'Spanish' },
        { value: 'French', label: 'French' },
        { value: 'German', label: 'German' },
        { value: 'Italian', label: 'Italian' },
        { value: 'Portuguese', label: 'Portuguese' },
        { value: 'Dutch', label: 'Dutch' },
        { value: 'Russian', label: 'Russian' },
        { value: 'Japanese', label: 'Japanese' },
        { value: 'Mandarin Chinese', label: 'Mandarin Chinese' },
        { value: 'Korean', label: 'Korean' },
        { value: 'Arabic', label: 'Arabic' },
        { value: 'Hindi', label: 'Hindi' },
        { value: 'Bengali', label: 'Bengali (Bangla)' },
        { value: 'Turkish', label: 'Turkish' },
        { value: 'Polish', label: 'Polish' },
    ]
};
