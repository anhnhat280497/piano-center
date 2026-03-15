import React from 'react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Users, CheckCircle, Clock } from 'lucide-react';

export default function TeacherView({ profile, lessons, onUpdateStatus }) {
  const today = format(new Date(), 'yyyy-MM-dd');
  const todayLessons = lessons.filter(l => format(new Date(l.start_time), 'yyyy-MM-dd') === today);

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      <div className="bg-indigo-600 text-white p-8 rounded-[40px] shadow-xl shadow-indigo-100 flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-black mb-2 uppercase tracking-tighter">Lịch dạy hôm nay</h2>
          <p className="opacity-80 font-medium italic">Chào {profile.full_name}, bạn có {todayLessons.length} buổi dạy trong ngày.</p>
        </div>
        <div className="bg-white/10 p-4 rounded-3xl"><Users size={40} /></div>
      </div>

      <div className="grid gap-4">
        {todayLessons.length > 0 ? todayLessons.map(l => (
          <div key={l.id} className="bg-white p-6 rounded-3xl border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-indigo-200 transition-all">
            <div className="flex items-center gap-4">
              <div className="bg-slate-50 p-4 rounded-2xl text-center min-w-[80px]">
                <p className="text-xl font-black text-indigo-600">{format(new Date(l.start_time), 'HH:mm')}</p>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">GMT+7</p>
              </div>
              <div>
                <p className="font-black text-slate-800 text-lg uppercase tracking-tight">{l.student?.full_name}</p>
                <p className="text-xs font-bold text-slate-400 uppercase">{l.class_name || "Lớp kèm riêng"}</p>
              </div>
            </div>
            <button 
              onClick={() => onUpdateStatus([l.id], 'attended')}
              disabled={l.status === 'attended'}
              className={`px-8 py-3 rounded-2xl font-black text-xs transition-all ${l.status === 'attended' ? 'bg-green-100 text-green-600' : 'bg-slate-900 text-white shadow-lg shadow-slate-200 hover:bg-indigo-600'}`}
            >
              {l.status === 'attended' ? 'ĐÃ DẠY XONG' : 'ĐIỂM DANH DẠY'}
            </button>
          </div>
        )) : (
          <div className="p-20 text-center bg-white rounded-[40px] border-2 border-dashed border-slate-100">
            <Clock size={48} className="mx-auto text-slate-200 mb-4" />
            <p className="text-slate-400 font-bold uppercase text-xs tracking-widest">Hôm nay bạn không có lịch dạy</p>
          </div>
        )}
      </div>
    </div>
  );
}