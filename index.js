require('dotenv').config();
const express = require('express');
const twilio = require('twilio');
const OpenAI = require('openai');

const app = express();
app.use(express.urlencoded({ extended: false }));

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const conversations = {};
const MY_NUMBER = 'whatsapp:+4915222571934';

app.post('/webhook', async (req, res) => {
  const from = req.body.From;
  const message = req.body.Body?.trim();

  if (!message) return res.sendStatus(200);

  if (!conversations[from]) {
    conversations[from] = [];
  }

  // فحص START50 فوري قبل أي شيء
  if (message.toUpperCase().includes('START50')) {
    conversations[from].push({ role: 'user', content: message });
    conversations[from].push({ role: 'assistant', content: '✅ Partner-Code erkannt! Sie erhalten 50% Rabatt auf das erste Monat! Wie kann ich Ihnen weiterhelfen?' });

    const twiml = new twilio.twiml.MessagingResponse();
    twiml.message('✅ Partner-Code erkannt! Sie erhalten 50% Rabatt auf das erste Monat! Wie kann ich Ihnen weiterhelfen?');
    res.type('text/xml');
    return res.send(twiml.toString());
  }

  conversations[from].push({
    role: 'user',
    content: message
  });

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      max_tokens: 500,
      messages: [
        {
          role: 'system',
          content: `Du bist ein professioneller KI-Verkaufsassistent von GastroAI.

⚠️ DEMO-HINWEIS: Weise den Kunden darauf hin, dass dies eine Test-Nummer ist.
Sage: "Diese Nummer ist nur für Demo-Zwecke. Nach Vertragsabschluss erhalten Sie eine eigene WhatsApp-Business-Nummer mit Ihrem Firmenlogo!"

Über uns:
- Entwickelt von Mo
- Instagram: @gastroaiagency
- Website: https://gastroai.info/

Deine Aufgabe:
1. Begrüße professionell in der Sprache des Kunden
2. Stelle GastroAI vor
3. Erkläre den Demo-Hinweis
4. Frage nach: Unternehmensart, Problem, Funktionen, Budget, Kontaktdaten
5. Am Ende sage GENAU: "Mo meldet sich in 24 Stunden!"

Antworte immer in der Sprache des Kunden.
Stelle immer nur EINE Frage.`
        },
        ...conversations[from]
      ]
    });

    const reply = response.choices[0].message.content;

    conversations[from].push({
      role: 'assistant',
      content: reply
    });

    const hasPartnerCode = conversations[from]
      .some(m => m.content.toUpperCase().includes('START50'));

    // إرسال إشعار للمالك عند انتهاء المحادثة
    if (reply.includes('meldet sich') || reply.includes('24 Stunden')) {
      try {
        const client = twilio(
          process.env.TWILIO_ACCOUNT_SID,
          process.env.TWILIO_AUTH_TOKEN
        );

        const summary = conversations[from]
          .filter(m => m.role === 'user')
          .map((m, i) => `${i + 1}. ${m.content}`)
          .join('\n');

        await client.messages.create({
          from: process.env.TWILIO_WHATSAPP_NUMBER,
          to: MY_NUMBER,
          body: `🔔 عميل جديد جاهز!\n` +
                `📱 رقم: ${from}\n` +
                `${hasPartnerCode ? '⭐ استخدم كود START50!\n' : ''}` +
                `\n📝 ملخص:\n${summary}`
        });
      } catch (notifyErr) {
        console.error('خطأ في الإشعار:', notifyErr.message);
      }
    }

    const twiml = new twilio.twiml.MessagingResponse();
    twiml.message(reply);
    res.type('text/xml');
    res.send(twiml.toString());

  } catch (error) {
    console.error('خطأ:', error.message);
    const twiml = new twilio.twiml.MessagingResponse();
    twiml.message('Entschuldigung, ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.');
    res.type('text/xml');
    res.send(twiml.toString());
  }
});

app.get('/', (req, res) => {
  res.send('GastroAI Bot ✅ Online');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ GastroAI Bot شغال على البورت ${PORT}`);
});