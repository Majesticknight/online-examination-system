import { Navigate, Route, Routes } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import AppShell from './layouts/AppShell';
import Login from './pages/Login';
import Register from './pages/Register';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminExams from './pages/admin/AdminExams';
import AdminQuestions from './pages/admin/AdminQuestions';
import AdminResults from './pages/admin/AdminResults';
import AdminStudents from './pages/admin/AdminStudents';
import StudentDashboard from './pages/student/StudentDashboard';
import StudentExams from './pages/student/StudentExams';
import TakeExam from './pages/student/TakeExam';
import StudentResults from './pages/student/StudentResults';
import ResultReview from './pages/student/ResultReview';
import { useAuth } from './services/AuthContext';

function HomeRedirect() {
  const { user, loading } = useAuth();
  if (loading) return <div className="grid min-h-screen place-items-center text-sm text-slate-500">Loading Examly…</div>;
  return <Navigate to={user ? (user.role === 'admin' ? '/admin/dashboard' : '/student/dashboard') : '/login'} replace />;
}

export default function App() {
  return <Routes>
    <Route path="/" element={<HomeRedirect />} />
    <Route path="/login" element={<Login />} />
    <Route path="/register" element={<Register />} />
    <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
      <Route element={<AppShell />}>
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/exams" element={<AdminExams />} />
        <Route path="/admin/exams/:examId/questions" element={<AdminQuestions />} />
        <Route path="/admin/results" element={<AdminResults />} />
        <Route path="/admin/students" element={<AdminStudents />} />
      </Route>
    </Route>
    <Route element={<ProtectedRoute allowedRoles={['student']} />}>
      <Route element={<AppShell />}>
        <Route path="/student/dashboard" element={<StudentDashboard />} />
        <Route path="/student/exams" element={<StudentExams />} />
        <Route path="/student/results" element={<StudentResults />} />
      </Route>
      <Route path="/student/attempts/:attemptId" element={<TakeExam />} />
      <Route element={<AppShell />}>
        <Route path="/student/results/:attemptId" element={<ResultReview />} />
      </Route>
    </Route>
    <Route path="*" element={<HomeRedirect />} />
  </Routes>;
}
