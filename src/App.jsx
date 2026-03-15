import React, { useEffect, useState } from 'react';
import { supabase } from './lib/supabase';
import { Toaster } from 'react-hot-toast';
import Auth from './components/Auth';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/admin/Dashboard';
import Schedule from './pages/admin/Schedule';
import Accounts from './pages/admin/Accounts';
import TeacherView from './pages/TeacherView';
import StudentView from './pages/StudentView';
import ClassesByDay from './pages/admin/ClassesByDay';
import ClassesByGroup from './pages/admin/ClassesByGroup';
import ConfirmModal from './components/ConfirmModal';
import toast from 'react-hot-toast';
import { ROLES } from './lib/constants';

export default function App() {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState({ isOpen: false });

  const loadAllData = async (uid) => {
    try {
      // Không cần set lại setLoading(true) ở đây để tránh màn hình bị nháy trắng (flash) khi đang dùng

      const { data: prof } = await supabase.from('profiles').select('*').eq('id', uid).maybeSingle();
      if (!prof) return;
      setProfile({ ...prof }); // Dùng spread để tạo object mới

      if (prof.role === ROLES.ADMIN) {
        const { data: uData } = await supabase.from('profiles').select('*').order('role', { ascending: true });
        if (uData) setAllUsers([...uData]); // Ép render lại mảng User
      }

      const { data: lData } = await supabase.from('lessons').select(`
      *, 
      student:profiles!lessons_student_id_fkey(*), 
      teacher:profiles!lessons_teacher_id_fkey(*)
    `).order('start_time', { ascending: false });

      if (lData) setLessons([...lData]); // Ép render lại mảng Lesson

    } catch (e) {
      console.error("Lỗi loadAllData:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) loadAllData(session.user.id); else setLoading(false);
    });
    supabase.auth.onAuthStateChange((_e, session) => {
      setSession(session);
      if (session) loadAllData(session.user.id);
    });
  }, []);

  // Hàm hỗ trợ hiển thị Modal xác nhận
  const askConfirm = (title, message, onConfirm, type = 'danger') => {
    setConfirmConfig({
      isOpen: true,
      title,
      message,
      type,
      onConfirm: () => {
        onConfirm();
        setConfirmConfig({ isOpen: false });
      },
      onCancel: () => setConfirmConfig({ isOpen: false })
    });
  };

  // Hàm Đăng xuất có xác nhận
  const handleLogoutRequest = () => {
    askConfirm(
      "Đăng xuất hệ thống?",
      "Bạn có chắc chắn muốn thoát khỏi phiên làm việc hiện tại không?",
      async () => {
        await supabase.auth.signOut();
        toast.success("Đã đăng xuất");
      },
      "danger"
    );
  };

  // Hàm Khóa tài khoản có xác nhận
  const handleBlockRequest = (user) => {
    askConfirm(
      user.is_blocked ? "Mở khóa tài khoản?" : "Khóa tài khoản?",
      `Xác nhận thay đổi quyền truy cập của ${user.full_name}. Người dùng bị khóa sẽ không thể đăng nhập.`,
      async () => {
        // 1. Thực hiện khóa/mở khóa trên Database
        const { error } = await supabase
          .from('profiles')
          .update({ is_blocked: !user.is_blocked })
          .eq('id', user.id);

        if (error) {
          toast.error(user.is_blocked ? "Lỗi mở khóa: "+ error.message : "Lỗi khóa tài khoản: "+ error.message);
        }
        else {
          toast.success(user.is_blocked ? "Đã mở khóa" : "Đã khóa tài khoản");
          loadAllData(session.user.id); // Reload dữ liệu
        }
      },
      user.is_blocked ? "info" : "danger"
    );
  };

  if (loading) return <div className="h-screen flex items-center justify-center font-black">PIANO CENTER...</div>;
  if (!session) return <Auth />;

  // VIEW CHO ADMIN
  if (profile?.role === ROLES.ADMIN) {
    return (
      <div className="min-h-screen bg-slate-50 flex">
        <Toaster />
        <ConfirmModal {...confirmConfig} />
        <Sidebar
          active={currentTab}
          onChange={setCurrentTab}
          onLogout={handleLogoutRequest}
          isCollapsed={isSidebarCollapsed}
          onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        />
        <main className={`flex-1 p-10 transition-all duration-300 ${isSidebarCollapsed ? 'ml-20' : 'ml-64'}`}>
          {currentTab === 'dashboard' && <Dashboard lessons={lessons} />}
          {currentTab === 'schedule' && <Schedule allUsers={allUsers} onRefresh={() => loadAllData(session.user.id)} />}
          {currentTab === 'classes-day' && <ClassesByDay lessons={lessons} onRefresh={() => loadAllData(session.user.id)} />}
          {currentTab === 'classes-group' && <ClassesByGroup lessons={lessons} onRefresh={() => loadAllData(session.user.id)} />}
          {currentTab === 'accounts' && (
            <Accounts
              users={allUsers}
              onRefresh={() => loadAllData(session.user.id)}
              onBlock={handleBlockRequest}
            />
          )}
        </main>
      </div>
    );
  }

  // VIEW CHO GIÁO VIÊN / HỌC VIÊN
  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-12">
      <Toaster />
      <div className="max-w-5xl mx-auto">
        {profile?.role === ROLES.TEACHER ? (
          <TeacherView profile={profile} lessons={lessons.filter(l => l.teacher_id === profile.id)} onUpdateStatus={() => loadAllData(session.user.id)} />
        ) : (
          <StudentView profile={profile} lessons={lessons.filter(l => l.student_id === profile.id)} />
        )}
        <button onClick={() => supabase.auth.signOut()} className="mt-8 text-xs font-black text-gray-400 hover:text-red-500 uppercase tracking-widest">Đăng xuất khỏi hệ thống</button>
      </div>
    </div>
  );
}