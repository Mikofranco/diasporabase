"use client"
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Bell, Check, X, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import Link from 'next/link';
export interface Notification {
  id: string;
  user_id: string;
  message: string;
  type:
    | 'request_status_change'
    | 'project_approval'
    | 'new_agency'
    | 'new_project'
    | 'volunteer_request_send'
    | 'volunteer_request_to_join_project';
  is_read: boolean;
  created_at: string;
  related_id?: string;
  project_id?: string;
  projects?: { title: string };
}

export interface VolunteerRequest {
  id: string;
  project_id: string;
  volunteer_id: string;
  status: 'pending' | 'accepted' | 'rejected';
  organization_id?: string;
  created_at: string;
}

export interface ProjectVolunteer {
  project_id: string;
  volunteer_id: string;
  created_at: string;
}

export interface User {
  id: string;
  email?: string;
}

const NotificationScreen: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    async function setupNotifications() {
      setLoading(true);
      try {
        // Get authenticated user
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
          toast.error('Error: User not authenticated');
          setLoading(false);
          return;
        }
        setUser(user);

        // Fetch notifications
        const { data, error } = await supabase
          .from('notifications')
          .select(`
            id,
            user_id,
            message,
            type,
            is_read,
            created_at,
            related_id,
            project_id,
            projects (title)
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setNotifications(data || []);
      } catch (err: any) {
        toast.error(`Error fetching notifications: ${err.message}`);
      } finally {
        setLoading(false);
      }

      // Set up real-time subscription
      const subscription = supabase
        .channel('notifications')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${user?.id}`,
          },
          (payload:any) => {
            setNotifications((prev) => [payload.new as Notification, ...prev]);
            toast.info('New notification received!');
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(subscription);
      };
    }
    setUserRole(localStorage.getItem('diaspobase_role'));
    setupNotifications();
  }, [user?.id]);

  const handleMarkAsRead = async (id: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', id);
      if (error) throw error;
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
      toast.success('Notification marked as read');
    } catch (err: any) {
      toast.error(`Error marking notification: ${err.message}`);
    }
  };

  const handleVolunteerRequest = async (notification: Notification, status: 'accepted' | 'rejected') => {
    if (notification.type !== 'volunteer_request_to_join_project') return;

    try {
      // Update volunteer_requests
      const { error: requestError } = await supabase
        .from('volunteer_requests')
        .update({ status })
        .eq('id', notification.related_id)
        .eq('volunteer_id', user?.id);

      if (requestError) throw requestError;

      // If accepted, add to project_volunteers
      if (status === 'accepted') {
        const { error: volunteerError } = await supabase
          .from('project_volunteers')
          .insert({
            project_id: notification.project_id,
            volunteer_id: user?.id,
            created_at: new Date().toISOString(),
          });

        if (volunteerError) throw volunteerError;
      }

      // Mark notification as read
      await handleMarkAsRead(notification.id);
      toast.success(`Project request ${status}`);
    } catch (err: any) {
      toast.error(`Error processing request: ${err.message}`);
    }
  };

  const renderNotificationContent = (notification: Notification) => {
    switch (notification.type) {
      case 'volunteer_request_to_join_project':
        return (
          <div className="space-y-2">
            <p className="text-sm text-gray-900 dark:text-gray-100">{notification.message}</p>
            {/* <Link
              href={`/dashboard/${userRole}/projects/${notification.project_id}`}
              className="text-[#0284C7] hover:underline text-sm"
            >
              View Project
            </Link> */}
            <div className="flex gap-2">
              <Button
                size="sm"
                className="bg-[#0284C7] hover:bg-blue-700 text-white text-xs"
                onClick={() => handleVolunteerRequest(notification, 'accepted')}
              >
                <Check className="mr-2 h-4 w-4" />
                Accept
              </Button>
              <Button
                size="sm"
                variant="destructive"
                className="text-xs"
                onClick={() => handleVolunteerRequest(notification, 'rejected')}
              >
                <X className="mr-2 h-4 w-4" />
                Reject
              </Button>
            </div>
          </div>
        );
      case 'project_approval':
        
      case 'new_project':
        return (
          <div className="space-y-2">
            <p className="text-sm text-gray-900 dark:text-gray-100">{notification.message}</p>
            {/* <Link
              href={`/dashboard/${userRole}/projects/${notification.project_id}`}
              className="text-[#0284C7] hover:underline text-sm"
            >
              View Project
            </Link> */}
          </div>
        );
      default:
        return (
          <p className="text-sm text-gray-600 dark:text-gray-400">{notification.message}</p>
        );
    }
  };

  return (
    <Card className="w-full mx-auto bg-white dark:bg-gray-900">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center">
          <Bell className="mr-2 h-5 w-5 text-[#0284C7]" />
          Volunteer Notifications
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-sm text-gray-600 dark:text-gray-400">Loading notifications...</p>
        ) : notifications.length === 0 ? (
          <p className="text-sm text-gray-600 dark:text-gray-400">No notifications</p>
        ) : (
          <div className="space-y-4">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-4 rounded-md border ${
                  notification.is_read
                    ? 'border-gray-200 dark:border-gray-700'
                    : 'border-[#0284C7] bg-blue-50 dark:bg-blue-900/50'
                }`}
              >
                {renderNotificationContent(notification)}
                {!notification.is_read && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-2 text-xs border-gray-300 dark:border-gray-700"
                    onClick={() => handleMarkAsRead(notification.id)}
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    Mark as Read
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default NotificationScreen;