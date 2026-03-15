import React, { useState } from 'react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Calendar, Users } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';
import { LESSON_STATUS } from '../../lib/constants';

export default function ClassesByDay({ lessons, onRefresh }) {
    const [filterDate, setFilterDate] = useState(format(new Date(), 'yyyy-MM-dd'));

    const filtered = lessons.filter(l => format(new Date(l.start_time), 'yyyy-MM-dd') === filterDate);

    // Gom nhóm học viên cùng giờ trong cùng một ngày
    const sessions = filtered.reduce((acc, l) => {
        const key = `${l.class_name}-${l.start_time}`;
        if (!acc[key]) acc[key] = { ...l, students: [], ids: [] };
        acc[key].students.push(l.student?.full_name);
        acc[key].ids.push(l.id);
        return acc;
    }, {});

    const updateStatus = async (ids, status) => {
        const { error } = await supabase.from('lessons').update({ status }).in('id', ids);
        if (!error) { toast.success("Đã cập nhật!"); onRefresh(); }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="bg-white p-6 rounded-3xl border flex justify-between items-center shadow-sm">
                <h2 className="font-black text-slate-800 uppercase flex items-center gap-2 tracking-tighter"><Calendar className="text-indigo-600" /> Lịch học ngày {format(new Date(filterDate), 'dd/MM', { locale: vi })}</h2>
                <input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)} className="p-2 bg-slate-50 rounded-xl font-bold text-indigo-600 border-none outline-none" />
            </div>

            <div className="grid gap-4">
                {Object.values(sessions).length > 0 ? Object.values(sessions).sort((a, b) => new Date(a.start_time) - new Date(b.start_time)).map(s => (
                    <div key={s.id} className="bg-white p-6 rounded-[32px] border flex flex-col md:flex-row justify-between items-center gap-4 hover:shadow-lg transition-all border-slate-100">
                        <div className="flex items-center gap-6">
                            <div className="text-center min-w-[70px] border-r pr-6 border-slate-100">
                                <p className="text-xl font-black text-slate-800 leading-none">{format(new Date(s.start_time), 'HH:mm')}</p>
                                <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">24 Giờ</p>
                            </div>
                            <div>
                                <h3 className="font-black text-slate-700 uppercase tracking-tight">{s.class_name}</h3>
                                <div className="flex flex-wrap gap-1 mt-1">
                                    {s.students.map((name, i) => <span key={i} className="text-[10px] bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-lg font-bold border border-indigo-100">{name}</span>)}
                                </div>
                            </div>
                        </div>
                        <select
                            value={s.status}
                            onChange={e => updateStatus(s.ids, e.target.value)}
                            className={`text-[10px] font-black p-2 rounded-xl border-none outline-none text-white shadow-md cursor-pointer transition-all ${LESSON_STATUS[s.status.toUpperCase()]?.color || 'bg-gray-400'
                                }`}
                        >
                            {Object.values(LESSON_STATUS).map((status) => (
                                <option key={status.value} value={status.value}>
                                    {status.label}
                                </option>
                            ))}
                        </select>
                    </div>
                )) : <div className="p-20 text-center bg-white rounded-[40px] border-2 border-dashed border-slate-200 font-bold text-slate-300 uppercase tracking-widest text-xs">Không có lịch học trong ngày này</div>}
            </div>
        </div>
    );
}