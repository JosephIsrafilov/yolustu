'use client';
import { useEffect, useState } from 'react';
import { getDemoData, saveDemoData } from '@/services/demo/data';
import { useAppStore } from '@/store/useAppStore';

export default function DemoNotifications() {
  const userId = useAppStore((state) => state.currentUser?.id);
  const [open, setOpen] = useState(false);
  const [, refresh] = useState(0);
  useEffect(() => { const update = () => refresh((value) => value + 1); window.addEventListener('yolmates-demo-change', update); return () => window.removeEventListener('yolmates-demo-change', update); }, []);
  if (!userId) return null;
  const items = getDemoData().notifications.filter((item) => item.userId === userId);
  const unread = items.filter((item) => !item.read).length;
  return <div className="relative"><button type="button" onClick={() => setOpen(!open)} aria-label={`Notifications, ${unread} unread`} aria-expanded={open} className="relative rounded-full p-2 text-[#054752] hover:bg-[#edfcff]">🔔{unread > 0 && <span className="absolute -right-1 -top-1 rounded-full bg-[#d45532] px-1 text-[10px] text-white">{unread}</span>}</button>{open && <div className="absolute right-0 top-11 z-[80] w-[min(90vw,340px)] rounded-xl border border-[#cbe8ee] bg-white p-3 shadow-xl"><div className="mb-2 flex items-center justify-between"><strong className="text-sm text-[#002f37]">Demo notifications</strong><button type="button" className="text-xs text-[#054752] underline" onClick={() => { items.forEach((item) => { item.read = true; }); saveDemoData(); }}>Mark all read</button></div>{items.length ? <div className="max-h-72 space-y-2 overflow-y-auto">{items.map((item) => <button type="button" key={item.id} onClick={() => { item.read = true; saveDemoData(); }} className={`block w-full rounded-lg p-2 text-left text-xs ${item.read ? 'bg-white' : 'bg-[#edfcff]'}`}><strong className="block text-[#002f37]">{item.title}</strong><span className="text-[#405d64]">{item.body}</span></button>)}</div> : <p className="text-xs text-[#405d64]">No notifications yet.</p>}</div>}</div>;
}
