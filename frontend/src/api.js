const BASE_URL = 'http://127.0.0.1:5000/api';

export const apiFetch = async (endpoint, options = {}) => {
  const token = localStorage.getItem('token');
  
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
    ...options.headers,
  };

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    window.location.href = '/login';
    return null;
  }

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.msg || 'Произошла ошибка');
  }
  return data;
};

// Специальная функция для скачивания файлов (Excel/PDF)
export const apiDownload = async (endpoint, filename) => {
  const token = localStorage.getItem('token');
  const response = await fetch(`${BASE_URL}${endpoint}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });

  if (!response.ok) throw new Error('Ошибка скачивания файла');

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
};
