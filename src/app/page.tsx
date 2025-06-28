'use client';

import { useState, useEffect } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { 
  Droplets, 
  Shield, 
  Users, 
  TrendingUp, 
  MapPin, 
  AlertTriangle,
  CheckCircle,
  BarChart3,
  Eye,
  Building,
  UserCheck,
  Search as SearchIcon
} from 'lucide-react';
import Link from 'next/link';
import dynamic from 'next/dynamic';

// Dynamically import Map to avoid SSR issues
const Map = dynamic(() => import('@/components/Map'), { ssr: false });
const Search = dynamic(() => import('@/components/Search'), { ssr: false });

interface StatsData {
  totalSystems: number;
  totalViolations: number;
  populationServed: number;
  activeViolations: number;
}

export default function HomePage() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 300], [0, -50]);
  const y2 = useTransform(scrollY, [0, 300], [0, -100]);

  useEffect(() => {
    // Fetch basic stats for the hero section
    fetch('/api/regulatory-data')
      .then(res => res.json())
      .then(data => {
        setStats({
          totalSystems: data.totalSystems || 0,
          totalViolations: data.totalViolations || 0,
          populationServed: data.totalPopulation || 0,
          activeViolations: data.activeViolations || 0
        });
      })
      .catch(err => console.error('Failed to fetch stats:', err));
  }, []);

  const professionalPortals = [
    {
      id: 'operator' as const,
      title: 'Water System Operators',
      description: 'Manage compliance, track violations, and monitor system performance',
      icon: Building,
      color: 'green',
      href: '/operator/dashboard',
      features: ['System dashboard', 'Compliance tracking', 'Violation alerts', 'Performance metrics']
    },
    {
      id: 'regulator' as const,
      title: 'State Regulators',
      description: 'Statewide oversight, analytics, and regulatory compliance monitoring',
      icon: UserCheck,
      color: 'purple',
      href: '/regulator/dashboard',
      features: ['Statewide analytics', 'Risk assessment', 'Compliance trends', 'Enforcement tracking']
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0">
          <motion.div 
            style={{ y: y1 }}
            className="absolute top-20 left-10 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-70"
          />
          <motion.div 
            style={{ y: y2 }}
            className="absolute top-40 right-10 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-70"
          />
          <motion.div 
            style={{ y: y1 }}
            className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-200 rounded-full mix-blend-multiply filter blur-xl opacity-70"
          />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="inline-flex items-center justify-center w-20 h-20 bg-blue-600 rounded-full mb-8"
            >
              <Droplets className="w-10 h-10 text-white" />
            </motion.div>

            <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-6">
              Georgia{' '}
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Water Quality
              </span>
              <br />
              Dashboard
            </h1>

            <p className="text-xl md:text-2xl text-gray-600 mb-12 max-w-3xl mx-auto">
              Find water quality information for your community. Search by county, city, or water system name to discover compliance status and safety data.
            </p>

            {/* Primary CTA - Search */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="mb-12"
            >
              <div className="max-w-2xl mx-auto mb-6">
                <Search />
              </div>
              <p className="text-gray-600 mb-8">
                Or explore by clicking counties on the interactive map below
              </p>
              <Link
                href="#map"
                className="inline-flex items-center px-8 py-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors text-lg font-medium shadow-lg hover:shadow-xl"
              >
                <MapPin className="w-5 h-5 mr-2" />
                Explore Interactive Map
              </Link>
            </motion.div>

            {/* Live Stats */}
            {stats && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto"
              >
                <div className="glass-card rounded-xl p-6 shadow-lg">
                  <div className="text-3xl font-bold text-blue-600">{stats.totalSystems.toLocaleString()}</div>
                  <div className="text-sm text-gray-600">Water Systems</div>
                </div>
                <div className="glass-card rounded-xl p-6 shadow-lg">
                  <div className="text-3xl font-bold text-green-600">{stats.populationServed.toLocaleString()}</div>
                  <div className="text-sm text-gray-600">People Served</div>
                </div>
                <div className="glass-card rounded-xl p-6 shadow-lg">
                  <div className="text-3xl font-bold text-red-600">{stats.activeViolations}</div>
                  <div className="text-sm text-gray-600">Active Violations</div>
                </div>
                <div className="glass-card rounded-xl p-6 shadow-lg">
                  <div className="text-3xl font-bold text-purple-600">{stats.totalViolations.toLocaleString()}</div>
                  <div className="text-sm text-gray-600">Total Violations</div>
                </div>
              </motion.div>
            )}
          </motion.div>
        </div>
      </section>

      {/* Interactive Map Section - Now Primary */}
      <section id="map" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Explore Georgia's Water Systems
            </h2>
            <p className="text-xl text-gray-600 mb-8">
              Click on any county to discover water systems and their compliance status
            </p>
          </motion.div>

          {/* Map Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="glass-card rounded-2xl shadow-2xl overflow-hidden"
          >
            <div className="h-[600px] relative">
              <Map />
            </div>
          </motion.div>

          {/* Usage Instructions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-8 glass-light rounded-xl p-6 border border-blue-200/50"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center mb-3">
                  <span className="text-white font-bold">1</span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Click a County</h3>
                <p className="text-gray-600 text-sm">Select any county on the map to see water systems in that area</p>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center mb-3">
                  <span className="text-white font-bold">2</span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Choose a System</h3>
                <p className="text-gray-600 text-sm">Browse water systems and click to view detailed information</p>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center mb-3">
                  <span className="text-white font-bold">3</span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">View Details</h3>
                <p className="text-gray-600 text-sm">See compliance status, violations, and health information</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-white mb-6">
              Transparent Water Quality Data
            </h2>
            <p className="text-xl text-blue-100 max-w-3xl mx-auto mb-12">
              This dashboard provides easy access to official EPA data about Georgia's public water systems. 
              Our mission is to make water quality information transparent and accessible to all Georgians.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: Shield,
                title: 'Official EPA Data',
                description: 'All information comes directly from EPA Safe Drinking Water Act databases'
              },
              {
                icon: BarChart3,
                title: 'Easy to Understand',
                description: 'Complex regulatory data translated into clear, actionable information'
              },
              {
                icon: MapPin,
                title: 'Location-Based',
                description: 'Find water quality information specific to your community'
              },
              {
                icon: TrendingUp,
                title: 'Always Updated',
                description: 'Regular updates ensure you have the most current information available'
              }
            ].map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ scale: 1.05 }}
                  className="text-center"
                >
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-full mb-6">
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-4">{feature.title}</h3>
                  <p className="text-blue-100">{feature.description}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Professional Access Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Professional Access
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Specialized dashboards for water system operators and state regulators
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {professionalPortals.map((portal, index) => {
              const Icon = portal.icon;
              
              return (
                <motion.div
                  key={portal.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ scale: 1.02 }}
                  className="bg-white rounded-2xl shadow-lg p-8 hover:shadow-xl transition-all duration-300"
                >
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-6">
                    <Icon className="w-8 h-8 text-blue-600" />
                  </div>
                  
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">
                    {portal.title}
                  </h3>
                  
                  <p className="text-lg text-gray-600 mb-6">
                    {portal.description}
                  </p>

                  <ul className="space-y-2 mb-8">
                    {portal.features.map((feature, i) => (
                      <li key={i} className="flex items-center text-gray-600">
                        <CheckCircle className="w-4 h-4 mr-2 text-green-600 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>

                  <Link
                    href={portal.href}
                    className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    Access Dashboard
                    <motion.div
                      whileHover={{ x: 5 }}
                      className="ml-2"
                    >
                      →
                    </motion.div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl font-bold text-gray-900 mb-6">
              Stay Informed About Your Water Quality
            </h2>
            <p className="text-xl text-gray-600 mb-8">
              Knowledge is power when it comes to water safety. Start exploring your community's water quality data today.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="#map"
                className="inline-flex items-center px-8 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-lg font-medium"
              >
                <MapPin className="w-5 h-5 mr-2" />
                Start Exploring
              </Link>
              <Link
                href="/system/GA1310022"
                className="inline-flex items-center px-8 py-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-lg font-medium"
              >
                <Eye className="w-5 h-5 mr-2" />
                View Example System
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}