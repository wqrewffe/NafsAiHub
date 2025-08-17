import React, { createContext, useState, useEffect, useContext, ReactNode, useMemo } from 'react';

export interface Theme {
  name: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    light: string;
  };
}

export const themes: Theme[] = [
  { name: 'Slate & Sky', colors: { primary: '#1e293b', secondary: '#334155', accent: '#38bdf8', light: '#f1f5f9' } },
  { name: 'Midnight Dusk', colors: { primary: '#191D2D', secondary: '#2D2F40', accent: '#8A4D76', light: '#EAEAEA' } },
  { name: 'Forest Whisper', colors: { primary: '#1A2E2A', secondary: '#2A4B43', accent: '#58A683', light: '#E8F5E9' } },
  { name: 'Ruby Noir', colors: { primary: '#2D1B22', secondary: '#4A2A33', accent: '#D9465B', light: '#F5E6E8' } },
  { name: 'Golden Twilight', colors: { primary: '#212121', secondary: '#424242', accent: '#FFCA28', light: '#FFFFFF' } },
  { name: 'Oceanic Deep', colors: { primary: '#0F1E3A', secondary: '#1B325F', accent: '#00A896', light: '#D6F5F2' } },
  { name: 'Cyberpunk Neon', colors: { primary: '#000000', secondary: '#1A1A1A', accent: '#FF00FF', light: '#00FFFF' } },
  { name: 'Crimson Night', colors: { primary: '#1B1B1B', secondary: '#301A1A', accent: '#B71C1C', light: '#EEEEEE' } },
  { name: 'Emerald Depths', colors: { primary: '#0E2A20', secondary: '#1A4D39', accent: '#2ECC71', light: '#E8F6EF' } },
  { name: 'Amethyst Haze', colors: { primary: '#241B2F', secondary: '#3D2C4D', accent: '#9B59B6', light: '#F2EBF6' } },
  { name: 'Graphite & Gold', colors: { primary: '#262626', secondary: '#363636', accent: '#F1C40F', light: '#F5F5F5' } },
  { name: 'Arctic Night', colors: { primary: '#2C3E50', secondary: '#34495E', accent: '#5DADE2', light: '#ECF0F1' } },
  { name: 'Volcanic Ash', colors: { primary: '#282C34', secondary: '#3B4048', accent: '#E67E22', light: '#FFFFFF' } },
  { name: 'Mocha Umber', colors: { primary: '#3E2723', secondary: '#5D4037', accent: '#A1887F', light: '#EFEBE9' } },
  { name: 'Cobalt Steel', colors: { primary: '#263238', secondary: '#37474F', accent: '#78909C', light: '#ECEFF1' } },
  { name: 'Rose Quartz', colors: { primary: '#2F2F2F', secondary: '#4F4F4F', accent: '#F4ACB7', light: '#FFE4E1' } },
  { name: 'Abyssal Blue', colors: { primary: '#000814', secondary: '#001d3d', accent: '#0077b6', light: '#caf0f8' } },
  { name: 'Matrix Green', colors: { primary: '#000000', secondary: '#0D0D0D', accent: '#39FF14', light: '#FFFFFF' } },
  { name: 'Sunset Glow', colors: { primary: '#2E1C3A', secondary: '#4A2B55', accent: '#FF7F50', light: '#FADADD' } },
  { name: 'Royal Indigo', colors: { primary: '#1A1A40', secondary: '#272763', accent: '#5353C4', light: '#E0E0FF' } },
  { name: 'Galactic Core', colors: { primary: '#0b071a', secondary: '#1d113f', accent: '#be4bdb', light: '#e4dcf1' } },
  { name: 'Starlight', colors: { primary: '#0a0a23', secondary: '#1d1d4e', accent: '#a6a6f7', light: '#ffffff' } },
  { name: 'Nebula', colors: { primary: '#10002b', secondary: '#240046', accent: '#c77dff', light: '#f2e6ff' } },
  { name: 'Deep Space', colors: { primary: '#000000', secondary: '#0f0f0f', accent: '#00bfff', light: '#ffffff' } },
  { name: 'Quantum', colors: { primary: '#141414', secondary: '#222222', accent: '#00ff7f', light: '#e0e0e0' } },
  { name: 'Bio-luminescence', colors: { primary: '#022c43', secondary: '#053f5e', accent: '#ffd700', light: '#f0f8ff' } },
  { name: 'Obsidian', colors: { primary: '#0B0B0B', secondary: '#1C1C1C', accent: '#9897A9', light: '#D1D1D1' } },
  { name: 'Evergreen', colors: { primary: '#013220', secondary: '#004225', accent: '#8FBC8F', light: '#F0FFF0' } },
  { name: 'Volcano', colors: { primary: '#231F20', secondary: '#382F32', accent: '#FF4500', light: '#FFF5EE' } },
  { name: 'Synthwave', colors: { primary: '#2B0B3F', secondary: '#4A148C', accent: '#FF69B4', light: '#f0f0f0' } },
  { name: 'Carbon Fiber', colors: { primary: '#121212', secondary: '#282828', accent: '#BEBEBE', light: '#E5E5E5' } },
  { name: 'Night Owl', colors: { primary: '#011627', secondary: '#011C33', accent: '#2EC4B6', light: '#FDFFFC' } },
  { name: 'Dracula', colors: { primary: '#282a36', secondary: '#44475a', accent: '#ff79c6', light: '#f8f8f2' } },
  { name: 'Gruvbox Dark', colors: { primary: '#282828', secondary: '#3c3836', accent: '#fabd2f', light: '#ebdbb2' } },
  { name: 'Nord Dark', colors: { primary: '#2e3440', secondary: '#3b4252', accent: '#88c0d0', light: '#d8dee9' } },
  { name: 'Solarized Dark', colors: { primary: '#002b36', secondary: '#073642', accent: '#268bd2', light: '#839496' } },
  { name: 'Monokai', colors: { primary: '#272822', secondary: '#3E3D32', accent: '#A6E22E', light: '#F8F8F2' } },
  { name: 'Tokyo Night', colors: { primary: '#1a1b26', secondary: '#24283b', accent: '#7aa2f7', light: '#c0caf5' } },
  { name: 'Gotham', colors: { primary: '#0c1014', secondary: '#12181f', accent: '#26a98b', light: '#98a2a9' } },
  { name: 'Charcoal', colors: { primary: '#36454F', secondary: '#4F626E', accent: '#82BADC', light: '#FFFFFF' } },
  { name: 'Gunmetal', colors: { primary: '#2C3539', secondary: '#3E4C53', accent: '#B2BEB5', light: '#E1E1E1' } },
  { name: 'Deep Sea', colors: { primary: '#001F3F', secondary: '#003366', accent: '#39CCCC', light: '#F0FFFF' } },
  { name: 'Forest Night', colors: { primary: '#222d22', secondary: '#344e41', accent: '#a3b18a', light: '#dad7cd' } },
  { name: 'Autumn Evening', colors: { primary: '#3d1c02', secondary: '#5a2a02', accent: '#e85d04', light: '#fff3e0' } },
  { name: 'Midnight Purple', colors: { primary: '#2e0249', secondary: '#52057b', accent: '#892cdc', light: '#e4d7ff' } },
  { name: 'Wizards Study', colors: { primary: '#1e1b18', secondary: '#4a3f35', accent: '#a98d75', light: '#e5dcd2' } },
  { name: 'Dark Teal', colors: { primary: '#004d40', secondary: '#00695c', accent: '#4db6ac', light: '#e0f2f1' } },
  { name: 'City at Night', colors: { primary: '#000033', secondary: '#191970', accent: '#FFD700', light: '#F5F5F5' } },
  { name: 'Espresso', colors: { primary: '#2a1a1f', secondary: '#4d2e36', accent: '#b08968', light: '#e6dcd2' } },
  { name: 'Black Hole', colors: { primary: '#010101', secondary: '#101010', accent: '#5F00FF', light: '#EAEAEA' } },
  { name: 'Deep Jungle', colors: { primary: '#002626', secondary: '#0e4749', accent: '#95c623', light: '#e4f6e1' } },
  { name: 'Red Alert', colors: { primary: '#190000', secondary: '#4c0000', accent: '#ff0000', light: '#fdecec' } },
  { name: 'Hacker', colors: { primary: '#0a0a0a', secondary: '#1a1a1a', accent: '#00ff00', light: '#c0c0c0' } },
  { name: 'Industrial', colors: { primary: '#333333', secondary: '#444444', accent: '#FF6F61', light: '#FFFFFF' } },
  { name: 'Deep Indigo', colors: { primary: '#303F9F', secondary: '#3F51B5', accent: '#FF4081', light: '#C5CAE9' } },
  { name: 'Velvet', colors: { primary: '#1a001a', secondary: '#330033', accent: '#ff00ff', light: '#fce4fc' } },
  { name: 'Dark Academia', colors: { primary: '#3a2e2c', secondary: '#5c4d4b', accent: '#a38d78', light: '#e8e0d9' } },
  { name: 'Cosmic Latte', colors: { primary: '#261C15', secondary: '#3E2C22', accent: '#FFF8E7', light: '#DDC9B4' } },
  { name: 'Stealth', colors: { primary: '#1E2021', secondary: '#313335', accent: '#4A4E51', light: '#B0B3B8' } },
  { name: 'Firefly', colors: { primary: '#081421', secondary: '#162b40', accent: '#fca311', light: '#e5e5e5' } },
  { name: 'Paper White', colors: { primary: '#ffffff', secondary: '#f5f5f5', accent: '#4285f4', light: '#202124' } },
  { name: 'Linen', colors: { primary: '#faf0e6', secondary: '#ffffff', accent: '#8b4513', light: '#362719' } },
  { name: 'Seashell', colors: { primary: '#fff5ee', secondary: '#ffffff', accent: '#ff7f50', light: '#5c3a2b' } },
  { name: 'Minty Fresh', colors: { primary: '#f0fbf4', secondary: '#ffffff', accent: '#4ade80', light: '#14532d' } },
  { name: 'Lavender Bliss', colors: { primary: '#f3e8ff', secondary: '#ffffff', accent: '#a855f7', light: '#4a044e' } },
  { name: 'Peach Keen', colors: { primary: '#fff0e5', secondary: '#ffffff', accent: '#ff7043', light: '#6d2813' } },
  { name: 'Sky Blue', colors: { primary: '#e0f2fe', secondary: '#ffffff', accent: '#38bdf8', light: '#0c4a6e' } },
  { name: 'Solarized Light', colors: { primary: '#fdf6e3', secondary: '#eee8d5', accent: '#268bd2', light: '#657b83' } },
  { name: 'Gruvbox Light', colors: { primary: '#fbf1c7', secondary: '#ebdbb2', accent: '#d65d0e', light: '#3c3836' } },
  { name: 'Minimalist Gray', colors: { primary: '#e5e5e5', secondary: '#f0f0f0', accent: '#707070', light: '#121212' } },
  { name: 'Classic Blue', colors: { primary: '#FFFFFF', secondary: '#EDF2F7', accent: '#3182CE', light: '#2D3748' } },
  { name: 'Corporate', colors: { primary: '#F7FAFC', secondary: '#FFFFFF', accent: '#2B6CB0', light: '#1A202C' } },
  { name: 'Bamboo', colors: { primary: '#f5f5f0', secondary: '#ffffff', accent: '#3d8b3d', light: '#222f22' } },
  { name: 'Cherry Blossom', colors: { primary: '#fff0f3', secondary: '#ffffff', accent: '#e56399', light: '#6a1639' } },
  { name: 'Buttercream', colors: { primary: '#fffbe6', secondary: '#ffffff', accent: '#f59e0b', light: '#78350f' } },
  { name: 'Stone', colors: { primary: '#e7e5e4', secondary: '#f5f5f4', accent: '#78716c', light: '#292524' } },
  { name: 'Arctic', colors: { primary: '#f9fafb', secondary: '#ffffff', accent: '#60a5fa', light: '#111827' } },
  { name: 'Daylight', colors: { primary: '#ffffff', secondary: '#f1f5f9', accent: '#f59e0b', light: '#1e293b' } },
  { name: 'Sage', colors: { primary: '#f0fdf4', secondary: '#ffffff', accent: '#84cc16', light: '#1a2e05' } },
  { name: 'Aperture', colors: { primary: '#EAEAEA', secondary: '#FFFFFF', accent: '#FF6F00', light: '#000000' } },
  { name: 'Sakura', colors: { primary: '#FFF5F7', secondary: '#FFFFFF', accent: '#D6336C', light: '#59001D' } },
  { name: 'Sandstone', colors: { primary: '#FEF3C7', secondary: '#FFFBEB', accent: '#D97706', light: '#78350F' } },
  { name: 'Periwinkle', colors: { primary: '#E0E7FF', secondary: '#EEF2FF', accent: '#6366F1', light: '#312E81' } },
  { name: 'Clean Slate', colors: { primary: '#F8F9FA', secondary: '#FFFFFF', accent: '#6C757D', light: '#212529' } },
  { name: 'Aqua', colors: { primary: '#E0FFFF', secondary: '#F0FFFF', accent: '#00CED1', light: '#003334' } },
  { name: 'Spring', colors: { primary: '#F0FFF0', secondary: '#FFFFFF', accent: '#3CB371', light: '#003314' } },
  { name: 'Vanilla', colors: { primary: '#FAFAD2', secondary: '#FFFFF0', accent: '#BDB76B', light: '#333300' } },
  { name: 'Cotton', colors: { primary: '#F0F8FF', secondary: '#FFFFFF', accent: '#4682B4', light: '#00192C' } },
  { name: 'Misty Rose', colors: { primary: '#FFE4E1', secondary: '#FFF0F0', accent: '#BC8F8F', light: '#4c2626' } },
  { name: 'Lemonade', colors: { primary: '#FFFACD', secondary: '#FFFFE0', accent: '#FFD700', light: '#4d4d00' } },
  { name: 'Bubblegum', colors: { primary: '#fec5e5', secondary: '#f8d5ee', accent: '#ff85a1', light: '#6a0033' } },
  { name: 'Retro Groove', colors: { primary: '#f2e5d5', secondary: '#ffffff', accent: '#e86a33', light: '#4a2511' } },
  { name: 'Solarpunk', colors: { primary: '#f3f7e9', secondary: '#ffffff', accent: '#53b47c', light: '#245237' } },
  { name: 'Cottagecore', colors: { primary: '#fdf8f0', secondary: '#ffffff', accent: '#b9926b', light: '#4d3d2c' } },
  { name: 'Ocean Sunset', colors: { primary: '#023047', secondary: '#219ebc', accent: '#ffb703', light: '#f1faee' } },
  { name: 'Jungle Moss', colors: { primary: '#1e3329', secondary: '#2e4d3d', accent: '#9ccc65', light: '#e8f5e9' } },
  { name: 'Candy Apple', colors: { primary: '#f8f9fa', secondary: '#ffffff', accent: '#e63946', light: '#212529' } },
  { name: 'Grape Soda', colors: { primary: '#3d2b56', secondary: '#533a78', accent: '#d09aff', light: '#f7f2ff' } },
  { name: 'Burning Ember', colors: { primary: '#2d0f04', secondary: '#4e1a06', accent: '#ff6700', light: '#fff8e1' } },
  { name: 'Azure', colors: { primary: '#f0f9ff', secondary: '#ffffff', accent: '#0ea5e9', light: '#082f49' } },
  { name: 'Neon Sunset', colors: { primary: '#101010', secondary: '#202020', accent: '#fc5404', light: '#f5f5f5' } },
  { name: 'Pastel Dream', colors: { primary: '#fce7f3', secondary: '#ffffff', accent: '#f472b6', light: '#831843' } },
  { name: 'Irish Meadow', colors: { primary: '#00420c', secondary: '#006412', accent: '#00e029', light: '#f0fff2' } },
  { name: 'Terra Cotta', colors: { primary: '#e2725b', secondary: '#f08080', accent: '#ffffff', light: '#2e110c' } },
  { name: 'Deep Water', colors: { primary: '#005f73', secondary: '#0a9396', accent: '#e9d8a6', light: '#ffffff' } },
  { name: 'Cosmic Dust', colors: { primary: '#39304A', secondary: '#524369', accent: '#E845A0', light: '#E8E4ED' } },
  { name: 'Goldenrod', colors: { primary: '#fdfdea', secondary: '#fefbe9', accent: '#facc15', light: '#422006' } },
  { name: 'Lilac Garden', colors: { primary: '#E6E6FA', secondary: '#F8F8FF', accent: '#9370DB', light: '#32224a' } },
  { name: 'Teal & Orange', colors: { primary: '#024959', secondary: '#036873', accent: '#F28705', light: '#F2F2F2' } },
  { name: 'Raspberry', colors: { primary: '#fdf2f8', secondary: '#fff', accent: '#e11d48', light: '#500724' } },
  { name: 'Olive Grove', colors: { primary: '#3d402b', secondary: '#585c3e', accent: '#adae95', light: '#f3f4f0' } },
  { name: 'Muted Rainbow', colors: { primary: '#464d77', secondary: '#36827f', accent: '#f9db6d', light: '#fcfcfc' } },
  { name: 'Hot Dog Stand', colors: { primary: '#fefce8', secondary: '#ffffff', accent: '#ef4444', light: '#7f1d1d' } },
  { name: 'Blueprint', colors: { primary: '#0d3b66', secondary: '#1e5387', accent: '#faf0ca', light: '#ffffff' } },
  { name: 'Cinnamon', colors: { primary: '#6d2e13', secondary: '#8a4831', accent: '#e29468', light: '#fceee6' } },
  { name: 'Dune', colors: { primary: '#e3d5b8', secondary: '#f5efde', accent: '#a47e3b', light: '#3a2e1d' } },
  { name: 'Poppy Field', colors: { primary: '#1e4620', secondary: '#2e6b30', accent: '#ff312e', light: '#f0f5f0' } },
  { name: 'Byzantium', colors: { primary: '#3c183f', secondary: '#702670', accent: '#d74ea2', light: '#fbe9fb' } },
  { name: 'Ice Cream Parlor', colors: { primary: '#fff0f5', secondary: '#ffffff', accent: '#ff8fab', light: '#7a0c2e' } },
  { name: 'Tropicana', colors: { primary: '#007f5f', secondary: '#2b9348', accent: '#f9c74f', light: '#ffffff' } },
];


interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  themes: Theme[];
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>(() => {
    try {
      const storedTheme = localStorage.getItem('app-theme');
      return storedTheme ? JSON.parse(storedTheme) : themes[0];
    } catch (error) {
      console.error("Failed to parse theme from localStorage", error);
      return themes[0];
    }
  });

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--color-primary', theme.colors.primary);
    root.style.setProperty('--color-secondary', theme.colors.secondary);
    root.style.setProperty('--color-accent', theme.colors.accent);
    root.style.setProperty('--color-light', theme.colors.light);

    try {
      localStorage.setItem('app-theme', JSON.stringify(theme));
    } catch (error) {
      console.error("Failed to save theme to localStorage", error);
    }
  }, [theme]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };

  const value = useMemo(() => ({ theme, setTheme, themes }), [theme]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
