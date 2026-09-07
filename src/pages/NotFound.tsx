import { AlertTriangle, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

function NotFound() {
  const navigate = useNavigate();

  return (
    <div
      className="flex min-h-screen items-center justify-center bg-slate-50 p-6"
      dir="rtl"
    >
      <div className="w-full max-w-md text-center">
        <div className="rounded-3xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
            <AlertTriangle size={32} />
          </div>

          <div className="text-6xl font-extrabold text-slate-900">404</div>

          <h1 className="mt-4 text-xl font-extrabold text-slate-900">
            الصفحة غير موجودة
          </h1>

          <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">
            عذرًا، الصفحة التي تحاول الوصول إليها غير موجودة أو تم نقلها.
          </p>

          <button
            type="button"
            onClick={() => navigate('/')}
            className="mt-7 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3.5 text-sm font-extrabold text-white transition hover:bg-blue-700 active:scale-[0.99]"
          >
            <ArrowRight size={18} />
            العودة للرئيسية
          </button>
        </div>
      </div>
    </div>
  );
}

export default NotFound;
