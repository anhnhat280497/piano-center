import React, { useState } from 'react';
import { 
  LayoutDashboard, CalendarRange, Library, Users, LogOut, 
  BookOpen, ChevronDown, CalendarDays, Layers 
} from 'lucide-react';

export default function Sidebar({ active, onChange, onLogout, isCollapsed, onToggle }) {
  const [isClassOpen, setIsClassOpen] = useState(true);

  const menuItems = [
    { id: 'dashboard', label: 'DASHBOARD', icon: LayoutDashboard },
    { id: 'schedule', label: 'XẾP LỊCH', icon: CalendarRange },
  ];

  return (
    <aside className={`bg-slate-900 text-white flex flex-col fixed h-full z-20 shadow-2xl transition-all duration-300 ${isCollapsed ? 'w-20' : 'w-64'}`}>
      
      {/* KHU VỰC LOGO - Đóng vai trò là nút Toggle */}
      <div 
        onClick={onToggle}
        className={`flex items-center gap-3 py-8 px-6 cursor-pointer hover:bg-slate-800/50 transition-all duration-300 group ${isCollapsed ? 'justify-center px-0' : ''}`}
        title={isCollapsed ? "Mở rộng menu" : "Thu nhỏ menu"}
      >
        <div className="bg-indigo-600 p-2 rounded-xl text-white shadow-lg shadow-indigo-500/30 group-hover:scale-110 transition-transform shrink-0">
          <BookOpen size={24} />
        </div>
        {!isCollapsed && (
          <h1 className="text-lg font-black tracking-tighter uppercase whitespace-nowrap animate-in fade-in slide-in-from-left-2">
            Piano Center
          </h1>
        )}
      </div>

      {/* NAVIGATION ITEMS */}
      <nav className="space-y-2 flex-1 font-bold text-sm px-3">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onChange(item.id)}
            className={`w-full flex items-center gap-3 p-4 rounded-2xl transition-all ${
              active === item.id ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800'
            } ${isCollapsed ? 'justify-center' : ''}`}
            title={isCollapsed ? item.label : ''}
          >
            <item.icon size={20} className="shrink-0" />
            {!isCollapsed && <span className="animate-in fade-in duration-300">{item.label}</span>}
          </button>
        ))}

        {/* QUẢN LÝ LỚP VỚI SUB-MENU */}
        <div className="space-y-1">
          <button
            onClick={() => !isCollapsed && setIsClassOpen(!isClassOpen)}
            className={`w-full flex items-center justify-between p-4 rounded-2xl text-slate-400 hover:bg-slate-800 transition-all ${
              active.includes('classes') ? 'text-white' : ''
            } ${isCollapsed ? 'justify-center' : ''}`}
          >
            <div className="flex items-center gap-3">
              <Library size={20} className="shrink-0" />
              {!isCollapsed && <span className="animate-in fade-in duration-300 text-sm font-bold uppercase">Quản lý lớp</span>}
            </div>
            {!isCollapsed && (
              <ChevronDown size={14} className={`transition-transform duration-300 ${isClassOpen ? 'rotate-180' : ''}`} />
            )}
          </button>
          
          {/* Chỉ hiện sub-menu khi không bị thu nhỏ và trạng thái là mở */}
          {isClassOpen && !isCollapsed && (
            <div className="ml-6 space-y-1 animate-in slide-in-from-top-2 duration-300">
              <button 
                onClick={() => onChange('classes-day')}
                className={`w-full flex items-center gap-3 p-3 rounded-xl text-[11px] font-bold ${
                  active === 'classes-day' ? 'text-indigo-400' : 'text-slate-500 hover:text-white'
                }`}
              >
                <CalendarDays size={14} /> THEO NGÀY
              </button>
              <button 
                onClick={() => onChange('classes-group')}
                className={`w-full flex items-center gap-3 p-3 rounded-xl text-[11px] font-bold ${
                  active === 'classes-group' ? 'text-indigo-400' : 'text-slate-500 hover:text-white'
                }`}
              >
                <Layers size={14} /> THEO LỚP
              </button>
            </div>
          )}
        </div>

        {/* TÀI KHOẢN */}
        <button
          onClick={() => onChange('accounts')}
          className={`w-full flex items-center gap-3 p-4 rounded-2xl transition-all ${
            active === 'accounts' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800'
          } ${isCollapsed ? 'justify-center' : ''}`}
          title={isCollapsed ? "Tài khoản" : ""}
        >
          <Users size={20} className="shrink-0" />
          {!isCollapsed && <span className="animate-in fade-in duration-300">TÀI KHOẢN</span>}
        </button>
      </nav>

      {/* THOÁT */}
      <button 
        onClick={onLogout}
        className={`flex items-center gap-3 p-6 text-red-400 font-bold hover:bg-red-500/10 transition-all mt-auto ${
          isCollapsed ? 'justify-center' : ''
        }`}
      >
        <LogOut size={20} className="shrink-0" />
        {!isCollapsed && <span className="animate-in fade-in duration-300">THOÁT</span>}
      </button>
    </aside>
  );
}