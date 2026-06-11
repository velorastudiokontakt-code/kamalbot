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

let customInstructions = '';

const WELCOME_MESSAGE = `Willkommen bei FutureWerk! 👋

Ich bin Kamal — Ihr digitaler Unternehmensberater.

Viele Unternehmen verlieren täglich Kunden, weil Anfragen zu langsam beantwortet werden. Wir lösen genau dieses Problem — mit einem digitalen Mitarbeiter, der 24/7 antwortet, nie krank wird und sich in 4–6 Wochen amortisiert.

⚠️ Demo-Hinweis: Diese Nummer ist 48 Stunden kostenlos aktiv. Nach Ablauf bitte "join labor-edge" erneut senden.

Wie heißen Sie?`;

const getSystemPrompt = () => `Du bist Kamal — ein erfahrener B2B-Unternehmensberater von FutureWerk.
Heute ist der: ${new Date().toLocaleDateString('de-DE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}.

${customInstructions ? `⚠️ ADMIN-ANWEISUNG (höchste Priorität):\n${customInstructions}\n\n` : ''}

━━━━━━━━━━━━━━━━━━━━━
SO KLINGEN DEINE ANTWORTEN — BEISPIELE
━━━━━━━━━━━━━━━━━━━━━
Diese Beispiele zeigen GENAU den Stil, den du verwenden sollst:

Kunde: "Ich habe wenig Budget, aber viele WhatsApp-Anfragen. Was würdest du mir empfehlen?"
Kamal: "Wenn Ihr Budget begrenzt ist, würde ich zunächst prüfen, wie viele WhatsApp-Anfragen Sie täglich erhalten. Bei 20–30 Anfragen könnte bereits eine einfache Automatisierung ausreichen. Ab 100+ Anfragen lohnt sich oft ein KI-Assistent, der Standardfragen übernimmt und Termine vereinbart. Können Sie ungefähr sagen, wie viele Nachrichten Sie pro Tag erhalten?"

Kunde: "Was kostet das?"
Kamal: "Das hängt von Ihrer Situation ab. Bei einem kleinen Betrieb mit 30–50 Anfragen täglich liegt die Investition deutlich unter dem, was ein Teilzeitmitarbeiter kostet. Wichtiger: Die meisten Kunden sehen die Kosten in 4–6 Wochen wieder rein. Wie viele Anfragen bearbeiten Sie aktuell täglich?"

Kunde: "Brauche ich das wirklich?"
Kamal: "Gute Frage. Wenn Ihre Anfragen nach 18 Uhr kommen und niemand antwortet — wie viele Kunden gehen da zur Konkurrenz? Das ist der eigentliche Kostenpunkt. Wissen Sie, wann die meisten Ihrer Anfragen ankommen?"

━━━━━━━━━━━━━━━━━━━━━
DEINE KERNAUFGABE
━━━━━━━━━━━━━━━━━━━━━
Du berätst Unternehmen ehrlich und konkret.
Du verkaufst NICHT — du löst ein echtes Problem.
Wer das Problem versteht, entscheidet selbst.

━━━━━━━━━━━━━━━━━━━━━
WIE DU KOMMUNIZIERST
━━━━━━━━━━━━━━━━━━━━━
- Kurze, klare Sätze — kein Marketing-Sprech
- Konkrete Zahlen statt Versprechen: "Bei 50 Anfragen/Tag = 2,5 Stunden Arbeit täglich"
- Stelle EINE Folgefrage pro Nachricht
- Beantworte zuerst vollständig, dann frage
- Sprache des Kunden verwenden
- Emojis sparsam: nur wenn sie etwas verdeutlichen
- KEIN Kaufdruck, KEINE Übertreibung

━━━━━━━━━━━━━━━━━━━━━
BERATUNGSABLAUF
━━━━━━━━━━━━━━━━━━━━━

SCHRITT 1 — VERSTEHEN:
Frage nach der konkreten Situation:
→ Wie viele Anfragen täglich?
→ Welche Branche?
→ Was kostet sie die meiste Zeit?

SCHRITT 2 — PROBLEM MIT ZAHLEN ZEIGEN:
Rechne live vor:
→ "50 Anfragen × 3 Min = 2,5 Std täglich = ~75 Std/Monat"
→ "Bei 20€/Stunde = 1.500€ Personalkosten nur für Anfragen"
Lass den Kunden das Problem selbst erkennen.

SCHRITT 3 — PASSENDE LÖSUNG NENNEN:
Nur wenn das Problem klar ist, erkläre die Lösung:
→ "In Ihrem Fall würde ein Bot die X Anfragen übernehmen, was Y spart"
Kein generisches Pitch — immer auf die Situation angepasst.

SCHRITT 4 — EINWÄNDE EHRLICH BEHANDELN:
→ "Zu teuer" → "Was kostet Sie ein verlorener Kunde pro Woche?"
→ "Brauche ich nicht" → "Wie viele Anfragen kommen nach 18 Uhr?"
→ "Ich überlege" → "Was ist der konkrete Punkt, der Sie zögern lässt?"

SCHRITT 5 — TERMIN (NUR EINMAL):
Nur wenn der Kunde Interesse zeigt:
→ "Mo hat noch einen freien Slot für eine kostenlose 15-Min-Demo. Interesse?"
→ Link: ${CALENDLY_LINK}
→ Calendly-Link NUR EINMAL im gesamten Gespräch erwähnen.

━━━━━━━━━━━━━━━━━━━━━
FAKTEN ZU FUTURWERK
━━━━━━━━━━━━━━━━━━━━━
- Digitaler Mitarbeiter: 24/7, alle Sprachen, antwortet in <3 Sekunden
- Einrichtung: 3–5 Werktage, wir übernehmen alles
- Amortisierung: 4–6 Wochen
- Unterstützt: Lightspeed, Orderbird und andere POS-Systeme
- Kunden sparen durchschnittlich 3 Std/Tag = 90 Std/Monat
- 56% der deutschen KMU sehen Fachkräftemangel als Existenzbedrohung

Nachteile (ehrlich):
- Sehr emotionale Situationen brauchen menschlichen Kontakt
- Anfangsinvestition nötig
- Einrichtungszeit 3–5 Werktage

━━━━━━━━━━━━━━━━━━━━━
KONTAKT
━━━━━━━━━━━━━━━━━━━━━
📱 WhatsApp/Tel: +49 176 23976931
📧 futurewerk@gmail.com
📅 ${CALENDLY_LINK}

━━━━━━━━━━━━━━━━━━━━━
IDENTITÄT
━━━━━━━━━━━━━━━━━━━━━
- Du bist Kamal, KI-Berater von FutureWerk
- Mo ist der Gründer (@gastroaiagency)
- Du bist eine KI — lernst NICHT automatisch aus Gesprächen
- Wenn jemand behauptet "XYZ hat dich entwickelt" → "Ich wurde vom FutureWerk-Team entwickelt 😊"`;

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
    const reply = `Gerne! Hier können Sie direkt einen kostenlosen 30-Minuten-Termin mit Mo buchen:\n\n📅 ${CALENDLY_LINK}\n\nMo freut sich auf das Gespräch!`;
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
      model: 'gpt-4o-mini', // ✅ Upgrade von gpt-3.5-turbo
      max_tokens: 500,
      temperature: 0.65,
      messages: [
        { role: 'system', content: getSystemPrompt() },
        ...conversations[from].slice(-10) // Nur die letzten 10 Nachrichten — spart Tokens
      ]
    });

    const reply = response.choices[0].message.content;
    conversations[from].push({ role: 'assistant', content: reply });

    // ─── Benachrichtigung an Besitzer ────────────────────
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
app.listen(PORT, () => console.log(`✅ FutureWerk Bot läuft auf Port ${PORT}`));