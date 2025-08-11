"use client"
import React, { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus } from '@fortawesome/free-solid-svg-icons';
import { fetchDashboardData } from '@/lib/data/dashboard'; // Adjust path as needed
import {  Stat, Activity, Event } from '@/lib/types/dashboard'; // Adjust path as needed


const Volunteerdashboard: React.FC = () => {
  const [data, setData] = useState<{ stats: Stat[]; activities: Activity[]; events: Event[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const response = await fetchDashboardData(); // Replace with real API call if needed
        setData(response);
        setLoading(false);
      } catch (err) {
        setError('Failed to load dashboard data');
        setLoading(false);
      }
    };
    loadData();
  }, []);

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }

  if (error) {
    return <div className="flex justify-center items-center min-h-screen text-red-600">{error}</div>;
  }

  return (
    <div id="diaspora-dashboard" className="bg-gradient-to-br from-slate-50 to-blue-50 min-h-screen">
      <main id="main-content" className="flex-1 p-8">
        {/* Dashboard Overview */}
        <div id="dashboard-overview" className="mb-8">
          <h1 className="text-4xl font-bold text-slate-800 mb-2">Welcome Back, Maria!</h1>
          <p className="text-slate-600 text-lg">Here's what's happening in your diaspora community today.</p>
        </div>

        {/* Stats Cards */}
        <div id="stats-cards" className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {data?.stats.map((stat, index) => (
            <div
              key={index}
              className="bg-white/80 backdrop-blur-lg p-6 rounded-2xl border border-blue-100 shadow-lg hover:shadow-xl transition-all"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-500 text-sm font-medium">{stat.title}</p>
                  <p className="text-3xl font-bold text-slate-800">{stat.value}</p>
                  <p className={`${stat.changeColor} text-sm font-medium mt-1`}>{stat.change}</p>
                </div>
                <div className={`bg-gradient-to-r ${stat.gradient} p-3 rounded-xl`}>
                  <FontAwesomeIcon icon={['fas', stat.icon]} className="text-white text-xl" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Recent Activities */}
        <div id="recent-activities" className="bg-white/80 backdrop-blur-lg rounded-2xl border border-blue-100 shadow-lg mb-8">
          <div className="p-6 border-b border-blue-100">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-slate-800">Recent Community Activities</h2>
              <button className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:shadow-lg transition-all font-medium">
                <FontAwesomeIcon icon={faPlus} className="mr-2" />
                Create Event
              </button>
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {data?.activities.map((activity, index) => (
                <div
                  key={index}
                  className={`flex items-center justify-between p-5 bg-gradient-to-r ${activity.gradient} rounded-xl border ${activity.borderColor}`}
                >
                  <div className="flex items-center space-x-4">
                    <img
                      src={activity.avatar}
                      alt="User"
                      className="w-12 h-12 rounded-full border-2 border-blue-200"
                    />
                    <div>
                      <p className="font-semibold text-slate-800">{activity.user}</p>
                      <p className="text-slate-600">{activity.action}</p>
                      <p className="text-sm text-slate-500">{activity.time}</p>
                    </div>
                  </div>
                  <span className={`px-4 py-2 bg-${activity.typeColor.split('-')[1]}-100 ${activity.typeColor} rounded-full text-sm font-medium`}>
                    {activity.type}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Upcoming Events */}
        <div id="upcoming-events" className="bg-white/80 backdrop-blur-lg rounded-2xl border border-blue-100 shadow-lg">
          <div className="p-6 border-b border-blue-100">
            <h2 className="text-2xl font-bold text-slate-800">Upcoming Events</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {data?.events.map((event, index) => (
                <div
                  key={index}
                  className={`bg-gradient-to-br ${event.gradient} p-6 rounded-xl border ${event.borderColor} hover:shadow-lg transition-all`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <span className={`px-3 py-1 bg-${event.categoryColor.split('-')[1]}-100 ${event.categoryColor} rounded-full text-sm font-medium`}>
                      {event.category}
                    </span>
                    <span className="text-sm text-slate-500">{event.date}</span>
                  </div>
                  <h3 className="font-bold text-slate-800 mb-2">{event.title}</h3>
                  <p className="text-slate-600 text-sm mb-4">{event.description}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex -space-x-2">
                      {event.attendees.map((attendee, idx) => (
                        <img
                          key={idx}
                          src={attendee}
                          alt="Attendee"
                          className="w-6 h-6 rounded-full border-2 border-white"
                        />
                      ))}
                      <span className="w-6 h-6 bg-slate-300 rounded-full border-2 border-white flex items-center justify-center text-xs text-slate-600">
                        +{event.additionalAttendees}
                      </span>
                    </div>
                    <button className={`px-4 py-2 ${event.buttonColor} text-white rounded-lg text-sm transition-colors`}>
                      Join
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Volunteerdashboard;