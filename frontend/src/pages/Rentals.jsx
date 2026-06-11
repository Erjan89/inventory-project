import { useEffect, useState } from 'react';
import { apiFetch, apiDownload } from '../api';
import { FileText, Download, CheckCircle2, Handshake, Plus, X } from 'lucide-react';

export default function Rentals() {
  const [rentals, setRentals] = useState([]);
  const [products, setProducts] = useState([]);
  const [clients, setClients] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ product_id: '', client_id: '', expected_return: '' });

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const r = await apiFetch('/rentals');
      const p = await apiFetch('/products?status=in_stock');
      const c = await apiFetch('/clients');
      setRentals(r); setProducts(p); setClients(c);
    } catch (e) { console.error(e); }
  };

  const handleIssue = async (e) => {
    e.preventDefault();
    try {
      await apiFetch('/rentals', { method: 'POST', body: JSON.stringify(formData) });
      setIsModalOpen(false);
      loadData();
    } catch (e) { alert(e.message); }
  };

  const downloadPDF = async (id) => {
    try {
      await apiDownload(`/export/pdf/${id}`, `Contract_${id}.pdf`);
    } catch (e) { alert('Ошибка скачивания'); }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900">Журнал выдачи</h1>
          <p className="text-zinc-500 text-sm">Контроль аренды и акты передачи</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="w-full md:w-auto flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-5 py-2.5 rounded-xl font-medium transition-colors shadow-lg shadow-teal-600/20">
          <Plus size={18} /> Выдать технику
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left whitespace-nowrap">
            <thead className="bg-zinc-50 border-b border-zinc-200 text-xs uppercase text-zinc-500 font-bold tracking-wider">
              <tr>
                <th className="px-6 py-4">Оборудование</th>
                <th className="px-6 py-4">Сотрудник</th>
                <th className="px-6 py-4">Выдано</th>
                <th className="px-6 py-4">Статус</th>
                <th className="px-6 py-4 text-right">Документы</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {rentals.map((r) => (
                <tr key={r.id} className="hover:bg-zinc-50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-bold text-zinc-900">{r.product_name}</p>
                    <p className="text-xs text-zinc-500 font-mono mt-0.5">S/N: {r.serial_number}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-semibold text-zinc-800">{r.client_name}</p>
                    <p className="text-xs text-zinc-400 mt-0.5">{r.client_phone}</p>
                  </td>
                  <td className="px-6 py-4 text-sm text-zinc-600">{r.rented_at.split(' ')[0]}</td>
                  <td className="px-6 py-4">
                    {r.status === 'active' ? (
                      <span className="flex items-center gap-1.5 text-xs font-bold bg-orange-100 text-orange-700 px-3 py-1.5 rounded-lg w-max">
                        <Handshake size={14}/> В пользовании
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-xs font-bold bg-emerald-100 text-emerald-700 px-3 py-1.5 rounded-lg w-max">
                        <CheckCircle2 size={14}/> Возвращен
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => downloadPDF(r.id)} className="inline-flex items-center gap-2 text-teal-600 bg-teal-50 hover:bg-teal-100 px-3 py-2 rounded-lg text-sm font-semibold transition-colors">
                      <Download size={16} /> Акт (PDF)
                    </button>
                  </td>
                </tr>
              ))}
              {rentals.length === 0 && <tr><td colSpan="5" className="px-6 py-10 text-center text-zinc-400">Журнал пуст</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-zinc-950/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-zinc-900">Оформление выдачи</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-zinc-400 bg-zinc-100 p-2 rounded-full"><X size={20}/></button>
            </div>
            <form onSubmit={handleIssue} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-zinc-700 mb-2">Оборудование (Доступное)</label>
                <select required className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:border-teal-500 outline-none" value={formData.product_id} onChange={e => setFormData({...formData, product_id: e.target.value})}>
                  <option value="">Выберите устройство...</option>
                  {products.map(p => <option key={p.id} value={p.id}>{p.name} (S/N: {p.serial_number})</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-zinc-700 mb-2">Сотрудник / Клиент</label>
                <select required className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:border-teal-500 outline-none" value={formData.client_id} onChange={e => setFormData({...formData, client_id: e.target.value})}>
                  <option value="">Кому выдаем...</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.name} ({c.department || 'Без отдела'})</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-zinc-700 mb-2">Дата планового возврата</label>
                <input required type="date" className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:border-teal-500 outline-none" value={formData.expected_return} onChange={e => setFormData({...formData, expected_return: e.target.value})} />
              </div>
              <button type="submit" className="w-full bg-teal-600 text-white font-bold py-4 rounded-xl hover:bg-teal-700 mt-4">Подтвердить выдачу</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
