// Library display screen: slides, screen settings, and the catalogue of branded templates.

export type DisplayTemplateId = 'welcome' | 'announcement' | 'quote' | 'event' | 'book' | 'photo' | 'image';
export type DisplayTheme = 'teal' | 'light' | 'dark';
export type DisplayTransition = 'fade' | 'slide' | 'zoom';
export type ImageFit = 'cover' | 'contain';
export type SlideTextField = 'title' | 'subtitle' | 'body' | 'attribution' | 'eventDate' | 'eventTime' | 'location';

export interface DisplaySlide {
  _id?: string;
  template: DisplayTemplateId;
  theme: DisplayTheme;
  title: string;
  subtitle: string;
  body: string;
  attribution: string;
  eventDate: string;
  eventTime: string;
  location: string;
  /** Id of the uploaded image (served by the API at /display/media/:id). */
  image?: string | null;
  imageFit: ImageFit;
  /** Seconds on screen. */
  duration: number;
  isActive: boolean;
  order?: number;
  /** Optional schedule, local dates as YYYY-MM-DD. */
  startDate: string;
  endDate: string;
  updatedAt?: string;
}

export interface DisplaySettings {
  tickerEnabled: boolean;
  /** One news item per line. */
  tickerText: string;
  showClock: boolean;
  hijriOffset: number;
  transition: DisplayTransition;
}

export interface DisplayData {
  settings: DisplaySettings;
  slides: DisplaySlide[];
}

export interface TemplateField {
  key: SlideTextField;
  label: string;
  placeholder?: string;
  multiline?: boolean;
  required?: boolean;
  max: number;
}

export interface DisplayTemplateDef {
  id: DisplayTemplateId;
  name: string;
  description: string;
  /** Font Awesome icon class. */
  icon: string;
  fields: TemplateField[];
  image: 'none' | 'optional' | 'required';
  imageLabel?: string;
  /** Whether the admin chooses between "fit" and "fill" for the image. */
  fitChoice: boolean;
  /** Whether the colour theme applies. */
  themed: boolean;
  /** Starting content when a new slide is created from this template. */
  defaults: Partial<DisplaySlide>;
  /** Image used for the template's preview in the gallery. */
  sampleImage?: string;
}

export const DISPLAY_THEMES: { id: DisplayTheme; name: string; colors: [string, string] }[] = [
  { id: 'teal', name: 'فيروزي', colors: ['#209C90', '#ffffff'] },
  { id: 'light', name: 'فاتح', colors: ['#F4F9F8', '#209C90'] },
  { id: 'dark', name: 'داكن', colors: ['#0F2B28', '#2BB5A7'] }
];

export const DISPLAY_TRANSITIONS: { id: DisplayTransition; name: string }[] = [
  { id: 'fade', name: 'تلاشي' },
  { id: 'slide', name: 'انزلاق' },
  { id: 'zoom', name: 'تكبير' }
];

const SAMPLE_PHOTO = 'assets/img/display/sample-library.jpg';

