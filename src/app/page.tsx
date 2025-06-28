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
  UserCheck
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
  const [selectedView, setSelectedView] = useState<'public' | 'operator' | 'regulator'>('public');
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

  const stakeholderViews = [
    {
      id: 'public' as const,
      title: 'Public Portal',
      description: 'Discover water quality information in your community',
      icon: Eye,
      color: 'blue',
      features: ['Interactive county map', 'Water system search', 'Violation history', 'Health impact data']
    },
    {
      id: 'operator' as const,
      title: 'Operator Dashboard',
      description: 'Manage and monitor your water system compliance',
      icon: Building,
      color: 'green',
      features: ['System overview', 'Compliance tracking', 'Violation management', 'Reporting tools']
    },
    {
      id: 'regulator' as const,
      title: 'Regulator Analytics',
      description: 'Comprehensive oversight and regulatory insights',
      icon: UserCheck,
      color: 'purple',
      features: ['Statewide analytics', 'Violation trends', 'Compliance metrics', 'Risk assessment']
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

            <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Empowering communities, operators, and regulators with transparent, 
              accessible water quality data across Georgia
            </p>

            {/* Live Stats */}
            {stats && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12 max-w-4xl mx-auto"
              >
                <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-lg">
                  <div className="text-3xl font-bold text-blue-600">{stats.totalSystems.toLocaleString()}</div>
                  <div className="text-sm text-gray-600">Water Systems</div>
                </div>
                <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-lg">
                  <div className="text-3xl font-bold text-green-600">{stats.populationServed.toLocaleString()}</div>
                  <div className="text-sm text-gray-600">People Served</div>
                </div>
                <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-lg">
                  <div className="text-3xl font-bold text-red-600">{stats.activeViolations}</div>
                  <div className="text-sm text-gray-600">Active Violations</div>
                </div>
                <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-lg">
                  <div className="text-3xl font-bold text-purple-600">{stats.totalViolations.toLocaleString()}</div>
                  <div className="text-sm text-gray-600">Total Violations</div>
                </div>
              </motion.div>
            )}
          </motion.div>
        </div>
      </section>

      {/* Stakeholder Selection */}
      <section className="py-20 bg-white/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Choose Your Portal
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Tailored experiences for different stakeholders in Georgia's water quality ecosystem
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {stakeholderViews.map((view, index) => {
              const Icon = view.icon;
              const isSelected = selectedView === view.id;
              
              return (
                <motion.div
                  key={view.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ scale: 1.05 }}
                  className={`relative p-8 rounded-2xl shadow-xl cursor-pointer transition-all duration-300 ${
                    isSelected 
                      ? 'bg-gradient-to-br from-blue-500 to-purple-600 text-white' 
                      : 'bg-white hover:shadow-2xl'
                  }`}
                  onClick={() => setSelectedView(view.id)}
                >
                  <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-6 ${
                    isSelected ? 'bg-white/20' : 'bg-blue-100'
                  }`}>
                    <Icon className={`w-8 h-8 ${isSelected ? 'text-white' : 'text-blue-600'}`} />
                  </div>
                  
                  <h3 className={`text-2xl font-bold mb-4 ${isSelected ? 'text-white' : 'text-gray-900'}`}>
                    {view.title}
                  </h3>
                  
                  <p className={`text-lg mb-6 ${isSelected ? 'text-white/90' : 'text-gray-600'}`}>
                    {view.description}
                  </p>

                  <ul className="space-y-2">
                    {view.features.map((feature, i) => (
                      <li key={i} className={`flex items-center ${isSelected ? 'text-white/90' : 'text-gray-600'}`}>
                        <CheckCircle className="w-4 h-4 mr-2 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>

                  <div className="mt-8">
                    <Link
                      href={view.id === 'public' ? '#map' : `/${view.id}/dashboard`}
                      className={`inline-flex items-center px-6 py-3 rounded-lg font-medium transition-colors ${
                        isSelected
                          ? 'bg-white text-blue-600 hover:bg-gray-100'
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                      }`}
                    >
                      Enter Portal
                      <motion.div
                        whileHover={{ x: 5 }}
                        className="ml-2"
                      >
                        →
                      </motion.div>
                    </Link>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Interactive Map Section */}
      <section id="map" className="py-20">
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

          {/* Search Bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-8"
          >
            <Search />
          </motion.div>

          {/* Map Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="bg-white rounded-2xl shadow-2xl overflow-hidden"
          >
            <div className="h-[600px] relative">
              <Map />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-white mb-4">
              Powerful Features
            </h2>
            <p className="text-xl text-blue-100 max-w-2xl mx-auto">
              Advanced tools and insights to ensure safe drinking water for all Georgians
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: Shield,
                title: 'Real-time Monitoring',
                description: 'Live updates on water quality violations and compliance status'
              },
              {
                icon: BarChart3,
                title: 'Advanced Analytics',
                description: 'Comprehensive data visualization and trend analysis'
              },
              {
                icon: MapPin,
                title: 'Geographic Insights',
                description: 'Interactive maps showing water systems across Georgia'
              },
              {
                icon: TrendingUp,
                title: 'Predictive Intelligence',
                description: 'AI-powered insights for proactive water quality management'
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

      {/* CTA Section */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl font-bold text-gray-900 mb-6">
              Ready to Explore Georgia's Water Quality?
            </h2>
            <p className="text-xl text-gray-600 mb-8">
              Join thousands of Georgians staying informed about their water quality
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="#map"
                className="inline-flex items-center px-8 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-lg font-medium"
              >
                <MapPin className="w-5 h-5 mr-2" />
                Explore the Map
              </Link>
              <Link
                href="/operator/dashboard"
                className="inline-flex items-center px-8 py-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-lg font-medium"
              >
                <Building className="w-5 h-5 mr-2" />
                Operator Login
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
} 