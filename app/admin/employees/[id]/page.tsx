import EmployeeDetail from '@/app/(admin)/employees/[id]/page';

// Generate static params for static export
export async function generateStaticParams() {
  // Return empty array since this is a server component with dynamic data
  return [];
}

export default function EmployeeDetailPage() {
  return <EmployeeDetail />;
} 