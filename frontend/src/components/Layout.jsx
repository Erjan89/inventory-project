import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Laptop, FileText, Users, LogOut, Hexagon, Menu, X } from 'lucide-react';

export default function Layout({ children }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const username = localStorage.getItem('username') || 'user';
  const role = localStorage.getItem('role') || 'manager';

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const menuItems = [
    { path: '/', name: 'Сводка', icon: LayoutDashboard },
    { path: '/products', name: 'Оборудование', icon: Laptop },
    { path: '/rentals', name: 'Выдача (Прокат)', icon: FileText },
    { path: '/clients', name: 'Сотрудники / Клиенты', icon: Users },
  ];

  return (
    <div className="flex h-screen bg-zinc-100 overflow-hidden font-sans">
      
      {/* Мобильная шапка (видна только на телефонах) */}
      <div className="md:hidden fixed top-0 w-full bg-zinc-950 text-white h-16 flex items-center justify-between px-4 z-50">
        <div className="flex items-center gap-2">
          <Hexagon className="text-teal-400" />
          <span className="font-bold text-lg tracking-wide">IT-AssetPro</span>
        </div>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-zinc-300">
          {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
      </div>

      {/* Оверлей для мобильного меню */}
      {isMobileMenuOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/50 z-40" 
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Сайдбар (Десктоп и Мобильный) */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-72 bg-zinc-950 text-zinc-300 flex flex-col transition-transform duration-300 ease-in-out
        md:relative md:translate-x-0
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-8 hidden md:flex items-center gap-3">
          <div className="bg-teal-500/10 p-2 rounded-xl border border-teal-500/20">
            <Hexagon size={28} className="text-teal-400" />
          </div>
          <span className="text-white text-2xl font-bold tracking-tight">IT-Asset<span className="text-teal-500">Pro</span></span>
        </div>

        <nav className="flex-1 px-4 space-y-2 mt-16 md:mt-4 overflow-y-auto">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-200 group ${
                  isActive 
                    ? 'bg-teal-500 text-zinc-950 font-semibold shadow-lg shadow-teal-500/20' 
                    : 'hover:bg-zinc-900 hover:text-white'
                }`}
              >
                <Icon size={20} className={isActive ? 'text-zinc-950' : 'text-zinc-500 group-hover:text-teal-400'} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Блок пользователя */}
        <div className="p-4 m-4 bg-zinc-900 rounded-3xl border border-zinc-800">
          <div className="flex items-center gap-3 mb-4 px-2 pt-2">
            <div className="w-12 h-12 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-teal-400 font-bold text-lg">
              {username.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-white font-medium capitalize">{username}</p>
              <p className={`text-xs font-bold uppercase tracking-wider ${role === 'admin' ? 'text-rose-400' : 'text-teal-500'}`}>
                {role === 'admin' ? 'Администратор' : 'Менеджер'}
              </p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="flex items-center justify-center gap-2 text-sm font-medium bg-zinc-950 hover:bg-red-500 hover:text-white text-zinc-400 transition-colors w-full py-2.5 rounded-xl"
          >
            <LogOut size={16} /> Выйти
          </button>
        </div>
      </div>

      {/* Основной контент */}
      <div className="flex-1 flex flex-col h-screen overflow-y-auto pt-16 md:pt-0">
        <main className="p-4 md:p-8 max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
