import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Hexagon, Lock, User, AlertCircle } from 'lucide-react';

export default function Login() {
  // Состояния для хранения введенных данных
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const navigate = useNavigate();

  // Функция обработки отправки формы
  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch('http://127.0.0.1:5000/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.msg || 'Ошибка авторизации. Проверьте данные.');
      }
      
      // Сохраняем данные сессии в браузер
      localStorage.setItem('token', data.token);
      localStorage.setItem('role', data.role);
      localStorage.setItem('username', data.username);
      
      // Перенаправляем на главную
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col md:flex-row font-sans">
      
      {/* Левая часть - Брендинг (Скрыта на мобильных устройствах) */}
      <div className="hidden md:flex flex-1 bg-zinc-900 items-center justify-center p-12 border-r border-zinc-800 relative overflow-hidden">
        {/* Декоративный фоновый элемент */}
        <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-teal-600/20 rounded-full blur-[100px]"></div>
        
        <div className="max-w-md relative z-10">
          <div className="bg-teal-500/10 p-4 rounded-2xl w-max mb-8 border border-teal-500/20">
            <Hexagon size={64} className="text-teal-400" />
          </div>
          <h1 className="text-5xl font-extrabold text-white mb-6 tracking-tight">Учет IT-активов компании.</h1>
          <p className="text-zinc-400 text-lg leading-relaxed">
            Безопасная система управления оборудованием, контроля выдачи инвентаря и автоматической генерации отчетности.
          </p>
        </div>
      </div>

      {/* Правая часть - Форма авторизации */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-12 relative">
        <div className="w-full max-w-md bg-zinc-900 md:bg-transparent p-8 md:p-0 rounded-3xl border border-zinc-800 md:border-none shadow-2xl md:shadow-none">
          
          {/* Логотип для мобильной версии */}
          <div className="md:hidden flex justify-center mb-8">
            <div className="bg-teal-500/10 p-3 rounded-2xl border border-teal-500/20">
              <Hexagon size={48} className="text-teal-400" />
            </div>
          </div>
          
          <h2 className="text-3xl font-bold text-white mb-2 text-center md:text-left">Вход в систему</h2>
          <p className="text-zinc-500 mb-8 text-center md:text-left">Введите учетные данные для доступа к панели</p>
          
          {/* Блок вывода ошибки */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-4 rounded-xl mb-6 flex items-start gap-3">
              <AlertCircle size={20} className="shrink-0 mt-0.5" />
              <span className="text-sm font-medium">{error}</span>
            </div>
          )}
          
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-zinc-400 mb-2">Имя пользователя (Логин)</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <User size={20} className="text-zinc-500" />
                </div>
                <input
                  type="text"
                  className="w-full pl-12 pr-4 py-4 bg-zinc-950 border border-zinc-800 rounded-xl text-white placeholder-zinc-600 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Введите логин"
                  required
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-zinc-400 mb-2">Пароль</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock size={20} className="text-zinc-500" />
                </div>
                <input
                  type="password"
                  className="w-full pl-12 pr-4 py-4 bg-zinc-950 border border-zinc-800 rounded-xl text-white placeholder-zinc-600 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>
            
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full bg-teal-600 hover:bg-teal-500 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-teal-600/20 flex justify-center items-center ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {isLoading ? (
                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                'Авторизоваться'
              )}
            </button>
          </form>

          {/* Подсказка для комиссии на защите диплома */}
          {/* <div className="mt-8 pt-6 border-t border-zinc-800 text-center">
            <p className="text-xs text-zinc-500">
              Доступные аккаунты для тестирования:<br/>
              <span className="font-mono text-zinc-400">admin / admin123</span> (Полные права)<br/>
              <span className="font-mono text-zinc-400">manager / manager123</span> (Ограниченные права)
            </p>
          </div> */}
        </div>
      </div>
    </div>
  );
}
