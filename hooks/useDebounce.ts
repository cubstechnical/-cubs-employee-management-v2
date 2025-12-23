import { useState, useEffect } from 'react';

/**
 * Custom hook to debounce a value.
 * Used for search inputs to prevent filtering on every keystroke.
 * 
 * @param value The value to debounce
 * @param delay The delay in milliseconds (default 500ms)
 * @returns The debounced value
 */
export function useDebounce<T>(value: T, delay: number = 500): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);

    useEffect(() => {
        // Set a timer to update the value after the delay
        const timer = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        // Clean up the timer if the value changes (or component unmounts)
        return () => {
            clearTimeout(timer);
        };
    }, [value, delay]);

    return debouncedValue;
}
