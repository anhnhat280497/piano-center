import React, { useState } from 'react';
import { supabase } from './supabaseClient';
import toast, { Toaster } from 'react-hot-toast';

export default function Auth() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('student'); // Mặc định là học viên
  const [loading, setLoading] = useState(false);

const handleAuth = async (e) => {
  e.preventDefault();
  setLoading(true);
  console.log("Bắt đầu đăng nhập với:", email);

  const { data, error } = isSignUp 
    ? await supabase.auth.signUp({ email, password, options: { data: { full_name: fullName, role: role } } })
    : await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    console.error("Lỗi Auth:", error.message);
    toast.error("LỖI: " + error.message);
  } else {
    console.log("Thành công:", data);
    if (isSignUp) toast.success("Đăng ký xong! Hãy thử đăng nhập.");
  }
  setLoading(false);
};

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
      <Toaster position="top-right" reverseOrder={false} />
      <div className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-md border border-slate-100">
        <h2 className="text-3xl font-black text-center text-indigo-600 mb-2">PIANO CENTER</h2>
        <p className="text-center text-slate-400 text-sm mb-8">
          {isSignUp ? 'Tạo tài khoản mới' : 'Chào mừng bạn quay trở lại'}
        </p>

        <form onSubmit={handleAuth} className="space-y-4">
          {isSignUp && (
            <>
              <div>
                <label className="text-xs font-bold uppercase text-slate-500 ml-1">Họ và Tên</label>
                <input 
                  type="text" required
                  className="w-full p-3 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  value={fullName} onChange={(e) => setFullName(e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs font-bold uppercase text-slate-500 ml-1">Bạn là ai?</label>
                <select 
                  className="w-full p-3 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  value={role} onChange={(e) => setRole(e.target.value)}
                >
                  <option value="student">Học viên</option>
                  <option value="teacher">Giáo viên</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </>
          )}

          <div>
            <label className="text-xs font-bold uppercase text-slate-500 ml-1">Email</label>
            <input 
              type="email" required
              className="w-full p-3 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none"
              value={email} onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label className="text-xs font-bold uppercase text-slate-500 ml-1">Mật khẩu</label>
            <input 
              type="password" required
              className="w-full p-3 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none"
              value={password} onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button 
            type="submit" disabled={loading}
            className="w-full bg-indigo-600 text-white font-black p-4 rounded-2xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
          >
            {loading ? 'Đang xử lý...' : (isSignUp ? 'ĐĂNG KÝ' : 'ĐĂNG NHẬP')}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button 
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-sm font-bold text-indigo-500 hover:underline"
          >
            {isSignUp ? 'Đã có tài khoản? Đăng nhập' : 'Chưa có tài khoản? Đăng ký ngay'}
          </button>
        </div>
      </div>
    </div>
  );
}