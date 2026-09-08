import { useEffect } from 'react';

const MAIN_TITLE = 'نظام الانتظار | مركز الرعاية الصحية الأولية بالخرج';

export function usePageTitle(title?: string) {
  useEffect(() => {
    // حفظ العنوان السابق لإعادت عند مغادرة الصفحة
    const prevTitle = document.title;

    // تعيين العنوان الجديد مع الاسم الموحد للتطبيق
    document.title = title ? `${title} | ${MAIN_TITLE}` : MAIN_TITLE;

    return () => {
      document.title = prevTitle;
    };
  }, [title]);
}