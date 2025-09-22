import EmployeeDetail from '@/components/admin/EmployeeDetail';

// Generate static params for static export
export async function generateStaticParams() {
  // Return empty array since this is a server component with dynamic data
  return [];
}

export default function EmployeeDetailPage() {
  return <EmployeeDetail />;
} 