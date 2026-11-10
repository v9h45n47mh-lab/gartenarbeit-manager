# Änderungen

## 1.3.1

- HA UI Kit 1.3.1 übernimmt die exakte Zentrierung: Beide Kontostände stehen unabhängig von einem ausstehenden Hinweis auf derselben Mittellinie.
- Quadratische halbe Breiten, zwei Kacheln nebeneinander auch mobil, Name oben links und großer mittiger Stand. Hinweistext bleibt am unteren Rand; vollständiger Text bleibt zugänglich.
- Zuklappbarer Buchungsbereich mit höchstens zehn neuesten passenden Einträgen, gespeicherter Klappzustand und sämtliche offenen Freigaben bleiben erhalten.
- Keine lokalen CSS-Regeln; Berechtigungen, Korrekturbuchungen, Fotos und gespeicherte Buchungsdaten unverändert. Desktop/Mobil und beide Themes geprüft.

## 1.3.0

- Aktuelle Zeitkonten als gemeinsame quadratische Kontokacheln aus HA UI Kit 1.3.0: Name oben links, großer mittiger Stand mit Einheit und Guthaben-/Offen-Status.
- Zwei gleich breite Kacheln nebeneinander, ausdrücklich auch auf dem Handy. Kinder sehen weiterhin ausschließlich ihr eigenes Konto; die eigene Kachel bleibt halbbreit.
- Bereich „Buchungen“ unter der Trennlinie standardmäßig zugeklappt. Filter und Buchungen werden gemeinsam auf-/zugeklappt; der Klappzustand bleibt bei Aktualisierung und Filterwechsel erhalten.
- Geöffnet werden nur die zehn neuesten passenden Buchungen nach Erfassungszeit gezeigt. Ältere Datensätze bleiben gespeichert. Im Tab „Freigaben“ bleiben sämtliche offenen Meldungen erreichbar.
- Vollständige Kontozusammensetzung bleibt als zugängliche Beschreibung und Tooltip der Kachel verfügbar; noch nicht freigegebene Minuten erscheinen zusätzlich als Hinweis.
- Buchungen, freie Korrekturen, Fotos, Freigaben und Konto-/Label-Berechtigungen erhalten. Desktop/Mobil, helle/dunkle Themes, Kachelgeometrie, Listenbegrenzung und Klappzustände werden geprüft.

## 1.2.1

- Gestaltung vollständig aus HA UI Kit 1.2.1: Alle lokalen CSS-Regeln entfernt. Formularraster, Schrift, Farben, Abstände, Einrückungen und Symbole kommen unverändert aus dem Kit.
- Buchungslisten und Änderungsverlauf verwenden gemeinsame Abschnitte, Zeilen, Verlaufslisten, Zähler und Kontostatus. Bestehende Filter und aufklappbare Buchungsdetails bleiben erhalten.
- Foto-Großansicht auf den gemeinsamen `photoDialog` umgestellt; Fotoauswahl, Vorschau, Verkleinerung und Buchungsdialoge verwenden ebenfalls die gemeinsamen Komponenten.
- Direkter Vergleich der berechneten Schrift-, Farb-, Abstands- und Symbolstile mit unberührten Referenzkomponenten in Desktop-/Mobilansichten und hellen/dunklen Themes ergänzt. Buchungslisten, Korrekturformulare, Fotovorschau und Großansicht werden ausdrücklich geprüft.
- Buchungen, freie positive/negative Korrekturen, Freigaben, Fotos, Rollen und native Konto-/Label-Berechtigungen beibehalten.

## 1.2.0

