import clientPromise from '@/lib/mongodb';

// We'll use the same data fetching functions from the system details page
// In a real app, these would be in a shared lib file
async function getWaterSystem(pwsid: string) {
  const client = await clientPromise;
  const db = client.db('speedofwater');
  const system = await db.collection('pub_water_systems').findOne({ PWSID: pwsid });
  return system;
}

async function getViolations(pwsid: string) {
  const client = await clientPromise;
  const db = client.db('speedofwater');
  const violations = await db.collection('violations_enforcement').find({ PWSID: pwsid }).toArray();
  return violations;
}

export default async function OperatorDashboard() {
  // For now, let's hardcode a PWSID to represent the logged-in operator's system
  const pwsid = 'GA0170014'; // Example: CITY OF BUFORD
  const system = await getWaterSystem(pwsid);
  const violations = await getViolations(pwsid);

  if (!system) {
    return <div>Could not load data for water system {pwsid}</div>
  }

  return (
    <main className="flex min-h-screen flex-col items-center p-24">
      <div className="w-full max-w-5xl">
        <h1 className="text-4xl font-bold">Operator Dashboard</h1>
        <p className="mt-2 text-lg text-gray-600">
          Welcome, Operator for {system.PWS_NAME} ({system.PWSID})
        </p>
        
        <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Stats cards will go here */}
          <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
            <h3 className="text-2xl font-semibold leading-none tracking-tight">Active Violations</h3>
            <p className="text-4xl font-bold mt-2">{violations.length}</p>
          </div>
          <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
            <h3 className="text-2xl font-semibold leading-none tracking-tight">Samples Due</h3>
            <p className="text-4xl font-bold mt-2">2</p> {/* Mock data */}
          </div>
          <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
            <h3 className="text-2xl font-semibold leading-none tracking-tight">Population Served</h3>
            <p className="text-4xl font-bold mt-2">{Number(system.POPULATION_SERVED_COUNT).toLocaleString()}</p>
          </div>
        </div>

        <div className="mt-10">
          <h2 className="text-2xl font-bold">Recent Violations</h2>
          <div className="mt-4 rounded-lg border bg-card text-card-foreground shadow-sm">
            <div className="p-6">
              {violations.length > 0 ? (
                <ul className="divide-y divide-gray-200">
                  {violations.slice(0, 5).map((violation, index) => (
                    <li key={index} className="py-4">
                      <p><strong>Violation:</strong> {violation.VIOLATION_NAME}</p>
                      <p><strong>Date:</strong> {new Date(violation.COMPL_PER_BEGIN_DATE).toLocaleDateString()}</p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p>No violations found for this system.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
} 