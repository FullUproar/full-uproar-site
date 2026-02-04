import { Suspense } from 'react';
import AdminApp from './AdminApp';

function AdminLoading() {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      background: '#0a0a0a'
    }}>
      <div style={{ color: '#FBDB65', fontSize: '18px' }}>
        Loading admin panel...
      </div>
    </div>
  );
}

export default function AdminPage() {
  return (
    <Suspense fallback={<AdminLoading />}>
      <AdminApp />
    </Suspense>
  );
}
