'use client';

import { useState } from 'react';
import { ArrowLeft, MapPin, Users, AlertTriangle, CheckCircle, Calendar, Droplets, Info, TestTube, Bell } from 'lucide-react';
import Link from 'next/link';
import HealthEffects from '@/components/HealthEffects';
import { LeadTestingDialog, AlertSetupDialog } from '@/components/ActionDialogs';

interface SystemPageClientProps {
  system: any;
  violations: any[];
  activeViolations: any[];
  resolvedViolations: any[];
  enforcementActions: any[];
}

export default function SystemPageClient({ 
  system, 
  violations, 
  activeViolations, 
  resolvedViolations, 
  enforcementActions 
}: SystemPageClientProps) {
  const [showLeadTestDialog, setShowLeadTestDialog] = useState(false);
  const [showAlertDialog, setShowAlertDialog] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="glass-light shadow-sm border-b border-white/20">
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
        <div className="glass-card rounded-xl shadow-lg p-8 mb-8">
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
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

          {/* Action Buttons */}
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Take Action</h3>
            <div className="flex flex-wrap gap-4">
              <button
                onClick={() => setShowLeadTestDialog(true)}
                className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-lg hover:shadow-xl"
              >
                <TestTube className="w-5 h-5 mr-2" />
                Request Lead Testing Kit
              </button>
              
              <button
                onClick={() => setShowAlertDialog(true)}
                className="inline-flex items-center px-6 py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors font-medium shadow-lg hover:shadow-xl"
              >
                <Bell className="w-5 h-5 mr-2" />
                Set Up Alerts
              </button>
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
            <div className="glass-card rounded-xl shadow-lg p-8">
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
            <div className="glass-card rounded-xl shadow-lg p-8">
              <div className="flex items-center mb-6">
                <CheckCircle className="w-6 h-6 text-green-600 mr-3" />
                <h2 className="text-2xl font-bold text-gray-900">Resolved Violations</h2>
                <span className="ml-3 bg-green-100 text-green-800 text-sm font-medium px-3 py-1 rounded-full">
                  {resolvedViolations.length}
                </span>
              </div>
              <div className="space-y-4">
                {resolvedViolations.slice(0, 10).map((violation, index) => (
                  <div key={index} className="border border-green-200 rounded-lg p-4 bg-green-50">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <span className="font-medium text-gray-700">Violation:</span>
                        <span className="ml-2 text-gray-600">{violation.VIOLATION_NAME || 'Unknown'}</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Contaminant:</span>
                        <span className="ml-2 text-gray-600">{violation.CONTAMINANT_NAME || 'Unknown'}</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Status:</span>
                        <span className="ml-2 text-green-600 font-medium">{violation.VIOLATION_STATUS}</span>
                      </div>
                    </div>
                  </div>
                ))}
                {resolvedViolations.length > 10 && (
                  <p className="text-sm text-gray-500 text-center py-2">
                    Showing 10 of {resolvedViolations.length} resolved violations
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Enforcement Actions */}
          {enforcementActions.length > 0 && (
            <div className="glass-card rounded-xl shadow-lg p-8">
              <div className="flex items-center mb-6">
                <Info className="w-6 h-6 text-blue-600 mr-3" />
                <h2 className="text-2xl font-bold text-gray-900">Enforcement Actions</h2>
                <span className="ml-3 bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full">
                  {enforcementActions.length}
                </span>
              </div>
              <div className="space-y-4">
                {enforcementActions.slice(0, 5).map((action, index) => (
                  <div key={index} className="border border-blue-200 rounded-lg p-4 bg-blue-50">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <span className="font-medium text-gray-700">Action Type:</span>
                        <span className="ml-2 text-gray-600">
                          {action.ENFORCEMENT_ACTION_TYPE_CODE === 'SIA' ? 'Sanitary Inspection Action' :
                           action.ENFORCEMENT_ACTION_TYPE_CODE === 'SIE' ? 'Sanitary Inspection Enforcement' :
                           action.ENFORCEMENT_ACTION_TYPE_CODE === 'NOV' ? 'Notice of Violation' :
                           action.ENFORCEMENT_ACTION_TYPE_CODE === 'AO' ? 'Administrative Order' :
                           action.ENFORCEMENT_ACTION_TYPE_CODE || 'Unknown'}
                        </span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Date:</span>
                        <span className="ml-2 text-gray-600">
                          {action.ENFORCEMENT_DATE ? new Date(action.ENFORCEMENT_DATE).toLocaleDateString() : 'Not specified'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
                {enforcementActions.length > 5 && (
                  <p className="text-sm text-gray-500 text-center py-2">
                    Showing 5 of {enforcementActions.length} enforcement actions
                  </p>
                )}
              </div>
            </div>
          )}

          {/* No Violations */}
          {violations.length === 0 && (
            <div className="glass-card rounded-xl shadow-lg p-8 text-center">
              <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">No Violations Found</h2>
              <p className="text-gray-600">
                This water system has no recorded violations in our database.
              </p>
            </div>
          )}
        </div>

        {/* Data Source Note */}
        <div className="mt-8 glass-light rounded-xl p-6 border border-blue-200/50">
          <div className="flex items-start">
            <Info className="w-5 h-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-gray-700">
              <p className="font-medium mb-2">Data Source & Glossary</p>
              <p className="mb-2">
                All data comes from the EPA Safe Drinking Water Information System (SDWIS). 
                Data is updated regularly but may not reflect the most recent changes.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 text-xs">
                <div>
                  <strong>MCL:</strong> Maximum Contaminant Level - The highest level of a contaminant allowed in drinking water
                </div>
                <div>
                  <strong>MR:</strong> Monitoring and Reporting - Requirements for testing and reporting water quality
                </div>
                <div>
                  <strong>TT:</strong> Treatment Technique - Required processes for treating water
                </div>
                <div>
                  <strong>PN:</strong> Public Notification - Requirements to inform the public about water quality issues
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Dialogs */}
      <LeadTestingDialog
        isOpen={showLeadTestDialog}
        onClose={() => setShowLeadTestDialog(false)}
        systemName={system.PWS_NAME}
      />
      
      <AlertSetupDialog
        isOpen={showAlertDialog}
        onClose={() => setShowAlertDialog(false)}
        systemName={system.PWS_NAME}
        pwsid={system.PWSID}
      />
    </div>
  );
} 