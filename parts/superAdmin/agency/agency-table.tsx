"use client";

import React, { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

// Initialize Supabase client
const supabase = createClient();

// Define TypeScript interface for agency profile
interface AgencyProfile {
  id: string;
  organization_name: string | null;
  contact_person_email: string | null;
  website: string | null;
  focus_areas: string[] | null;
  role: 'agency';
}

const AgencyList: React.FC = () => {
  const [agencies, setAgencies] = useState<AgencyProfile[]>([]);
  const [filteredAgencies, setFilteredAgencies] = useState<AgencyProfile[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const pageSize = 10;
  const [user, setUser] = useState<any>(null); // Replace with Supabase's User type if available
  const router = useRouter();

  // Check user authentication and role
  useEffect(() => {
    const fetchUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (error || !['admin', 'super_admin'].includes(profile.role)) {
        router.push('/unauthorized');
        return;
      }
      setUser(user);
    };

    fetchUser();
  }, [router]);

  // Fetch agencies
  useEffect(() => {
    const fetchAgencies = async () => {
      setLoading(true);
      setError(null);

      const query = supabase
        .from('profiles')
        .select('id, organization_name, contact_person_email, website, focus_areas, role', {
          count: 'exact',
        })
        .eq('role', 'agency')
        .range((page - 1) * pageSize, page * pageSize - 1);

      const { data, error, count } = await query;

      if (error) {
        setError('Failed to fetch agencies');
        console.error(error);
        toast.error('Failed to fetch agencies');
      } else {
        setAgencies(data as AgencyProfile[]);
        setTotalPages(Math.ceil((count || 0) / pageSize));
      }
      setLoading(false);
    };

    if (user) {
      fetchAgencies();
    }

    // Real-time subscription
    const subscription = supabase
      .channel('profiles')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'profiles', filter: 'role=eq.agency' },
        () => fetchAgencies(),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [page, user]);

  // Filter agencies by search query
  useEffect(() => {
    const filtered = agencies.filter(
      (agency) =>
        (agency.organization_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (agency.contact_person_email || '').toLowerCase().includes(searchQuery.toLowerCase()),
    );
    setFilteredAgencies(filtered);
  }, [agencies, searchQuery]);

  // Handle row click to navigate to agency profile
  const handleRowClick = (agencyId: string) => {
    router.replace(`/dashboard/admin/agencies/${agencyId}`);
  };

  if (!user) return null;

  return (
    <div className="container mx-auto p-6 border rounded-lg shadow-sm bg-white">
      <h1 className="text-3xl font-bold mb-6">Agency List</h1>

      {/* Search */}
      <div className="mb-6">
        <label htmlFor="search" className="text-sm font-medium mb-1 block">
          Search Agencies
        </label>
        <Input
          id="search"
          placeholder="Search by organization name or email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full max-w-md"
        />
      </div>

      {/* Error Message */}
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="flex justify-center items-center py-10">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : filteredAgencies.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-gray-500">No agencies found.</p>
          <Button
            variant="link"
            onClick={() => setSearchQuery('')}
            className="mt-2"
          >
            Clear Search
          </Button>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className='bg-gray-50'>
                <TableRow>
                  <TableHead>Organization Name</TableHead>
                  <TableHead>Contact Email</TableHead>
                  <TableHead>Website</TableHead>
                  <TableHead>Focus Areas</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAgencies.map((agency) => (
                  <TableRow
                    key={agency.id}
                    onClick={() => handleRowClick(agency.id)}
                    className="cursor-pointer hover:bg-gray-100"
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        handleRowClick(agency.id);
                      }
                    }}
                  >
                    <TableCell>{agency.organization_name || 'N/A'}</TableCell>
                    <TableCell>{agency.contact_person_email || 'N/A'}</TableCell>
                    <TableCell>
                      {agency.website ? (
                        <a
                          href={agency.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {agency.website}
                        </a>
                      ) : (
                        'N/A'
                      )}
                    </TableCell>
                    <TableCell>
                      {agency.focus_areas?.join(', ') || 'N/A'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <Pagination className="mt-6">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => setPage((prev) => Math.max(prev - 1, 1))}//@ts-ignore
                    disabled={page === 1}
                  />
                </PaginationItem>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <PaginationItem key={p}>
                    <PaginationLink
                      onClick={() => setPage(p)}
                      isActive={p === page}
                    >
                      {p}
                    </PaginationLink>
                  </PaginationItem>
                ))}
                <PaginationItem>
                  <PaginationNext
                    onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}//@ts-ignore
                    disabled={page === totalPages}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </>
      )}
    </div>
  );
};

export default AgencyList;