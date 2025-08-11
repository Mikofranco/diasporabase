import { Event, Stat, Activity, } from '../types/dashboard';

export const fetchDashboardData = async (): Promise<{
  stats: Stat[];
  activities: Activity[];
  events: Event[];
}> => {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 1000));

  return {
    stats: [
      {
        title: 'Active Members',
        value: '2,847',
        change: '+12% this month',
        changeColor: 'text-emerald-600',
        icon: 'users',
        gradient: 'from-blue-500 to-purple-500',
      },
      {
        title: 'Upcoming Events',
        value: '18',
        change: '3 this week',
        changeColor: 'text-amber-600',
        icon: 'calendar-days',
        gradient: 'from-amber-500 to-orange-500',
      },
      {
        title: 'Job Opportunities',
        value: '156',
        change: '+8 new today',
        changeColor: 'text-emerald-600',
        icon: 'briefcase',
        gradient: 'from-emerald-500 to-teal-500',
      },
      {
        title: 'Unread Messages',
        value: '24',
        change: 'Needs attention',
        changeColor: 'text-red-600',
        icon: 'message',
        gradient: 'from-red-500 to-pink-500',
      },
    ],
    activities: [
      {
        user: 'Carlos Martinez',
        avatar: 'https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-2.jpg',
        action: 'Created "Tech Networking Night" event',
        time: '2 hours ago',
        type: 'New Event',
        typeColor: 'text-blue-700',
        gradient: 'from-blue-50 to-purple-50',
        borderColor: 'border-blue-100',
      },
      {
        user: 'Ana Silva',
        avatar: 'https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-1.jpg',
        action: 'Posted a job opportunity at Microsoft',
        time: '5 hours ago',
        type: 'Job Post',
        typeColor: 'text-emerald-700',
        gradient: 'from-emerald-50 to-teal-50',
        borderColor: 'border-emerald-100',
      },
      {
        user: 'Diego Fernandez',
        avatar: 'https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-3.jpg',
        action: 'Joined the community from Barcelona',
        time: '1 day ago',
        type: 'New Member',
        typeColor: 'text-amber-700',
        gradient: 'from-amber-50 to-orange-50',
        borderColor: 'border-amber-100',
      },
    ],
    events: [
      {
        category: 'Tech',
        categoryColor: 'text-blue-700',
        date: 'Jan 28',
        title: 'Startup Pitch Night',
        description: 'Present your startup ideas to investors and fellow entrepreneurs.',
        attendees: [
          'https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-4.jpg',
          'https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-6.jpg',
          'https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-7.jpg',
        ],
        additionalAttendees: 5,
        buttonColor: 'bg-blue-600 hover:bg-blue-700',
        gradient: 'from-blue-50 to-purple-50',
        borderColor: 'border-blue-100',
      },
      {
        category: 'Cultural',
        categoryColor: 'text-emerald-700',
        date: 'Feb 2',
        title: 'Latin Food Festival',
        description: 'Celebrate our heritage with traditional foods and music.',
        attendees: [
          'https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-8.jpg',
          'https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-9.jpg',
        ],
        additionalAttendees: 12,
        buttonColor: 'bg-emerald-600 hover:bg-emerald-700',
        gradient: 'from-emerald-50 to-teal-50',
        borderColor: 'border-emerald-100',
      },
      {
        category: 'Professional',
        categoryColor: 'text-amber-700',
        date: 'Feb 5',
        title: 'Career Workshop',
        description: 'Learn resume writing and interview skills from industry experts.',
        attendees: [
          'https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-1.jpg',
          'https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-2.jpg',
          'https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-3.jpg',
        ],
        additionalAttendees: 8,
        buttonColor: 'bg-amber-600 hover:bg-amber-700',
        gradient: 'from-amber-50 to-orange-50',
        borderColor: 'border-amber-100',
      },
    ],
  };
};