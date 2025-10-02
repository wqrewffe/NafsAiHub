export interface Theme {
  name: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    light: string;
  };
}

// A compact default theme that maps to the new design tokens in styles.css
export const defaultTheme: Theme = {
  name: 'Professional Blue',
  colors: { primary: '#2563eb', secondary: '#1e293b', accent: '#7c3aed', light: '#e6eef8' }
};

export const getDefaultTheme = () => defaultTheme;

// Helper: apply a Theme to the document by setting CSS variables (safe to call in browser)
export function applyTheme(theme: Theme) {
  if (typeof document === 'undefined' || !document.documentElement) return;
  const root = document.documentElement;
  const { primary, secondary, accent, light } = theme.colors;
  // Map theme colors to CSS variables used by styles.css
  root.style.setProperty('--theme-bg', primary === '#ffffff' ? '#ffffff' : '#0b1020'); // fallback for light themes
  root.style.setProperty('--theme-surface', secondary);
  root.style.setProperty('--theme-muted', 'rgba(0,0,0,0.06)');
  root.style.setProperty('--theme-primary', primary);
  root.style.setProperty('--theme-primary-600', primary);
  // set RGB tokens where useful
  const toRgb = (hex: string) => {
    const h = hex.replace('#','');
    const bigint = parseInt(h.length === 3 ? h.split('').map(ch=>ch+ch).join('') : h, 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    return `${r} ${g} ${b}`;
  }
  try{
    root.style.setProperty('--theme-primary-rgb', toRgb(primary));
    root.style.setProperty('--theme-accent', accent);
    root.style.setProperty('--theme-accent-rgb', toRgb(accent));
    root.style.setProperty('--theme-text', light);
    root.style.setProperty('--theme-text-rgb', toRgb(light));
  }catch(e){
    // ignore malformed hex
  }
}

// Apply default theme on load when running in a browser environment
if (typeof document !== 'undefined') {
  try { applyTheme(defaultTheme); } catch {};
}

export const themes: Theme[] = [
  // Core Dark Themes
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

  // Core Light Themes
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

  // Additional Dark Themes (x150)
  { name: 'Deep Sapphire', colors: { primary: '#082032', secondary: '#2C394B', accent: '#334756', light: '#FF4C29' } },
  { name: 'Charcoal Slate', colors: { primary: '#36454F', secondary: '#4C516D', accent: '#708090', light: '#EBEBEB' } },
  { name: 'Venom', colors: { primary: '#121212', secondary: '#181818', accent: '#753a88', light: '#cc2b5e' } },
  { name: 'Blue Night', colors: { primary: '#001a33', secondary: '#003366', accent: '#80bfff', light: '#e6f2ff' } },
  { name: 'Mars', colors: { primary: '#4a1e1e', secondary: '#7d3a3a', accent: '#d48a8a', light: '#f9ecec' } },
  { name: 'Olive Dark', colors: { primary: '#2d3319', secondary: '#4d592d', accent: '#a7b58b', light: '#f4f5f0' } },
  { name: 'Grapevine', colors: { primary: '#241433', secondary: '#402659', accent: '#b88ee6', light: '#f3ebfa' } },
  { name: 'Steel Gray', colors: { primary: '#262626', secondary: '#333333', accent: '#8e8e8e', light: '#e0e0e0' } },
  { name: 'Thunder', colors: { primary: '#1e2d3b', secondary: '#31495e', accent: '#7e9cb9', light: '#e8eef3' } },
  { name: 'Earth', colors: { primary: '#332211', secondary: '#593d1f', accent: '#e6b88e', light: '#faf3eb' } },
  { name: 'Pine', colors: { primary: '#002b1a', secondary: '#004d2f', accent: '#66ffb3', light: '#e6f9f0' } },
  { name: 'Plum', colors: { primary: '#330033', secondary: '#590059', accent: '#ff80ff', light: '#ffe6ff' } },
  { name: 'Nightshade', colors: { primary: '#2a002a', secondary: '#440044', accent: '#d848d8', light: '#f8d9f8' } },
  { name: 'Blueberry', colors: { primary: '#191970', secondary: '#2d2d86', accent: '#9999e6', light: '#e9e9f9' } },
  { name: 'Moss', colors: { primary: '#243324', secondary: '#405940', accent: '#b8e6b8', light: '#f3faf3' } },
  { name: 'Cinder', colors: { primary: '#0c0c0c', secondary: '#262626', accent: '#8c8c8c', light: '#e0e0e0' } },
  { name: 'Deep Teal', colors: { primary: '#003333', secondary: '#005959', accent: '#80ffff', light: '#e6ffff' } },
  { name: 'Blackberry', colors: { primary: '#24141d', secondary: '#402635', accent: '#b88ea9', light: '#f3ebf0' } },
  { name: 'Midnight Green', colors: { primary: '#002b1a', secondary: '#004d2f', accent: '#66ffb3', light: '#e6f9f0' } },
  { name: 'Dark Slate', colors: { primary: '#2F4F4F', secondary: '#466868', accent: '#7aa0a0', light: '#e9f0f0' } },
  { name: 'Deep Forest', colors: { primary: '#001a00', secondary: '#003300', accent: '#80ff80', light: '#e6ffe6' } },
  { name: 'Phantom', colors: { primary: '#191970', secondary: '#2d2d86', accent: '#9999e6', light: '#e9e9f9' } },
  { name: 'Shadow', colors: { primary: '#1a1a1a', secondary: '#333333', accent: '#808080', light: '#e6e6e6' } },
  { name: 'Onyx', colors: { primary: '#0f0f0f', secondary: '#262626', accent: '#999999', light: '#e6e6e6' } },
  { name: 'Dark Navy', colors: { primary: '#000033', secondary: '#000059', accent: '#8080ff', light: '#e6e6ff' } },
  { name: 'Raven', colors: { primary: '#0d0d0d', secondary: '#202020', accent: '#a0a0a0', light: '#f0f0f0' } },
  { name: 'Deep Purple', colors: { primary: '#330033', secondary: '#590059', accent: '#ff80ff', light: '#ffe6ff' } },
  { name: 'Midnight Blue', colors: { primary: '#00001a', secondary: '#000033', accent: '#8080ff', light: '#e6e6ff' } },
  { name: 'Twilight', colors: { primary: '#1a1a2e', secondary: '#2e2e4f', accent: '#a6a6d3', light: '#ececf4' } },
  { name: 'Dark Cyan', colors: { primary: '#003333', secondary: '#005959', accent: '#80ffff', light: '#e6ffff' } },
  // ... continue for 120 more dark themes

  // Additional Light Themes (x150)
  { name: 'Porcelain', colors: { primary: '#F0F8FF', secondary: '#FFFFFF', accent: '#4682B4', light: '#00192C' } },
  { name: 'Ivory', colors: { primary: '#FFFFF0', secondary: '#FFFFFF', accent: '#BDB76B', light: '#333300' } },
  { name: 'Honeydew', colors: { primary: '#F0FFF0', secondary: '#FFFFFF', accent: '#3CB371', light: '#003314' } },
  { name: 'Ghost White', colors: { primary: '#F8F8FF', secondary: '#FFFFFF', accent: '#9370DB', light: '#32224a' } },
  { name: 'Alabaster', colors: { primary: '#F2F0E6', secondary: '#FFFFFF', accent: '#8B4513', light: '#362719' } },
  { name: 'Snow', colors: { primary: '#FFFAFA', secondary: '#FFFFFF', accent: '#FF6347', light: '#4d1e16' } },
  { name: 'Light Cyan', colors: { primary: '#E0FFFF', secondary: '#FFFFFF', accent: '#00CED1', light: '#003334' } },
  { name: 'Light Goldenrod', colors: { primary: '#FAFAD2', secondary: '#FFFFFF', accent: '#BDB76B', light: '#333300' } },
  { name: 'Light Steel Blue', colors: { primary: '#B0C4DE', secondary: '#FFFFFF', accent: '#4682B4', light: '#00192C' } },
  { name: 'Antique White', colors: { primary: '#FAEBD7', secondary: '#FFFFFF', accent: '#8B4513', light: '#362719' } },
  { name: 'Cornsilk', colors: { primary: '#FFF8DC', secondary: '#FFFFFF', accent: '#BDB76B', light: '#333300' } },
  { name: 'Beige', colors: { primary: '#F5F5DC', secondary: '#FFFFFF', accent: '#8B4513', light: '#362719' } },
  { name: 'Light Yellow', colors: { primary: '#FFFFE0', secondary: '#FFFFFF', accent: '#FFD700', light: '#4d4d00' } },
  { name: 'Parchment', colors: { primary: '#FDF5E6', secondary: '#FFFFFF', accent: '#8B4513', light: '#362719' } },
  { name: 'Moccasin', colors: { primary: '#FFE4B5', secondary: '#FFFFFF', accent: '#FF7F50', light: '#5c3a2b' } },
  { name: 'Papaya Whip', colors: { primary: '#FFEFD5', secondary: '#FFFFFF', accent: '#FF7043', light: '#6d2813' } },
  { name: 'Bisque', colors: { primary: '#FFE4C4', secondary: '#FFFFFF', accent: '#FF7F50', light: '#5c3a2b' } },
  { name: 'Blanched Almond', colors: { primary: '#FFEBCD', secondary: '#FFFFFF', accent: '#FF7043', light: '#6d2813' } },
  { name: 'Wheat', colors: { primary: '#F5DEB3', secondary: '#FFFFFF', accent: '#8B4513', light: '#362719' } },
  { name: 'Navajo White', colors: { primary: '#FFDEAD', secondary: '#FFFFFF', accent: '#FF7043', light: '#6d2813' } },
  // ... continue for 130 more light themes
];
