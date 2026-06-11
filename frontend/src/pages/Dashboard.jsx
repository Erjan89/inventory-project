import { useEffect, useState } from 'react';
import { apiFetch } from '../api';
import { Laptop, Wrench, DollarSign, Activity, AlertCircle, TrendingUp, History as HistoryIcon } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  
  // Получаем роль текущего пользователя из localStorage
  const role = localStorage.getItem('role');
  const isAdmin = role === 'admin';

  // Загрузка данных при монтировании компонента
  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const data = await apiFetch('/stats');
      setStats(data);
    } catch (error) {
      console.error("Ошибка при загрузке статистики:", error);
    }
  };

  // Демонстрационные данные для графика (для защиты диплома)
  // В реальном проекте эти данные генерировал бы Бэкенд на основе Transaction
  const chartData = [
    { name: 'Пн', выдано: 4, возвращено: 2 }, 
    { name: 'Вт', выдано: 7, возвращено: 5 },
    { name: 'Ср', выдано: 2, возвращено: 8 }, 
    { name: 'Чт', выдано: 9, возвращено: 3 },
    { name: 'Пт', выдано: 12, возвращено: 10 }, 
    { name: 'Сб', выдано: 3, возвращено: 4 },
    { name: 'Вс', выдано: 1, возвращено: 1 },
  ];

  // Экран загрузки
  if (!stats) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-zinc-400 gap-4">
        <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
        <span className="font-medium animate-pulse">Синхронизация данных...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-500">
      
      {/* Шапка страницы */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-zinc-900 tracking-tight">Сводка по активам</h1>
          <p className="text-zinc-500 mt-1 text-sm md:text-base">Статистика IT-оборудования компании в реальном времени.</p>
        </div>
        <div className="bg-white px-4 py-2 rounded-xl border border-zinc-200 shadow-sm inline-flex items-center gap-2 w-max">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-teal-500"></span>
            </span>
            <span className="text-sm font-semibold text-zinc-700">Система активна</span>
        </div>
      </div>

      {/* Карточки KPI */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <StatCard 
          icon={<Laptop />} 
          title="Всего на балансе" 
          value={`${stats.total_items} шт`} 
          color="text-indigo-600" 
          bg="bg-indigo-50" 
        />
        <StatCard 
          icon={<Activity />} 
          title="Доступно на складе" 
          value={`${stats.in_stock} шт`} 
          color="text-emerald-600" 
          bg="bg-emerald-50" 
        />
        <StatCard 
          icon={<Wrench />} 
          title="В ремонте" 
          value={`${stats.in_repair} шт`} 
          color="text-orange-600" 
          bg="bg-orange-50" 
        />
        
        {/* Финансовый блок (Отображается только администратору) */}
        {isAdmin ? (
          <StatCard 
            icon={<DollarSign />} 
            title="Стоимость активов" 
            value={`${stats.total_value.toLocaleString()} ₸`} 
            color="text-teal-600" 
            bg="bg-teal-50" 
            borderColor="border-l-4 border-l-teal-500"
          />
        ) : (
          <div className="bg-zinc-50 rounded-3xl p-6 border border-zinc-200 flex flex-col justify-center items-center text-center opacity-80 border-dashed">
            <AlertCircle className="text-zinc-400 mb-2" size={28}/>
            <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Финансы скрыты</p>
            <p className="text-[10px] text-zinc-400 mt-1">Недостаточно прав доступа</p>
          </div>
        )}
      </div>

      {/* Основной контент (График + История) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        
        {/* Блок графика (Занимает 2/3 ширины на больших экранах) */}
        <div className="lg:col-span-2 bg-white p-6 md:p-8 rounded-3xl border border-zinc-200 shadow-sm flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-zinc-900 text-lg flex items-center gap-2">
              <TrendingUp size={20} className="text-teal-500"/> Динамика движения техники
            </h3>
            <span className="text-xs font-bold text-zinc-500 bg-zinc-100 px-3 py-1 rounded-full uppercase tracking-wider">За неделю</span>
          </div>
          
          <div className="h-[300px] w-full flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorVydano" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0d9488" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#0d9488" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e4e4e7" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#a1a1aa', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#a1a1aa', fontSize: 12}} />
                <Tooltip 
                    contentStyle={{borderRadius: '16px', border: '1px solid #e4e4e7', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} 
                />
                <Area type="monotone" name="Выдано шт." dataKey="выдано" stroke="#0d9488" strokeWidth={3} fillOpacity={1} fill="url(#colorVydano)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Блок логов системы (Занимает 1/3 ширины) */}
        <div className="bg-white p-6 md:p-8 rounded-3xl border border-zinc-200 shadow-sm flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-zinc-900 text-lg flex items-center gap-2">
              <HistoryIcon size={20} className="text-teal-500"/> Журнал событий
            </h3>
          </div>
          
          <div className="flex-1 overflow-y-auto pr-2 space-y-4">
            {stats.recent_operations.length === 0 ? (
              <div className="h-full flex items-center justify-center text-zinc-400 text-sm italic">
                Нет недавних операций
              </div>
            ) : (
              stats.recent_operations.map((op) => (
                <div key={op.id} className="flex items-start gap-4 p-3 hover:bg-zinc-50 rounded-2xl transition-colors border border-transparent hover:border-zinc-100">
                  {/* Иконка статуса операции */}
                  <div className={`mt-0.5 w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-sm ${
                      op.action === 'delete' ? 'bg-red-100 text-red-600' : 
                      op.action === 'add' ? 'bg-emerald-100 text-emerald-600' : 
                      op.action === 'rent' ? 'bg-orange-100 text-orange-600' : 
                      'bg-teal-100 text-teal-600'
                  }`}>
                    {op.action === 'add' ? '+' : op.action === 'delete' ? '−' : op.action === 'rent' ? '↑' : '↓'}
                  </div>
                  
                  {/* Текст операции */}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-zinc-800 leading-tight">{op.details}</p>
                    <p className="text-xs text-zinc-500 mt-1">
                      Исполнитель: <span className="font-semibold text-zinc-700">{op.user}</span>
                    </p>
                  </div>
                  
                  {/* Время */}
                  <div className="text-xs font-bold text-zinc-400 bg-zinc-100 px-2 py-1 rounded-md">
                    {op.time}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

// Вспомогательный компонент для карточек (KPI)
function StatCard({ icon, title, value, color, bg, borderColor = "border-transparent" }) {
  return (
    <div className={`bg-white rounded-3xl p-6 border ${borderColor === 'border-transparent' ? 'border-zinc-200' : borderColor} shadow-sm flex items-center gap-5 transition-transform hover:-translate-y-1 duration-300`}>
      <div className={`${bg} ${color} p-4 rounded-2xl shadow-inner`}>
        {icon}
      </div>
      <div>
        <p className="text-2xl md:text-3xl font-black text-zinc-900 leading-none mb-1.5">{value}</p>
        <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider">{title}</p>
      </div>
    </div>
  );
}
