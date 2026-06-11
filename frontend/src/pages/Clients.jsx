import { useEffect, useState } from 'react';
import { apiFetch } from '../api';
import { UserPlus, Briefcase, Phone, Mail, X } from 'lucide-react';

export default function Clients() {
  const [clients, setClients] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', phone: '', email: '', department: '' });

  useEffect(() => { loadClients(); }, []);

  const loadClients = async () => {
    try {
      const data = await apiFetch('/clients');
      setClients(data);
    } catch (e) { console.error(e); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await apiFetch('/clients', { method: 'POST', body: JSON.stringify(formData) });
      setIsModalOpen(false);
      setFormData({ name: '', phone: '', email: '', department: '' });
      loadClients();
    } catch (e) { alert(e.message); }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900">Сотрудники / Клиенты</h1>
          <p className="text-zinc-500 text-sm">База лиц, которым выдается оборудование</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="w-full md:w-auto flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-5 py-2.5 rounded-xl font-medium transition-colors shadow-lg shadow-teal-600/20">
          <UserPlus size={18} /> Новый профиль
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {clients.map(c => (
          <div key={c.id} className="bg-white p-6 rounded-3xl border border-zinc-200 shadow-sm flex flex-col gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-zinc-100 rounded-full flex items-center justify-center text-xl font-bold text-teal-600 border border-zinc-200">
                {c.name.charAt(0)}
              </div>
              <div>
                <h3 className="font-bold text-zinc-900 leading-tight">{c.name}</h3>
                <p className="text-xs font-semibold text-zinc-400 uppercase flex items-center gap-1 mt-1">
                  <Briefcase size={12} /> {c.department || 'Без отдела'}
                </p>
              </div>
            </div>
            <div className="pt-4 border-t border-zinc-100 space-y-2">
              <div className="flex items-center gap-3 text-sm text-zinc-600">
                <Phone size={14} className="text-zinc-400"/> {c.phone}
              </div>
              <div className="flex items-center gap-3 text-sm text-zinc-600">
                <Mail size={14} className="text-zinc-400"/> {c.email || '—'}
              </div>
            </div>
          </div>
        ))}
        {clients.length === 0 && <div className="col-span-full text-center py-10 text-zinc-400">База пуста</div>}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-zinc-950/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-zinc-900">Данные сотрудника</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-zinc-400 bg-zinc-100 p-2 rounded-full"><X size={20}/></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input required type="text" placeholder="ФИО полностью" className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:border-teal-500 outline-none" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              <input required type="text" placeholder="Отдел (например: Маркетинг)" className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:border-teal-500 outline-none" value={formData.department} onChange={e => setFormData({...formData, department: e.target.value})} />
              <input required type="text" placeholder="Телефон" className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:border-teal-500 outline-none" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
              <input type="email" placeholder="Email (необязательно)" className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:border-teal-500 outline-none" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
              <button type="submit" className="w-full bg-teal-600 text-white font-bold py-3.5 rounded-xl hover:bg-teal-700 mt-2">Создать</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
