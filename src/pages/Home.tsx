import { useState, useEffect } from 'react';
import { Monitor, LogIn, Stethoscope, Users, ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { usePageTitle } from '../hooks/usePageTitle';

// بيانات الشرائح المقترحة لشريط الخدمات
const carouselSlides = [
  {
    badge: 'خدمات رقمية متكاملة',
    title: 'أبرز خدماتنا لتنظيم وخدمة المراجعين',
    description:
      'نعمل على توفير تجربة مراجعة ميسرة وسريعة من خلال تنظيم مسارات الاستقبال والعيادات وشاشات العرض الذكية.',
    statNumber: '24/7',
    statTitle: 'خدمة مستمرة',
    statSub: 'لتطوير جودة الرعاية الصحية',
  },
  {
    badge: 'كفاءة تشغيلية عالية',
    title: 'متابعة دقيقة لسير العمل داخل العيادات',
    description:
      'تمكين الطاقم الطبي من إدارة قوائم الانتظار، استدعاء المرضى بكل سهولة، وتنظيم أوقات الزيارات لتقليل الازدحام.',
    statNumber: '100%',
    statTitle: 'تنظيم آلي',
    statSub: 'دقة في إدارة المواعيد',
  },
  {
    badge: 'شفافية وسرعة في الإعلان',
    title: 'لوحات عرض رقمية محدثة لحظياً',
    description:
      'عرض أرقام التذاكر الحالية وأرقام الغرف بوضوح تام في مناطق الانتظار لتوجيه المراجعين بسلاسة ودون عناء.',
    statNumber: 'HD',
    statTitle: 'عرض مرئي',
    statSub: 'تحديثات فورية ومباشرة',
  },
  {
    badge: 'جودة رعاية صحية متطورة',
    title: 'أنظمة رقمية داعمة لراحة المراجعين',
    description:
      'تسخير التقنية الحديثة للارتقاء بجودة الخدمات المقدمة في مركز الرعاية الصحية الأولية بالخرج طوال ساعات العمل.',
    statNumber: 'VIP',
    statTitle: 'عناية فائقة',
    statSub: 'بأعلى معايير الجودة',
  },
];

function Home() {
  usePageTitle('الرئيسية');
  const navigate = useNavigate();
  const [currentSlide, setCurrentSlide] = useState(0);

  // الانتقال التلقائي بين الشرائح كل 4 ثوانٍ
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % carouselSlides.length);
    }, 4000);

    return () => clearInterval(timer);
  }, []);

  const slide = carouselSlides[currentSlide];

  return (
    <div
      className="min-h-screen bg-slate-50 flex flex-col justify-between"
      dir="rtl"
    >
      <div className="flex-1 bg-emerald-50/60 flex flex-col items-center justify-center p-6 lg:p-10">
        <div className="w-full max-w-6xl mx-auto">
          {/* Header / Navbar */}
          <div
            className="mb-8 flex items-center justify-between gap-4 bg-gradient-to-r from-emerald-700 to-sky-600 backdrop-blur-md px-6 py-4 rounded-2xl shadow-sm border border-white/10"
            dir="rtl"
          >
            <div className="flex items-center gap-4">
              <img
                src="/logo.svg"
                alt="شعار تجمع الرياض الصحي الأول"
                className="h-14 w-auto object-contain drop-shadow-md transition-transform hover:scale-105 sm:h-16"
              />
              <div className="text-right">
                <h1 className="text-lg font-extrabold text-white sm:text-xl">
                  مركز الرعاية الصحية الأولية بالخرج
                </h1>
                <p className="mt-0.5 text-xs font-semibold text-sky-100">
                  تجمع الرياض الصحي الأول
                </p>
              </div>
            </div>

            <div className="hidden md:block text-left text-white/80 text-sm font-bold">
              نظام إدارة الانتظار الذكي
            </div>
          </div>

          {/* Banner / Image Strip (متحرك آلياً) */}
          <div className="mb-8 relative overflow-hidden rounded-3xl shadow-xl bg-gradient-to-r from-sky-600 to-emerald-700 border border-white/20 transition-all duration-500">
            <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#e0f2fe_1px,transparent_1px)] [background-size:16px_16px]"></div>

            <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between p-6 sm:p-10 gap-8 min-h-[220px]">
              <div className="text-right max-w-xl transition-opacity duration-300">
                <span className="inline-block bg-sky-400/30 text-white text-xs font-extrabold px-3 py-1 rounded-full mb-3 backdrop-blur-sm">
                  {slide.badge}
                </span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white leading-tight">
                  {slide.title}
                </h2>
                <p className="mt-2 text-sm text-sky-100 font-medium leading-relaxed">
                  {slide.description}
                </p>
              </div>

              {/* عناصر الإحصائية أو الشعار في الشريط */}
              <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/15 w-full lg:w-auto justify-center">
                <div className="h-12 w-12 rounded-xl bg-white/20 flex items-center justify-center text-white font-extrabold text-lg">
                  {slide.statNumber}
                </div>
                <div className="text-right">
                  <div className="text-sm font-extrabold text-white">
                    {slide.statTitle}
                  </div>
                  <div className="text-xs text-sky-100">{slide.statSub}</div>
                </div>
              </div>
            </div>

            {/* نقاط التنقل التفاعلية (Dots) */}
            <div className="flex justify-center items-center gap-2 pb-4 relative z-10">
              {carouselSlides.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentSlide(index)}
                  className={`transition-all duration-300 rounded-full ${
                    currentSlide === index
                      ? 'w-6 h-2 bg-white'
                      : 'w-2 h-2 bg-white/50'
                  }`}
                  aria-label={`الانتقال إلى الشريحة ${index + 1}`}
                />
              ))}
            </div>
          </div>

          {/* Main Options Grid */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {/* Reception */}
            <button
              type="button"
              onClick={() => navigate('/login/reception')}
              className="group flex flex-col justify-between rounded-3xl bg-white p-7 text-right shadow-lg ring-1 ring-slate-200/50 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl"
            >
              <div>
                <div className="mb-6 flex items-center justify-between">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 transition group-hover:bg-blue-600 group-hover:text-white shadow-sm">
                    <Users size={28} />
                  </div>
                  <ChevronLeft
                    size={22}
                    className="text-slate-300 transition group-hover:-translate-x-1 group-hover:text-blue-600"
                  />
                </div>
                <h3 className="text-xl font-extrabold text-slate-900">
                  الاستقبال
                </h3>
                <p className="mt-2 text-sm font-semibold leading-relaxed text-slate-500">
                  تسجيل المراجعين وإصدار أرقام الانتظار وتوجيههم إلى العيادات
                  بكفاءة عالية.
                </p>
              </div>

              <div className="mt-6 flex items-center gap-2 text-sm font-extrabold text-blue-600 pt-4 border-t border-slate-100">
                <LogIn size={18} />
                تسجيل الدخول
              </div>
            </button>

            {/* Clinics */}
            <button
              type="button"
              onClick={() => navigate('/login/clinic')}
              className="group flex flex-col justify-between rounded-3xl bg-white p-7 text-right shadow-lg ring-1 ring-slate-200/50 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl"
            >
              <div>
                <div className="mb-6 flex items-center justify-between">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 transition group-hover:bg-emerald-600 group-hover:text-white shadow-sm">
                    <Stethoscope size={28} />
                  </div>
                  <ChevronLeft
                    size={22}
                    className="text-slate-300 transition group-hover:-translate-x-1 group-hover:text-emerald-600"
                  />
                </div>
                <h3 className="text-xl font-extrabold text-slate-900">
                  العيادات
                </h3>
                <p className="mt-2 text-sm font-semibold leading-relaxed text-slate-500">
                  إدارة قوائم الانتظار واستدعاء المراجعين وإتمام الزيارات الطبية
                  بكل سهولة.
                </p>
              </div>

              <div className="mt-6 flex items-center gap-2 text-sm font-extrabold text-emerald-600 pt-4 border-t border-slate-100">
                <LogIn size={18} />
                تسجيل الدخول
              </div>
            </button>

            {/* Display */}
            <button
              type="button"
              onClick={() => navigate('/display')}
              className="group flex flex-col justify-between rounded-3xl bg-white p-7 text-right shadow-lg ring-1 ring-slate-200/50 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl"
            >
              <div>
                <div className="mb-6 flex items-center justify-between">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-50 text-violet-600 transition group-hover:bg-violet-600 group-hover:text-white shadow-sm">
                    <Monitor size={28} />
                  </div>
                  <ChevronLeft
                    size={22}
                    className="text-slate-300 transition group-hover:-translate-x-1 group-hover:text-violet-600"
                  />
                </div>
                <h3 className="text-xl font-extrabold text-slate-900">
                  شاشة العرض
                </h3>
                <p className="mt-2 text-sm font-semibold leading-relaxed text-slate-500">
                  عرض أرقام المراجعين المستدعاة والعيادات والغرف على شاشة
                  الانتظار العامة.
                </p>
              </div>

              <div className="mt-6 flex items-center gap-2 text-sm font-extrabold text-violet-600 pt-4 border-t border-slate-100">
                <Monitor size={18} />
                دخول مباشر
              </div>
            </button>
          </div>

          {/* Footer Instruction */}
          <div className="mt-10 text-center">
            <p className="text-xs font-bold text-white/90 bg-black/10 py-2 px-4 rounded-xl inline-block backdrop-blur-sm bg-emerald-600">
              اختر الواجهة المطلوبة للمتابعة
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;
