'use client';

import { useState, useEffect, useCallback } from 'react';

export type Theme = 'dark' | 'light';

export function useTheme() {
    const [theme, setTheme] = useState<Theme>('dark');

    // Initialize Theme from localStorage or default to dark
    useEffect(() => {
        try {
            const savedTheme = localStorage.getItem('readr_theme') as Theme | null;
            const chosenTheme = savedTheme || 'dark';
            setTheme(chosenTheme);

            if (chosenTheme === 'dark') {
                document.documentElement.classList.add('dark');
            } else {
                document.documentElement.classList.remove('dark');
            }
        } catch (e) {
            console.error('Failed to access theme from storage:', e);
        }
    }, []);

    // Toggle Theme
    const toggleTheme = useCallback(() => {
        setTheme((prevTheme) => {
            const nextTheme: Theme = prevTheme === 'dark' ? 'light' : 'dark';

            if (nextTheme === 'dark') {
                document.documentElement.classList.add('dark');
            } else {
                document.documentElement.classList.remove('dark');
            }

            try {
                localStorage.setItem('readr_theme', nextTheme);
            } catch (e) {
                console.error('Failed to save theme:', e);
            }

            return nextTheme;
        });
    }, []);

    return { theme, toggleTheme };
}
