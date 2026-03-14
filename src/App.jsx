import React, { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';
import Auth from './Auth';
import {
  Calendar, User, BookOpen, DollarSign, Clock,
  LogOut, Shield, ShieldOff, Edit, Save, Plus, Users, Wallet
} from 'lucide-react';
import { X } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import ConfirmModal from './ConfirmModal';
import Select from 'react-select';
import { format, addDays, setDay, isAfter, startOfDay } from 'date-fns';
import { vi } from 'date-fns/locale'; // Thêm ngôn ngữ tiếng Việt

// --- COMPONENT: QUẢN LÝ TÀI KHOẢN (ADMIN) ---
const AdminUserManagement = ({ users, onUpdate, onBlockUser }) => {
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  const handleUpdate = async (id) => {
    setIsSaving(true);

    // Lọc bỏ những dữ liệu không cần thiết hoặc bị null trước khi gửi
    const updateData = {
      full_name: editForm.full_name,
      role: editForm.role,
      is_blocked: editForm.is_blocked,
      // Chỉ gửi commission_rate nếu là teacher, tuition_rate nếu là student
      ...(editForm.role === 'teacher' && { commission_rate: parseFloat(editForm.commission_rate) }),
      ...(editForm.role === 'student' && { tuition_rate: parseInt(editForm.tuition_rate) })
    };

    const { error } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', id);

    if (error) {
      console.error("Lỗi Supabase:", error);
      toast.error("KHÔNG THỂ LƯU: " + error.message);
    } else {
      toast.success("Đã lưu thay đổi thành công!");
      setEditingId(null);
      onUpdate(); // Gọi hàm này để App.jsx load lại dữ liệu mới nhất
    }
    setIsSaving(false);
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border overflow-hidden mt-8">
      <div className="p-4 bg-slate-800 text-white font-bold flex items-center gap-2 uppercase text-xs tracking-widest">
        <Shield size={16} /> Quản lý tài khoản hệ thống
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="bg-gray-50 text-gray-400 uppercase font-black text-[10px]">
              <th className="p-4">Họ Tên / Vai Trò</th>
              <th className="p-4 text-center">Đơn giá / % Lương</th>
              <th className="p-4 text-center">Trạng Thái</th>
              <th className="p-4 text-right">Thao Tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {users.map(u => (
              <tr key={u.id} className={u.role === 'admin' ? "bg-indigo-50/30" : ""}>
                <td className="p-4">
                  {editingId === u.id ? (
                    <input
                      className="border-2 border-indigo-300 p-2 rounded-lg w-full outline-none"
                      value={editForm.full_name || ''}
                      onChange={e => setEditForm({ ...editForm, full_name: e.target.value })}
                    />
                  ) : (
                    <div>
                      <p className="font-bold text-slate-800">{u.full_name}</p>
                      <p className="text-[9px] text-gray-400 uppercase font-black tracking-widest">{u.role}</p>
                    </div>
                  )}
                </td>
                <td className="p-4 text-center">
                  {editingId === u.id ? (
                    u.role === 'teacher' ? (
                      <div className="flex items-center justify-center gap-1">
                        <input type="number" step="0.1" className="border-2 border-indigo-300 p-1 rounded w-16 text-center" value={editForm.commission_rate || 0} onChange={e => setEditForm({ ...editForm, commission_rate: e.target.value })} />
                        <span className="text-xs font-bold text-gray-400">%</span>
                      </div>
                    ) : u.role === 'student' ? (
                      <div className="flex items-center justify-center gap-1">
                        <input type="number" className="border-2 border-indigo-300 p-1 rounded w-24 text-center" value={editForm.tuition_rate || 0} onChange={e => setEditForm({ ...editForm, tuition_rate: e.target.value })} />
                        <span className="text-xs font-bold text-gray-400">đ</span>
                      </div>
                    ) : <span className="text-gray-300 italic text-xs">N/A</span>
                  ) : (
                    u.role === 'teacher' ? <span className="font-bold text-indigo-600">Lương: {u.commission_rate * 100}%</span> :
                      u.role === 'student' ? <span className="font-bold text-green-600">{u.tuition_rate?.toLocaleString()}đ / buổi</span> :
                        <span className="text-slate-300 text-[10px] uppercase font-bold tracking-tighter">Admin</span>
                  )}
                </td>
                <td className="p-4 text-center text-[10px] font-black">
                  {u.is_blocked ?
                    <span className="text-red-500 bg-red-50 px-2 py-1 rounded-md">BỊ KHÓA</span> :
                    <span className="text-green-500 bg-green-50 px-2 py-1 rounded-md">HOẠT ĐỘNG</span>
                  }
                </td>
                <td className="p-4 text-right">
                  {editingId === u.id ? (
                    <div className="flex justify-end gap-2">
                      <button
                        disabled={isSaving}
                        onClick={() => handleUpdate(u.id)}
                        className="bg-green-500 text-white p-2 rounded-lg hover:bg-green-600"
                      >
                        <Save size={16} />
                      </button>
                      <button onClick={() => setEditingId(null)} className="bg-gray-100 text-gray-500 p-2 rounded-lg"><X size={16} /></button>
                    </div>
                  ) : (
                    <div className="flex justify-end gap-2">
                      <button onClick={() => { setEditingId(u.id); setEditForm(u) }} className="text-indigo-500 p-2 hover:bg-indigo-50 rounded-lg"><Edit size={18} /></button>
                      {u.role !== 'admin' && (
                        <button
                          onClick={() => {
                            onBlockUser(u);
                          }}
                          className={u.is_blocked ? "text-green-500 p-2 hover:bg-green-50 rounded-lg" : "text-red-400 p-2 hover:bg-red-50 rounded-lg"}
                        >
                          {u.is_blocked ? <Shield size={18} /> : <ShieldOff size={18} />}
                        </button>
                      )}
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// --- COMPONENT CHÍNH ---
export default function App() {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirmConfig, setConfirmConfig] = useState({ isOpen: false });
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [selectedDays, setSelectedDays] = useState([]);
  const [expandedSession, setExpandedSession] = useState(null);
  const [expandedClass, setExpandedClass] = useState(null);
  const [filterDate, setFilterDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  const DAYS_OPTIONS = [
    { value: 1, label: 'Thứ 2' },
    { value: 2, label: 'Thứ 3' },
    { value: 3, label: 'Thứ 4' },
    { value: 4, label: 'Thứ 5' },
    { value: 5, label: 'Thứ 6' },
    { value: 6, label: 'Thứ 7' },
    { value: 0, label: 'Chủ Nhật' },
  ];

  // Hàm lấy dữ liệu tổng hợp
  const loadFullData = async (userId) => {
    try {
      // 1. Lấy Profile
      const { data: prof, error: profErr } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (profErr) throw profErr;
      if (!prof) {
        console.error("Không tìm thấy Profile");
        setLoading(false);
        return;
      }

      if (prof.is_blocked) {
        toast.error("Tài khoản bị khóa!");
        await supabase.auth.signOut();
        return;
      }

      setProfile(prof);

      // 2. Lấy Lịch học (Lessons)
      let lessonQuery = supabase.from('lessons').select(`
        *, 
        student:profiles!lessons_student_id_fkey(full_name, tuition_rate), 
        teacher:profiles!lessons_teacher_id_fkey(full_name, commission_rate)
      `);
      if (prof.role === 'teacher') lessonQuery = lessonQuery.eq('teacher_id', prof.id);
      if (prof.role === 'student') lessonQuery = lessonQuery.eq('student_id', prof.id);

      const { data: lData } = await lessonQuery;
      setLessons(lData || []);

      // 3. Nếu là Admin, lấy thêm danh sách User
      if (prof.role === 'admin') {
        const { data: uData } = await supabase.from('profiles').select('*').order('role');
        setAllUsers(uData || []);
      }
    } catch (err) {
      console.error("Lỗi tải dữ liệu:", err.message);
    } finally {
      setLoading(false); // Kết thúc loading sau khi xong tất cả
    }
  };

  useEffect(() => {
    // Kiểm tra session khi F5
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setSession(session);
        loadFullData(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Lắng nghe Auth thay đổi
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        setSession(session);
        loadFullData(session.user.id);
      } else if (event === 'SIGNED_OUT') {
        setSession(null);
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Hàm xếp lịch (Admin)
  const handleBatchCreateLesson = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const teacherId = formData.get('teacher');
    const className = formData.get('class_name');
    const startTimeStr = formData.get('start_time_only'); // Ví dụ: "14:30"
    const startDateStr = formData.get('start_date');     // Ví dụ: "2023-10-25"
    const weeksCount = parseInt(formData.get('weeks_count'));

    if (!selectedStudents.length || !selectedDays.length) {
      toast.error("Vui lòng chọn đầy đủ học viên và thứ!");
      return;
    }

    const newLessons = [];
    const [hour, minute] = startTimeStr.split(':');

    for (let i = 0; i < weeksCount; i++) {
      selectedDays.forEach(day => {
        // Tạo đối tượng ngày dựa trên input (năm, tháng-1, ngày)
        const [year, month, d] = startDateStr.split('-').map(Number);
        let baseDate = new Date(year, month - 1, d);

        // Tính toán ngày mục tiêu trong tuần
        let currentWeekDate = addDays(baseDate, i * 7);
        let targetDate = setDay(currentWeekDate, day.value, { weekStartsOn: 1 });

        // Gán giờ và phút theo định dạng 24h
        targetDate.setHours(parseInt(hour), parseInt(minute), 0, 0);

        // Chỉ lấy các buổi từ ngày bắt đầu trở đi
        if (isAfter(targetDate, startOfDay(baseDate)) || format(targetDate, 'yyyy-MM-dd') === startDateStr) {
          selectedStudents.forEach(student => {
            newLessons.push({
              class_name: className,
              teacher_id: teacherId,
              student_id: student.value,
              start_time: targetDate.toISOString(), // Supabase sẽ lưu dưới dạng UTC
              status: 'scheduled',
              price_per_lesson: student.tuition_rate
            });
          });
        }
      });
    }

    // Gửi lên Supabase...
    const { error } = await supabase.from('lessons').insert(newLessons);
    if (error) toast.error(error.message);
    else {
      toast.success(`Đã xếp ${newLessons.length} buổi học.`);
      loadFullData(session.user.id);
    }
  };

  const updateSessionStatus = async (ids, newStatus) => {
    const { error } = await supabase
      .from('lessons')
      .update({ status: newStatus })
      .in('id', ids); // Cập nhật tất cả ID trong mảng

    if (error) {
      toast.error("Lỗi cập nhật: " + error.message);
    } else {
      toast.success("Đã cập nhật trạng thái lớp học");
      loadFullData(session.user.id);
    }
  };

  const getGroupedByClass = () => {
    const groups = lessons.reduce((acc, lesson) => {
      const name = lesson.class_name || "Lớp lẻ";
      if (!acc[name]) {
        acc[name] = {
          class_name: name,
          teacher_name: lesson.teacher?.full_name || "Chưa phân công",
          total_sessions: 0,
          completed_sessions: 0,
          sessions: {} // Dùng object để gom học viên cùng giờ vào 1 buổi
        };
      }

      const timeKey = lesson.start_time;
      if (!acc[name].sessions[timeKey]) {
        acc[name].total_sessions += 1;
        if (lesson.status === 'attended') acc[name].completed_sessions += 1;

        acc[name].sessions[timeKey] = {
          time: timeKey,
          status: lesson.status,
          student_names: [],
          ids: []
        };
      }

      acc[name].sessions[timeKey].student_names.push(lesson.student?.full_name);
      acc[name].sessions[timeKey].ids.push(lesson.id);

      return acc;
    }, {});

    return Object.values(groups);
  };

  const getGroupedByClassFiltered = () => {
    // 1. Lọc ra các buổi học đúng ngày đã chọn
    const filtered = lessons.filter(lesson =>
      format(new Date(lesson.start_time), 'yyyy-MM-dd') === filterDate
    );

    // 2. Gom nhóm những buổi học đã lọc theo tên lớp
    const groups = filtered.reduce((acc, lesson) => {
      const name = lesson.class_name || "Lớp lẻ";
      if (!acc[name]) {
        acc[name] = {
          class_name: name,
          teacher_name: lesson.teacher?.full_name || "Chưa phân công",
          sessions: {}
        };
      }

      const timeKey = lesson.start_time;
      if (!acc[name].sessions[timeKey]) {
        acc[name].sessions[timeKey] = {
          time: timeKey,
          status: lesson.status,
          student_names: [],
          ids: []
        };
      }

      acc[name].sessions[timeKey].student_names.push(lesson.student?.full_name);
      acc[name].sessions[timeKey].ids.push(lesson.id);

      return acc;
    }, {});

    return Object.values(groups);
  };

  // Hàm tiện ích để mở modal xác nhận
  const askConfirm = (title, message, onConfirm, type = 'danger') => {
    setConfirmConfig({
      isOpen: true,
      title,
      message,
      onConfirm: () => {
        onConfirm();
        setConfirmConfig({ isOpen: false });
      },
      onCancel: () => setConfirmConfig({ isOpen: false }),
      type
    });
  };

  // --- RENDERING ---
  if (loading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 mb-4"></div>
        <p className="text-indigo-600 font-bold">Đang tải dữ liệu Piano Center...</p>
      </div>
    );
  }

  if (!session) return <Auth />;

  if (!profile) {
    return (
      <div className="h-screen flex flex-col items-center justify-center p-6 text-center">
        <p className="text-red-500 font-bold mb-4 font-mono uppercase tracking-tighter">Đang tải thông tin...</p>
        <button onClick={() => supabase.auth.signOut()} className="bg-slate-900 text-white px-8 py-2 rounded-xl">Thoát</button>
      </div>
    );
  }

  // 1. Khi Logout
  const handleLogout = () => {
    askConfirm(
      "Đăng xuất?",
      "Bạn có chắc chắn muốn thoát khỏi hệ thống không?",
      () => supabase.auth.signOut(),
      "danger"
    );
  };

  // 2. Khi Admin Khóa/Mở khóa User (Trong AdminUserManagement)
  // Truyền hàm askConfirm xuống Component con hoặc xử lý tại đây
  const toggleBlockUser = (user) => {
    askConfirm(
      user.is_blocked ? "Mở khóa tài khoản?" : "Khóa tài khoản?",
      `Xác nhận thay đổi trạng thái truy cập của ${user.full_name}`,
      async () => {
        await supabase.from('profiles').update({ is_blocked: !user.is_blocked }).eq('id', user.id);
        toast.success("Đã cập nhật trạng thái!");
        loadFullData(session.user.id);
      },
      user.is_blocked ? "info" : "danger"
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <Toaster position="top-right" reverseOrder={false} />
      <ConfirmModal {...confirmConfig} />
      <header className="max-w-6xl mx-auto flex justify-between items-center mb-8 bg-white p-6 rounded-2xl shadow-sm border">
        <h1 className="text-2xl font-black text-indigo-600 flex items-center gap-2"><BookOpen /> PIANO CENTER</h1>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="font-bold">{profile.full_name}</p>
            <p className="text-[10px] font-black text-indigo-400 uppercase">{profile.role}</p>
          </div>
          <button onClick={() => handleLogout()} className="p-2 bg-red-50 text-red-500 rounded-lg transition-all hover:bg-red-500 hover:text-white">
            <LogOut size={18} />
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto space-y-8 pb-20">
        {profile.role === 'admin' && (
          <>
            {/* View Admin: Thống kê (Giữ nguyên logic l.price_per_lesson) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-2xl shadow-sm border-l-4 border-green-500">
                <p className="text-xs font-bold text-gray-400 uppercase">Học phí thu vào (Học viên)</p>
                <p className="text-3xl font-black text-green-600">{lessons.filter(l => l.status === 'attended').reduce((sum, l) => sum + (l.price_per_lesson || 0), 0).toLocaleString()}đ</p>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-sm border-l-4 border-indigo-500">
                <p className="text-xs font-bold text-gray-400 uppercase">Lương chi ra (Giáo viên)</p>
                <p className="text-3xl font-black text-indigo-600">{lessons.filter(l => l.status === 'attended').reduce((sum, l) => sum + (l.price_per_lesson * (l.teacher?.commission_rate || 0.4)), 0).toLocaleString()}đ</p>
              </div>
            </div>
            {/* Form Xếp lịch Nâng cao */}
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-indigo-100">
              <h2 className="text-xl font-black text-indigo-700 mb-6 flex items-center gap-2">
                <Calendar size={24} /> THIẾT LẬP LỚP HỌC & XẾP LỊCH CHUỖI
              </h2>
              <form onSubmit={handleBatchCreateLesson} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="text-xs font-black text-gray-400 uppercase ml-1">Tên lớp học</label>
                    <input name="class_name" placeholder="Ví dụ: Piano Nhóm A1" className="w-full p-3 bg-slate-50 rounded-2xl border-none outline-none focus:ring-2 focus:ring-indigo-500" required />
                  </div>
                  <div>
                    <label className="text-xs font-black text-gray-400 uppercase ml-1">Giáo viên phụ trách</label>
                    <select name="teacher" className="w-full p-3 bg-slate-50 rounded-2xl border-none outline-none" required>
                      <option value="">Chọn GV...</option>
                      {allUsers.filter(u => u.role === 'teacher').map(t => <option key={t.id} value={t.id}>{t.full_name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-black text-gray-400 uppercase ml-1">Thời gian bắt đầu học</label>
                    <input name="start_time_only" type="time" className="w-full p-3 bg-slate-50 rounded-2xl border-none outline-none" required />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-black text-gray-400 uppercase ml-1">Chọn học viên (Nhiều người)</label>
                  <Select
                    isMulti
                    options={allUsers.filter(u => u.role === 'student').map(s => ({ value: s.id, label: s.full_name, tuition_rate: s.tuition_rate }))}
                    className="basic-multi-select"
                    classNamePrefix="select"
                    onChange={setSelectedStudents}
                    placeholder="Tìm và chọn học viên..."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="text-xs font-black text-gray-400 uppercase ml-1">Các ngày trong tuần</label>
                    <Select
                      isMulti
                      options={DAYS_OPTIONS}
                      onChange={setSelectedDays}
                      placeholder="Chọn thứ..."
                    />
                  </div>
                  <div>
                    <label className="text-xs font-black text-gray-400 uppercase ml-1">Ngày bắt đầu khóa</label>
                    <input name="start_date" type="date" className="w-full p-3 bg-slate-50 rounded-2xl border-none outline-none" required />
                  </div>
                  <div>
                    <label className="text-xs font-black text-gray-400 uppercase ml-1">Số tuần áp dụng</label>
                    <input name="weeks_count" type="number" defaultValue="4" min="1" className="w-full p-3 bg-slate-50 rounded-2xl border-none outline-none" required />
                  </div>
                </div>

                <button className="w-full bg-indigo-600 text-white font-black py-4 rounded-2xl hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all">
                  XÁC NHẬN XẾP LỊCH HÀNG LOẠT
                </button>
              </form>
            </div>

            {/* Danh sách buổi học nâng cao */}
            <div className="space-y-6 mt-8">

              {/* THANH BỘ LỌC NGÀY */}
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-black text-slate-800 flex items-center gap-2 uppercase tracking-tight">
                    <Calendar className="text-indigo-600" /> Lịch dạy theo ngày
                  </h2>
                  <p className="text-xs text-slate-400 font-bold uppercase mt-1">
                    {format(new Date(filterDate), 'EEEE, dd MMMM yyyy', { locale: vi })}
                  </p>
                </div>

                <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-2xl border border-slate-100">
                  <button
                    onClick={() => setFilterDate(format(new Date(), 'yyyy-MM-dd'))}
                    className="px-4 py-2 text-[10px] font-black uppercase bg-white shadow-sm rounded-xl hover:bg-indigo-50 transition-colors"
                  >
                    Hôm nay
                  </button>
                  <input
                    type="date"
                    value={filterDate}
                    onChange={(e) => setFilterDate(e.target.value)}
                    className="bg-transparent border-none outline-none text-sm font-bold text-indigo-600 cursor-pointer p-1"
                  />
                </div>
              </div>

              {/* DANH SÁCH LỚP TRONG NGÀY ĐÃ CHỌN */}
              <div className="space-y-4">
                {getGroupedByClassFiltered().length > 0 ? (
                  getGroupedByClassFiltered().map((group) => (
                    <div key={group.class_name} className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden animate-in fade-in slide-in-from-bottom-2">
                      {/* TIÊU ĐỀ LỚP */}
                      <div
                        onClick={() => setExpandedClass(expandedClass === group.class_name ? null : group.class_name)}
                        className="p-5 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-all"
                      >
                        <div className="flex items-center gap-4">
                          <div className="bg-slate-800 p-3 rounded-2xl text-white">
                            <Users size={20} />
                          </div>
                          <div>
                            <h3 className="font-black text-slate-800 uppercase tracking-tighter">{group.class_name}</h3>
                            <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">GV: {group.teacher_name}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          <span className="bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full text-[10px] font-black uppercase">
                            {Object.keys(group.sessions).length} Buổi dạy
                          </span>
                          <Plus size={20} className={`text-slate-300 transition-transform ${expandedClass === group.class_name ? 'rotate-45' : ''}`} />
                        </div>
                      </div>

                      {/* CHI TIẾT CÁC BUỔI TRONG NGÀY */}
                      {expandedClass === group.class_name && (
                        <div className="bg-slate-50/50 border-t border-slate-50 p-4 space-y-3">
                          {Object.values(group.sessions).sort((a, b) => new Date(a.time) - new Date(b.time)).map((session) => (
                            <div key={session.time} className="bg-white p-4 rounded-2xl border border-white flex flex-col md:flex-row md:items-center justify-between gap-4">
                              <div className="flex items-center gap-6">
                                <div className="flex flex-col border-r pr-6 border-slate-100">
                                  <span className="font-black text-xl text-slate-700">{format(new Date(session.time), 'HH:mm')}</span>
                                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">GMT+7</span>
                                </div>
                                <div className="flex flex-wrap gap-1">
                                  {session.student_names.map((name, i) => (
                                    <span key={i} className="bg-indigo-50 text-indigo-600 px-3 py-1 rounded-lg text-[10px] font-black border border-indigo-100">
                                      {name}
                                    </span>
                                  ))}
                                </div>
                              </div>

                              <select
                                value={session.status}
                                onChange={(e) => updateSessionStatus(session.ids, e.target.value)}
                                className={`text-[10px] font-black p-2 px-4 rounded-xl border-none outline-none shadow-sm cursor-pointer ${session.status === 'attended' ? 'bg-green-500 text-white' :
                                    session.status === 'teacher_off' ? 'bg-red-500 text-white' : 'bg-orange-400 text-white'
                                  }`}
                              >
                                <option value="scheduled">CHỜ DẠY</option>
                                <option value="attended">ĐÃ DẠY XONG</option>
                                <option value="teacher_off">GIÁO VIÊN NGHỈ</option>
                              </select>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="bg-white p-20 rounded-3xl border border-dashed border-slate-200 text-center">
                    <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Calendar size={32} className="text-slate-200" />
                    </div>
                    <p className="text-slate-400 font-bold uppercase text-xs tracking-widest">Không có lớp học nào trong ngày này</p>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4 mt-8">
              <h2 className="text-xl font-black text-slate-800 flex items-center gap-2 uppercase tracking-tight">
                <BookOpen className="text-indigo-600" /> Quản lý theo lớp học
              </h2>

              {getGroupedByClass().map((group) => (
                <div key={group.class_name} className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                  {/* HÀNG TỔNG QUÁT LỚP (Bấm để mở) */}
                  <div
                    onClick={() => setExpandedClass(expandedClass === group.class_name ? null : group.class_name)}
                    className="p-5 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-all"
                  >
                    <div className="flex items-center gap-4">
                      <div className="bg-indigo-600 p-3 rounded-2xl text-white shadow-lg shadow-indigo-100">
                        <Users size={20} />
                      </div>
                      <div>
                        <h3 className="font-black text-slate-800 uppercase tracking-tighter">{group.class_name}</h3>
                        <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">Giáo viên: {group.teacher_name}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Tiến độ</p>
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-black text-slate-700">{group.completed_sessions}/{group.total_sessions}</span>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Buổi</span>
                        </div>
                      </div>
                      <div className={`transition-transform duration-300 ${expandedClass === group.class_name ? 'rotate-180' : ''}`}>
                        <Plus size={20} className="text-slate-300" />
                      </div>
                    </div>
                  </div>

                  {/* CHI TIẾT CÁC BUỔI HỌC (Hiển thị khi mở) */}
                  {expandedClass === group.class_name && (
                    <div className="bg-slate-50/50 border-t border-slate-50 animate-in slide-in-from-top-2 duration-300">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left">
                          <thead>
                            <tr className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                              <th className="p-4 pl-20">Thời gian (24h)</th>
                              <th className="p-4">Danh sách học viên</th>
                              <th className="p-4 text-right">Trạng thái buổi</th>
                            </tr>
                          </thead>
                          <tbody>
                            {Object.values(group.sessions).sort((a, b) => new Date(a.time) - new Date(b.time)).map((session) => (
                              <tr key={session.time} className="border-t border-white hover:bg-white transition-colors">
                                <td className="p-4 pl-20">
                                  <div className="flex flex-col">
                                    <span className="font-black text-slate-700 text-sm">
                                      {format(new Date(session.time), 'HH:mm', { locale: vi })}
                                    </span>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase">
                                      {format(new Date(session.time), 'EEEE, dd/MM/yyyy', { locale: vi })}
                                    </span>
                                  </div>
                                </td>
                                <td className="p-4">
                                  <div className="flex flex-wrap gap-1">
                                    {session.student_names.map((name, i) => (
                                      <span key={i} className="bg-white border border-slate-200 text-slate-600 px-2 py-1 rounded-lg text-[10px] font-bold">
                                        {name}
                                      </span>
                                    ))}
                                  </div>
                                </td>
                                <td className="p-4 text-right">
                                  <select
                                    value={session.status}
                                    onChange={(e) => updateSessionStatus(session.ids, e.target.value)}
                                    className={`text-[10px] font-black p-2 rounded-xl border-none outline-none shadow-sm cursor-pointer ${session.status === 'attended' ? 'bg-green-500 text-white' :
                                      session.status === 'teacher_off' ? 'bg-red-500 text-white' : 'bg-orange-400 text-white'
                                      }`}
                                  >
                                    <option value="scheduled">CHỜ DẠY</option>
                                    <option value="attended">ĐÃ DẠY</option>
                                    <option value="teacher_off">GV NGHỈ</option>
                                  </select>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* QUẢN LÝ TÀI KHOẢN */}
            <AdminUserManagement users={allUsers} onUpdate={() => loadFullData(session.user.id)} onBlockUser={toggleBlockUser} />
          </>
        )}

        {/* --- TEACHER VIEW (Giữ nguyên logic updateStatus) --- */}
        {profile?.role === 'teacher' && (
          <div className="space-y-6">
            <div className="bg-indigo-600 text-white p-8 rounded-3xl flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-black mb-1">LỊCH DẠY</h2>
                <p className="opacity-80">Tổng thu nhập dự kiến: {lessons.filter(l => l.status === 'attended').reduce((sum, l) => sum + (l.price_per_lesson * (profile.commission_rate || 0.4)), 0).toLocaleString()}đ</p>
              </div>
              <DollarSign size={40} className="opacity-20" />
            </div>
            <div className="grid gap-4">
              {lessons.map(l => (
                <div key={l.id} className="bg-white p-6 rounded-2xl border flex justify-between items-center shadow-sm">
                  <div>
                    <p className="text-xs text-indigo-500 font-bold uppercase">{format(new Date(l.start_time), 'HH:mm - EEEE, dd/MM', { locale: vi })}</p>
                    <p className="font-black text-xl text-slate-800">{l.student?.full_name}</p>
                  </div>
                  <button
                    onClick={() => { supabase.from('lessons').update({ status: 'attended' }).eq('id', l.id).then(() => fetchLessons(profile)) }}
                    className={`px-6 py-2 rounded-xl font-bold transition-all ${l.status === 'attended' ? 'bg-green-100 text-green-600' : 'bg-indigo-600 text-white shadow-lg shadow-indigo-100'}`}
                  >
                    {l.status === 'attended' ? 'ĐÃ HOÀN THÀNH' : 'ĐIỂM DANH'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* --- STUDENT VIEW --- */}
        {profile?.role === 'student' && (
          <div className="max-w-2xl mx-auto space-y-6 text-center">
            <div className="bg-white p-10 rounded-3xl shadow-xl border-t-8 border-green-500">
              <h2 className="text-3xl font-black text-slate-800 mb-2 italic">Chào {profile.full_name}!</h2>
              <p className="text-gray-400 mb-10 uppercase text-[10px] font-black tracking-widest">Lịch sử học phí của bạn</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 text-left">
                <div className="bg-slate-50 p-6 rounded-2xl border">
                  <p className="text-xs font-bold text-gray-400 uppercase mb-1">Tổng số buổi đã học</p>
                  <p className="text-4xl font-black text-indigo-600">{lessons.filter(l => l.status === 'attended').length}</p>
                </div>
                <div className="bg-slate-50 p-6 rounded-2xl border">
                  <p className="text-xs font-bold text-gray-400 uppercase mb-1">Tổng học phí đã dùng</p>
                  <p className="text-3xl font-black text-green-600">
                    {lessons.filter(l => l.status === 'attended').reduce((sum, l) => sum + (l.price_per_lesson || 0), 0).toLocaleString()}đ
                  </p>
                </div>
              </div>

              <div className="space-y-3 text-left">
                <h3 className="font-bold text-sm text-gray-500 uppercase tracking-tighter">Chi tiết các buổi gần nhất</h3>
                {lessons.map(l => (
                  <div key={l.id} className="flex justify-between items-center bg-gray-50 p-3 rounded-xl border border-dashed border-gray-200">
                    <span className="text-xs font-medium text-gray-600">{format(new Date(l.start_time), 'dd/MM/yyyy (HH:mm)', { locale: vi })}</span>
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${l.status === 'attended' ? 'bg-green-100 text-green-600' : 'bg-gray-200 text-gray-500'}`}>
                      {l.status === 'attended' ? `-${l.price_per_lesson.toLocaleString()}đ` : 'CHƯA DẠY'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}