'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Users,
  Droplets,
  Shield,
  MapPin,
  Calendar,
  Download,
  Filter,
  Search,
  RefreshCw,
  Eye,
  FileText,
  Settings,
  Bell
} from 'lucide-react';
import Link from 'next/link';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area
} from 'recharts';

interface RegulatoryData {
  totalSystems: number;
  totalViolations: number;
  totalPopulation: number;
  activeViolations: number;
  violationsByType: Array<{ type: string; count: number; percentage: number }>;
  violationsByMonth: Array<{ month: string; violations: number; systems: number }>;
  topViolators: Array<{ pwsid: string; name: string; violations: number; population: number }>;
  complianceRate: number;
  riskScore: number;
}

export default function RegulatorDashboard() {
  const [data, setData] = useState<RegulatoryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTimeframe, setSelectedTimeframe] = useState('6months');
  const [selectedMetric, setSelectedMetric] = useState('violations');
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  useEffect(() => {
    fetchRegulatoryData();
  }, [selectedTimeframe]);

  const fetchRegulatoryData = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/regulatory-data');
      const regulatoryData = await response.json();
      
      // Transform the data for our dashboard
      const transformedData: RegulatoryData = {
        totalSystems: regulatoryData.totalSystems || 0,
        totalViolations: regulatoryData.totalViolations || 0,
        totalPopulation: regulatoryData.totalPopulation || 0,
        activeViolations: regulatoryData.activeViolations || 0,
        violationsByType: regulatoryData.violationsByType || [],
        violationsByMonth: regulatoryData.violationsByMonth || [],
        topViolators: regulatoryData.topViolators || [],
        complianceRate: regulatoryData.complianceRate || 95,
        riskScore: regulatoryData.riskScore || 25
      };
      
      setData(transformedData);
    } catch (error) {
      console.error('Error fetching regulatory data:', error);
    } finally {
      setLoading(false);
      setLastUpdated(new Date());
    }
  };

  const colors = ['#3b82f6', '#ef4444', '#f59e0b', '#10b981', '#8b5cf6', '#f97316'];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-100 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading regulatory dashboard...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <Link href="/" className="flex items-center space-x-2 text-blue-600 hover:text-blue-800">
                <Shield className="w-8 h-8" />
                <span className="text-xl font-bold">Georgia Water Quality</span>
              </Link>
              <div className="hidden md:block h-6 w-px bg-gray-300" />
              <div className="hidden md:block">
                <span className="text-sm text-gray-500">Regulatory Portal</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <select
                value={selectedTimeframe}
                onChange={(e) => setSelectedTimeframe(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="1month">Last Month</option>
                <option value="3months">Last 3 Months</option>
                <option value="6months">Last 6 Months</option>
                <option value="1year">Last Year</option>
              </select>
              
              <button
                onClick={fetchRegulatoryData}
                className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </button>
              
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <Calendar className="w-4 h-4" />
                <span>Updated {lastUpdated.toLocaleTimeString()}</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Key Metrics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
        >
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Water Systems</p>
                <p className="text-3xl font-bold text-gray-900">{data?.totalSystems.toLocaleString()}</p>
                <div className="flex items-center mt-2">
                  <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                  <span className="text-sm text-green-600">+2.5% from last month</span>
                </div>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <Droplets className="w-8 h-8 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Population Served</p>
                <p className="text-3xl font-bold text-gray-900">{data?.totalPopulation.toLocaleString()}</p>
                <div className="flex items-center mt-2">
                  <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                  <span className="text-sm text-green-600">+1.2% from last month</span>
                </div>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <Users className="w-8 h-8 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Violations</p>
                <p className="text-3xl font-bold text-gray-900">{data?.activeViolations}</p>
                <div className="flex items-center mt-2">
                  <TrendingDown className="w-4 h-4 text-red-500 mr-1" />
                  <span className="text-sm text-red-600">-8.3% from last month</span>
                </div>
              </div>
              <div className="bg-red-100 p-3 rounded-full">
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Compliance Rate</p>
                <p className="text-3xl font-bold text-gray-900">{data?.complianceRate}%</p>
                <div className="flex items-center mt-2">
                  <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                  <span className="text-sm text-green-600">+0.5% from last month</span>
                </div>
              </div>
              <div className="bg-purple-100 p-3 rounded-full">
                <CheckCircle className="w-8 h-8 text-purple-600" />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Violations Trend */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl shadow-lg p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">Violations Over Time</h3>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setSelectedMetric('violations')}
                  className={`px-3 py-1 text-sm rounded-full ${
                    selectedMetric === 'violations'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  Violations
                </button>
                <button
                  onClick={() => setSelectedMetric('systems')}
                  className={`px-3 py-1 text-sm rounded-full ${
                    selectedMetric === 'systems'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  Systems
                </button>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={data?.violationsByMonth}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey={selectedMetric}
                  stroke="#3b82f6"
                  fill="#3b82f6"
                  fillOpacity={0.3}
                />
              </AreaChart>
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
              <h3 className="text-xl font-bold text-gray-900">Violation Types</h3>
              <BarChart3 className="w-5 h-5 text-gray-600" />
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={data?.violationsByType}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={120}
                  paddingAngle={5}
                  dataKey="count"
                >
                  {data?.violationsByType.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap justify-center gap-4 mt-4">
              {data?.violationsByType.map((type, index) => (
                <div key={type.type} className="flex items-center">
                  <div
                    className="w-3 h-3 rounded-full mr-2"
                    style={{ backgroundColor: colors[index % colors.length] }}
                  />
                  <span className="text-sm text-gray-600">
                    {type.type} ({type.percentage}%)
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Risk Assessment and Top Violators */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Risk Assessment */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-xl shadow-lg p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">Risk Assessment</h3>
              <Shield className="w-5 h-5 text-gray-600" />
            </div>
            
            <div className="text-center mb-6">
              <div className={`inline-flex items-center justify-center w-24 h-24 rounded-full text-2xl font-bold ${
                (data?.riskScore || 0) < 30 ? 'bg-green-100 text-green-800' :
                (data?.riskScore || 0) < 60 ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }`}>
                {data?.riskScore}
              </div>
              <p className="text-sm text-gray-600 mt-2">
                {(data?.riskScore || 0) < 30 ? 'Low Risk' :
                 (data?.riskScore || 0) < 60 ? 'Medium Risk' : 'High Risk'}
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Public Health Risk</span>
                <span className="text-sm font-medium text-green-600">Low</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Compliance Trend</span>
                <span className="text-sm font-medium text-green-600">Improving</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">System Coverage</span>
                <span className="text-sm font-medium text-blue-600">98.5%</span>
              </div>
            </div>
          </motion.div>

          {/* Top Violators */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white rounded-xl shadow-lg p-6 lg:col-span-2"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">Systems Requiring Attention</h3>
              <button className="inline-flex items-center px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm">
                <AlertTriangle className="w-4 h-4 mr-1" />
                {data?.topViolators.length} Systems
              </button>
            </div>
            
            <div className="space-y-4">
              {data?.topViolators.slice(0, 5).map((system, index) => (
                <div key={system.pwsid} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      index === 0 ? 'bg-red-100 text-red-800' :
                      index === 1 ? 'bg-orange-100 text-orange-800' :
                      index === 2 ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {index + 1}
                    </div>
                    <div>
                      <Link
                        href={`/system/${system.pwsid}`}
                        className="font-medium text-gray-900 hover:text-blue-600"
                      >
                        {system.name}
                      </Link>
                      <p className="text-sm text-gray-600">
                        PWSID: {system.pwsid} • {system.population.toLocaleString()} people served
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-red-600">{system.violations}</div>
                    <div className="text-sm text-gray-600">violations</div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Action Items and Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Action Items */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-white rounded-xl shadow-lg p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">Priority Actions</h3>
              <Bell className="w-5 h-5 text-yellow-600" />
            </div>
            
            <div className="space-y-4">
              <div className="flex items-start space-x-3 p-3 bg-red-50 rounded-lg border-l-4 border-red-500">
                <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900">High-Risk Violations</p>
                  <p className="text-sm text-gray-600">3 systems require immediate attention</p>
                  <button className="text-sm text-red-600 hover:underline mt-1">Review Details →</button>
                </div>
              </div>
              
              <div className="flex items-start space-x-3 p-3 bg-yellow-50 rounded-lg border-l-4 border-yellow-500">
                <Calendar className="w-5 h-5 text-yellow-600 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900">Overdue Reports</p>
                  <p className="text-sm text-gray-600">12 systems have pending submissions</p>
                  <button className="text-sm text-yellow-600 hover:underline mt-1">Send Reminders →</button>
                </div>
              </div>
              
              <div className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                <FileText className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900">Monthly Report Due</p>
                  <p className="text-sm text-gray-600">State compliance report due in 5 days</p>
                  <button className="text-sm text-blue-600 hover:underline mt-1">Generate Report →</button>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.7 }}
            className="bg-white rounded-xl shadow-lg p-6"
          >
            <h3 className="text-xl font-bold text-gray-900 mb-6">Quick Actions</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <button className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <Download className="w-6 h-6 text-blue-600 mb-2" />
                <span className="text-sm font-medium text-gray-900">Export Data</span>
              </button>
              
              <button className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <Search className="w-6 h-6 text-green-600 mb-2" />
                <span className="text-sm font-medium text-gray-900">Search Systems</span>
              </button>
              
              <button className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <Bell className="w-6 h-6 text-yellow-600 mb-2" />
                <span className="text-sm font-medium text-gray-900">Set Alerts</span>
              </button>
              
              <Link
                href="/"
                className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <MapPin className="w-6 h-6 text-purple-600 mb-2" />
                <span className="text-sm font-medium text-gray-900">View Map</span>
              </Link>
              
              <button className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <FileText className="w-6 h-6 text-indigo-600 mb-2" />
                <span className="text-sm font-medium text-gray-900">Generate Report</span>
              </button>
              
              <button className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <Settings className="w-6 h-6 text-gray-600 mb-2" />
                <span className="text-sm font-medium text-gray-900">Settings</span>
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}