import { Suspense } from 'react';
import AuthSuccessContent from '@/parts/auth-success';

export default function AuthSuccessPage() { 

return (
  <Suspense fallback={<div>Loading auth callback...</div>}>
    <AuthSuccessContent />
  </Suspense>
)};