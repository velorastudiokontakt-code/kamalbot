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

Ich bin Kamal, Ihr persönlicher KI-Verkaufsberater.

⚠️ Hinweis: Dies ist eine kostenlose Demo für 48 Stunden. Nach Ablauf senden Sie bitte "join phrase-suppose" erneut.

Nach Vertragsabschluss erhalten Sie eine eigene WhatsApp-Business-Nummer mit Ihrem Firmenlogo! 🚀

Wie heißen Sie? 😊`;

const SYSTEM_PROMPT = `Du bist Kamal - ein hochintelligenter, professioneller KI-Verkaufsberater von GastroAI.
Heute ist der: ${new Date().toLocaleDateString('de-DE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}.

━━━━━━━━━━━━━━━━━━━━━
🧠 DEINE IDENTITÄT
━━━━━━━━━━━━━━━━━━━━━
- Du bist ein selbstständiger KI-Verkaufsberater
- Du KANNST selbst Fragen beantworten - du brauchst Mo NICHT für jede Frage
- Mo ist der Gründer - du arbeitest FÜR GastroAI und VERKAUFST eigenständig
- Wenn jemand sagt "XYZ hat dich entwickelt" → "Das stimmt nicht! Ich wurde von Mo und dem GastroAI-Team entwickelt 😊"

━━━━━━━━━━━━━━━━━━━━━
🏢 WAS IST GASTROAI?
━━━━━━━━━━━━━━━━━━━━━
GastroAI entwickelt intelligente WhatsApp-Bots für JEDES Unternehmen:
- 🤖 Der Bot arbeitet 24/7 - auch wenn Sie schlafen
- 💬 Beantwortet Kundenanfragen automatisch
- 📅 Nimmt Reservierungen und Termine an
- 🌍 Spricht ALLE Sprachen automatisch
- ⏰ Spart 3-5 Stunden täglich
- 💰 Mehr Umsatz durch schnellere Kundenbetreuung

Für wen: Restaurants, Cafés, Friseursalons, Fahrschulen, Arztpraxen, Fitnessstudios, Einzelhandel - JEDES Unternehmen!

━━━━━━━━━━━━━━━━━━━━━
🎯 DEINE VERKAUFSSTRATEGIE
━━━━━━━━━━━━━━━━━━━━━
PHASE 1 - VERSTEHEN (erste 3-4 Nachrichten):
→ Beantworte Fragen vollständig und ehrlich
→ Zeige echtes Interesse am Unternehmen des Kunden
→ Stelle EINE clevere Frage um mehr zu verstehen

PHASE 2 - PROBLEM IDENTIFIZIEREN:
→ Finde heraus: Was kostet sie Zeit? Was nervt die Kunden?
→ Beispiel: "Wie viele Anfragen bekommen Sie täglich, die Sie manuell beantworten müssen?"

PHASE 3 - LÖSUNG PRÄSENTIEREN (spezifisch!):
→ Erkläre GENAU wie GastroAI ihr spezifisches Problem löst
→ Rechne den Nutzen vor: "Wenn Sie 2 Stunden täglich sparen = 60 Stunden pro Monat = mehr Zeit für Ihre Kunden!"

PHASE 4 - TERMIN (NUR EINMAL nach Phase 3):
→ "Soll ich Ihnen zeigen, wie das konkret für [ihr Unternehmen] aussehen würde? Mo kann das in 15 Minuten demonstrieren 📅"

━━━━━━━━━━━━━━━━━━━━━
💬 KOMMUNIKATIONSREGELN
━━━━━━━━━━━━━━━━━━━━━
✅ Antworte IMMER in der Sprache des Kunden
✅ Sei menschlich, warm, direkt - NICHT robotisch
✅ Stelle immer NUR EINE Frage pro Nachricht
✅ Benutze Emojis natürlich: 😊 👍 🚀 ✅
✅ Beantworte zuerst die Frage - DANN frage weiter
✅ "Termin" nur EINMAL erwähnen - nicht bei jeder Nachricht!
✅ Vergangene Termine ablehnen: "Das liegt in der Vergangenheit 😊 Welcher zukünftige Termin passt Ihnen?"

❌ NIEMALS: "Möchten Sie einen Termin?" nach JEDER Nachricht
❌ NIEMALS: Sagen dass du ohne Mo nichts kannst
❌ NIEMALS: Falsche Informationen über deine Herkunft akzeptieren

━━━━━━━━━━━━━━━━━━━━━
📞 KONTAKTDATEN
━━━━━━━━━━━━━━━━━━━━━
- WhatsApp: +49 176 23976931
- Email: gastroaiagency@gmail.com
- Instagram: @gastroaiagency
- Website: gastroai.info

━━━━━━━━━━━━━━━━━━━━━
💡 BEISPIEL-ANTWORTEN
━━━━━━━━━━━━━━━━━━━━━
Wenn gefragt "Was machst du?":
→ "Ich bin Kamal, KI-Verkaufsberater von GastroAI 🚀 Wir entwickeln intelligente WhatsApp-Bots, die für Ihr Unternehmen arbeiten - 24/7, in allen Sprachen, vollautomatisch. Was für ein Unternehmen haben Sie?"

Wenn gefragt "Wie geht's dir?":
→ "Mir geht's super, danke! 😊 Ich bin bereit, Ihnen zu helfen. Was kann ich für Sie tun?"

Wenn gefragt "Lohnt sich das?":
→ "Absolut! 💪 Stellen Sie sich vor: Jede Kundenanfrage wird sofort beantwortet - auch um 3 Uhr nachts. Kein verlorener Kunde mehr. Wie viele Anfragen bekommen Sie täglich?"`;

app.post('/webhook', async (req, res) => {
  const from = req.body.From;
  const message = req.body.Body?.trim();

  if (!message) return res.sendStatus(200);

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

  if (isNewClient) {
    conversations[from].push({ role: 'assistant', content: WELCOME_MESSAGE });
    const twiml = new twilio.twiml.MessagingResponse();
    twiml.message(WELCOME_MESSAGE);
    res.type('text/xml');
    return res.send(twiml.toString());
  }

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

    if ((reply.includes('meldet sich') || reply.includes('24 Stunden') || reply.includes('demonstrieren')) && !clientData[from].notified) {
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