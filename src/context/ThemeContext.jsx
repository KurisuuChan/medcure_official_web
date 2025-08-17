import React, { createContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

// Default theme values
const defaultTheme = {
  primaryColor: '#2563eb',
  language: 'en',
  timezone: 'Asia/Manila',
  currency: 'PHP',
  fontFamily: 'Inter',
  fontSize: 'medium',
  borderRadius: 'medium',
  // Color variations based on primary color
  primaryColorRGB: '37, 99, 235',
  primaryColorHover: '#1d4ed8',
  primaryColorLight: '#3b82f6',
  primaryColorDark: '#1e40af',
};

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    // Load theme from localStorage or use defaults
    const savedTheme = localStorage.getItem('medcure-theme');
    if (savedTheme) {
      try {
        return { ...defaultTheme, ...JSON.parse(savedTheme) };
      } catch (error) {
        console.error('Error parsing saved theme:', error);
        return defaultTheme;
      }
    }
    return defaultTheme;
  });

  // Function to convert hex to RGB
  const hexToRgb = (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`
      : '37, 99, 235';
  };

  // Function to generate color variations
  const generateColorVariations = (primaryColor) => {
    // Simple color manipulation - in a real app you might use a color library
    const baseColor = primaryColor.replace('#', '');
    const r = parseInt(baseColor.substr(0, 2), 16);
    const g = parseInt(baseColor.substr(2, 2), 16);
    const b = parseInt(baseColor.substr(4, 2), 16);

    // Generate darker version (hover)
    const hoverR = Math.max(0, r - 30);
    const hoverG = Math.max(0, g - 30);
    const hoverB = Math.max(0, b - 30);
    
    // Generate lighter version
    const lightR = Math.min(255, r + 30);
    const lightG = Math.min(255, g + 30);
    const lightB = Math.min(255, b + 30);
    
    // Generate darker version
    const darkR = Math.max(0, r - 50);
    const darkG = Math.max(0, g - 50);
    const darkB = Math.max(0, b - 50);

    return {
      primaryColorRGB: hexToRgb(primaryColor),
      primaryColorHover: `#${hoverR.toString(16).padStart(2, '0')}${hoverG.toString(16).padStart(2, '0')}${hoverB.toString(16).padStart(2, '0')}`,
      primaryColorLight: `#${lightR.toString(16).padStart(2, '0')}${lightG.toString(16).padStart(2, '0')}${lightB.toString(16).padStart(2, '0')}`,
      primaryColorDark: `#${darkR.toString(16).padStart(2, '0')}${darkG.toString(16).padStart(2, '0')}${darkB.toString(16).padStart(2, '0')}`,
    };
  };

  // Update theme function
  const updateTheme = (newThemeValues) => {
    const updatedTheme = { ...theme, ...newThemeValues };
    
    // If primary color changed, generate color variations
    if (newThemeValues.primaryColor) {
      const colorVariations = generateColorVariations(newThemeValues.primaryColor);
      Object.assign(updatedTheme, colorVariations);
    }
    
    setTheme(updatedTheme);
    
    // Save to localStorage
    localStorage.setItem('medcure-theme', JSON.stringify(updatedTheme));
    
    // Apply CSS custom properties
    applyThemeToDOM(updatedTheme);
  };

  // Apply theme to DOM function
  const applyThemeToDOM = (themeData) => {
    const root = document.documentElement;
    
    // Apply CSS custom properties
    root.style.setProperty('--primary-color', themeData.primaryColor);
    root.style.setProperty('--primary-color-rgb', themeData.primaryColorRGB);
    root.style.setProperty('--primary-color-hover', themeData.primaryColorHover);
    root.style.setProperty('--primary-color-light', themeData.primaryColorLight);
    root.style.setProperty('--primary-color-dark', themeData.primaryColorDark);
    
    // Add language attribute to html element
    document.documentElement.lang = themeData.language;
    
    // Set meta viewport for responsive design based on font size
    const fontSizeScale = {
      small: '14px',
      medium: '16px',
      large: '18px'
    };
    root.style.setProperty('--base-font-size', fontSizeScale[themeData.fontSize] || '16px');
  };

  // Apply theme on mount and when theme changes
  useEffect(() => {
    applyThemeToDOM(theme);
  }, [theme]);

  // Reset theme to defaults
  const resetTheme = () => {
    setTheme(defaultTheme);
    localStorage.removeItem('medcure-theme');
    applyThemeToDOM(defaultTheme);
  };

  // Get theme-based Tailwind classes
  const getThemeClasses = () => {
    return {
      primaryButton: 'bg-[var(--primary-color)] hover:bg-[var(--primary-color-hover)] text-white',
      primaryBorder: 'border-[var(--primary-color)]',
      primaryText: 'text-[var(--primary-color)]',
      primaryBg: 'bg-[var(--primary-color)]',
      primaryBgLight: 'bg-[var(--primary-color-light)]',
      primaryBgHover: 'hover:bg-[var(--primary-color-hover)]',
      primaryRing: 'ring-[var(--primary-color)] focus:ring-[var(--primary-color)]',
    };
  };

  const value = {
    theme,
    updateTheme,
    resetTheme,
    getThemeClasses,
    defaultTheme,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeContext;
