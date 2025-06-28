'use client';

import { useState, useEffect } from 'react';
import { Bar, Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement } from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

// Helper to generate random colors for the pie chart
const getRandomColor = () => `rgba(${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, 0.2)`;

export default function RegulatorDashboard() {
  const [chartData, setChartData] = useState<any>(null);
  const [topSystems, setTopSystems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/regulatory-data');
        const data = await res.json();
        
        // Format data for the pie chart (Violations by Type)
        const pieData = {
          labels: data.violationsByType.map((d: any) => d._id || 'Unknown'),
          datasets: [{
            label: '# of Violations',
            data: data.violationsByType.map((d: any) => d.count),
            backgroundColor: data.violationsByType.map(() => getRandomColor()),
            borderColor: data.violationsByType.map(() => getRandomColor().replace('0.2', '1')),
            borderWidth: 1,
          }],
        };

        // Format data for the bar chart (Violations by Month)
        // This is a simplified version, a real app would handle dates more robustly
        const barData = {
            labels: data.violationsByMonth.map((d: any) => `${d._id.year}-${String(d._id.month).padStart(2, '0')}`),
            datasets: [{
              label: 'Violations per month',
              data: data.violationsByMonth.map((d: any) => d.count),
              backgroundColor: 'rgba(54, 162, 235, 0.2)',
              borderColor: 'rgba(54, 162, 235, 1)',
              borderWidth: 1
            }]
        };

        setChartData({ pie: pieData, bar: barData });
        setTopSystems(data.topSystems);
      } catch (error) {
        console.error("Failed to fetch regulatory data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-24">
        <p>Loading regulatory data...</p>
      </main>
    )
  }

  return (
    <main className="flex min-h-screen flex-col items-center p-24">
      <div className="w-full max-w-7xl">
        <h1 className="text-4xl font-bold">Statewide Regulatory Dashboard</h1>
        <p className="mt-2 text-lg text-gray-600">
          An overview of water quality compliance across Georgia.
        </p>
        
        <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
            <h2 className="text-2xl font-bold">Violations by Type</h2>
            <div className="mt-4" style={{ height: '300px' }}>
              {chartData?.pie && <Pie data={chartData.pie} options={{ maintainAspectRatio: false }} />}
            </div>
          </div>
          <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
            <h2 className="text-2xl font-bold">Violations Over Time</h2>
            <div className="mt-4" style={{ height: '300px' }}>
              {chartData?.bar && <Bar data={chartData.bar} options={{ maintainAspectRatio: false }} />}
            </div>
          </div>
        </div>

        <div className="mt-10">
          <h2 className="text-2xl font-bold">Systems with Most Violations</h2>
          <div className="mt-4 rounded-lg border bg-card text-card-foreground shadow-sm">
            <div className="p-6">
              {topSystems.length > 0 ? (
                <ol className="list-decimal list-inside">
                  {topSystems.map((system, index) => (
                    <li key={index} className="py-1">
                      {system._id || 'Unknown System'}: <span className="font-semibold">{system.count} violations</span>
                    </li>
                  ))}
                </ol>
              ) : (
                <p>No data available.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
} 