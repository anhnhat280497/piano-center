import React, { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';
import Auth from './Auth'; // Import trang login/signup
import { Calendar, User, BookOpen, DollarSign, Clock, LogOut } from 'lucide-react';

export default function App() {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [allUsers, setAllUsers] = useState([]); 

  useEffect(() => {
    // Kiểm tra trạng thái đăng nhập
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchProfile(session.user.id);
      else setLoading(false);
    });

    // Lắng nghe thay đổi đăng nhập/đăng xuất
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchProfile(session.user.id);
      else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
  if (profile?.role === 'admin') {
    const fetchAllUsers = async () => {
      const { data } = await supabase.from('profiles').select('*');
      setAllUsers(data || []);
    };
    fetchAllUsers();
  }
}, [profile]);

  const fetchProfile = async (uid) => {
    setLoading(true);
    const { data } = await supabase.from('profiles').select('*').eq('id', uid).single();
    if (data) {
      setProfile(data);
      fetchLessons(data);
    }
    setLoading(false);
  };

  const fetchLessons = async (prof) => {
    let query = supabase.from('lessons').select(`
      *,
      student:profiles!lessons_student_id_fkey(full_name),
      teacher:profiles!lessons_teacher_id_fkey(full_name)
    `);
    
    if (prof.role === 'teacher') query = query.eq('teacher_id', prof.id);
    if (prof.role === 'student') query = query.eq('student_id', prof.id);
    
    const { data } = await query;
    setLessons(data || []);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  if (loading) return <div className="h-screen flex items-center justify-center font-bold">Đang tải...</div>;

  // Nếu chưa đăng nhập thì hiện trang Auth
  if (!session) {
    return <Auth />;
  }

  
// 2. Hàm Admin xếp lịch mới
const handleCreateLesson = async (e) => {
  e.preventDefault();
  const teacherId = document.getElementById('teacher_select').value;
  const studentId = document.getElementById('student_select').value;
  const startTime = document.getElementById('lesson_time').value;

  const { error } = await supabase.from('lessons').insert([{
    teacher_id: teacherId,
    student_id: studentId,
    start_time: startTime,
    status: 'scheduled',
    price_per_lesson: 200000 // Giá mặc định
  }]);

  if (error) alert(error.message);
  else {
    alert("Đã xếp lịch thành công!");
    fetchLessons(profile); // Reload lại danh sách
  }
};

// 3. Hàm Admin cập nhật trạng thái (GV nghỉ, Điểm danh hộ...)
const updateLessonStatus = async (lessonId, newStatus) => {
  const { error } = await supabase
    .from('lessons')
    .update({ status: newStatus })
    .eq('id', lessonId);

  if (error) alert(error.message);
  else fetchLessons(profile); // Reload lại danh sách
};

  return (
    <div className="min-h-screen bg-gray-50 p-4 font-sans">
      <header className="max-w-6xl mx-auto bg-white shadow-sm p-4 rounded-xl mb-6 flex justify-between items-center border border-gray-100">
        <h1 className="text-2xl font-extrabold text-indigo-600 flex items-center gap-2">
          <BookOpen /> Piano Center
        </h1>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="font-bold text-gray-800">{profile?.full_name}</p>
            <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">{profile?.role}</p>
          </div>
          <button onClick={handleLogout} className="p-2 bg-red-50 text-red-500 rounded-lg hover:bg-red-100 transition-all">
            <LogOut size={20} />
          </button>
        </div>
      </header>

      {/* Phần hiển thị Dashboard theo Role (Admin/Teacher/Student) - Giữ nguyên như cũ */}
      <main className="max-w-6xl mx-auto grid gap-6">
        {profile?.role === 'admin' && (
  <div className="space-y-8">
    {/* --- PHẦN 1: TỔNG QUAN TRẠNG THÁI HÔM NAY --- */}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="bg-white p-6 rounded-2xl shadow-sm border-t-4 border-indigo-500">
        <h3 className="text-gray-400 text-xs font-bold uppercase">Giáo viên đi làm</h3>
        <p className="text-3xl font-black text-indigo-600">
          {[...new Set(lessons.filter(l => l.status !== 'teacher_off').map(l => l.teacher_id))].length}
        </p>
      </div>
      <div className="bg-white p-6 rounded-2xl shadow-sm border-t-4 border-red-500">
        <h3 className="text-gray-400 text-xs font-bold uppercase">Giáo viên nghỉ (OFF)</h3>
        <p className="text-3xl font-black text-red-600">
          {lessons.filter(l => l.status === 'teacher_off').length}
        </p>
      </div>
      <div className="bg-white p-6 rounded-2xl shadow-sm border-t-4 border-green-500">
        <h3 className="text-gray-400 text-xs font-bold uppercase">Tổng buổi học</h3>
        <p className="text-3xl font-black text-green-600">{lessons.length}</p>
      </div>
    </div>

    {/* --- PHẦN 2: FORM XẾP LỊCH CHO HỌC VIÊN --- */}
    <div className="bg-white p-6 rounded-2xl shadow-md border border-gray-100">
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
        <Calendar className="text-indigo-600" /> Xếp lịch học mới
      </h2>
      <form onSubmit={handleCreateLesson} className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <select id="teacher_select" className="p-3 bg-gray-50 rounded-xl outline-none border-none text-sm" required>
          <option value="">Chọn Giáo viên</option>
          {allUsers.filter(u => u.role === 'teacher').map(t => (
            <option key={t.id} value={t.id}>{t.full_name}</option>
          ))}
        </select>
        <select id="student_select" className="p-3 bg-gray-50 rounded-xl outline-none border-none text-sm" required>
          <option value="">Chọn Học viên</option>
          {allUsers.filter(u => u.role === 'student').map(s => (
            <option key={s.id} value={s.id}>{s.full_name}</option>
          ))}
        </select>
        <input id="lesson_time" type="datetime-local" className="p-3 bg-gray-50 rounded-xl border-none text-sm" required />
        <button type="submit" className="bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all">
          Thêm lịch học
        </button>
      </form>
    </div>

    {/* --- PHẦN 3: BẢNG LƯƠNG & QUẢN LÝ TỔNG THỂ --- */}
    <div className="bg-white rounded-2xl shadow-md overflow-hidden border border-gray-100">
      <div className="p-6 bg-gray-50 border-b flex justify-between items-center">
        <h2 className="text-lg font-bold flex items-center gap-2">
          <DollarSign className="text-green-600" /> Quản lý Lương & Trạng thái dạy
        </h2>
        <span className="text-xs text-gray-400 italic font-medium">Lương tính dựa trên % buổi 'Attended'</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-gray-50 text-gray-400 text-[10px] uppercase tracking-widest">
            <tr>
              <th className="p-4">Giáo viên</th>
              <th className="p-4">Học viên</th>
              <th className="p-4">Thời gian</th>
              <th className="p-4">Trạng thái</th>
              <th className="p-4 text-right">Lương (%)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-sm">
            {lessons.map((l) => (
              <tr key={l.id} className="hover:bg-gray-50 transition-colors">
                <td className="p-4 font-bold text-gray-700">{l.teacher?.full_name}</td>
                <td className="p-4 text-gray-600">{l.student?.full_name || 'N/A'}</td>
                <td className="p-4 text-gray-500">{new Date(l.start_time).toLocaleString('vi-VN')}</td>
                <td className="p-4">
                  <select 
                    value={l.status} 
                    onChange={(e) => updateLessonStatus(l.id, e.target.value)}
                    className={`text-[10px] font-bold px-2 py-1 rounded-full border-none outline-none ${
                      l.status === 'attended' ? 'bg-green-100 text-green-700' : 
                      l.status === 'teacher_off' ? 'bg-red-100 text-red-700' : 'bg-gray-100'
                    }`}
                  >
                    <option value="scheduled">Scheduled</option>
                    <option value="attended">Attended (Đã dạy)</option>
                    <option value="absent">Absent (Học viên nghỉ)</option>
                    <option value="teacher_off">Teacher Off (GV nghỉ)</option>
                  </select>
                </td>
                <td className="p-4 text-right font-black text-indigo-600">
                  {l.status === 'attended' ? (l.price_per_lesson * 0.4).toLocaleString() + 'đ' : '0đ'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </div>
)}
        
        {/* ... Copy lại các View Admin/Teacher/Student từ code trước vào đây ... */}
      </main>
    </div>
  );
}