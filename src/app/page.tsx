import * as topojson from 'topojson-client';
import Dashboard from '@/components/Dashboard';

export default async function Home() {
  // Fetch and process the geographic data on the server
  const res = await fetch('https://cdn.jsdelivr.net/npm/us-atlas@3/counties-10m.json');
  const usTopoJson = await res.json();

  // Filter for Georgia counties (FIPS code for Georgia is 13)
  const gaCounties = {
    type: "GeometryCollection",
    geometries: usTopoJson.objects.counties.geometries.filter((g: any) => g.id.startsWith('13'))
  };
  
  const gaGeoJson = topojson.feature(usTopoJson, gaCounties);

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div className="z-10 w-full max-w-5xl items-center justify-between font-mono text-sm lg:flex">
        <p className="fixed left-0 top-0 flex w-full justify-center border-b border-gray-300 bg-gradient-to-b from-zinc-200 pb-6 pt-8 backdrop-blur-2xl dark:border-neutral-800 dark:bg-zinc-800/30 dark:from-inherit lg:static lg:w-auto  lg:rounded-xl lg:border lg:bg-gray-200 lg:p-4 lg:dark:bg-zinc-800/30">
          Georgia Water Quality Dashboard
        </p>
      </div>
      
      <Dashboard geoJsonData={gaGeoJson} />

      <div className="mb-32 grid text-center lg:mb-0 lg:w-full lg:max-w-5xl lg:grid-cols-3 lg:text-left">
        <a
          href="#"
          className="group rounded-lg border border-transparent px-5 py-4 transition-colors hover:border-gray-300 hover:bg-gray-100 hover:dark:border-neutral-700 hover:dark:bg-neutral-800/30"
        >
          <h2 className={`mb-3 text-2xl font-semibold`}>
            For the Public
          </h2>
          <p className={`m-0 max-w-[30ch] text-sm opacity-50`}>
            Find out about the quality of your drinking water.
          </p>
        </a>

        <a
          href="#"
          className="group rounded-lg border border-transparent px-5 py-4 transition-colors hover:border-gray-300 hover:bg-gray-100 hover:dark:border-neutral-700 hover:dark:bg-neutral-800/30"
        >
          <h2 className={`mb-3 text-2xl font-semibold`}>
            For Operators
          </h2>
          <p className={`m-0 max-w-[30ch] text-sm opacity-50`}>
            View your system's compliance status and manage tasks.
          </p>
        </a>

        <a
          href="#"
          className="group rounded-lg border border-transparent px-5 py-4 transition-colors hover:border-gray-300 hover:bg-gray-100 hover:dark:border-neutral-700 hover:dark:bg-neutral-800/30"
        >
          <h2 className={`mb-3 text-2xl font-semibold`}>
            For Regulators
          </h2>
          <p className={`m-0 max-w-[30ch] text-sm opacity-50`}>
            Get a high-level overview of water systems across the state.
          </p>
        </a>
      </div>
    </main>
  );
} 