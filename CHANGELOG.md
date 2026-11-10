# Änderungen

## 1.0.2

- Buchungsformulare bei lokalem HTTP-Zugriff repariert: Die bisher verwendete Browserfunktion `crypto.randomUUID()` steht dort nicht zur Verfügung und hat das Einrichten der Speicherfunktion unterbrochen.
- Buchungskennungen werden jetzt als UUID v4 mit `crypto.getRandomValues()` erzeugt; das funktioniert lokal über HTTP und über HTTPS/Cloud.
- Arbeitsmeldungen der Kinder, Zuweisungen und freie Elternkorrekturen können dadurch auch beim lokalen Zugriff gespeichert werden.
- Regressionstests prüfen beide Browserumgebungen sowie den gesamten Weg von der Karte über die WebSocket-Verarbeitung bis zum simulierten HA-Speicher, einschließlich Freigaben und erneutem Senden nach verlorener Antwort.

## 1.0.1

- Einstellungssymbol wie bei der Spülmaschine: ausgefülltes Zahnrad mit markiertem Aktivzustand, auch in der Einstellungsansicht.
- Korrekturbuchungen mit freier Eingabe ganzer Minuten von −1440 bis +1440 (außer 0), auch beim Bearbeiten.
- Die Schnellwerte ±5, ±10 und ±15 Minuten bleiben als Schaltflächen verfügbar.
- Positive Korrekturen erhöhen offene Minuten; negative Korrekturen schreiben Minuten gut.

## 1.0.0

- Gartenzeitkonto aus der Haushalts-Site als eigenständige lokale HA-Integration.
- Zuweisungen (5/10/15 min), Korrekturen (±5/10/15 min), eigene Arbeitsmeldungen (1–1440 min).
- Freigabe durch Vera und Manuel mit anpassbaren Minuten und dokumentiertem Freigabezeitpunkt.
- Guthaben bei negativer Restzeit; ausstehende Meldungen wirken sich noch nicht auf das Konto aus.
- Optionale Fotos, Bearbeitung, Änderungsverlauf und getrennte Benutzerrechte.
- Kompakte Dashboard-Karte im Stil des Shutter Managers und Marketplace-Branding.
- Schutz vor doppelten Buchungen und konkurrierenden Änderungen.
