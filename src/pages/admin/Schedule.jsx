import React, { useState } from 'react';
import Select from 'react-select';
import { supabase } from '../../lib/supabase';
import { format, addDays, setDay, isAfter, startOfDay } from 'date-fns';
import toast from 'react-hot-toast';
import { CalendarRange, Info, User, Users, Clock, Calendar as CalendarIcon, Hash } from 'lucide-react';

export default function Schedule({ allUsers, onRefresh }) {
  const [selSt, setSelSt] = useState([]);
  const [selDays, setSelDays] = useState([]);

  const DAYS = [
    { value: 1, label: 'Thứ 2' }, { value: 2, label: 'Thứ 3' }, { value: 3, label: 'Thứ 4' },
    { value: 4, label: 'Thứ 5' }, { value: 5, label: 'Thứ 6' }, { value: 6, label: 'Thứ 7' }, { value: 0, label: 'Chủ Nhật' }
  ];

  const handleBatchSubmit = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const startDateStr = fd.get('start_date');
    const [h, m] = fd.get('time').split(':');
    
    const newList = [];
    const weeks = parseInt(fd.get('weeks'));

    for (let i = 0; i < weeks; i++) {
      selDays.forEach(day => {
        const [yy, mm, dd] = startDateStr.split('-').map(Number);
        let target = setDay(addDays(new Date(yy, mm - 1, dd), i * 7), day.value, { weekStartsOn: 1 });
        target.setHours(parseInt(h), parseInt(m), 0, 0);

        if (isAfter(target, startOfDay(new Date(yy, mm - 1, dd - 1)))) {
          selSt.forEach(s => newList.push({
            class_name: fd.get('name'),
            teacher_id: fd.get('teacher'),
            student_id: s.value,
            start_time: target.toISOString(),
            price_per_lesson: s.tuition_rate,
            status: 'scheduled'
          }));
        }
      });
    }

    const { error } = await supabase.from('lessons').insert(newList);
    if (error) toast.error(error.message);
    else {
      toast.success(`Đã xếp ${newList.length} buổi học thành công!`);
      onRefresh();
      e.target.reset();
      setSelSt([]); setSelDays([]);
    }
  };

  return (
    <div className="max-w-4xl bg-white p-8 rounded-[40px] shadow-sm border border-indigo-50 animate-in slide-in-from-right-4 duration-500">
      <div className="mb-8">
        <h2 className="text-3xl font-black text-slate-800 uppercase flex items-center gap-3 tracking-tighter">
          <CalendarRange size={32} className="text-indigo-600"/> Thiết lập chuỗi lịch học
        </h2>
        <p className="text-slate-400 text-sm mt-2 font-medium">Hệ thống sẽ tự động nhân bản lịch học theo số tuần bạn chọn.</p>
      </div>

      <form onSubmit={handleBatchSubmit} className="space-y-8">
        
        {/* SECTION 1: THÔNG TIN CƠ BẢN */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2 ml-1">
              <Info size={14} className="text-indigo-400"/> Tên lớp học / Khóa học
            </label>
            <input 
              name="name" 
              placeholder="Ví dụ: Piano Nhóm A1 - Tháng 3" 
              className="w-full p-4 bg-slate-50 rounded-2xl outline-none font-bold border-2 border-transparent focus:border-indigo-100 transition-all" 
              required 
            />
            <p className="text-[10px] text-slate-400 ml-1 italic">* Tên này sẽ dùng để gom nhóm các buổi học.</p>
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2 ml-1">
              <User size={14} className="text-indigo-400"/> Giáo viên phụ trách
            </label>
            <select name="teacher" className="w-full p-4 bg-slate-50 rounded-2xl outline-none font-bold border-2 border-transparent focus:border-indigo-100 appearance-none cursor-pointer" required>
              <option value="">-- Chọn giáo viên --</option>
              {allUsers.filter(u => u.role === 'teacher').map(t => <option key={t.id} value={t.id}>{t.full_name}</option>)}
            </select>
          </div>
        </div>

        {/* SECTION 2: CHỌN HỌC VIÊN */}
        <div className="space-y-2">
          <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2 ml-1">
            <Users size={14} className="text-indigo-400"/> Danh sách học viên trong lớp
          </label>
          <Select 
            isMulti 
            placeholder="Tìm và chọn một hoặc nhiều học viên..." 
            options={allUsers.filter(u=>u.role==='student').map(s=>({value:s.id, label:s.full_name, tuition_rate:s.tuition_rate}))} 
            onChange={setSelSt} 
            value={selSt} 
            styles={{
              control: (base) => ({ ...base, borderRadius: '1rem', padding: '0.5rem', backgroundColor: '#f8fafc', border: 'none' }),
            }}
          />
        </div>

        {/* SECTION 3: THỜI GIAN & CHU KỲ */}
        <div className="bg-indigo-50/50 p-6 rounded-[32px] space-y-6 border border-indigo-100/50">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[11px] font-black text-indigo-600 uppercase tracking-widest flex items-center gap-2 ml-1">
                <CalendarIcon size={14}/> Các thứ trong tuần
              </label>
              <Select 
                isMulti 
                placeholder="Chọn Thứ (VD: 2, 4, 6)" 
                options={DAYS} 
                onChange={setSelDays} 
                value={selDays} 
                styles={{
                  control: (base) => ({ ...base, borderRadius: '1rem', padding: '0.2rem', border: 'none' }),
                }}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[11px] font-black text-indigo-600 uppercase tracking-widest flex items-center gap-2 ml-1">
                <Clock size={14}/> Giờ bắt đầu (24h)
              </label>
              <input name="time" type="time" className="w-full p-4 bg-white rounded-2xl outline-none border-none font-bold text-indigo-600 shadow-sm" required />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[11px] font-black text-indigo-600 uppercase tracking-widest flex items-center gap-2 ml-1">
                <CalendarIcon size={14}/> Ngày bắt đầu (Khai giảng)
              </label>
              <input name="start_date" type="date" defaultValue={format(new Date(), 'yyyy-MM-dd')} className="w-full p-4 bg-white rounded-2xl outline-none border-none font-bold shadow-sm" required />
            </div>
            <div className="space-y-2">
              <label className="text-[11px] font-black text-indigo-600 uppercase tracking-widest flex items-center gap-2 ml-1">
                <Hash size={14}/> Số tuần kéo dài
              </label>
              <input name="weeks" type="number" placeholder="Ví dụ: 4 tuần" defaultValue="4" min="1" className="w-full p-4 bg-white rounded-2xl outline-none border-none font-bold shadow-sm" required />
            </div>
          </div>
        </div>

        {/* SUBMIT BUTTON */}
        <div className="pt-4">
          <button className="w-full bg-indigo-600 text-white font-black py-5 rounded-[24px] shadow-xl shadow-indigo-200 uppercase tracking-[0.2em] hover:bg-indigo-700 hover:-translate-y-1 transition-all duration-300">
            Xác nhận tạo lịch hàng loạt
          </button>
          <p className="text-center text-[10px] text-slate-400 font-bold mt-4 uppercase tracking-widest">
            Thời gian được tính theo múi giờ Việt Nam (GMT+7)
          </p>
        </div>
      </form>
    </div>
  );
}