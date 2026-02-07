import { redirect } from 'next/navigation';

/**
 * Admin Index Page
 * ----------------
 * Redirects to users management page.
 */
export default function AdminPage() {
  redirect('/admin/users');
}
