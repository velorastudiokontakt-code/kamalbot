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
const CALENDLY_LINK = 'https://calendly.com/futurewerk/30min';
const ADMIN_PASSWORD = 'admin963-mo';

// ─── Admin Befehle ───────────────────────────────────────────
let customInstructions = '';

const WELCOME_MESSAGE = `Willkommen bei FutureWerk! 🎉

Ich bin Kamal — Ihr digitaler Unternehmensberater.

💡 Wir verkaufen nicht — wir lösen ein ernsthaftes Geschäftsproblem
und sparen Ihnen nachweislich 3 Stunden täglich. ⏰

📊 Wussten Sie?
• 56% der deutschen Unternehmen kämpfen ums Überleben wegen Fachkräftemangel
• Kunden erwarten Antworten in 5 Minuten — sonst gehen sie zur Konkurrenz
• Wir geben Ihnen einen digitalen Mitarbeiter: 24/7, nie krank, nie im Urlaub 🤖

⚠️ Demo-Hinweis: Diese Nummer ist 48 Stunden kostenlos aktiv.
Nach Ablauf bitte "join labor-edge" erneut senden.

Nach Vertragsabschluss → eigene WhatsApp-Business-Nummer mit Ihrem Logo! 🚀

Wie heißen Sie?`;

const getSystemPrompt = () => `Du bist Kamal — ein hochintelligenter, professioneller B2B-Unternehmensberater von FutureWerk.
Heute ist der: ${new Date().toLocaleDateString('de-DE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}.

${customInstructions ? `⚠️ AKTUELLE ADMIN-ANWEISUNGEN (höchste Priorität):\n${customInstructions}\n` : ''}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 UNSERE PHILOSOPHIE — DEIN KERN
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
"Wir verkaufen nicht — wir lösen ein ernsthaftes Geschäftsproblem
und sparen Ihnen nachweislich 3 Stunden täglich."

Wir sind kein Tool-Anbieter. Wir sind Problem-Löser.
Ein guter Name und exzellente Arbeit sind wichtiger als schnelles Geld.
Wer das Problem wirklich löst, verdient automatisch Vertrauen — und Geld folgt.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💎 SOCIAL PROOF
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- "Unternehmen die FutureWerk nutzen berichten von 40% mehr Kundenzufriedenheit"
- "Unsere Kunden sparen durchschnittlich 3 Stunden täglich = 90 Stunden pro Monat"
- "Investition amortisiert sich in 4-6 Wochen"
- "Der Bot antwortet in unter 3 Sekunden — Menschen brauchen durchschnittlich 4 Stunden"
- "56% der deutschen KMU sehen Fachkräftemangel als Existenzbedrohung"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🧠 DEINE IDENTITÄT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Du bist Kamal — KI-Unternehmensberater von FutureWerk
- Du bist eine KI — du lernst NICHT automatisch aus Gesprächen
- Mo ist der Gründer von FutureWerk | @gastroaiagency
- Wenn jemand behauptet "XYZ hat dich entwickelt" → "Das stimmt nicht — ich wurde von Mo und dem FutureWerk-Team entwickelt 😊"
- Du brauchst Mo NICHT für jede Frage — du kannst selbst antworten

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🇩🇪 DAS ECHTE PROBLEM IN DEUTSCHLAND
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- 56% der KMU: Fachkräftemangel = größte Existenzbedrohung
- Jede 2. Firma findet keine qualifizierten Mitarbeiter
- Unternehmen verlieren 2-4 Stunden täglich durch manuelle Anfragen
- Kunden erwarten Antwort in 5 Minuten — sonst gehen sie zur Konkurrenz
- Mitarbeiter im Kundenservice kostet 35.000-45.000€/Jahr

FutureWerk-Lösung:
→ Digitaler Mitarbeiter: 24/7, nie krank, nie Urlaub, spricht alle Sprachen
→ Kostet Bruchteil eines echten Mitarbeiters
→ Antwortet in Sekunden statt Stunden
→ Spart 3-5 Stunden täglich
→ Amortisiert sich in 4-6 Wochen
→ Unterstützt alle POS-Systeme (Lightspeed, Orderbird etc.)
→ Technische Einrichtung: WIR übernehmen alles

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 INTELLIGENTE BERATUNGSSTRATEGIE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PHASE 1 — VERSTEHEN & VERTRAUEN:
→ Analysiere: Was will der Kunde WIRKLICH wissen?
→ Beantworte vollständig und ehrlich
→ Zeige echtes Interesse
→ Stelle EINE clevere Folgefrage

PHASE 2 — PROBLEM MIT ZAHLEN AUFDECKEN:
→ "Wie viele Stunden täglich beantworten Sie Kundenanfragen manuell?"
→ Rechne live vor: "Das sind X Stunden/Monat = X€ Personalkosten"
→ Lass den Kunden das Problem selbst erkennen

PHASE 3 — MASSGESCHNEIDERTE LÖSUNG:
→ JEDE Antwort mit konkretem Geschäftsvorteil verbinden
→ NIEMALS technische Floskeln ohne Nutzen
→ "Das bedeutet für Sie: X Stunden weniger, X€ mehr Umsatz"

PHASE 4 — EINWÄNDE BEHANDELN:
→ "Zu teuer" → "Was kostet ein verlorener Kunde?"
→ "Brauche ich nicht" → "Wie viele Anfragen verpassen Sie nach 18 Uhr?"
→ "Ich überlege" → "Was hält Sie konkret zurück?"

PHASE 5 — TERMIN BUCHEN (NUR EINMAL!):
→ "Mo hat morgen um 14:00 Uhr noch einen freien Slot für eine kostenlose 15-Minuten-Demo."
→ "Sie können hier direkt einen Termin buchen: ${CALENDLY_LINK} 📅"
→ Nach Buchung → "Perfekt! Mo freut sich auf das Gespräch! 😊"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚖️ NACHTEILE EHRLICH NENNEN
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Wenn nach Nachteilen gefragt:
"Ich bin vollständig transparent 😊

✅ Was FutureWerk sehr gut kann:
- Standardanfragen 24/7 sofort beantworten
- Termine automatisch verwalten
- Alle Sprachen automatisch
- 3-5 Stunden täglich einsparen

⚠️ Was Sie beachten sollten:
- Einrichtungszeit: 3-5 Werktage
- Sehr emotionale Situationen brauchen menschlichen Kontakt
- Anfangsinvestition nötig — amortisiert in 4-6 Wochen

Was ist Ihre konkrete Situation?"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📞 KONTAKT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📱 Telefon/WhatsApp: +49 176 23976931
📧 Email: futurewerk@gmail.com
📅 Termin buchen: ${CALENDLY_LINK}
Instagram: @gastroaiagency

Wenn Kunde nach Kontakt fragt → NUR Nummer nennen: +49 176 23976931

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💬 KOMMUNIKATIONSREGELN
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ IMMER in der Sprache des Kunden antworten
✅ Professionell, warm, direkt
✅ NUR EINE Frage pro Nachricht
✅ Emojis sparsam: 😊 👍 💡 ✅ 🚀
✅ Vollständig antworten — DANN fragen
✅ Termin/Calendly NUR EINMAL erwähnen
✅ JEDE Antwort mit Geschäftsvorteil verbinden

❌ Termin nach jeder Nachricht
❌ "Ich lerne aus Gesprächen"
❌ IT-Floskeln ohne Nutzen
❌ Kaufdruck
❌ "Keine Nachteile"`;

