'use client';

import dynamic from 'next/dynamic';
import Search from '@/components/Search';
import { Suspense } from 'react';

const Map = dynamic(() => import('@/components/Map'), {
  ssr: false,
});

export default function Dashboard({ geoJsonData }: { geoJsonData: any }) {
  return (
    <>
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-6xl">
          Understanding Georgia's Water
        </h1>
        <p className="mt-6 text-lg leading-8 text-gray-600 dark:text-gray-300">
          Search for your local water system to see its latest quality report.
        </p>
        <div className="mt-10 flex items-center justify-center gap-x-6">
          <Search />
        </div>
      </div>

      <div className="w-full max-w-5xl mt-10">
        <Suspense fallback={<div>Loading map...</div>}>
          <Map geoJsonData={geoJsonData} />
        </Suspense>
      </div>
    </>
  );
} 