- HA UI Kit 1.2.0 aus dem gemeinsamen Repository fest eingebunden, einschließlich aktueller Symbole, Farben, Schriften, Abstände und Buttonvarianten.
- Beschreibung, freie Minuten mit Schnellwerten, Fotoauswahl, Fotovorschau und Bildverkleinerung nutzen jetzt die gemeinsamen Komponenten. Lokale Kopien der Fotostile und Bildverarbeitung entfallen.
- Gemeinsame Lade-, Leer-, Erfolgs- und Fehlermeldungen sowie Herunterziehen zum Aktualisieren übernommen.
- Buchungen, freie positive/negative Korrekturen, Fotos, Freigaben, Benutzerrollen und bestehende Sensor-/Label-Berechtigungen bleiben erhalten.
- Desktop/Mobil (1100/430/390/375/320 px), helle/dunkle Themes, Formularübermittlung, Fotos und Rollen werden vor der Veröffentlichung geprüft.

## 1.1.1

- Aktuellen HA UI Kit 1.1.0 aus dem gemeinsamen Repository fest eingebunden; Modulpfad, Prüfsummen und Lizenz geprüft.
- „+ Buchung“ bzw. „+ Gartenarbeit“ verwendet jetzt den gemeinsamen Primär-Plusbutton aus dem Shutter Manager mit Textplus statt eines separaten SVG-Plus.
- Gemeinsame Symbole, Farben, Schrift und Abstände stammen aus dem neuen UI-Kit-Stand. Fachlogik und vorhandene Familien-/Entitätsberechtigungen bleiben erhalten.
- Desktop/Mobil, helle/dunkle Themes, Buchungen, freie Korrekturen, Fotos und Freigaben werden vor der Veröffentlichung erneut geprüft.

## 1.1.0

- Gesamte Oberfläche auf den gemeinsamen HA UI Kit 1.0.0 umgestellt: Navigation, Original-SVGs, Farben, Schrift, Abstände, Zeitkonto- und Buchungszeilen, Einstellungen, Filter, Eingaben und Dialoge.
- Einheitliches Shutter-Manager-Zahnrad mit neutralem und ausgewähltem Zustand; Versionsanzeige für Oberfläche, Integration und UI Kit.
- Feste lokale Modulversion mit Prüfsummen und Lizenz; vollständige Frontend-Auslieferung einschließlich aller Unterverzeichnisse und Kontrolle des Release-Inhalts.
- Buchungslogik, freie Korrekturen, Freigaben, Fotos, Änderungsverlauf und die serverseitigen Familien- und Entitätsberechtigungen beibehalten.
- Bestehende Label-Freigaben der Konto-Sensoren werden weiter verwendet; die Anleitung dokumentiert diese bestätigte Variante.
- Browserprüfung für Desktop und Mobilgeräte (1100/430/390/375/320 px), helle und dunkle Themes, echte Formularübermittlung, Fotos, Eingabenerhalt, Tastatur und Fokus. Die Veröffentlichung wartet auf diese Prüfungen sowie Hassfest und Marketplace/HACS.

## 1.0.3

- Access-Control-Kompatibilität: Jede Buchung, Bearbeitung und Freigabe benennt die tatsächlich betroffene Kontoentität als `entity_id`.
- Zwei echte Kontosensoren zeigen die offenen Minuten bzw. das Guthaben; standardmäßig `sensor.gartenarbeit_maximilian` und `sensor.gartenarbeit_paul`. Die Karte verwendet stets die tatsächlichen IDs, auch nach einer Umbenennung.
- Das Backend prüft die Zuordnung des Ziels zum betroffenen Konto und die HA-Bedienberechtigung. Ein fremdes oder nur vorgetäuschtes Ziel wird abgewiesen; die Familienrollen bleiben zusätzlich wirksam.
- Access-Control-Anleitung ergänzt: `gartenarbeit_manager/*` unter Advanced → Always allow und „Read and control“ für das jeweilige Konto. Die Befehlsfreigabe allein hebt die zusätzliche Zielprüfung nicht auf.
- Kontosensoren aktualisieren sich nach erfolgreicher Speicherung. Beschreibungen, Fotos und Buchungsdetails stehen nicht in den Sensorattributen.

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
