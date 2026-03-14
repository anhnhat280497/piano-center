import React, { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';
import Auth from './Auth';
import ConfirmModal from './ConfirmModal';
import toast, { Toaster } from 'react-hot-toast';
import Select from 'react-select';
import { format, addDays, setDay, isAfter, startOfDay } from 'date-fns';
import { vi } from 'date-fns/locale';
import { 
  LayoutDashboard, CalendarRange, Library, Users, LogOut, 
  Plus, BookOpen, Wallet, DollarSign, ShieldAlert, ChevronRight, Search
} from 'lucide-react';

export default function App() {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [currentView, setCurrentView] = useState('dashboard'); // dashboard, schedule, classes, accounts
  const [loading, setLoading] = useState(true);
  
  // Dữ liệu
  const [lessons, setLessons] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [filterDate, setFilterDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [confirmConfig, setConfirmConfig] = useState({ isOpen: false });

  // 1. Khởi tạo & Auth
  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      if (session) await loadData(session.user.id);
      setLoading(false);
    };
    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      if (session) loadData(session.user.id);
      else { setProfile(null); setLoading(false); }
    });
    return () => subscription.unsubscribe();
  }, []);

  const loadData = async (uid) => {
    try {
      const { data: prof } = await supabase.from('profiles').select('*').eq('id', uid).maybeSingle();
      if (!prof) return;
      if (prof.is_blocked) { toast.error("Tài khoản bị khóa!"); supabase.auth.signOut(); return; }
      setProfile(prof);

      // Load Lessons
      const { data: lData } = await supabase.from('lessons').select(`
        *, student:profiles!lessons_student_id_fkey(*), teacher:profiles!lessons_teacher_id_fkey(*)
      `).order('start_time', { ascending: false });
      setLessons(lData || []);

      if (prof.role === 'admin') {
        const { data: uData } = await supabase.from('profiles').select('*').order('role');
        setAllUsers(uData || []);
      }
    } catch (e) { console.error(e); }
  };

  // 2. Logic hỗ trợ
  const askConfirm = (title, message, onConfirm, type = 'danger') => {
    setConfirmConfig({ isOpen: true, title, message, onConfirm: () => { onConfirm(); setConfirmConfig({ isOpen: false }); }, onCancel: () => setConfirmConfig({ isOpen: false }), type });
  };

  const updateStatus = async (ids, status) => {
    await supabase.from('lessons').update({ status }).in('id', ids);
    toast.success("Đã cập nhật!");
    loadData(session.user.id);
  };

  // --- COMPONENT TRANG RIÊNG BIỆT ---

  // A. DASHBOARD (Thống kê tài chính & Trạng thái)
  const DashboardView = () => (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-8 rounded-3xl shadow-sm border-l-8 border-green-500">
          <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Doanh thu Học phí</p>
          <p className="text-3xl font-black text-slate-800 mt-2">
            {lessons.filter(l => l.status === 'attended').reduce((s, l) => s + (l.price_per_lesson || 0), 0).toLocaleString()}đ
          </p>
        </div>
        <div className="bg-white p-8 rounded-3xl shadow-sm border-l-8 border-indigo-500">
          <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Chi trả Lương GV</p>
          <p className="text-3xl font-black text-slate-800 mt-2">
            {lessons.filter(l => l.status === 'attended').reduce((s, l) => s + (l.price_per_lesson * (l.teacher?.commission_rate || 0.4)), 0).toLocaleString()}đ
          </p>
        </div>
        <div className="bg-slate-900 p-8 rounded-3xl shadow-lg text-white">
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest text-indigo-300">Lợi nhuận ròng</p>
          <p className="text-3xl font-black mt-2">
            {(lessons.filter(l => l.status === 'attended').reduce((s, l) => s + (l.price_per_lesson * (1 - (l.teacher?.commission_rate || 0.4))), 0)).toLocaleString()}đ
          </p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
        <h3 className="font-black text-slate-800 uppercase text-sm mb-4">Trạng thái dạy hôm nay</h3>
        <div className="flex gap-4">
           <div className="bg-orange-50 text-orange-600 p-4 rounded-2xl flex-1 text-center font-bold">
              Chờ dạy: {lessons.filter(l => l.status === 'scheduled' && format(new Date(l.start_time), 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')).length}
           </div>
           <div className="bg-red-50 text-red-600 p-4 rounded-2xl flex-1 text-center font-bold">
              GV Nghỉ: {lessons.filter(l => l.status === 'teacher_off' && format(new Date(l.start_time), 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')).length}
           </div>
        </div>
      </div>
    </div>
  );

  // B. XẾP LỊCH (Batch Scheduling)
  const ScheduleView = () => {
    const [selSt, setSelSt] = useState([]);
    const [selDays, setSelDays] = useState([]);
    const handleBatch = async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const [y, m, d] = fd.get('start_date').split('-').map(Number);
      const [h, min] = fd.get('time').split(':');
      const newList = [];
      for (let i = 0; i < parseInt(fd.get('weeks')); i++) {
        selDays.forEach(day => {
          let target = setDay(addDays(new Date(y, m-1, d), i*7), day.value, {weekStartsOn:1});
          target.setHours(h, min, 0, 0);
          if (isAfter(target, startOfDay(new Date(y, m-1, d-1)))) {
            selSt.forEach(s => newList.push({
              class_name: fd.get('name'), teacher_id: fd.get('teacher'), 
              student_id: s.value, start_time: target.toISOString(), 
              price_per_lesson: s.tuition_rate, status: 'scheduled'
            }));
          }
        });
      }
      const { error } = await supabase.from('lessons').insert(newList);
      if (!error) { toast.success("Đã xếp lịch!"); loadData(session.user.id); setCurrentView('classes'); }
    };

    return (
      <div className="max-w-4xl bg-white p-8 rounded-3xl shadow-sm border border-indigo-50 animate-in slide-in-from-right-4 duration-500">
        <h2 className="text-2xl font-black text-slate-800 mb-6 uppercase tracking-tighter">Thiết lập chuỗi lịch học</h2>
        <form onSubmit={handleBatch} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <input name="name" placeholder="Tên lớp (VD: Piano Thứ 2-4)" className="p-4 bg-slate-50 rounded-2xl outline-none font-bold" required />
            <select name="teacher" className="p-4 bg-slate-50 rounded-2xl outline-none font-bold" required>
               <option value="">Chọn Giáo viên</option>
               {allUsers.filter(u => u.role === 'teacher').map(t => <option key={t.id} value={t.id}>{t.full_name}</option>)}
            </select>
          </div>
          <Select isMulti placeholder="Chọn các học viên..." options={allUsers.filter(u=>u.role==='student').map(s=>({value:s.id, label:s.full_name, tuition_rate:s.tuition_rate}))} onChange={setSelSt} />
          <div className="grid grid-cols-3 gap-4">
            <Select isMulti placeholder="Thứ trong tuần" options={[{value:1, label:'Thứ 2'},{value:2, label:'Thứ 3'},{value:3, label:'Thứ 4'},{value:4, label:'Thứ 5'},{value:5, label:'Thứ 6'},{value:6, label:'Thứ 7'},{value:0, label:'CN'}]} onChange={setSelDays} />
            <input name="time" type="time" className="p-4 bg-slate-50 rounded-2xl outline-none" required />
            <input name="weeks" type="number" placeholder="Số tuần" defaultValue="4" className="p-4 bg-slate-50 rounded-2xl outline-none" required />
          </div>
          <input name="start_date" type="date" defaultValue={format(new Date(), 'yyyy-MM-dd')} className="w-full p-4 bg-slate-50 rounded-2xl outline-none" required />
          <button className="w-full bg-indigo-600 text-white font-black py-4 rounded-2xl shadow-xl shadow-indigo-100 uppercase">Xác nhận xếp lịch</button>
        </form>
      </div>
    );
  };

  // C. QUẢN LÝ LỚP HỌC (Grouped by Class & Date Filter)
  const ClassManagementView = () => {
    const [exp, setExp] = useState(null);
    const filtered = lessons.filter(l => format(new Date(l.start_time), 'yyyy-MM-dd') === filterDate);
    const groups = filtered.reduce((acc, l) => {
      const name = l.class_name || "Lớp lẻ";
      if (!acc[name]) acc[name] = { name, teacher: l.teacher?.full_name, sessions: {} };
      const tk = l.start_time;
      if (!acc[name].sessions[tk]) acc[name].sessions[tk] = { time: tk, status: l.status, sts: [], ids: [] };
      acc[name].sessions[tk].sts.push(l.student?.full_name);
      acc[name].sessions[tk].ids.push(l.id);
      return acc;
    }, {});

    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        <div className="flex justify-between items-center bg-white p-4 rounded-2xl border">
           <p className="font-black text-slate-800 uppercase ml-2 tracking-tighter">Lọc ngày: {format(new Date(filterDate), 'EEEE, dd/MM', {locale:vi})}</p>
           <input type="date" value={filterDate} onChange={e=>setFilterDate(e.target.value)} className="p-2 bg-slate-50 rounded-xl font-bold text-indigo-600 outline-none" />
        </div>

        {Object.values(groups).length > 0 ? Object.values(groups).map(g => (
          <div key={g.name} className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
            <div onClick={()=>setExp(exp===g.name?null:g.name)} className="p-5 flex justify-between items-center cursor-pointer hover:bg-slate-50">
               <div><h3 className="font-black text-slate-800">{g.name}</h3><p className="text-[10px] font-bold text-indigo-500 uppercase">GV: {g.teacher}</p></div>
               <ChevronRight className={`transition-transform ${exp===g.name?'rotate-90':''}`} />
            </div>
            {exp === g.name && (
              <div className="bg-slate-50 p-4 space-y-3 border-t">
                 {Object.values(g.sessions).map(s => (
                   <div key={s.time} className="bg-white p-4 rounded-2xl flex justify-between items-center shadow-sm">
                      <div>
                        <p className="font-black text-indigo-600">{format(new Date(s.time), 'HH:mm')}</p>
                        <p className="text-[10px] font-bold text-slate-400">{s.sts.join(', ')}</p>
                      </div>
                      <select value={s.status} onChange={e=>updateStatus(s.ids, e.target.value)} className={`text-[10px] font-black p-2 rounded-xl border-none outline-none text-white ${s.status==='attended'?'bg-green-500':'bg-orange-400'}`}>
                         <option value="scheduled">CHỜ DẠY</option><option value="attended">ĐÃ DẠY</option><option value="teacher_off">GV NGHỈ</option>
                      </select>
                   </div>
                 ))}
              </div>
            )}
          </div>
        )) : <div className="p-20 text-center text-slate-300 font-bold uppercase tracking-widest bg-white rounded-3xl border-2 border-dashed">Hôm nay không có lớp nào</div>}
      </div>
    );
  };

  // D. QUẢN LÝ TÀI KHOẢN (Profiles)
  const AccountsView = () => {
    const [edId, setEdId] = useState(null);
    const [form, setForm] = useState({});
    return (
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden animate-in fade-in duration-500">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
            <tr><th className="p-4">Họ Tên / Vai Trò</th><th className="p-4 text-center">Đơn giá / %</th><th className="p-4 text-center">Khóa</th><th className="p-4 text-right">Sửa</th></tr>
          </thead>
          <tbody className="divide-y">
            {allUsers.map(u => (
              <tr key={u.id} className={u.is_blocked ? "bg-red-50" : ""}>
                <td className="p-4">
                  {edId === u.id ? <input className="border p-1 rounded" value={form.full_name} onChange={e=>setForm({...form, full_name:e.target.value})}/> : <div><p className="font-bold">{u.full_name}</p><p className="text-[9px] uppercase text-gray-400 font-black">{u.role}</p></div>}
                </td>
                <td className="p-4 text-center font-bold">
                  {u.role === 'teacher' ? (u.commission_rate * 100 + '%') : (u.tuition_rate?.toLocaleString() + 'đ')}
                </td>
                <td className="p-4 text-center">
                   <button onClick={()=>askConfirm("Thay đổi trạng thái?", "Xác nhận khóa/mở tài khoản này?", async ()=>{ await supabase.from('profiles').update({is_blocked: !u.is_blocked}).eq('id', u.id); loadData(session.user.id); })}>
                      {u.is_blocked ? <ShieldAlert className="text-red-500"/> : <Users className="text-green-500"/>}
                   </button>
                </td>
                <td className="p-4 text-right">
                  <button onClick={()=>{setEdId(u.id); setForm(u)}} className="text-indigo-600"><Edit size={16}/></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  // --- RENDERING CHÍNH ---
  if (loading) return <div className="h-screen flex items-center justify-center font-black text-indigo-600 animate-pulse">PIANO CENTER...</div>;
  if (!session) return <Auth />;

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Toaster position="top-right" />
      <ConfirmModal {...confirmConfig} />

      {/* SIDEBAR NAVIGATION */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col p-6 fixed h-full z-10">
        <div className="flex items-center gap-3 mb-10">
          <div className="bg-indigo-600 p-2 rounded-xl text-white"><BookOpen size={24}/></div>
          <h1 className="text-lg font-black tracking-tighter">PIANO CENTER</h1>
        </div>

        <nav className="space-y-2 flex-1 font-bold text-sm">
          {[
            { id: 'dashboard', label: 'DASHBOARD', icon: LayoutDashboard },
            { id: 'schedule', label: 'XẾP LỊCH', icon: CalendarRange },
            { id: 'classes', label: 'QUẢN LÝ LỚP', icon: Library },
            { id: 'accounts', label: 'TÀI KHOẢN', icon: Users },
          ].map(item => (
            <button
              key={item.id}
              onClick={() => setCurrentView(item.id)}
              className={`w-full flex items-center gap-3 p-4 rounded-2xl transition-all ${currentView === item.id ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50' : 'text-slate-400 hover:bg-slate-800'}`}
            >
              <item.icon size={20} />
              {item.label}
            </button>
          ))}
        </nav>

        <button onClick={()=>supabase.auth.signOut()} className="flex items-center gap-3 p-4 text-red-400 font-bold hover:bg-red-500/10 rounded-2xl transition-all mt-auto">
          <LogOut size={20} /> THOÁT
        </button>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 ml-64 p-10">
        <header className="flex justify-between items-center mb-10">
           <h2 className="text-3xl font-black text-slate-800 uppercase tracking-tighter">
             {currentView === 'dashboard' && 'Tổng quan hệ thống'}
             {currentView === 'schedule' && 'Thiết lập giảng dạy'}
             {currentView === 'classes' && 'Lịch dạy chi tiết'}
             {currentView === 'accounts' && 'Quản trị nhân sự'}
           </h2>
           <div className="bg-white p-3 px-5 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
              <div className="text-right">
                 <p className="text-sm font-black text-slate-700">{profile?.full_name}</p>
                 <p className="text-[10px] font-black text-indigo-500 uppercase">{profile?.role}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black">
                 {profile?.full_name?.charAt(0)}
              </div>
           </div>
        </header>

        {currentView === 'dashboard' && <DashboardView />}
        {currentView === 'schedule' && <ScheduleView />}
        {currentView === 'classes' && <ClassManagementView />}
        {currentView === 'accounts' && <AccountsView />}
      </main>
    </div>
  );
}

// Giả lập Component Edit cho nhanh
const Edit = ({size}) => <Plus size={size} className="rotate-45" />;