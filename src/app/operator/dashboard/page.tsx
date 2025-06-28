'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Droplets,
  AlertTriangle,
  CheckCircle,
  Users,
  Calendar,
  TrendingUp,
  TrendingDown,
  Bell,
  FileText,
  Settings,
  Download,
  RefreshCw,
  MapPin,
  Phone,
  Mail,
  Building2,
  Clock,
  Shield
} from 'lucide-react';
import Link from 'next/link';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

interface WaterSystem {
  PWSID: string;
  PWS_NAME: string;
  POPULATION_SERVED_COUNT: number;
  PWS_TYPE_CODE: string;
  OWNER_NAME: string;
  OWNER_PHONE: string;
  OWNER_EMAIL: string;
  CITY_NAME: string;
  SUBMISSIONYEARQUARTER: string;
}

interface Violation {
  VIOLATION_NAME: string;
  CONTAMINANT_NAME: string;
  COMPL_PER_BEGIN_DATE: string;
  ENFORCEMENT_ACTION_TYPE_CODE: string;
  SEVERITY_IND_CODE: string;
}

export default function OperatorDashboard() {
  const [system, setSystem] = useState<WaterSystem | null>(null);
  const [violations, setViolations] = useState<Violation[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // Demo PWSID - in production this would come from authentication
  const DEMO_PWSID = 'GA1410019';

  useEffect(() => {
    fetchSystemData();
  }, []);

  const fetchSystemData = async () => {
    setLoading(true);
    try {
      // Fetch system details
      const systemRes = await fetch(`/api/water-systems?q=${DEMO_PWSID}`);
      const systemData = await systemRes.json();
      
      if (systemData.waterSystems && systemData.waterSystems.length > 0) {
        setSystem(systemData.waterSystems[0]);
      }

      // Fetch violations
      const violationsRes = await fetch(`/api/water-systems/${DEMO_PWSID}/violations`);
      if (violationsRes.ok) {
        const violationsData = await violationsRes.json();
        setViolations(violationsData.violations || []);
      }
    } catch (error) {
      console.error('Error fetching system data:', error);
    } finally {
      setLoading(false);
      setLastUpdated(new Date());
    }
  };

  const activeViolations = violations.filter(v => v.ENFORCEMENT_ACTION_TYPE_CODE !== 'C');
  const resolvedViolations = violations.filter(v => v.ENFORCEMENT_ACTION_TYPE_CODE === 'C');
  
  // Mock trend data for charts
  const complianceData = [
    { month: 'Jan', score: 95, violations: 2 },
    { month: 'Feb', score: 97, violations: 1 },
    { month: 'Mar', score: 92, violations: 3 },
    { month: 'Apr', score: 98, violations: 1 },
    { month: 'May', score: 94, violations: 2 },
    { month: 'Jun', score: 99, violations: 0 },
  ];

  const violationTypes = [
    { name: 'Monitoring', value: 45, color: '#ef4444' },
    { name: 'Reporting', value: 30, color: '#f97316' },
    { name: 'Treatment', value: 15, color: '#eab308' },
    { name: 'Other', value: 10, color: '#6b7280' },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading your dashboard...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <Link href="/" className="flex items-center space-x-2 text-blue-600 hover:text-blue-800">
                <Droplets className="w-8 h-8" />
                <span className="text-xl font-bold">Georgia Water Quality</span>
              </Link>
              <div className="hidden md:block h-6 w-px bg-gray-300" />
              <div className="hidden md:block">
                <span className="text-sm text-gray-500">Operator Portal</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={fetchSystemData}
                className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </button>
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <Clock className="w-4 h-4" />
                <span>Updated {lastUpdated.toLocaleTimeString()}</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* System Overview */}
        {system && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow-lg p-8 mb-8"
          >
            <div className="flex items-start justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{system.PWS_NAME}</h1>
                <div className="flex items-center text-gray-600 space-x-4">
                  <div className="flex items-center">
                    <Building2 className="w-4 h-4 mr-1" />
                    <span>PWSID: {system.PWSID}</span>
                  </div>
                  <div className="flex items-center">
                    <MapPin className="w-4 h-4 mr-1" />
                    <span>{system.CITY_NAME}</span>
                  </div>
                </div>
              </div>
              
              <div className="text-right">
                {activeViolations.length === 0 ? (
                  <div className="flex items-center text-green-600 bg-green-50 px-4 py-2 rounded-full">
                    <CheckCircle className="w-5 h-5 mr-2" />
                    <span className="font-medium">Compliant</span>
                  </div>
                ) : (
                  <div className="flex items-center text-red-600 bg-red-50 px-4 py-2 rounded-full">
                    <AlertTriangle className="w-5 h-5 mr-2" />
                    <span className="font-medium">{activeViolations.length} Active Issue{activeViolations.length !== 1 ? 's' : ''}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
              <div className="bg-blue-50 rounded-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-600">Population Served</p>
                    <p className="text-2xl font-bold text-blue-900">{system.POPULATION_SERVED_COUNT?.toLocaleString() || 'N/A'}</p>
                  </div>
                  <Users className="w-8 h-8 text-blue-600" />
                </div>
              </div>
              
              <div className="bg-green-50 rounded-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-600">Compliance Score</p>
                    <p className="text-2xl font-bold text-green-900">99%</p>
                  </div>
                  <Shield className="w-8 h-8 text-green-600" />
                </div>
              </div>

              <div className="bg-red-50 rounded-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-red-600">Active Violations</p>
                    <p className="text-2xl font-bold text-red-900">{activeViolations.length}</p>
                  </div>
                  <AlertTriangle className="w-8 h-8 text-red-600" />
                </div>
              </div>

              <div className="bg-purple-50 rounded-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-purple-600">System Type</p>
                    <p className="text-2xl font-bold text-purple-900">{system.PWS_TYPE_CODE}</p>
                  </div>
                  <Droplets className="w-8 h-8 text-purple-600" />
                </div>
              </div>
            </div>

            {/* Contact Information */}
            {(system.OWNER_NAME || system.OWNER_PHONE || system.OWNER_EMAIL) && (
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">System Contact</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {system.OWNER_NAME && (
                    <div className="flex items-center">
                      <Building2 className="w-4 h-4 text-gray-400 mr-2" />
                      <span className="text-gray-700">{system.OWNER_NAME}</span>
                    </div>
                  )}
                  {system.OWNER_PHONE && (
                    <div className="flex items-center">
                      <Phone className="w-4 h-4 text-gray-400 mr-2" />
                      <span className="text-gray-700">{system.OWNER_PHONE}</span>
                    </div>
                  )}
                  {system.OWNER_EMAIL && (
                    <div className="flex items-center">
                      <Mail className="w-4 h-4 text-gray-400 mr-2" />
                      <span className="text-gray-700">{system.OWNER_EMAIL}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* Charts and Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Compliance Trend */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl shadow-lg p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">Compliance Trend</h3>
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={complianceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis domain={[80, 100]} />
                <Tooltip />
                <Line type="monotone" dataKey="score" stroke="#10b981" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Violation Types */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-xl shadow-lg p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">Violation Breakdown</h3>
              <BarChart className="w-5 h-5 text-blue-600" />
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={violationTypes}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={120}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {violationTypes.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap justify-center gap-4 mt-4">
              {violationTypes.map((type) => (
                <div key={type.name} className="flex items-center">
                  <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: type.color }} />
                  <span className="text-sm text-gray-600">{type.name}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Active Violations */}
        {activeViolations.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-xl shadow-lg p-8 mb-8"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <AlertTriangle className="w-6 h-6 text-red-600 mr-3" />
                <h2 className="text-2xl font-bold text-gray-900">Active Violations</h2>
                <span className="ml-3 bg-red-100 text-red-800 text-sm font-medium px-3 py-1 rounded-full">
                  {activeViolations.length}
                </span>
              </div>
              <button className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
                <Download className="w-4 h-4 mr-2" />
                Export Report
              </button>
            </div>
            
            <div className="space-y-4">
              {activeViolations.map((violation, index) => (
                <div key={index} className="border border-red-200 rounded-lg p-6 bg-red-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-2">
                        {violation.VIOLATION_NAME || 'Violation details not available'}
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium text-gray-700">Contaminant:</span>
                          <span className="ml-2 text-gray-600">{violation.CONTAMINANT_NAME || 'Not specified'}</span>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Date:</span>
                          <span className="ml-2 text-gray-600">
                            {violation.COMPL_PER_BEGIN_DATE ? new Date(violation.COMPL_PER_BEGIN_DATE).toLocaleDateString() : 'Not specified'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="ml-4">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        violation.SEVERITY_IND_CODE === 'H' ? 'bg-red-100 text-red-800' :
                        violation.SEVERITY_IND_CODE === 'M' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {violation.SEVERITY_IND_CODE === 'H' ? 'High' :
                         violation.SEVERITY_IND_CODE === 'M' ? 'Medium' : 'Low'} Priority
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-xl shadow-lg p-8"
        >
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <button className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <FileText className="w-6 h-6 text-blue-600 mr-3" />
              <div className="text-left">
                <div className="font-medium text-gray-900">Generate Report</div>
                <div className="text-sm text-gray-500">Monthly compliance report</div>
              </div>
            </button>
            
            <button className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <Bell className="w-6 h-6 text-yellow-600 mr-3" />
              <div className="text-left">
                <div className="font-medium text-gray-900">Set Alerts</div>
                <div className="text-sm text-gray-500">Configure notifications</div>
              </div>
            </button>
            
            <button className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <Settings className="w-6 h-6 text-gray-600 mr-3" />
              <div className="text-left">
                <div className="font-medium text-gray-900">System Settings</div>
                <div className="text-sm text-gray-500">Update system info</div>
              </div>
            </button>
            
            <Link
              href={`/system/${DEMO_PWSID}`}
              className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <MapPin className="w-6 h-6 text-green-600 mr-3" />
              <div className="text-left">
                <div className="font-medium text-gray-900">Public View</div>
                <div className="text-sm text-gray-500">See public page</div>
              </div>
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
} 