import { connectDB } from "../../../lib/mongodb";
import Message from "../../../models/Message";
import { NextResponse } from "next/server";

//  تابع تشخیص متون بی‌معنی و کاراکترهای تصادفی
function isRandomGibberish(text) {
  if (!text) return true;
  const words = text.trim().split(/\s+/);

  // اگر کلمه‌ای بیش از ۱۸ کاراکتر بدون فاصله داشته باشد
  const hasUnusuallyLongWord = words.some((word) => word.length > 18);

  //اگر کلا هیچ فاصله‌ای نداشته باشه و بیش از ۱۲ کاراکتر باشه
  const hasNoSpaces = !text.includes(" ");
  const isTooLongWithoutSpace = text.length > 12 && hasNoSpaces;

  return hasUnusuallyLongWord || isTooLongWithoutSpace;
}

//  تابع تشخیص ربات‌های اتوماتیک (Headless Browser)
function isHeadlessBot(deviceInfo) {
  if (!deviceInfo) return false;

  // نبود کارتگرافیک و ارسال زیر ۴ ثانیه نشانه اصلی رباته
  const noGpu =
    deviceInfo.gpu === "Not supported" || deviceInfo.gpu === "Unknown";
  const fastSubmit = deviceInfo.timeSpentSeconds < 4;

  return noGpu && fastSubmit;
}

// متد POST برای ثبت پیام از سمت کاربر
export async function POST(request) {
  try {
    const body = await request.json();
    const { name, email, subject, message, honeypot, deviceInfo } = body;

    //  تله ربات‌های ساده (Honeypot)
    if (honeypot) {
      return NextResponse.json(
        { success: true, message: "Message sent successfully" },
        { status: 200 },
      );
    }

    //  اعتبارسنجی اولیه
    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { message: "All fields are required" },
        { status: 400 },
      );
    }

    //  فیلتر مرورگرهای اتوماتیک (Headless Bot)
    if (deviceInfo && isHeadlessBot(deviceInfo)) {
      return NextResponse.json(
        { success: true, message: "Message sent successfully" },
        { status: 200 },
      );
    }

    //  فیلتر متن‌های بی‌معنی و تصادفی
    if (
      isRandomGibberish(name) ||
      isRandomGibberish(subject) ||
      isRandomGibberish(message)
    ) {
      return NextResponse.json(
        { success: true, message: "Message sent successfully" },
        { status: 200 },
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
      { status: 201 },
    );
  } catch (error) {
    console.error("Contact API error:", error);
    return NextResponse.json(
      { message: "Error sending message", error: error.message },
      { status: 500 },
    );
  }
}
