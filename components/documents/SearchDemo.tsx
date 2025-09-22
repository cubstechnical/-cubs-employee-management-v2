'use client';

import { useState } from 'react';
import SearchAutocomplete from './SearchAutocomplete';

export default function SearchDemo() {
  const [searchTerm, setSearchTerm] = useState('');

  const handleSearch = (term: string) => {
    console.log('Search performed:', term);
    // You can add additional search logic here
  };

  return (
    <div className="max-w-md mx-auto p-6">
      <h2 className="text-xl font-semibold mb-4">Search Autocomplete Demo</h2>
      <SearchAutocomplete
        value={searchTerm}
        onChange={setSearchTerm}
        onSearch={handleSearch}
        placeholder="Try typing an employee name, company, or document..."
      />
      {searchTerm && (
        <div className="mt-4 p-3 bg-gray-100 dark:bg-gray-800 rounded">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Current search term: <span className="font-medium">{searchTerm}</span>
          </p>
        </div>
      )}
    </div>
  );
}