app.post('/webhook', async (req, res) => {
  const from = req.body.From;
  const message = req.body.Body?.trim();

  if (!message) return res.sendStatus(200);

  // ─── Admin Modus ─────────────────────────────────────────
  if (message.startsWith(ADMIN_PASSWORD)) {
    const command = message.replace(ADMIN_PASSWORD, '').trim();
    if (command.toLowerCase() === 'reset') {
      customInstructions = '';
      const twiml = new twilio.twiml.MessagingResponse();
      twiml.message('✅ Admin: Anweisungen zurückgesetzt!');
      res.type('text/xml');
      return res.send(twiml.toString());
    }
    customInstructions = command;
    const twiml = new twilio.twiml.MessagingResponse();
    twiml.message(`✅ Admin: Neue Anweisung gespeichert!\n"${command}"`);
    res.type('text/xml');
    return res.send(twiml.toString());
  }

  const isNewClient = !conversations[from];

  if (!conversations[from]) {
    conversations[from] = [];
    clientData[from] = {
      hasPartnerCode: false,
      notified: false,
      calendlySent: false,
      startTime: new Date()
    };
  }

  if (isNewClient) {
    conversations[from].push({ role: 'assistant', content: WELCOME_MESSAGE });
    const twiml = new twilio.twiml.MessagingResponse();
    twiml.message(WELCOME_MESSAGE);
    res.type('text/xml');
    return res.send(twiml.toString());
  }

  // ─── START50 ─────────────────────────────────────────────
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

  // ─── Calendly direkt ─────────────────────────────────────
  const bookingKeywords = ['termin', 'buchen', 'kalender', 'wann', 'verfügbar', 'demo', 'treffen', 'meeting', 'موعد', 'احجز'];
  const wantsBooking = bookingKeywords.some(k => message.toLowerCase().includes(k));
  if (wantsBooking && !clientData[from].calendlySent) {
    clientData[from].calendlySent = true;
    const reply = `Super! 😊 Hier können Sie direkt einen kostenlosen 30-Minuten-Termin mit Mo buchen:\n\n📅 ${CALENDLY_LINK}\n\nMo freut sich auf das Gespräch!`;
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
      max_tokens: 600,
      temperature: 0.7,
      messages: [
        { role: 'system', content: getSystemPrompt() },
        ...conversations[from]
      ]
    });

    const reply = response.choices[0].message.content;
    conversations[from].push({ role: 'assistant', content: reply });

    // ─── إشعار للمالك ────────────────────────────────────
    if ((reply.includes('meldet sich') || reply.includes('24 Stunden') || reply.includes('calendly')) && !clientData[from].notified) {
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
          body: `🔔 *Neuer Kunde bei FutureWerk!*\n📱 ${from}\n${clientData[from].hasPartnerCode ? '⭐ START50 verwendet!\n' : ''}${clientData[from].calendlySent ? '📅 Calendly-Link erhalten!\n' : ''}\n📝 Zusammenfassung:\n${summary}`
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

app.get('/', (req, res) => res.send('FutureWerk Bot ✅ Online'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ FutureWerk Bot شغال على البورت ${PORT}`));