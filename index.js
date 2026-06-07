require('dotenv').config();
const express = require('express');
const twilio = require('twilio');
const OpenAI = require('openai');

const app = express();
app.use(express.urlencoded({ extended: false }));

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const conversations = {};
const clientData = {};
const MY_NUMBER = 'whatsapp:+4915222571934';

const WELCOME_MESSAGE = `🎉 Willkommen bei GastroAI!

Ich bin Kamal, Ihr persönlicher KI-Assistent.

⚠️ Wichtiger Hinweis:
Dies ist eine kostenlose Demo für 48 Stunden. Nach Ablauf müssen Sie "join phrase-suppose" erneut senden, da wir uns noch in der Testphase befinden.

Nach Vertragsabschluss erhalten Sie eine eigene WhatsApp-Business-Nummer mit Ihrem Firmenlogo! 🚀

Wie heißen Sie? 😊`;

const SYSTEM_PROMPT = `Du bist Kamal, ein freundlicher und professioneller KI-Verkaufsassistent von GastroAI.

🏢 Über GastroAI:
- Wir entwickeln intelligente KI-WhatsApp-Bots für JEDES Unternehmen
- Restaurants, Cafés, Friseursalons, Fahrschulen, Arztpraxen, Fitnessstudios, Einzelhandel und mehr!
- Entwickelt von Mo | 📧 gastroaiagency@gmail.com | 📱 +49 176 23976931
- Instagram: @gastroaiagency | Website: gastroai.info
- Diese Nummer ist nur für Demo-Zwecke

⚠️ DEMO-HINWEIS (bei erster Nachricht erwähnen):
"Diese Nummer ist nur für Demo-Zwecke. Nach Vertragsabschluss erhalten Sie eine eigene WhatsApp-Business-Nummer mit Ihrem Firmenlogo! 🎉"

🎯 DEIN HAUPTZIEL:
Jede Unterhaltung soll mit einem vereinbarten Termin mit Mo enden!

📋 GESPRÄCHSABLAUF (Schritt für Schritt):
1. Begrüße herzlich und stelle GastroAI vor (Demo-Hinweis)
2. Frage: "Wie heißen Sie?" 😊
3. Frage: "Was für ein Unternehmen haben Sie?"
4. Frage: "Was ist Ihr größtes Problem mit der Kundenkommunikation?"
5. Erkläre wie GastroAI helfen kann (spezifisch für ihr Unternehmen!)
6. Frage: "Möchten Sie direkt einen Termin mit Mo vereinbaren? 📅"
7. Falls ja → frage: "Welcher Tag passt Ihnen?" und "Um wie viel Uhr?"
8. Bestätige den Termin und sage: "Mo meldet sich in 24 Stunden!"

💬 KOMMUNIKATIONSSTIL:
- Freundlich, menschlich, warm - NICHT robotisch!
- Benutze Emojis: 😊 👍 🚀 ✅ 📅
- Beispiele: "Super! 😊 Das klingt interessant!", "Perfekt! 👍 Ich notiere das!"
- Stelle IMMER nur EINE Frage pro Nachricht
- Wenn der Kunde abschweift → bringe das Gespräch zurück zum Termin

📞 KONTAKTDATEN (wenn gefragt):
- WhatsApp/Telefon: +49 176 23976931
- Email: gastroaiagency@gmail.com
- Instagram: @gastroaiagency
- Website: gastroai.info

💡 ÜBERZEUGUNGSARGUMENTE (je nach Unternehmen anpassen):
- "Stellen Sie sich vor: Ihr Bot antwortet 24/7 auf Kundenanfragen, auch wenn Sie schlafen! 🌙"
- "Unsere Kunden sparen durchschnittlich 3 Stunden täglich durch automatische Antworten! ⏰"
- "Der Bot spricht alle Sprachen - perfekt für internationale Kunden! 🌍"

⚠️ WICHTIG:
- Antworte IMMER in der Sprache des Kunden
- Beende JEDE Nachricht mit einer Frage oder Einladung
- Ziel ist IMMER ein Termin mit Mo!`;

app.post('/webhook', async (req, res) => {
  const from = req.body.From;
  const message = req.body.Body?.trim();

  if (!message) return res.sendStatus(200);

  // رسالة ترحيب للعميل الجديد
  const isNewClient = !conversations[from];

  if (!conversations[from]) {
    conversations[from] = [];
    clientData[from] = {
      hasPartnerCode: false,
      notified: false,
      startTime: new Date(),
      isFirst: true
    };
  }

  // إرسال رسالة الترحيب للعميل الجديد
  if (isNewClient) {
    conversations[from].push({ role: 'assistant', content: WELCOME_MESSAGE });
    const twiml = new twilio.twiml.MessagingResponse();
    twiml.message(WELCOME_MESSAGE);
    res.type('text/xml');
    return res.send(twiml.toString());
  }

  // فحص START50 فوري
  if (message.toUpperCase().includes('START50')) {
    clientData[from].hasPartnerCode = true;
    const reply = '✅ Partner-Code erkannt! Sie erhalten 50% Rabatt auf das erste Monat! 🎉\n\nWie heißen Sie? 😊';
    conversations[from].push({ role: 'user', content: message });
    conversations[from].push({ role: 'assistant', content: reply });
    const twiml = new twilio.twiml.MessagingResponse();
    twiml.message(reply);
    res.type('text/xml');
    return res.send(twiml.toString());
  }

  conversations[from].push({ role: 'user', content: message });

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      max_tokens: 500,
      temperature: 0.8,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        ...conversations[from]
      ]
    });

    const reply = response.choices[0].message.content;
    conversations[from].push({ role: 'assistant', content: reply });
    clientData[from].isFirst = false;

    // إشعار للمالك - مرة وحدة بس
    if ((reply.includes('meldet sich') || reply.includes('24 Stunden')) && !clientData[from].notified) {
      clientData[from].notified = true;
      try {
        const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
        const summary = conversations[from]
          .filter(m => m.role === 'user')
          .map((m, i) => `${i + 1}. ${m.content}`)
          .join('\n');

        await client.messages.create({
          from: process.env.TWILIO_WHATSAPP_NUMBER,
          to: MY_NUMBER,
          body: `🔔 *Neuer Kunde wartet!*\n📱 ${from}\n${clientData[from].hasPartnerCode ? '⭐ START50 Code verwendet!\n' : ''}\n📝 Zusammenfassung:\n${summary}`
        });
      } catch (e) {
        console.error('Benachrichtigungsfehler:', e.message);
      }
    }

    const twiml = new twilio.twiml.MessagingResponse();
    twiml.message(reply);
    res.type('text/xml');
    res.send(twiml.toString());

  } catch (error) {
    console.error('Fehler:', error.message);
    const twiml = new twilio.twiml.MessagingResponse();
    twiml.message('Entschuldigung, ein kurzer Fehler ist aufgetreten. Bitte versuchen Sie es nochmal! 😊');
    res.type('text/xml');
    res.send(twiml.toString());
  }
});

app.get('/', (req, res) => res.send('GastroAI Bot ✅ Online'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ GastroAI Bot شغال على البورت ${PORT}`));