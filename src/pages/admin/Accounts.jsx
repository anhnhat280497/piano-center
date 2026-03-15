import React, { useState } from 'react';
import { Edit, Save, Shield, ShieldOff, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';
import { ROLES } from '../../lib/constants';

export default function Accounts({ users, onRefresh, onBlock }) {
    const [editingId, setEditingId] = useState(null);
    const [form, setForm] = useState({});
    const [isSaving, setIsSaving] = useState(false); // <--- THÊM DÒNG NÀY

    const handleSave = async (id) => {
        if (isSaving) return; // Nếu đang lưu thì không cho chạy tiếp
        setIsSaving(true); // Bây giờ biến này đã tồn tại

        try {
            const updateData = { full_name: form.full_name };
            if (form.role === 'teacher') {
                updateData.commission_rate = parseFloat(form.commission_rate);
            } else if (form.role === 'student') {
                updateData.tuition_rate = parseInt(form.tuition_rate);
            }

            const { error } = await supabase.from('profiles').update(updateData).eq('id', id);

            if (error) {
                toast.error("Lỗi: " + error.message);
            } else {
                toast.success("Đã lưu thay đổi! 🎹");
                // Đợi loadAllData chạy xong hoàn toàn
                await onRefresh();
                setEditingId(null);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="bg-white rounded-[32px] shadow-sm border overflow-hidden animate-in fade-in">
            <div className="p-6 bg-slate-900 text-white font-black text-[10px] uppercase tracking-[0.2em] flex items-center gap-2">
                <Shield size={16} /> Quản trị tài khoản & Đơn giá
            </div>
            <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b">
                    <tr>
                        <th className="p-4">Thành viên</th>
                        <th className="p-4 text-center">Đơn giá / %</th>
                        <th className="p-4 text-center">Trạng thái</th>
                        <th className="p-4 text-right">Thao tác</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {users.map(u => (
                        <tr key={u.id} className={u.is_blocked ? "bg-red-50/50" : "hover:bg-slate-50  transition-colors"}>
                            <td className="p-4">
                                {editingId === u.id ? (
                                    <input className="border-2 border-indigo-100 p-2 rounded-xl w-full font-bold outline-none" value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} />
                                ) : (
                                    <div>
                                        <p className="font-black text-slate-800 tracking-tight">{u.full_name}  {u.role === ROLES.ADMIN && "(Bạn)"}</p>
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{u.role}</p>
                                    </div>
                                )}
                            </td>
                            <td className="p-4 text-center">
                                {editingId === u.id ? (
                                    u.role === ROLES.TEACHER ?
                                        <input type="number" step="0.1" className="border-2 border-indigo-100 p-2 rounded-xl w-20 text-center font-bold" value={form.commission_rate} onChange={e => setForm({ ...form, commission_rate: e.target.value })} /> :
                                        u.role === ROLES.STUDENT ?
                                            <input type="number" className="border-2 border-indigo-100 p-2 rounded-xl w-28 text-center font-bold" value={form.tuition_rate} onChange={e => setForm({ ...form, tuition_rate: e.target.value })} /> :
                                            <span className="text-gray-300 italic text-[10px]">Không áp dụng</span>
                                ) : (
                                    <span className="font-bold text-slate-600">
                                        {u.role === ROLES.TEACHER ? `${(u.commission_rate || 0.4) * 100}%` :
                                            u.role === ROLES.STUDENT ? `${(u.tuition_rate || 200000).toLocaleString()}đ` :
                                                <span className="text-gray-300 font-normal italic uppercase text-[9px]">Quản trị viên</span>}
                                    </span>
                                )}
                            </td>
                            <td className="p-4 text-center">
                                <span className={`text-[9px] font-black px-3 py-1 rounded-full ${u.is_blocked ? 'bg-red-500 text-white' : 'bg-green-100 text-green-600'}`}>
                                    {u.is_blocked ? 'BỊ KHÓA' : 'HOẠT ĐỘNG'}
                                </span>
                            </td>
                            <td className="p-4 text-right space-x-2">
                                {editingId === u.id ? (
                                    <div className="flex justify-end gap-1">
                                        <button
                                            disabled={isSaving} // KHÓA NÚT khi đang lưu
                                            onClick={() => handleSave(u.id)}
                                            className={`p-2 rounded-xl transition-all ${isSaving
                                                ? 'bg-gray-400 cursor-not-allowed' // Màu xám khi đang lưu
                                                : 'bg-green-500 text-white hover:bg-green-600' // Màu xanh khi bình thường
                                                }`}
                                        >
                                            {isSaving ? (
                                                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" /> // Hiện icon xoay
                                            ) : (
                                                <Save size={16} /> // Hiện icon Save bình thường
                                            )}
                                        </button>
                                        <button onClick={() => setEditingId(null)} className="bg-slate-100 text-slate-400 p-2 rounded-xl"><X size={16} /></button>
                                    </div>
                                ) : (
                                    <div className="flex justify-end gap-1 text-slate-400">
                                        <button onClick={() => { setEditingId(u.id); setForm(u) }} className="p-2 hover:bg-indigo-50 hover:text-indigo-600 rounded-xl transition-colors"><Edit size={18} /></button>

                                        {/* NÚT KHÓA TÀI KHOẢN (Chỉ hiện nếu không phải Admin) */}
                                        {u.role !== ROLES.ADMIN && (
                                            <button
                                                onClick={() => onBlock(u)}
                                                className={`p-2 rounded-xl transition-colors ${u.is_blocked ? 'text-green-500 hover:bg-green-50' : 'hover:bg-red-50 hover:text-red-500'}`}
                                                title={u.is_blocked ? "Mở khóa" : "Khóa tài khoản"}
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
    );
}