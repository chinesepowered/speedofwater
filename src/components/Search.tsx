'use client';

import { useState, useEffect } from 'react';

interface WaterSystem {
  PWSID: string;
  PWS_NAME: string;
}

const Search = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<WaterSystem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (query.length < 3) {
      setResults([]);
      return;
    }

    const fetchResults = async () => {
      setLoading(true);
      const res = await fetch(`/api/water-systems?q=${query}`);
      const data = await res.json();
      setResults(data.waterSystems);
      setLoading(false);
    };

    const debounceTimer = setTimeout(() => {
      fetchResults();
    }, 500); // Debounce to avoid excessive API calls

    return () => clearTimeout(debounceTimer);
  }, [query]);

  return (
    <div className="relative">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search for your water system by name or ID..."
        className="w-full p-2 border border-gray-300 rounded-md"
      />
      {loading && <p>Loading...</p>}
      {results.length > 0 && (
        <ul className="absolute z-10 w-full bg-white border border-gray-300 rounded-md mt-1">
          {results.map((system) => (
            <li key={system.PWSID}>
              <a href={`/system/${system.PWSID}`} className="block p-2 hover:bg-gray-100 cursor-pointer">
                {system.PWS_NAME} ({system.PWSID})
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default Search; 