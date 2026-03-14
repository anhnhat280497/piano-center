import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { Shield, ShieldOff, Key, Edit, Save, X } from 'lucide-react';

export default function AdminUserManagement() {
  const [users, setUsers] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ full_name: '', commission_rate: 0.4, is_blocked: false });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    const { data } = await supabase.from('profiles').select('*').order('role');
    setUsers(data || []);
  };

  const startEdit = (user) => {
    setEditingId(user.id);
    setEditForm({ full_name: user.full_name, commission_rate: user.commission_rate, is_blocked: user.is_blocked });
  };

  const handleUpdate = async (id) => {
    const { error } = await supabase
      .from('profiles')
      .update(editForm)
      .eq('id', id);

    if (error) alert(error.message);
    else {
      alert("Cập nhật thành công!");
      setEditingId(null);
      fetchUsers();
    }
  };

  // Tính năng Khóa/Mở khóa
  const toggleBlock = async (user) => {
    const { error } = await supabase
      .from('profiles')
      .update({ is_blocked: !user.is_blocked })
      .eq('id', user.id);
    
    if (!error) fetchUsers();
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mt-8">
      <div className="p-6 border-b bg-gray-50 flex justify-between items-center">
        <h2 className="text-xl font-bold flex items-center gap-2 text-slate-800">
          <Shield className="text-indigo-600" size={24}/> Quản lý Giáo viên & Học viên
        </h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="text-[10px] uppercase font-black text-gray-400 bg-gray-50 tracking-widest">
            <tr>
              <th className="p-4">Tên / Vai trò</th>
              <th className="p-4 text-center">Hoa hồng (%)</th>
              <th className="p-4 text-center">Trạng thái</th>
              <th className="p-4 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {users.map((u) => (
              <tr key={u.id} className={`${u.is_blocked ? 'bg-red-50/50' : 'hover:bg-gray-50'}`}>
                <td className="p-4">
                  {editingId === u.id ? (
                    <input 
                      className="p-1 border rounded w-full"
                      value={editForm.full_name}
                      onChange={(e) => setEditForm({...editForm, full_name: e.target.value})}
                    />
                  ) : (
                    <div>
                      <p className="font-bold text-gray-800">{u.full_name}</p>
                      <span className="text-[9px] bg-slate-200 px-2 py-0.5 rounded font-black uppercase text-slate-500">{u.role}</span>
                    </div>
                  )}
                </td>
                <td className="p-4 text-center font-mono">
                  {editingId === u.id ? (
                    <input 
                      type="number" step="0.1"
                      className="p-1 border rounded w-16 text-center"
                      value={editForm.commission_rate}
                      onChange={(e) => setEditForm({...editForm, commission_rate: parseFloat(e.target.value)})}
                    />
                  ) : (
                    u.commission_rate * 100 + '%'
                  )}
                </td>
                <td className="p-4 text-center">
                  {u.is_blocked ? (
                    <span className="text-red-500 flex items-center justify-center gap-1 font-bold text-xs">
                       <ShieldOff size={14}/> Đã khóa
                    </span>
                  ) : (
                    <span className="text-green-500 font-bold text-xs uppercase">Hoạt động</span>
                  )}
                </td>
                <td className="p-4 text-right space-x-2">
                  {editingId === u.id ? (
                    <button onClick={() => handleUpdate(u.id)} className="text-green-600"><Save size={20}/></button>
                  ) : (
                    <>
                      <button onClick={() => startEdit(u)} className="text-indigo-500"><Edit size={18}/></button>
                      <button onClick={() => toggleBlock(u)} className={u.is_blocked ? "text-green-500" : "text-red-400"}>
                        {u.is_blocked ? <Shield size={18}/> : <ShieldOff size={18}/>}
                      </button>
                      <button 
                        onClick={() => alert("Hướng dẫn: Để reset password về 1234567890, Admin truy cập Supabase Dashboard > Auth > Users > Chọn User > Reset Password.")} 
                        className="text-gray-400 hover:text-orange-500"
                        title="Hướng dẫn Reset Password"
                      >
                        <Key size={18}/>
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}