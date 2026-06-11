import { useEffect, useState } from 'react';
import { apiFetch, apiDownload } from '../api';
import { Plus, Download, Search, Settings2, X, Trash2 } from 'lucide-react';

export default function Products() {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', category_id: 1, serial_number: '', condition: 'new', price: 0 });
  
  const role = localStorage.getItem('role');
  const isAdmin = role === 'admin';

  useEffect(() => {
    loadData();
  }, [search, filterStatus]); // Авто-обновление при вводе в поиск

  const loadData = async () => {
    try {
      const url = `/products?search=${search}&status=${filterStatus}`;
      const prods = await apiFetch(url);
      setProducts(prods);
    } catch (e) { console.error(e); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await apiFetch('/products', { method: 'POST', body: JSON.stringify(formData) });
      setIsModalOpen(false);
      setFormData({ name: '', category_id: 1, serial_number: '', condition: 'new', price: 0 });
      loadData();
    } catch (e) { alert(e.message); }
  };

  const handleDelete = async (id) => {
    if(!window.confirm('Точно удалить?')) return;
    try {
      await apiFetch(`/products/${id}`, { method: 'DELETE' });
      loadData();
    } catch (e) { alert(e.message); }
  };

  const handleExport = async () => {
    try {
      await apiDownload('/export/excel', 'inventory_report.xlsx');
    } catch (e) { alert('Ошибка экспорта'); }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900">Оборудование</h1>
          <p className="text-zinc-500 text-sm">Реестр ноутбуков, мониторов и прочей техники</p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          {isAdmin && (
            <button onClick={handleExport} className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 px-4 py-2.5 rounded-xl font-medium transition-colors">
              <Download size={18} /> <span className="hidden sm:inline">Excel отчет</span>
            </button>
          )}
          <button onClick={() => setIsModalOpen(true)} className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-4 py-2.5 rounded-xl font-medium transition-colors shadow-lg shadow-teal-600/20">
            <Plus size={18} /> Добавить
          </button>
        </div>
      </div>

      {/* Панель фильтров */}
      <div className="bg-white p-4 rounded-2xl border border-zinc-200 flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
          <input 
            type="text" 
            placeholder="Поиск по названию или S/N..." 
            className="w-full pl-10 pr-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
            value={search} onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <select 
            className="px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:border-teal-500 text-zinc-700 w-full md:w-auto"
            value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="">Все статусы</option>
            <option value="in_stock">На складе</option>
            <option value="rented">Выдано</option>
          </select>
        </div>
      </div>

      {/* Таблица (с горизонтальным скроллом для мобилок) */}
      <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left whitespace-nowrap">
            <thead className="bg-zinc-50 border-b border-zinc-200 text-xs uppercase text-zinc-500 font-bold tracking-wider">
              <tr>
                <th className="px-6 py-4">Оборудование / S/N</th>
                <th className="px-6 py-4">Состояние</th>
                <th className="px-6 py-4">Статус</th>
                {isAdmin && <th className="px-6 py-4 text-right">Управление</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {products.map((p) => (
                <tr key={p.id} className="hover:bg-zinc-50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-bold text-zinc-900">{p.name}</p>
                    <p className="text-xs text-zinc-500 font-mono mt-0.5">S/N: {p.serial_number || 'Н/Д'}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 text-xs font-bold rounded-md ${
                      p.condition === 'new' ? 'bg-blue-100 text-blue-700' :
                      p.condition === 'repair' ? 'bg-red-100 text-red-700' : 'bg-zinc-100 text-zinc-700'
                    }`}>
                      {p.condition === 'new' ? 'Новое' : p.condition === 'repair' ? 'Ремонт' : 'Б/У'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${p.status === 'in_stock' ? 'bg-emerald-500' : 'bg-orange-500'}`}></div>
                      <span className="text-sm font-medium text-zinc-700">{p.status === 'in_stock' ? 'На складе' : 'Выдано'}</span>
                    </div>
                  </td>
                  {isAdmin && (
                    <td className="px-6 py-4 text-right">
                      <button onClick={() => handleDelete(p.id)} className="text-zinc-400 hover:text-red-500 transition-colors p-2 hover:bg-red-50 rounded-lg">
                        <Trash2 size={18} />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
              {products.length === 0 && (
                <tr><td colSpan="4" className="px-6 py-10 text-center text-zinc-400">Ничего не найдено</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Модалка */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-zinc-950/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-zinc-900">Новое оборудование</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-zinc-400 hover:text-zinc-700 bg-zinc-100 p-2 rounded-full"><X size={20}/></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-zinc-700 mb-1">Название модели</label>
                <input required type="text" className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:border-teal-500" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="MacBook Pro 16 M2" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-zinc-700 mb-1">Серийный номер (S/N)</label>
                <input required type="text" className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:border-teal-500 font-mono" value={formData.serial_number} onChange={e => setFormData({...formData, serial_number: e.target.value})} placeholder="C02WM0R0HTD5" />
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-semibold text-zinc-700 mb-1">Состояние</label>
                  <select className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:border-teal-500" value={formData.condition} onChange={e => setFormData({...formData, condition: e.target.value})}>
                    <option value="new">Новое</option>
                    <option value="used">Б/У</option>
                  </select>
                </div>
                {isAdmin && (
                  <div className="flex-1">
                    <label className="block text-sm font-semibold text-zinc-700 mb-1">Цена (₸)</label>
                    <input type="number" className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:border-teal-500" value={formData.price} onChange={e => setFormData({...formData, price: parseFloat(e.target.value)})} />
                  </div>
                )}
              </div>
              <button type="submit" className="w-full bg-teal-600 text-white font-bold py-3.5 rounded-xl hover:bg-teal-700 mt-4">Сохранить в базу</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
