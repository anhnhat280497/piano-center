import React, { useState } from 'react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Layers, BookOpen, ChevronRight, Clock, Users } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { LESSON_STATUS } from '../../lib/constants'; // Import hằng số chung
import toast from 'react-hot-toast';

export default function ClassesByGroup({ lessons, onRefresh }) {
    const [expanded, setExpanded] = useState(null);

    // Logic gom nhóm dữ liệu: Theo Tên Lớp -> Sau đó theo Giờ học (Session)
    const groups = lessons.reduce((acc, l) => {
        const className = l.class_name || "Lớp lẻ";
        if (!acc[className]) {
            acc[className] = {
                name: className,
                teacher: l.teacher?.full_name || "Chưa phân công",
                sessions: {}
            };
        }

        const timeKey = l.start_time;
        if (!acc[className].sessions[timeKey]) {
            acc[className].sessions[timeKey] = {
                time: timeKey,
                status: l.status,
                students: [],
                ids: []
            };
        }

        acc[className].sessions[timeKey].students.push(l.student?.full_name);
        acc[className].sessions[timeKey].ids.push(l.id);
        return acc;
    }, {});

    // Hàm cập nhật trạng thái cho tất cả học viên trong cùng một buổi học
    const updateBulkStatus = async (ids, newStatus) => {
        const { error } = await supabase
            .from('lessons')
            .update({ status: newStatus })
            .in('id', ids);

        if (error) {
            toast.error("Lỗi cập nhật: " + error.message);
        } else {
            toast.success("Đã cập nhật trạng thái buổi học!");
            await onRefresh(); // Tải lại dữ liệu ở App.jsx
        }
    };

    return (
        <div className="space-y-4 animate-in fade-in duration-500 pb-20">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-black text-slate-800 flex items-center gap-2 uppercase tracking-tighter">
                    <Layers className="text-indigo-600" /> Lộ trình giảng dạy theo lớp
                </h2>
                <span className="text-[10px] font-bold text-slate-400 uppercase bg-white px-3 py-1 rounded-full border tracking-widest">
                    Tổng cộng: {Object.keys(groups).length} Lớp
                </span>
            </div>

            {Object.values(groups).map(g => {
                // Sắp xếp các buổi học trong lớp theo thời gian mới nhất
                const sessionList = Object.values(g.sessions).sort((a, b) => new Date(b.time) - new Date(a.time));
                const doneCount = sessionList.filter(s => s.status === LESSON_STATUS.ATTENDED.value).length;

                return (
                    <div key={g.name} className="bg-white rounded-[32px] border border-slate-100 overflow-hidden shadow-sm transition-all">
                        {/* HÀNG TIÊU ĐỀ LỚP (Bấm để mở rộng) */}
                        <div
                            onClick={() => setExpanded(expanded === g.name ? null : g.name)}
                            className="p-6 flex justify-between items-center cursor-pointer hover:bg-slate-50 transition-all"
                        >
                            <div className="flex items-center gap-4">
                                <div className="bg-indigo-600 p-3 rounded-2xl text-white shadow-lg shadow-indigo-100">
                                    <BookOpen size={20} />
                                </div>
                                <div>
                                    <h3 className="font-black text-slate-800 uppercase tracking-tighter">{g.name}</h3>
                                    <p className="text-[10px] font-bold text-indigo-500 uppercase font-mono tracking-widest">
                                        GV: {g.teacher}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-6">
                                <div className="text-right hidden sm:block">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Tiến độ lớp</p>
                                    <span className="text-lg font-black text-slate-800 leading-none">
                                        {doneCount}/{sessionList.length} <span className="text-xs text-slate-400 font-bold uppercase">Buổi</span>
                                    </span>
                                </div>
                                <ChevronRight className={`text-slate-300 transition-transform duration-300 ${expanded === g.name ? 'rotate-90' : ''}`} />
                            </div>
                        </div>

                        {/* DANH SÁCH CHI TIẾT CÁC BUỔI HỌC (Accordion Content) */}
                        {expanded === g.name && (
                            <div className="bg-slate-50 p-6 space-y-3 border-t border-slate-50 animate-in slide-in-from-top-2 duration-300">
                                <div className="grid gap-3">
                                    {sessionList.map(session => (
                                        <div key={session.time} className="bg-white p-4 rounded-2xl border border-white flex flex-col md:flex-row justify-between items-center gap-4 shadow-sm hover:border-indigo-100 transition-all">
                                            <div className="flex items-center gap-6 w-full md:w-auto">
                                                {/* Cột thời gian 24h & GMT+7 */}
                                                <div className="min-w-[80px] border-r pr-6 border-slate-100">
                                                    <p className="font-black text-slate-800 leading-none text-xl tracking-tighter">
                                                        {format(new Date(session.time), 'HH:mm')}
                                                    </p>
                                                    <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase italic">
                                                        {format(new Date(session.time), 'dd/MM', { locale: vi })}
                                                    </p>
                                                </div>

                                                {/* Thông tin Thứ & Danh sách học viên */}
                                                <div>
                                                    <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                                                        <Clock size={10} /> {format(new Date(session.time), 'EEEE, dd MMMM yyyy', { locale: vi })}
                                                    </p>
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {session.students.map((st, i) => (
                                                            <span key={i} className="text-[10px] bg-slate-100 text-slate-600 px-2.5 py-1 rounded-lg font-bold border border-slate-200 flex items-center gap-1">
                                                                <Users size={8} /> {st}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Nút đổi trạng thái dùng hằng số chung */}
                                            <select
                                                value={session.status}
                                                onChange={(e) => updateBulkStatus(session.ids, e.target.value)}
                                                className={`text-[10px] font-black p-2.5 px-4 rounded-xl border-none outline-none text-white shadow-md cursor-pointer transition-all w-full md:w-auto ${Object.values(LESSON_STATUS).find(s => s.value === session.status)?.color || 'bg-slate-400'
                                                    }`}
                                            >
                                                {Object.values(LESSON_STATUS).map((status) => (
                                                    <option key={status.value} value={status.value} className="bg-white text-slate-800">
                                                        {status.label}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                );
            })}

            {Object.keys(groups).length === 0 && (
                <div className="bg-white p-20 rounded-[40px] border-2 border-dashed border-slate-100 text-center">
                    <Layers size={48} className="mx-auto text-slate-100 mb-4" />
                    <p className="text-slate-300 font-black uppercase text-xs tracking-[0.2em]">Chưa có dữ liệu lớp học</p>
                </div>
            )}
        </div>
    );
}