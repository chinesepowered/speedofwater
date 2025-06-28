import clientPromise from '@/lib/mongodb';
import SystemPageClient from '@/components/SystemPageClient';
import { ArrowLeft, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

async function getWaterSystem(pwsid: string) {
  const client = await clientPromise;
  const db = client.db('speedofwater');
  const system = await db.collection('pub_water_systems').findOne({ PWSID: pwsid });
  return system;
}

async function getViolations(pwsid: string) {
  const client = await clientPromise;
  const db = client.db('speedofwater');
  
  // Group violations by VIOLATION_ID to avoid showing duplicate violations with multiple enforcement actions
  const violations = await db.collection('violations_enforcement').aggregate([
    { $match: { PWSID: pwsid } },
    { $sort: { NON_COMPL_PER_BEGIN_DATE: -1 } },
    {
      $group: {
        _id: {
          violation_id: '$VIOLATION_ID',
          violation_code: '$VIOLATION_CODE',
          contaminant_code: '$CONTAMINANT_CODE',
          begin_date: '$COMPL_PER_BEGIN_DATE',
          end_date: '$COMPL_PER_END_DATE'
        },
        // Keep the first (most recent) record for display
        violation: { $first: '$$ROOT' },
        // Count enforcement actions for this violation
        enforcementCount: { $sum: 1 },
        // Collect all enforcement IDs
        enforcementIds: { $push: '$ENFORCEMENT_ID' }
      }
    },
    { $sort: { 'violation.NON_COMPL_PER_BEGIN_DATE': -1 } },
    { $limit: 50 },
    {
      $lookup: {
        from: 'ref_code_values',
        let: { 
          violationCode: { 
            $convert: {
              input: '$violation.VIOLATION_CODE',
              to: 'int',
              onError: null,
              onNull: null
            }
          }
        },
        pipeline: [
          { 
            $match: { 
              $expr: { 
                $and: [
                  { $ne: ['$$violationCode', null] },
                  { $eq: ['$VALUE_CODE', '$$violationCode'] },
                  { $eq: ['$VALUE_TYPE', 'VIOLATION_CODE'] }
                ]
              }
            }
          }
        ],
        as: 'violationDetails'
      }
    },
    {
      $lookup: {
        from: 'ref_code_values',
        let: { 
          contaminantCode: { 
            $convert: {
              input: '$violation.CONTAMINANT_CODE',
              to: 'int',
              onError: null,
              onNull: null
            }
          }
        },
        pipeline: [
          { 
            $match: { 
              $expr: { 
                $and: [
                  { $ne: ['$$contaminantCode', null] },
                  { $eq: ['$VALUE_CODE', '$$contaminantCode'] },
                  { $eq: ['$VALUE_TYPE', 'CONTAMINANT_CODE'] }
                ]
              }
            }
          }
        ],
        as: 'contaminantDetails'
      }
    },
    {
      $addFields: {
        'violation.VIOLATION_NAME': { 
          $ifNull: [
            { $arrayElemAt: ['$violationDetails.VALUE_DESCRIPTION', 0] },
            'Unknown violation type'
          ]
        },
        'violation.CONTAMINANT_NAME': { 
          $ifNull: [
            { $arrayElemAt: ['$contaminantDetails.VALUE_DESCRIPTION', 0] },
            'Unknown contaminant'
          ]
        },
        'violation.ENFORCEMENT_COUNT': '$enforcementCount'
      }
    },
    {
      $replaceRoot: { newRoot: '$violation' }
    }
  ]).toArray();
  
  return violations;
}

export default async function SystemPage({ params }: { params: Promise<{ pwsid: string }> }) {
  const { pwsid } = await params;
  
  try {
    // Use Promise.all to run queries in parallel and add timeout
    const [system, violations] = await Promise.all([
      getWaterSystem(pwsid),
      getViolations(pwsid)
    ]);
    
    if (!system) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Water System Not Found</h1>
            <p className="text-gray-600 mb-6">The requested water system could not be located.</p>
            <Link href="/" className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Link>
          </div>
        </div>
      );
    }

    // Separate violations by data completeness and status
    const standardViolations = violations.filter(v => 
      v.VIOLATION_CODE && v.CONTAMINANT_CODE && v.VIOLATION_STATUS
    );
    const enforcementActions = violations.filter(v => 
      !v.VIOLATION_STATUS && v.ENFORCEMENT_ACTION_TYPE_CODE
    );
    
    // Use proper violation status logic:
    // Active = VIOLATION_STATUS is "Unaddressed" or "Addressed" 
    const activeViolations = standardViolations.filter(v => 
      ['Unaddressed', 'Addressed'].includes(v.VIOLATION_STATUS)
    );
    const resolvedViolations = standardViolations.filter(v => 
      ['Resolved', 'Archived'].includes(v.VIOLATION_STATUS)
    );

    // Serialize the data to remove MongoDB ObjectIds and other non-serializable objects
    const serializedSystem = JSON.parse(JSON.stringify(system));
    const serializedViolations = JSON.parse(JSON.stringify(violations));
    const serializedActiveViolations = JSON.parse(JSON.stringify(activeViolations));
    const serializedResolvedViolations = JSON.parse(JSON.stringify(resolvedViolations));
    const serializedEnforcementActions = JSON.parse(JSON.stringify(enforcementActions));

    return (
      <SystemPageClient
        system={serializedSystem}
        violations={serializedViolations}
        activeViolations={serializedActiveViolations}
        resolvedViolations={serializedResolvedViolations}
        enforcementActions={serializedEnforcementActions}
      />
    );

  } catch (error) {
    console.error('Error loading system data:', error);
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg p-8 text-center">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Error Loading System</h1>
          <p className="text-gray-600 mb-6">There was an error loading the water system data. Please try again later.</p>
          <Link href="/" className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>
        </div>
      </div>
    );
  }
}