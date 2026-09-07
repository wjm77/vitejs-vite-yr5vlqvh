import { useState } from 'react';
import { LogIn, Stethoscope } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { supabase } from '../config/supabase';

function ClinicLogin() {
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    setError('');

    const cleanUsername = username.trim();
    const cleanPassword = password.trim();

    if (!cleanUsername || !cleanPassword) {
      setError('يرجى إدخال اسم المستخدم وكلمة المرور');
      return;
    }

    setIsLoading(true);

    try {
      /*
       * المستخدم يكتب:
       * room1
       *
       * لكن Supabase Auth يستخدم:
       * room1@clinic.local
       */
      const email = `${cleanUsername}@clinic.local`;

      /*
       * تسجيل الدخول الحقيقي عبر Supabase Auth
       */
      const { data, error: loginError } =
        await supabase.auth.signInWithPassword({
          email,
          password: cleanPassword,
        });

      if (loginError) {
        console.error('خطأ تسجيل الدخول:', loginError);
        setError('اسم المستخدم أو كلمة المرور غير صحيحة');
        return;
      }

      if (!data.user) {
        setError('تعذر تسجيل الدخول');
        return;
      }

      /*
       * جلب بيانات ملف المستخدم المرتبط بحساب Auth.
       */
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('username, role, room_number, is_active')
        .eq('id', data.user.id)
        .eq('role', 'clinic')
        .maybeSingle();

      if (profileError) {
        console.error('فشل تحميل ملف العيادة:', profileError);

        await supabase.auth.signOut();

        setError('تعذر تحميل بيانات حساب العيادة');
        return;
      }

      if (!profile) {
        await supabase.auth.signOut();

        setError('حساب العيادة غير مرتبط بملف مستخدم');
        return;
      }

      if (!profile.is_active) {
        await supabase.auth.signOut();

        setError('حساب العيادة غير نشط');
        return;
      }

      if (!profile.room_number) {
        await supabase.auth.signOut();

        setError('لم يتم تحديد غرفة لهذا الحساب');
        return;
      }

      /*
       * Supabase Auth هو مصدر المصادقة الحقيقي.
       *
       * clinicRoom يستخدم لواجهة التطبيق فقط،
       * وليس كوسيلة حماية.
       */
      sessionStorage.setItem('clinicAuthenticated', 'true');
      sessionStorage.setItem('clinicRoom', String(profile.room_number));
      sessionStorage.setItem(
        'clinicUsername',
        profile.username ?? cleanUsername
      );

      /*
       * تنظيف بقايا النظام القديم.
       */
      sessionStorage.removeItem('clinicId');

      navigate('/clinic');
    } catch (loginException) {
      console.error('خطأ غير متوقع أثناء تسجيل الدخول:', loginException);

      setError('تعذر تسجيل الدخول، حاول مرة أخرى');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="flex min-h-screen items-center justify-center bg-slate-50 p-6 bg-gradient-to-r from-emerald-700 to-sky-600"
      dir="rtl"
    >
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-sm">
            <Stethoscope size={32} />
          </div>

          <h1 className="text-2xl font-extrabold text-white">
            تسجيل دخول العيادات
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
              htmlFor="clinic-username"
              className="mb-2 block text-sm font-bold text-slate-700"
            >
              اسم المستخدم
            </label>

            <input
              id="clinic-username"
              type="text"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  void handleLogin();
                }
              }}
              placeholder="اسم المستخدم"
              autoComplete="username"
              disabled={isLoading}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 transition focus:border-blue-500 focus:ring-4 focus:ring-blue-50 disabled:cursor-not-allowed disabled:bg-slate-50"
            />
          </div>

          {/* Password */}
          <div className="mb-5">
            <label
              htmlFor="clinic-password"
              className="mb-2 block text-sm font-bold text-slate-700"
            >
              كلمة المرور
            </label>

            <input
              id="clinic-password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  void handleLogin();
                }
              }}
              placeholder="كلمة المرور"
              autoComplete="current-password"
              disabled={isLoading}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 transition focus:border-blue-500 focus:ring-4 focus:ring-blue-50 disabled:cursor-not-allowed disabled:bg-slate-50"
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
            onClick={() => void handleLogin()}
            disabled={isLoading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 py-3.5 text-sm font-extrabold text-white transition hover:bg-emerald-600 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <LogIn size={19} />
            {isLoading ? 'جارٍ تسجيل الدخول...' : 'تسجيل الدخول'}
          </button>

          {/* Back */}
          <button
            type="button"
            onClick={() => navigate('/')}
            disabled={isLoading}
            className="mt-4 w-full rounded-xl px-4 py-3 text-sm font-bold text-slate-500 transition hover:bg-slate-50 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            العودة للرئيسية
          </button>
        </div>
      </div>
    </div>
  );
}

export default ClinicLogin;
