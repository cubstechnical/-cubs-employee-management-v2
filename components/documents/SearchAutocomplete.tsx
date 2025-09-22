'use client';

import { useState, useRef, useEffect } from 'react';
import { Search, User, Building, File, ChevronDown, X } from 'lucide-react';
import { useSearchSuggestions } from '@/lib/hooks/useDocuments';

interface SearchSuggestion {
  type: 'employee' | 'company' | 'document';
  id: string;
  name: string;
  company: string;
  displayText: string;
  searchText: string;
}

interface SearchAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSearch: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export default function SearchAutocomplete({
  value,
  onChange,
  onSearch,
  placeholder = "Search documents by name, employee, or company...",
  className = ""
}: SearchAutocompleteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Get search suggestions
  const { data: suggestionsData, isLoading: isSuggestionsLoading } = useSearchSuggestions(value, 8);
  const suggestions = suggestionsData?.suggestions || [];

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        !inputRef.current?.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    setIsOpen(newValue.length >= 2);
    setSelectedIndex(-1);
  };

  // Handle input focus
  const handleInputFocus = () => {
    setIsFocused(true);
    if (value.length >= 2) {
      setIsOpen(true);
    }
  };

  // Handle input blur
  const handleInputBlur = () => {
    setIsFocused(false);
    // Delay closing to allow for suggestion clicks
    setTimeout(() => setIsOpen(false), 150);
  };

  // Handle suggestion selection
  const handleSuggestionSelect = (suggestion: SearchSuggestion) => {
    onChange(suggestion.searchText);
    onSearch(suggestion.searchText);
    setIsOpen(false);
    setSelectedIndex(-1);
    inputRef.current?.blur();
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || suggestions.length === 0) {
      if (e.key === 'Enter') {
        onSearch(value);
        setIsOpen(false);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          handleSuggestionSelect(suggestions[selectedIndex]);
        } else {
          onSearch(value);
          setIsOpen(false);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setSelectedIndex(-1);
        inputRef.current?.blur();
        break;
    }
  };

  // Get icon for suggestion type
  const getSuggestionIcon = (type: string) => {
    switch (type) {
      case 'employee':
        return <User className="w-4 h-4 text-blue-500" />;
      case 'company':
        return <Building className="w-4 h-4 text-green-500" />;
      case 'document':
        return <File className="w-4 h-4 text-purple-500" />;
      default:
        return <Search className="w-4 h-4 text-gray-400" />;
    }
  };

  // Get suggestion type label
  const getSuggestionTypeLabel = (type: string) => {
    switch (type) {
      case 'employee':
        return 'Employee';
      case 'company':
        return 'Company';
      case 'document':
        return 'Document';
      default:
        return 'Result';
    }
  };

  // Clear search
  const handleClear = () => {
    onChange('');
    onSearch('');
    setIsOpen(false);
    setSelectedIndex(-1);
    inputRef.current?.focus();
  };

  return (
    <div className={`relative ${className}`}>
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          onKeyDown={handleKeyDown}
          className="w-full pl-10 pr-10 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
        />
        
        {/* Clear button */}
        {value && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
          >
            <X className="w-4 h-4 text-gray-400" />
          </button>
        )}
      </div>

      {/* Suggestions Dropdown */}
      {isOpen && (
        <div
          ref={dropdownRef}
          className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto"
        >
          {isSuggestionsLoading ? (
            <div className="p-4 text-center text-gray-500 dark:text-gray-400">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-sm">Loading suggestions...</p>
            </div>
          ) : suggestions.length > 0 ? (
            <div className="py-2">
              {suggestions.map((suggestion, index) => (
                <button
                  key={`${suggestion.type}-${suggestion.id}-${index}`}
                  onClick={() => handleSuggestionSelect(suggestion)}
                  className={`w-full px-4 py-3 text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                    index === selectedIndex ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    {getSuggestionIcon(suggestion.type)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {suggestion.displayText}
                        </p>
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                          {getSuggestionTypeLabel(suggestion.type)}
                        </span>
                      </div>
                      {suggestion.type === 'employee' && suggestion.company && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {suggestion.company}
                        </p>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : value.length >= 2 ? (
            <div className="p-4 text-center text-gray-500 dark:text-gray-400">
              <Search className="w-8 h-8 mx-auto mb-2 text-gray-400" />
              <p className="text-sm">No suggestions found</p>
              <p className="text-xs">Try a different search term</p>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}

