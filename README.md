# مبارزه با اسپم‌های ناشناخته
## چگونه فرم تماس وب‌سایت شخصی‌ام را در برابر ربات‌های هوشمند ایمن کردم؟

به عنوان یک توسعه‌دهنده، یکی از لذت‌بخش‌ترین بخش‌های داشتن یک وب‌سایت شخصی، راه‌اندازی **فرم تماس (Contact Form)** برای تعامل مستقیم با مخاطبان و کارفرمایان است. اما طولی نکشید که این مسیر ارتباطی به بستری برای ورود ده‌ها پیام اسپم، بی‌معنی و آزاردهنده تبدیل شد.

در این مقاله کوتاه، داستان مواجهه با این پیام‌های مخرب، نحوه تحلیل رفتار اسپمر و کد هوشمندی که برای مسدودسازی کاملاً خودکار آن در **Next.js App Router** پیاده‌سازی کردم را با شما به اشتراک می‌گذارم.

---

# ۱. شروع داستان: وقتی پیام‌های بی‌معنی دیتابیس را پر کردند!

در ابتدا متوجه شدم که به صورت مداوم پیام‌هایی با رشته‌های متوالی و بی‌معنی از کاراکترها دریافت می‌کنم، مانند:

```text
QxOURKPUHLrMhAmSqp
```

همچنین آدرس ایمیل ارسال‌کننده از ترفندهایی مانند **Gmail Dot Trick** استفاده می‌کرد تا محدودیت‌های ثبت پیام را دور بزند.

در ابتدا اولین راه‌حلی که به ذهنم رسید، **مسدودسازی IP** بود.

اما خیلی زود مشخص شد که ارسال‌کننده با استفاده از:

- VPN
- Proxy
- IPهای متغیر

هر بار با یک آدرس جدید وارد سایت می‌شود؛ بنابراین بلاک کردن IP به تنهایی راهکار پایداری نبود.

---

# ۲. تحلیل رفتار اسپمر و شناسایی ردپای دستگاه (Fingerprinting)

برای اینکه متوجه شوم با **یک انسان** طرف هستم یا **یک ربات**، اطلاعاتی از مرورگر و سخت‌افزار کلاینت استخراج کردم و همراه فرم تماس به سرور ارسال نمودم.

نمونه‌ای از اطلاعات جمع‌آوری‌شده:

- Browser
- Operating System
- CPU
- GPU
- Screen Resolution
- Time on Page
- Time Zone
- سایر مشخصات مرورگر

پس از بررسی ده‌ها پیام اسپم، الگوی جالبی مشاهده شد.

## ۱) عدم پشتیبانی از GPU

تقریباً تمام پیام‌های اسپم دارای مقدار زیر بودند:

```text
GPU: Not supported
```

این نشان می‌داد که درخواست‌ها احتمالاً توسط مرورگرهای Headless یا ابزارهایی مانند موارد زیر ارسال می‌شوند:

- Puppeteer
- Selenium
- Playwright

---

## ۲) زمان حضور بسیار کوتاه

یکی دیگر از نشانه‌ها، زمان حضور کاربر در صفحه بود.

فاصله بین ورود به صفحه و فشردن دکمه ارسال معمولاً بین:

- 2 ثانیه
- 3 ثانیه
- 4 ثانیه

بود.

در حالی که یک کاربر واقعی برای پر کردن فرم تماس معمولاً چندین ثانیه یا حتی چند دقیقه زمان صرف می‌کند.

---

## ۳) ساختار متن پیام

تقریباً تمام پیام‌ها شامل رشته‌هایی بسیار بلند و بدون فاصله بودند.

مانند:

```text
QxOURKPUHLrMhAmSqpMNBXZLKJHGFD
```

در نتیجه می‌توانستیم با تحلیل متن نیز احتمال ربات بودن را افزایش دهیم.

---

# ۳. پیاده‌سازی گارد هوشمند در `contact/route.js`

پس از تحلیل دقیق رفتار اسپمر، تصمیم گرفتم یک **گارد چندلایه‌ای** در مسیر زیر پیاده‌سازی کنم:

```text
src/app/api/contact/route.js
```

این گارد چندین ویژگی را همزمان بررسی می‌کند؛ از جمله:

- مدت حضور در صفحه
- وضعیت GPU
- ساختار متن پیام
- الگوهای مشکوک ایمیل
- سایر شاخص‌های رفتاری

---

# استراتژی اصلی

نکته جالب این بود که تصمیم گرفتم **ربات را بلاک نکنم!**

در عوض، در صورت تشخیص اسپم:

- اطلاعات در دیتابیس ذخیره نمی‌شود.
- هیچ ایمیلی ارسال نمی‌شود.
- اما سرور همچنان پاسخ موفقیت‌آمیز (`HTTP 200 OK`) برمی‌گرداند.

به بیان دیگر، ربات تصور می‌کند که پیام با موفقیت ثبت شده است، در حالی که هیچ داده‌ای در سیستم ذخیره نشده است.

این تکنیک دو مزیت مهم دارد:

- ربات متوجه شناسایی شدن خود نمی‌شود.
- توسعه‌دهنده ربات نیز احتمالاً الگوی حمله را تغییر نخواهد داد.

در نتیجه، دیتابیس کاملاً تمیز باقی می‌ماند و بار اضافی نیز به سیستم تحمیل نمی‌شود.

---

# نتیجه

گاهی اوقات مؤثرترین روش مقابله با اسپمرها، **فریب دادن آن‌ها** است، نه صرفاً مسدود کردنشان.

