'use client';

import { useState, useEffect } from 'react';
import { Search as SearchIcon, Loader2, MapPin } from 'lucide-react';
import Link from 'next/link';

interface WaterSystem {
  PWSID: string;
  PWS_NAME: string;
}

const Search = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<WaterSystem[]>([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    if (query.length < 3) {
      setResults([]);
      setShowResults(false);
      return;
    }

    const fetchResults = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/water-systems?q=${query}`);
        const data = await res.json();
        setResults(data.waterSystems || []);
        setShowResults(true);
      } catch (error) {
        console.error('Search error:', error);
        setResults([]);
      }
      setLoading(false);
    };

    const debounceTimer = setTimeout(() => {
      fetchResults();
    }, 500); // Debounce to avoid excessive API calls

    return () => clearTimeout(debounceTimer);
  }, [query]);

  const handleResultClick = () => {
    setShowResults(false);
    setQuery('');
  };

  return (
    <div className="relative w-full max-w-2xl mx-auto">
      <div className="relative">
        <SearchIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search water systems by name or PWSID (e.g., 'Atlanta Water' or 'GA1310022')"
          className="w-full pl-12 pr-12 py-4 text-lg border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all duration-200 bg-white shadow-sm"
          onFocus={() => setShowResults(results.length > 0)}
          onBlur={() => setTimeout(() => setShowResults(false), 200)}
        />
        {loading && (
          <Loader2 className="absolute right-4 top-1/2 transform -translate-y-1/2 text-blue-500 w-5 h-5 animate-spin" />
        )}
      </div>
      
      {showResults && results.length > 0 && (
        <div className="absolute z-50 w-full bg-white border border-gray-200 rounded-xl mt-2 shadow-xl max-h-80 overflow-y-auto">
          <div className="p-2">
            <p className="text-sm text-gray-500 px-3 py-2 border-b border-gray-100">
              Found {results.length} water system{results.length !== 1 ? 's' : ''}
            </p>
            {results.slice(0, 8).map((system) => (
              <Link
                key={system.PWSID}
                href={`/system/${system.PWSID}`}
                onClick={handleResultClick}
                className="flex items-center p-3 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer group"
              >
                <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-lg mr-3 group-hover:bg-blue-200 transition-colors">
                  <MapPin className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">
                    {system.PWS_NAME}
                  </p>
                  <p className="text-sm text-gray-500">
                    PWSID: {system.PWSID}
                  </p>
                </div>
              </Link>
            ))}
            {results.length > 8 && (
              <p className="text-sm text-gray-500 px-3 py-2 text-center border-t border-gray-100">
                Showing first 8 results. Be more specific to narrow down.
              </p>
            )}
          </div>
        </div>
      )}
      
      {showResults && results.length === 0 && query.length >= 3 && !loading && (
        <div className="absolute z-50 w-full bg-white border border-gray-200 rounded-xl mt-2 shadow-xl">
          <div className="p-4 text-center">
            <p className="text-gray-500">No water systems found for "{query}"</p>
            <p className="text-sm text-gray-400 mt-1">
              Try searching by system name or PWSID
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Search; 