export const DISPLAY_TEMPLATES: DisplayTemplateDef[] = [
  {
    id: 'welcome',
    name: 'ترحيب',
    description: 'شعار المركز مع رسالة ترحيب والساعة والتاريخ الهجري والميلادي',
    icon: 'fa-hand-holding-heart',
    fields: [
      { key: 'title', label: 'العنوان', required: true, max: 80 },
      { key: 'subtitle', label: 'النص الفرعي', max: 160 }
    ],
    image: 'none',
    fitChoice: false,
    themed: true,
    defaults: { theme: 'teal', title: 'أهلاً وسهلاً بكم', subtitle: 'في مكتبة مركز المصطفى', duration: 15 }
  },
  {
    id: 'announcement',
    name: 'إعلان',
    description: 'عنوان بارز ونص للإعلانات والتنبيهات',
    icon: 'fa-bullhorn',
    fields: [
      { key: 'subtitle', label: 'الوسم', placeholder: 'مثال: إعلان، تنبيه، جديد', max: 40 },
      { key: 'title', label: 'العنوان', required: true, max: 150 },
      { key: 'body', label: 'النص', multiline: true, max: 700 },
      { key: 'attribution', label: 'التذييل', placeholder: 'مثال: إدارة المكتبة', max: 150 }
    ],
    image: 'none',
    fitChoice: false,
    themed: true,
    defaults: {
      theme: 'light',
      subtitle: 'إعلان',
      title: 'تمديد ساعات الدوام في المكتبة',
      body: 'يسرّ إدارة المكتبة أن تعلن عن تمديد ساعات الدوام خلال فترة الامتحانات، لتصبح من الثامنة صباحاً حتى العاشرة مساءً طيلة أيام الأسبوع.',
      attribution: 'إدارة المكتبة'
    }
  },
  {
    id: 'quote',
    name: 'آية / حديث / حكمة',
    description: 'نص مقتبس بخط النسخ داخل إطار زخرفي',
    icon: 'fa-quote-right',
    fields: [
      { key: 'subtitle', label: 'العنوان الصغير', placeholder: 'مثال: قال تعالى، حديث شريف، حكمة اليوم', max: 40 },
      { key: 'body', label: 'النص', multiline: true, required: true, max: 400 },
      { key: 'attribution', label: 'المصدر', max: 150 }
    ],
    image: 'none',
    fitChoice: false,
    themed: true,
    defaults: {
      theme: 'dark',
      subtitle: 'قال تعالى',
      body: '﴿اقْرَأْ بِاسْمِ رَبِّكَ الَّذِي خَلَقَ﴾',
      attribution: 'سورة العلق - الآية ١'
    }
  },
  {
    id: 'event',
    name: 'فعالية / نشاط',
    description: 'تفاصيل الفعالية مع التاريخ والوقت والمكان وصورة اختيارية',
    icon: 'fa-calendar-alt',
    fields: [
      { key: 'subtitle', label: 'الوسم', placeholder: 'مثال: فعالية، محاضرة، دورة', max: 40 },
      { key: 'title', label: 'العنوان', required: true, max: 150 },
      { key: 'body', label: 'الوصف', multiline: true, max: 400 },
      { key: 'eventDate', label: 'التاريخ', placeholder: 'مثال: الخميس ٢٠ / ١١', max: 80 },
      { key: 'eventTime', label: 'الوقت', placeholder: 'مثال: بعد صلاة المغرب', max: 80 },
      { key: 'location', label: 'المكان', max: 120 }
    ],
    image: 'optional',
    imageLabel: 'صورة الفعالية (اختيارية)',
    fitChoice: false,
    themed: true,
    sampleImage: SAMPLE_PHOTO,
    defaults: {
      theme: 'teal',
      subtitle: 'محاضرة',
      title: 'آداب طالب العلم',
      body: 'ندعوكم لحضور محاضرة حول آداب طلب العلم ومنهجية القراءة والبحث.',
      eventDate: 'يوم الخميس القادم',
      eventTime: 'بعد صلاة المغرب',
      location: 'قاعة المكتبة الرئيسية'
    }
  },
  {
    id: 'book',
    name: 'كتاب مميز',
    description: 'غلاف كتاب مع العنوان والمؤلف ونبذة ومكانه في المكتبة',
    icon: 'fa-book',
    fields: [
      { key: 'subtitle', label: 'الوسم', placeholder: 'مثال: كتاب الأسبوع، وصل حديثاً', max: 40 },
      { key: 'title', label: 'عنوان الكتاب', required: true, max: 150 },
      { key: 'attribution', label: 'المؤلف', max: 150 },
      { key: 'body', label: 'نبذة', multiline: true, max: 500 },
      { key: 'location', label: 'مكانه في المكتبة', max: 120 }
    ],
    image: 'optional',
    imageLabel: 'صورة الغلاف (اختيارية)',
    fitChoice: false,
    themed: true,
    defaults: {
      theme: 'light',
      subtitle: 'كتاب الأسبوع',
      title: 'لسان العرب',
      attribution: 'ابن منظور',
      body: 'من أوسع معاجم اللغة العربية وأشهرها، جمع فيه مؤلفه ما تفرّق في المعاجم قبله، ويُعدّ مرجعاً أساسياً للباحثين وطلاب العلم.',
      location: 'الغرفة ١ - الاستاند ٣ - الرف ٢'
    }
  },
  {
    id: 'photo',
    name: 'صورة مع عنوان',
    description: 'صورة تملأ الشاشة مع عنوان بألوان المركز وشعاره',
    icon: 'fa-image',
    fields: [
      { key: 'title', label: 'العنوان', max: 150 },
      { key: 'subtitle', label: 'النص الفرعي', max: 160 }
    ],
    image: 'required',
    imageLabel: 'الصورة',
    fitChoice: false,
    themed: true,
    sampleImage: SAMPLE_PHOTO,
    defaults: { theme: 'teal', title: 'مكتبة مركز المصطفى', subtitle: 'بيئة هادئة للقراءة والبحث' }
  },
  {
    id: 'image',
    name: 'صورة فقط (رفع مباشر)',
    description: 'ارفع تصميماً جاهزاً أو صورة لتُعرض كما هي على كامل الشاشة',
    icon: 'fa-upload',
    fields: [],
    image: 'required',
    imageLabel: 'الصورة',
    fitChoice: true,
    themed: false,
    sampleImage: SAMPLE_PHOTO,
    defaults: { imageFit: 'contain' }
  }
];

