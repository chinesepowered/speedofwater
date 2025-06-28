import clientPromise from '@/lib/mongodb';
import HealthEffects from '@/components/HealthEffects';
import { ArrowLeft, MapPin, Users, AlertTriangle, CheckCircle, Calendar, Droplets, Info } from 'lucide-react';
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
                        <h3 className="font-semibold text-gray-900 mb-2">Violation Type</h3>
                        <p className="text-gray-700 font-medium">{violation.VIOLATION_NAME || 'Unknown violation type'}</p>
                        {violation.VIOLATION_CODE && (
                          <p className="text-sm text-gray-500 mt-1">Code: {violation.VIOLATION_CODE}</p>
                        )}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-2">Contaminant</h3>
                        <p className="text-gray-700 font-medium">{violation.CONTAMINANT_NAME || 'Unknown contaminant'}</p>
                        {violation.CONTAMINANT_CODE && (
                          <p className="text-sm text-gray-500 mt-1">Code: {violation.CONTAMINANT_CODE}</p>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      {violation.COMPL_PER_BEGIN_DATE && (
                        <div>
                          <span className="font-medium text-gray-700">Compliance Period:</span>
                          <span className="ml-2 text-gray-600">
                            {new Date(violation.COMPL_PER_BEGIN_DATE).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                      {violation.ENFORCEMENT_COUNT && violation.ENFORCEMENT_COUNT > 1 && (
                        <div>
                          <span className="font-medium text-gray-700">Enforcement Actions:</span>
                          <span className="ml-2 text-gray-600">
                            {violation.ENFORCEMENT_COUNT} actions taken
                          </span>
                        </div>
                      )}
                    </div>
                    
                    {/* Violation Type Explanation */}
                    {violation.VIOLATION_NAME && (
                      <div className="mb-4 p-3 bg-red-100 rounded-lg">
                        <div className="text-sm text-red-800">
                          <strong>What this means:</strong>
                          {violation.VIOLATION_NAME.includes('Monitoring') || violation.VIOLATION_NAME.includes('Reporting') ? 
                            ' This system failed to conduct required water testing or submit monitoring reports on time.' :
                           violation.VIOLATION_NAME.includes('Maximum Contaminant Level') || violation.VIOLATION_NAME.includes('MCL') ?
                            ' This system exceeded the maximum allowed level of a contaminant in drinking water.' :
                           violation.VIOLATION_NAME.includes('Treatment Technique') ?
                            ' This system failed to properly treat water using EPA-required methods.' :
                           violation.VIOLATION_NAME.includes('Public Notification') ?
                            ' This system failed to properly notify the public about water quality issues.' :
                           ' This represents a violation of drinking water safety regulations.'}
                        </div>
                      </div>
                    )}
                    
                    {violation.CONTAMINANT_NAME && (
                      <HealthEffects contaminantName={violation.CONTAMINANT_NAME} />
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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                      <div>
                        <span className="font-medium text-gray-700">Violation Type:</span>
                        <p className="text-gray-600 text-sm font-medium">{violation.VIOLATION_NAME || 'Unknown violation type'}</p>
                        {violation.VIOLATION_CODE && (
                          <p className="text-xs text-gray-500 mt-1">Code: {violation.VIOLATION_CODE}</p>
                        )}
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Contaminant:</span>
                        <p className="text-gray-600 text-sm font-medium">{violation.CONTAMINANT_NAME || 'Unknown contaminant'}</p>
                        {violation.CONTAMINANT_CODE && (
                          <p className="text-xs text-gray-500 mt-1">Code: {violation.CONTAMINANT_CODE}</p>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <span className="font-medium text-gray-700">Compliance Period:</span>
                        <p className="text-gray-600 text-sm">
                          {violation.COMPL_PER_BEGIN_DATE ? new Date(violation.COMPL_PER_BEGIN_DATE).toLocaleDateString() : 'Not specified'}
                        </p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Status:</span>
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          {violation.VIOLATION_STATUS || 'Resolved'}
                        </span>
                      </div>
                      {violation.ENFORCEMENT_COUNT && violation.ENFORCEMENT_COUNT > 1 && (
                        <div>
                          <span className="font-medium text-gray-700">Enforcement:</span>
                          <p className="text-gray-600 text-sm">
                            {violation.ENFORCEMENT_COUNT} actions
                          </p>
                        </div>
                      )}
                    </div>
                    
                    {/* Add explanation for resolved violations too */}
                    {violation.VIOLATION_NAME && (
                      <div className="mt-3 p-3 bg-green-100 rounded-lg">
                        <div className="text-sm text-green-800">
                          <strong>What this was:</strong>
                          {violation.VIOLATION_NAME.includes('Monitoring') || violation.VIOLATION_NAME.includes('Reporting') ? 
                            ' This system previously failed to conduct required water testing or submit monitoring reports, but has since corrected the issue.' :
                           violation.VIOLATION_NAME.includes('Maximum Contaminant Level') || violation.VIOLATION_NAME.includes('MCL') ?
                            ' This system previously exceeded the maximum allowed level of a contaminant, but has since resolved the issue.' :
                           violation.VIOLATION_NAME.includes('Treatment Technique') ?
                            ' This system previously failed to properly treat water using EPA-required methods, but has since corrected the treatment process.' :
                           violation.VIOLATION_NAME.includes('Public Notification') ?
                            ' This system previously failed to properly notify the public about water quality issues, but has since fulfilled notification requirements.' :
                           ' This was a violation of drinking water safety regulations that has now been resolved.'}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Enforcement Actions */}
          {enforcementActions.length > 0 && (
            <div className="bg-white rounded-xl shadow-lg p-8">
              <div className="flex items-center mb-6">
                <AlertTriangle className="w-6 h-6 text-orange-600 mr-3" />
                <h2 className="text-2xl font-bold text-gray-900">Enforcement Actions</h2>
                <span className="ml-3 bg-orange-100 text-orange-800 text-sm font-medium px-3 py-1 rounded-full">
                  {enforcementActions.length}
                </span>
              </div>
              <div className="space-y-4">
                {enforcementActions.map((action, index) => (
                  <div key={index} className="border border-orange-200 rounded-lg p-4 bg-orange-50">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <span className="font-medium text-gray-700">Action Type:</span>
                        <p className="text-gray-600 text-sm font-medium">
                          {action.ENFORCEMENT_ACTION_TYPE_CODE === 'SIA' ? 'Sanitary Inspection Action' :
                           action.ENFORCEMENT_ACTION_TYPE_CODE === 'SIE' ? 'Sanitary Inspection Enforcement' :
                           action.ENFORCEMENT_ACTION_TYPE_CODE === 'NOV' ? 'Notice of Violation' :
                           action.ENFORCEMENT_ACTION_TYPE_CODE === 'AO' ? 'Administrative Order' :
                           action.ENFORCEMENT_ACTION_TYPE_CODE || 'Not specified'}
                        </p>
                        {action.ENFORCEMENT_ACTION_TYPE_CODE && (
                          <p className="text-xs text-gray-500 mt-1">Code: {action.ENFORCEMENT_ACTION_TYPE_CODE}</p>
                        )}
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">System ID:</span>
                        <p className="text-gray-600 text-sm">{action.PWSID}</p>
                      </div>
                    </div>
                    <div className="mt-3 text-sm text-orange-700 bg-orange-100 p-3 rounded">
                      <strong>What this means:</strong> This represents a regulatory action taken by authorities. 
                      {action.ENFORCEMENT_ACTION_TYPE_CODE === 'SIA' && ' This was a routine sanitary inspection to ensure compliance with drinking water standards.'}
                      {action.ENFORCEMENT_ACTION_TYPE_CODE === 'SIE' && ' This was enforcement action following a sanitary inspection that found issues.'}
                      {action.ENFORCEMENT_ACTION_TYPE_CODE === 'NOV' && ' This was a formal notice that the system violated drinking water regulations.'}
                      {action.ENFORCEMENT_ACTION_TYPE_CODE === 'AO' && ' This was an administrative order requiring specific corrective actions.'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* No Records */}
          {standardViolations.length === 0 && enforcementActions.length === 0 && (
            <div className="bg-white rounded-xl shadow-lg p-8 text-center">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">No Violations Found</h2>
              <p className="text-gray-600">This water system has no recorded violations or enforcement actions in the database.</p>
            </div>
          )}

          {/* Understanding Violations - Glossary */}
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="flex items-center mb-6">
              <Info className="w-6 h-6 text-blue-600 mr-3" />
              <h2 className="text-2xl font-bold text-gray-900">Understanding Water Quality Violations</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Common Violation Types</h3>
                <div className="space-y-3 text-sm">
                  <div>
                    <strong className="text-gray-700">MCL (Maximum Contaminant Level):</strong>
                    <p className="text-gray-600">The highest level of a contaminant allowed in drinking water.</p>
                  </div>
                  <div>
                    <strong className="text-gray-700">MR (Monitoring/Reporting):</strong>
                    <p className="text-gray-600">Failure to conduct required testing or submit reports on time.</p>
                  </div>
                  <div>
                    <strong className="text-gray-700">TT (Treatment Technique):</strong>
                    <p className="text-gray-600">Failure to properly treat water using required methods.</p>
                  </div>
                  <div>
                    <strong className="text-gray-700">PN (Public Notification):</strong>
                    <p className="text-gray-600">Failure to properly notify the public about violations.</p>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Violation Status</h3>
                <div className="space-y-3 text-sm">
                  <div>
                    <strong className="text-green-700">Resolved:</strong>
                    <p className="text-gray-600">The violation has been corrected and is no longer active.</p>
                  </div>
                  <div>
                    <strong className="text-orange-700">Addressed:</strong>
                    <p className="text-gray-600">Action has been taken, but the violation may still be under review.</p>
                  </div>
                  <div>
                    <strong className="text-red-700">Unaddressed:</strong>
                    <p className="text-gray-600">The violation is active and has not yet been corrected.</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> This data comes from the EPA's Safe Drinking Water Information System (SDWIS). 
                For the most current information or if you have concerns about your water quality, 
                contact your water system directly or your state drinking water program.
              </p>
            </div>
          </div>
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