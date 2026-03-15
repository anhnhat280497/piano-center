import React from 'react';
import { format } from 'date-fns';
import { BookOpen, CheckCircle, CreditCard } from 'lucide-react';

export default function StudentView({ profile, lessons }) {
  const completed = lessons.filter(l => l.status === 'attended');
  const totalTuition = completed.reduce((sum, l) => sum + (l.price_per_lesson || 0), 0);

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-in slide-in-from-bottom-8 duration-700">
      <div className="bg-white p-10 rounded-[50px] shadow-sm border border-slate-100 text-center relative overflow-hidden">
        <h2 className="text-4xl font-black text-slate-800 mb-2 italic tracking-tighter">Xin chào, {profile.full_name}!</h2>
        <p className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.2em] mb-10">Tiến trình học Piano của bạn</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 text-left">
          <div className="bg-indigo-50 p-6 rounded-3xl border border-indigo-100">
            <div className="flex justify-between items-start mb-4">
              <p className="text-[10px] font-black text-indigo-400 uppercase">Buổi đã học</p>
              <CheckCircle size={20} className="text-indigo-400" />
            </div>
            <p className="text-5xl font-black text-indigo-700">{completed.length}</p>
          </div>
          <div className="bg-green-50 p-6 rounded-3xl border border-green-100">
            <div className="flex justify-between items-start mb-4">
              <p className="text-[10px] font-black text-green-400 uppercase">Học phí đã dùng</p>
              <CreditCard size={20} className="text-green-400" />
            </div>
            <p className="text-3xl font-black text-green-700">{totalTuition.toLocaleString()}đ</p>
          </div>
        </div>

        <div className="space-y-3 text-left">
          <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest ml-2">Lịch sử buổi học gần nhất</p>
          {lessons.slice(0, 10).map(l => (
            <div key={l.id} className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl border border-dashed border-slate-200">
              <div>
                <p className="text-xs font-black text-slate-700">{format(new Date(l.start_time), 'dd/MM/yyyy')}</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Giảng viên: {l.teacher?.full_name}</p>
              </div>
              <span className={`text-[10px] font-black px-3 py-1 rounded-full ${l.status === 'attended' ? 'bg-green-100 text-green-600' : 'bg-slate-200 text-slate-500'}`}>
                {l.status === 'attended' ? `-${l.price_per_lesson?.toLocaleString()}đ` : 'CHƯA HỌC'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}