export const DEFAULT_DISPLAY_SETTINGS: DisplaySettings = {
  tickerEnabled: false,
  tickerText: '',
  showClock: true,
  hijriOffset: 0,
  transition: 'fade'
};

export function getTemplate(id: DisplayTemplateId): DisplayTemplateDef {
  return DISPLAY_TEMPLATES.find(t => t.id === id) || DISPLAY_TEMPLATES[0];
}

export function emptySlide(template: DisplayTemplateId = 'announcement'): DisplaySlide {
  return {
    template,
    theme: 'teal',
    title: '',
    subtitle: '',
    body: '',
    attribution: '',
    eventDate: '',
    eventTime: '',
    location: '',
    image: null,
    imageFit: 'cover',
    duration: 12,
    isActive: true,
    startDate: '',
    endDate: ''
  };
}

/** A new slide pre-filled with the template's sample content. */
export function slideFromTemplate(template: DisplayTemplateId): DisplaySlide {
  return { ...emptySlide(template), ...getTemplate(template).defaults, template };
}

/** Shown on the screen when there is nothing scheduled. */
export const FALLBACK_SLIDE: DisplaySlide = slideFromTemplate('welcome');

/** Local date as YYYY-MM-DD (the format of a slide's schedule). */
export function localDateString(date: Date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export type SlideStatus = 'live' | 'off' | 'upcoming' | 'expired';

export function slideStatus(slide: DisplaySlide, today: string = localDateString()): SlideStatus {
  if (!slide.isActive) return 'off';
  if (slide.startDate && slide.startDate > today) return 'upcoming';
  if (slide.endDate && slide.endDate < today) return 'expired';
  return 'live';
}

// ---- Clock and dates (Arabic numerals; Hijri by the Umm al-Qura calendar plus a manual offset) ----

const timeFormat = new Intl.DateTimeFormat('ar-u-nu-arab', { hour: 'numeric', minute: '2-digit' });
const weekdayFormat = new Intl.DateTimeFormat('ar-u-nu-arab', { weekday: 'long' });
const gregorianFormat = new Intl.DateTimeFormat('ar-u-nu-arab', { day: 'numeric', month: 'numeric', year: 'numeric' });
const hijriFormat = new Intl.DateTimeFormat('ar-u-ca-islamic-umalqura-nu-arab', { day: 'numeric', month: 'long', year: 'numeric' });

/** A schedule date (YYYY-MM-DD) for display, e.g. ١‏/١٢‏/٢٠٢٦. */
export function formatDay(ymd: string): string {
  const [y, m, d] = (ymd || '').split('-').map(Number);
  return y && m && d ? gregorianFormat.format(new Date(y, m - 1, d)) : ymd;
}

export interface ClockParts {
  time: string;
  period: string;
  weekday: string;
  hijri: string;
  gregorian: string;
}

export function clockParts(date: Date, hijriOffset = 0): ClockParts {
  const parts = timeFormat.formatToParts(date);
  const value = (type: string) => parts.find(p => p.type === type)?.value || '';
  const hijriDate = new Date(date.getTime() + (hijriOffset || 0) * 86400000);
  return {
    time: `${value('hour')}:${value('minute')}`,
    period: value('dayPeriod'),
    weekday: weekdayFormat.format(date),
    hijri: hijriFormat.format(hijriDate),
    // Keep the right-to-left marks Intl inserts: they keep day/month/year in Arabic reading order.
    gregorian: `${gregorianFormat.format(date)} م`
  };
}
