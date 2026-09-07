import { useState } from 'react';
import { LogIn, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

function ReceptionLogin() {
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = () => {
    setError('');

    if (!username.trim() || !password.trim()) {
      setError('يرجى إدخال اسم المستخدم وكلمة المرور');
      return;
    }

    // تسجيل دخول تجريبي مؤقت
    if (username === 'reception' && password === '1234') {
      sessionStorage.setItem('receptionAuthenticated', 'true');
      navigate('/reception');
      return;
    }

    setError('اسم المستخدم أو كلمة المرور غير صحيحة');
  };

  return (
    <div
      className="flex min-h-screen items-center justify-center bg-slate-50 p-6 bg-gradient-to-r from-sky-300 to-emerald-300"
      dir="rtl"
    >
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-sm">
            <Users size={32} />
          </div>

          <h1 className="text-2xl font-extrabold text-slate-900">
            تسجيل دخول الاستقبال
          </h1>
        </div>

        {/* Login Card */}
        <div className="rounded-3xl bg-white p-7 shadow-sm ring-1 ring-slate-200">
          <div className="mb-6">
            <h2 className="text-lg font-extrabold text-slate-900">
              بيانات الدخول
            </h2>

            <p className="mt-1 text-xs font-semibold text-slate-400">
              أدخل بيانات الحساب للمتابعة
            </p>
          </div>

          {/* Username */}
          <div className="mb-5">
            <label
              htmlFor="reception-username"
              className="mb-2 block text-sm font-bold text-slate-700"
            >
              اسم المستخدم
            </label>

            <input
              id="reception-username"
              type="text"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  handleLogin();
                }
              }}
              placeholder="اسم المستخدم"
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 transition focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
            />
          </div>

          {/* Password */}
          <div className="mb-5">
            <label
              htmlFor="reception-password"
              className="mb-2 block text-sm font-bold text-slate-700"
            >
              كلمة المرور
            </label>

            <input
              id="reception-password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  handleLogin();
                }
              }}
              placeholder="كلمة المرور"
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 transition focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
            />
          </div>

          {/* Error */}
          {error && (
            <div className="mb-5 rounded-xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
              {error}
            </div>
          )}

          {/* Login Button */}
          <button
            type="button"
            onClick={handleLogin}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3.5 text-sm font-extrabold text-white transition hover:bg-blue-700 active:scale-[0.99]"
          >
            <LogIn size={19} />
            تسجيل الدخول
          </button>

          {/* Back */}
          <button
            type="button"
            onClick={() => navigate('/')}
            className="mt-4 w-full rounded-xl px-4 py-3 text-sm font-bold text-slate-500 transition hover:bg-slate-50 hover:text-slate-700"
          >
            العودة للرئيسية
          </button>
        </div>
      </div>
    </div>
  );
}

export default ReceptionLogin;
