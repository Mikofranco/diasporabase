// components/Notifications.js
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getUserId } from '@/lib/utils';
import { supabase } from '@/lib/supabase/client';
import { number } from 'framer-motion';
import { Notification } from '@/lib/types';
import { DashboardLoader } from './ui/dashboard-loader';

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [userId, setUserId] = useState(null);
  const [error, setError] = useState(null);
  const router = useRouter();

  // Fetch user ID
  useEffect(() => {
    const fetchUserId = async () => {
      const { data, error } = await getUserId();
      if (error) {
        setError(error);
        return;
      }
      setUserId(data);
    };
    fetchUserId();
  }, []);

  // Fetch notifications and set up real-time subscription
  useEffect(() => {
    if (!userId) return;

    const fetchNotifications = async () => {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching notifications:', error);
        setError(error.message);
        return;
      }

      setNotifications(data);
      const unread = data.filter((n:any) => !n.is_read).length;
      setUnreadCount(unread);
      localStorage.setItem('unreadNotifications', String(unread));
    };

    fetchNotifications();

    // Real-time subscription
    const subscription = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },//@ts-ignore
        (payload) => {//@ts-ignore
          setNotifications((prev) => [payload.new, ...prev]);
          setUnreadCount((prev) => {
            const newCount = prev + 1;//@ts-ignore
            localStorage.setItem('unreadNotifications', String(newCount));
            return newCount;
          });
        }
      )
      .subscribe();

    return () => supabase.removeChannel(subscription);
  }, [userId]);

  //@ts-ignore
  const markAsRead = async (notificationId) => {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId);

    if (error) {
      console.error('Error marking notification as read:', error);
      setError(error.message);
      return;
    }
    //@ts-ignore
    setNotifications((prev) =>
      prev.map((n:any) =>
        n.id === notificationId ? { ...n, is_read: true } : n
      )
    );
    setUnreadCount((prev) => {
      const newCount = prev - 1;
      localStorage.setItem('unreadNotifications', String(newCount));
      return newCount;
    });
  };

  // Handle volunteer request response
  const handleVolunteerResponse = async (requestId:string, status:string, projectId:string) => {
    const { error } = await supabase
      .from('volunteer_requests')
      .update({ status })
      .eq('id', requestId);

    if (error) {
      console.error('Error updating request:', error);
      setError(error.message);
      return;
    }

    // If accepted, add to project_volunteers
    if (status === 'accepted') {
      const { error: insertError } = await supabase
        .from('project_volunteers')
        .insert({ project_id: projectId, volunteer_id: userId });

      if (insertError) {
        console.error('Error adding to project_volunteers:', insertError);
        setError(insertError.message);
        return;
      }
    }

    router.refresh(); // Refresh to update UI
  };

  if (error) {
    return <div className="text-red-500 p-4">Error: {error}</div>;
  }

  if (!userId) {
    return <DashboardLoader label="Loading" />;
  }

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">
        Notifications ({unreadCount} unread)
      </h1>
      {notifications.length === 0 ? (
        <p>No notifications.</p>
      ) : (
        <ul className="space-y-4">
          {notifications.map((notification: Notification) => (
            <li
              key={notification.id}
              className={`p-4 border rounded-lg ${
                notification.is_read ? 'bg-gray-100' : 'bg-blue-50'
              }`}
            >
              <p className="text-sm text-gray-600">
                {notification.created_at
                  ? new Date(notification.created_at).toLocaleString()
                  : '—'}
              </p>
              <p className="font-medium">{notification.message}</p>
              {notification.type === 'request_status_change' &&
                notification.related_id && (
                <div className="mt-2">
                  {notification.status === 'pending' && (
                    <div className="flex space-x-2">
                      <button
                        onClick={() => {
                          const id = notification.related_id;
                          if (id)
                            handleVolunteerResponse(id, 'accepted', id);
                        }}
                        className="px-4 py-2 bg-green-500 text-white rounded"
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => {
                          const id = notification.related_id;
                          if (id)
                            handleVolunteerResponse(id, 'rejected', id);
                        }}
                        className="px-4 py-2 bg-red-500 text-white rounded"
                      >
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              )}
              {!notification.is_read && (
                <button
                  onClick={() => markAsRead(notification.id)}
                  className="mt-2 text-sm text-blue-600"
                >
                  Mark as read
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}