import clientPromise from '@/lib/mongodb';
import HealthEffects from '@/components/HealthEffects';
import { ArrowLeft, MapPin, Users, AlertTriangle, CheckCircle, Calendar, Droplets } from 'lucide-react';
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
  
  // Much faster query - get basic violations first, skip expensive lookups for now
  const violations = await db.collection('violations_enforcement').find(
    { PWSID: pwsid },
    { 
      sort: { NON_COMPL_PER_BEGIN_DATE: -1 },
      limit: 50 // Reduced limit for faster loading
    }
  ).toArray();
  
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

    // Filter out invalid/incomplete records first
    const validViolations = violations.filter(v => 
      v.VIOLATION_CODE && v.CONTAMINANT_CODE && v.VIOLATION_STATUS
    );
    
    // Use proper violation status logic:
    // Active = VIOLATION_STATUS is "Unaddressed" or "Addressed" 
    const activeViolations = validViolations.filter(v => 
      ['Unaddressed', 'Addressed'].includes(v.VIOLATION_STATUS)
    );
    const resolvedViolations = validViolations.filter(v => 
      ['Resolved', 'Archived'].includes(v.VIOLATION_STATUS)
    );

    return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <Link href="/" className="inline-flex items-center text-blue-600 hover:text-blue-800 transition-colors">
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Map
            </Link>
            <div className="flex items-center space-x-2">
              <Droplets className="w-6 h-6 text-blue-600" />
              <span className="text-sm font-medium text-gray-600">Georgia Water Quality</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* System Header */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">{system.PWS_NAME}</h1>
              <div className="flex items-center text-gray-600 mb-4">
                <MapPin className="w-5 h-5 mr-2" />
                <span className="text-lg">PWSID: {system.PWSID}</span>
              </div>
            </div>
            <div className="text-right">
              {activeViolations.length === 0 ? (
                <div className="flex items-center text-green-600 bg-green-50 px-4 py-2 rounded-full">
                  <CheckCircle className="w-5 h-5 mr-2" />
                  <span className="font-medium">No Active Violations</span>
                </div>
              ) : (
                <div className="flex items-center text-red-600 bg-red-50 px-4 py-2 rounded-full">
                  <AlertTriangle className="w-5 h-5 mr-2" />
                  <span className="font-medium">{activeViolations.length} Active Violation{activeViolations.length !== 1 ? 's' : ''}</span>
                </div>
              )}
            </div>
          </div>

          {/* System Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-blue-50 rounded-lg p-6">
              <div className="flex items-center">
                <Users className="w-8 h-8 text-blue-600 mr-3" />
                <div>
                  <p className="text-sm font-medium text-blue-600">Population Served</p>
                  <p className="text-2xl font-bold text-blue-900">{system.POPULATION_SERVED_COUNT?.toLocaleString() || 'N/A'}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-indigo-50 rounded-lg p-6">
              <div className="flex items-center">
                <Droplets className="w-8 h-8 text-indigo-600 mr-3" />
                <div>
                  <p className="text-sm font-medium text-indigo-600">System Type</p>
                  <p className="text-2xl font-bold text-indigo-900">{system.PWS_TYPE_CODE || 'N/A'}</p>
                </div>
              </div>
            </div>

            <div className="bg-purple-50 rounded-lg p-6">
              <div className="flex items-center">
                <Calendar className="w-8 h-8 text-purple-600 mr-3" />
                <div>
                  <p className="text-sm font-medium text-purple-600">Last Updated</p>
                  <p className="text-2xl font-bold text-purple-900">{system.SUBMISSIONYEARQUARTER || 'N/A'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          {(system.OWNER_NAME || system.ORG_NAME) && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Contact Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                {system.OWNER_NAME && (
                  <div>
                    <span className="font-medium text-gray-700">Owner:</span>
                    <span className="ml-2 text-gray-600">{system.OWNER_NAME}</span>
                  </div>
                )}
                {system.ORG_NAME && (
                  <div>
                    <span className="font-medium text-gray-700">Organization:</span>
                    <span className="ml-2 text-gray-600">{system.ORG_NAME}</span>
                  </div>
                )}
                {system.OWNER_PHONE && (
                  <div>
                    <span className="font-medium text-gray-700">Phone:</span>
                    <span className="ml-2 text-gray-600">{system.OWNER_PHONE}</span>
                  </div>
                )}
                {system.OWNER_EMAIL && (
                  <div>
                    <span className="font-medium text-gray-700">Email:</span>
                    <span className="ml-2 text-gray-600">{system.OWNER_EMAIL}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Violations Section */}
        <div className="space-y-8">
          {/* Active Violations */}
          {activeViolations.length > 0 && (
            <div className="bg-white rounded-xl shadow-lg p-8">
              <div className="flex items-center mb-6">
                <AlertTriangle className="w-6 h-6 text-red-600 mr-3" />
                <h2 className="text-2xl font-bold text-gray-900">Active Violations</h2>
                <span className="ml-3 bg-red-100 text-red-800 text-sm font-medium px-3 py-1 rounded-full">
                  {activeViolations.length}
                </span>
              </div>
              <div className="space-y-6">
                {activeViolations.map((violation, index) => (
                  <div key={index} className="border border-red-200 rounded-lg p-6 bg-red-50">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-2">Violation Code</h3>
                        <p className="text-gray-700">{violation.VIOLATION_CODE || 'Not specified'}</p>
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-2">Contaminant Code</h3>
                        <p className="text-gray-700">{violation.CONTAMINANT_CODE || 'Not specified'}</p>
                      </div>
                    </div>
                    {violation.COMPL_PER_BEGIN_DATE && (
                      <div className="mb-4">
                        <span className="font-medium text-gray-700">Compliance Period:</span>
                        <span className="ml-2 text-gray-600">
                          {new Date(violation.COMPL_PER_BEGIN_DATE).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                    {violation.CONTAMINANT_CODE && (
                      <HealthEffects contaminantName={violation.CONTAMINANT_CODE} />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Resolved Violations */}
          {resolvedViolations.length > 0 && (
            <div className="bg-white rounded-xl shadow-lg p-8">
              <div className="flex items-center mb-6">
                <CheckCircle className="w-6 h-6 text-green-600 mr-3" />
                <h2 className="text-2xl font-bold text-gray-900">Resolved Violations</h2>
                <span className="ml-3 bg-green-100 text-green-800 text-sm font-medium px-3 py-1 rounded-full">
                  {resolvedViolations.length}
                </span>
              </div>
              <div className="space-y-4">
                {resolvedViolations.map((violation, index) => (
                  <div key={index} className="border border-green-200 rounded-lg p-4 bg-green-50">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <span className="font-medium text-gray-700">Violation Code:</span>
                        <p className="text-gray-600 text-sm">{violation.VIOLATION_CODE || 'Not specified'}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Contaminant Code:</span>
                        <p className="text-gray-600 text-sm">{violation.CONTAMINANT_CODE || 'Not specified'}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Date:</span>
                        <p className="text-gray-600 text-sm">
                          {violation.COMPL_PER_BEGIN_DATE ? new Date(violation.COMPL_PER_BEGIN_DATE).toLocaleDateString() : 'Not specified'}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* No Violations */}
          {validViolations.length === 0 && (
            <div className="bg-white rounded-xl shadow-lg p-8 text-center">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">No Valid Violations Found</h2>
              <p className="text-gray-600">This water system has no valid recorded violations in the database.</p>
              {violations.length > validViolations.length && (
                <p className="text-sm text-gray-500 mt-2">
                  Note: {violations.length - validViolations.length} incomplete violation records were filtered out.
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
  } catch (error) {
    console.error('Error loading system page:', error);
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg p-8 text-center">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Error Loading System Data</h1>
          <p className="text-gray-600 mb-6">There was an error loading the water system information. Please try again later.</p>
          <Link href="/" className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>
        </div>
      </div>
    );
  }
}