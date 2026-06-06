require('dotenv').config(); // قراءة الإعدادات من ملف .env بدون أخطاء
const express = require('express');
const twilio = require('twilio');
const OpenAI = require('openai');

const app = express();
app.use(express.urlencoded({ extended: false }));

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const conversations = {};
// 📱 ضع رقمك هنا بدلاً من كمال لاستقبال إشعارات العملاء الجدد فوراً
const MY_NUMBER = 'whatsapp:+4915222571934'; 

app.post('/webhook', async (req, res) => {
  const from = req.body.From;
  const message = req.body.Body;

  // إنشاء جلسة جديدة للعميل إن لم تكن موجودة
  if (!conversations[from]) {
    conversations[from] = [];
  }

  // إضافة رسالة العميل إلى الجلسة
  conversations[from].push({
    role: 'user',
    content: message
  });

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      max_tokens: 1000,
      messages: [
        {
          role: 'system',
          content: `أنت مساعد ذكي اسمك Kamal تعمل في ألمانيا.
لغتك الأساسية هي الألمانية.
إذا كتب لك أحد بالعربي، رد عليه بالعربي.
إذا كتب بالألمانية، رد بالألمانية.
إذا كتب بأي لغة أخرى، رد بنفس لغته.
تخدم: مطاعم، مدارس، أسواق.
كن ودوداً ومختصراً.`
        },
        ...conversations[from]
      ]
    });

    const reply = response.choices[0].message.content;

    // حفظ رد الذكاء الاصطناعي في سجل المحادثة
    conversations[from].push({
      role: 'assistant',
      content: reply
    });

    // فحص محترف وذكي للكود الترويجي (START50) بدون تحسس لحجم الحروف
    const hasPartnerCode = conversations[from]
      .some(m => m.content.toUpperCase().includes('START50'));

    // إرسال الإشعار التلقائي لك عند انتهاء المحادثة وجمع البيانات
    if (reply.includes('meldet sich') || reply.includes('24 Stunden')) {
      const client = twilio(
        process.env.TWILIO_ACCOUNT_SID,
        process.env.TWILIO_AUTH_TOKEN
      );

      const summary = conversations[from]
        .filter(m => m.role === 'user')
        .map(m => `${m.content}`)
        .join('\n');

      await client.messages.create({
        from: process.env.TWILIO_WHATSAPP_NUMBER,
        to: MY_NUMBER,
        body: `🔔 عميل جديد في الانتظار!\n${hasPartnerCode ? '⭐ العميل استخدم كود الخصم: START50!\n' : ''}\n📝 ملخص طلب العميل:\n${summary}\n\n📞 رقم هاتف العميل: ${from}`
      });
    }

    // إرسال الرد النهائي إلى الواتساب عبر Twilio
    const twiml = new twilio.twiml.MessagingResponse();
    twiml.message(reply);
    res.type('text/xml');
    res.send(twiml.toString());

  } catch (error) {
    console.error(error);
    const twiml = new twilio.twiml.MessagingResponse();
    twiml.message('Entschuldigung, ein Fehler ist aufgetreten.');
    res.type('text/xml');
    res.send(twiml.toString());
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`GastroAI Bot شغال بنجاح على البورت ${PORT}`);
});