ترکیب چندین شاخص رفتاری مانند:

- Fingerprinting
- زمان حضور در صفحه
- تحلیل متن
- بررسی GPU
- الگوی ایمیل

باعث شد بتوانم بدون استفاده از CAPTCHA و بدون ایجاد مزاحمت برای کاربران واقعی، تقریباً تمام پیام‌های اسپم را به صورت خودکار حذف کنم.

این تجربه بار دیگر نشان داد که **تحلیل رفتار (Behavior Analysis)** در بسیاری از موارد از روش‌های سنتی مانند بلاک کردن IP بسیار مؤثرتر است.

```
import { connectDB } from "../../../lib/mongodb";
import Message from "../../../models/Message";
import { NextResponse } from "next/server";

// ۱. تابع تشخیص متون بی‌معنی و کاراکترهای تصادفی
function isRandomGibberish(text) {
  if (!text) return true;
  const words = text.trim().split(/\s+/);
  
  // اگر کلمه‌ای بیش از ۱۸ کاراکتر بدون فاصله داشته باشد
  const hasUnusuallyLongWord = words.some((word) => word.length > 18);

  // اگر کلاً هیچ فاصله‌ای نداشته باشد و بیش از ۱۲ کاراکتر باشد
  const hasNoSpaces = !text.includes(" ");
  const isTooLongWithoutSpace = text.length > 12 && hasNoSpaces;

  return hasUnusuallyLongWord || isTooLongWithoutSpace;
}

// ۲. تابع تشخیص ربات‌های اتوماتیک (Headless Browser)
function isHeadlessBot(deviceInfo) {
  if (!deviceInfo) return false;

  // نبود GPU و ارسال زیر ۴ ثانیه نشانه اصلی ربات است
  const noGpu = deviceInfo.gpu === "Not supported" || deviceInfo.gpu === "Unknown";
  const fastSubmit = deviceInfo.timeSpentSeconds < 4;

  return noGpu && fastSubmit;
}

// متد POST برای ثبت پیام از سمت کاربر
export async function POST(request) {
  try {
    const body = await request.json();
    const { name, email, subject, message, honeypot, deviceInfo } = body;

    // ۱. تله ربات‌های ساده (Honeypot)
    if (honeypot) {
      return NextResponse.json(
        { success: true, message: "Message sent successfully" },
        { status: 200 }
      );
    }

    // ۲. اعتبارسنجی اولیه
    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { message: "All fields are required" },
        { status: 400 }
      );
    }

    // 🛡️ ۳. فیلتر مرورگرهای اتوماتیک (Headless Bot)
    if (deviceInfo && isHeadlessBot(deviceInfo)) {
      return NextResponse.json(
        { success: true, message: "Message sent successfully" },
        { status: 200 }
      );
    }

    // 🛡️ ۴. فیلتر متن‌های بی‌معنی و تصادفی
    if (
      isRandomGibberish(name) ||
      isRandomGibberish(subject) ||
      isRandomGibberish(message)
    ) {
      return NextResponse.json(
        { success: true, message: "Message sent successfully" },
        { status: 200 }
      );
    }

    const rawIp =
      request.headers.get("x-forwarded-for") ||
      request.headers.get("x-real-ip") ||
      "unknown";

    const ipAddress = rawIp.split(",")[0].trim();
    const userAgent = request.headers.get("user-agent") || "unknown";

    await connectDB();

    // ایجاد پیام جدید بعد از عبور از تمامی فیلترها
    const newMessage = await Message.create({
      name,
      email,
      subject,
      message,
      status: "unread",
      ipAddress,
      userAgent,
      deviceInfo,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Message sent successfully",
        data: newMessage,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Contact API error:", error);
    return NextResponse.json(
      { message: "Error sending message", error: error.message },
      { status: 500 }
    );
  }
}

```

# ۴. نتیجه‌گیری

پس از پیاده‌سازی این منطق، نتایج زیر حاصل شد:

- ✅ **کاهش ۱۰۰ درصدی اسپم در دیتابیس**
  - بدون نیاز به استفاده از CAPTCHAهای آزاردهنده یا پیچیده.
  - تمامی پیام‌های رباتیک قبل از ذخیره‌سازی شناسایی و حذف شدند.

- ✅ **عدم وابستگی به IP**
  - حتی با تغییر مداوم VPN یا Proxy، ربات‌ها به دلیل نداشتن ویژگی‌های یک مرورگر واقعی یا ارسال متون غیرطبیعی، در همان لایه API شناسایی و رد می‌شوند.

- ✅ **حفظ تجربه کاربری (UX)**
  - کاربران واقعی بدون مواجهه با CAPTCHA یا مراحل اضافی، فرم تماس را ارسال می‌کنند.

- ✅ **دفاع چندلایه‌ای**
  - ترکیب تحلیل رفتار کاربر (Behavior Analysis)، Fingerprinting و بررسی محتوای پیام، یک لایه امنیتی قدرتمند و در عین حال نامرئی ایجاد می‌کند.

---

## جمع‌بندی

طراحی یک **سیستم دفاع چندلایه مبتنی بر تحلیل رفتار کاربر**، یکی از مؤثرترین روش‌ها برای محافظت از فرم‌های وب در برابر ربات‌های هوشمند است؛ روشی که بدون کاهش کیفیت تجربه کاربری، امنیت فرم را به شکل قابل توجهی افزایش می‌دهد.



### Younes Sheikhlar
#### DevOps | IT Systems & Network