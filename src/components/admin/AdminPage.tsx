import { useData } from '../../context/DataContext';
import AdminLogin from './AdminLogin';
import AdminDashboard from './AdminDashboard';

export default function AdminPage() {
  const { isAdminLoggedIn } = useData();

  if (!isAdminLoggedIn) {
    return <AdminLogin onSuccess={() => {}} />;
  }

  return <AdminDashboard />;
}
