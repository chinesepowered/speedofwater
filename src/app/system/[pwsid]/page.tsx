import clientPromise from '@/lib/mongodb';
import HealthEffects from '@/components/HealthEffects';

async function getWaterSystem(pwsid: string) {
  const client = await clientPromise;
  const db = client.db('speedofwater');
  const system = await db.collection('pub_water_systems').findOne({ PWSID: pwsid });
  return system;
}

async function getViolations(pwsid: string) {
  const client = await clientPromise;
  const db = client.db('speedofwater');
  const violations = await db.collection('violations_enforcement').aggregate([
    { $match: { PWSID: pwsid } },
    {
      $lookup: {
        from: 'ref_code_values',
        localField: 'VIOLATION_CODE',
        foreignField: 'CODE_VALUE',
        as: 'violationDetails'
      }
    },
    {
      $lookup: {
        from: 'ref_code_values',
        localField: 'CONTAMINANT_CODE',
        foreignField: 'CODE_VALUE',
        as: 'contaminantDetails'
      }
    },
    {
      $unwind: { path: "$violationDetails", preserveNullAndEmptyArrays: true }
    },
    {
      $unwind: { path: "$contaminantDetails", preserveNullAndEmptyArrays: true }
    },
    {
      $addFields: {
        VIOLATION_NAME: '$violationDetails.CODE_DESCRIPTION',
        CONTAMINANT_NAME: '$contaminantDetails.CODE_DESCRIPTION',
      }
    }
  ]).toArray();
  return violations;
}

export default async function SystemPage({ params }: { params: { pwsid: string } }) {
  const system = await getWaterSystem(params.pwsid);
  const violations = await getViolations(params.pwsid);

  if (!system) {
    return <div>Water system not found.</div>;
  }

  return (
    <main className="flex min-h-screen flex-col items-center p-24">
      <h1 className="text-4xl font-bold">{system.PWS_NAME}</h1>
      <p className="text-lg text-gray-600">PWSID: {system.PWSID}</p>
      <p>Population Served: {system.POPULATION_SERVED_COUNT}</p>
      
      <div className="mt-10 w-full max-w-5xl">
        <h2 className="text-2xl font-bold">Violations</h2>
        <div className="mt-4">
          {violations.length > 0 ? (
            <ul className="divide-y divide-gray-200">
              {violations.map((violation, index) => (
                <li key={index} className="py-4">
                  <p><strong>Violation:</strong> {violation.VIOLATION_NAME}</p>
                  <p><strong>Contaminant:</strong> {violation.CONTAMINANT_NAME}</p>
                  <p><strong>Date:</strong> {new Date(violation.COMPL_PER_BEGIN_DATE).toLocaleDateString()}</p>
                  {violation.CONTAMINANT_NAME && <HealthEffects contaminantName={violation.CONTAMINANT_NAME} />}
                </li>
              ))}
            </ul>
          ) : (
            <p>No violations found for this system.</p>
          )}
        </div>
      </div>
    </main>
  );
} 