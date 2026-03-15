import React from 'react';
import { Wallet, DollarSign, TrendingUp, Users } from 'lucide-react';

export default function Dashboard({ lessons }) {
  const attended = lessons.filter(l => l.status === 'attended');
  
  const revenue = attended.reduce((sum, l) => sum + (l.price_per_lesson || 0), 0);
  const salary = attended.reduce((sum, l) => sum + (l.price_per_lesson * (l.teacher?.commission_rate || 0.4)), 0);
  const profit = revenue - salary;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-8 rounded-[32px] shadow-sm border-b-8 border-green-500">
          <div className="flex justify-between items-start mb-4">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Doanh thu Học phí</p>
            <Wallet className="text-green-500" size={20} />
          </div>
          <p className="text-3xl font-black text-slate-800">{revenue.toLocaleString()}đ</p>
        </div>
        
        <div className="bg-white p-8 rounded-[32px] shadow-sm border-b-8 border-indigo-500">
          <div className="flex justify-between items-start mb-4">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Chi phí Lương GV</p>
            <DollarSign className="text-indigo-500" size={20} />
          </div>
          <p className="text-3xl font-black text-slate-800">{salary.toLocaleString()}đ</p>
        </div>

        <div className="bg-slate-900 p-8 rounded-[32px] shadow-xl text-white">
          <div className="flex justify-between items-start mb-4">
            <p className="text-[10px] font-black text-indigo-300 uppercase tracking-widest">Lợi nhuận ròng</p>
            <TrendingUp className="text-indigo-400" size={20} />
          </div>
          <p className="text-3xl font-black">{profit.toLocaleString()}đ</p>
        </div>
      </div>

      <div className="bg-white p-8 rounded-[32px] shadow-sm border border-slate-100">
        <h3 className="font-black text-slate-800 uppercase text-xs tracking-widest mb-6 flex items-center gap-2">
          <Users size={16} className="text-indigo-600"/> Tình hình dạy học tháng này
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
           <div><p className="text-2xl font-black text-slate-700">{lessons.length}</p><p className="text-[10px] font-bold text-slate-400 uppercase">Tổng buổi</p></div>
           <div><p className="text-2xl font-black text-green-600">{attended.length}</p><p className="text-[10px] font-bold text-slate-400 uppercase">Đã hoàn thành</p></div>
           <div><p className="text-2xl font-black text-red-500">{lessons.filter(l=>l.status==='teacher_off').length}</p><p className="text-[10px] font-bold text-slate-400 uppercase">GV Báo nghỉ</p></div>
           <div><p className="text-2xl font-black text-orange-500">{lessons.filter(l=>l.status==='scheduled').length}</p><p className="text-[10px] font-bold text-slate-400 uppercase">Chờ dạy</p></div>
        </div>
      </div>
    </div>
  );
}