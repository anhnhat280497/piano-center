import React from 'react';
import { AlertTriangle } from 'lucide-react';

export default function ConfirmModal({ isOpen, title, message, onConfirm, onCancel, type = "danger" }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-sm rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-8 text-center">
          <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4 ${type === 'danger' ? 'bg-red-50 text-red-500' : 'bg-indigo-50 text-indigo-500'}`}>
            <AlertTriangle size={32} />
          </div>
          <h3 className="text-xl font-black text-slate-800 mb-2 tracking-tight">{title}</h3>
          <p className="text-slate-500 text-sm leading-relaxed">{message}</p>
        </div>
        <div className="flex border-t border-slate-100 bg-slate-50/50">
          <button onClick={onCancel} className="flex-1 px-4 py-5 text-xs font-black text-slate-400 hover:bg-white transition-colors border-r border-slate-100">HỦY BỎ</button>
          <button onClick={onConfirm} className={`flex-1 px-4 py-5 text-xs font-black transition-colors hover:bg-white ${type === 'danger' ? 'text-red-500' : 'text-indigo-600'}`}>XÁC NHẬN</button>
        </div>
      </div>
    </div>
  );
}