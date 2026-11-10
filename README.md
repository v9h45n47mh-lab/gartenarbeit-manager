<img src="brand/icon.png" alt="Gartenarbeit Manager" width="96" height="96">

# Gartenarbeit Manager

Lokales Gartenzeitkonto für Home Assistant. Übernimmt die Gartenarbeitslogik der Haushalts-Site: Kinder melden ihre Arbeit, Vera und Manuel prüfen die Minuten und geben sie frei. Die responsive Dashboard-Karte verwendet vollständig den gemeinsamen HA UI Kit 1.3.0 auf Basis des Shutter Managers. Symbole, Farben, Schrift, Abstände, Navigation, Einstellungszeilen, Eingaben und Dialoge kommen aus dessen lokal gebundenen Komponenten und respektieren das aktive HA-Theme einschließlich Dunkelmodus.

## Installation über Marketplace

1. In Marketplace unter **Benutzerdefinierte Repositories** dieses Repository hinzufügen:
   `https://github.com/v9h45n47mh-lab/gartenarbeit-manager`
2. Kategorie **Integration** wählen und **Gartenarbeit Manager** installieren.
3. Home Assistant neu starten.
4. Unter **Einstellungen → Geräte & Dienste → Integration hinzufügen** nach **Gartenarbeit Manager** suchen.
5. Vera, Manuel, Maximilian und Paul jeweils ihrem eigenen HA-Benutzer zuordnen.
6. Eine manuelle Karte im gewünschten Dashboard ergänzen:

```yaml
type: custom:gartenarbeit-manager-card
title: Gartenarbeit
```

Die Kartenressource wird automatisch registriert. Falls der Browser die Karte nach der Erstinstallation noch nicht kennt, die HA-App bzw. den Browser einmal vollständig neu laden.

**Manuell:** Das Release-Archiv `Gartenarbeit_Manager_1.3.0.zip` entpacken und `custom_components/gartenarbeit_manager` nach `/config/custom_components/gartenarbeit_manager` kopieren. Danach mit Schritt 3 fortfahren. Mindestens Home Assistant 2026.3 erforderlich.

## Kontoregeln

| Buchung | Wer? | Minuten | Kontowirkung |
| --- | --- | --- | --- |
| Gartenzeit zuweisen | Vera / Manuel | 5, 10 oder 15 | Erhöht offene Minuten sofort |
| Zeitkonto korrigieren | Vera / Manuel | Frei: −1440 bis +1440 ganze Minuten, außer 0; Schnellwerte ±5/10/15 | Positiv erhöht den Rückstand, negativ schreibt gut |
| Gartenarbeit melden | Jeweiliges Kind | 1–1440 ganze Minuten | Wartet auf Freigabe, ändert den Saldo noch nicht |
| Gartenarbeit freigeben | Vera / Manuel | 1–1440 ganze Minuten, anpassbar | Zieht die tatsächlich freigegebenen Minuten ab |

**Saldo = Zuweisungen + Korrekturen − freigegebene Gartenarbeit.** Positive Werte bedeuten offene Gartenminuten. Negative Werte sind Guthaben und bleiben erhalten. Es gibt keinen automatischen Wochen- oder Monatsreset und keine automatische neue Sollzeit.

Jede Buchung enthält ein Datum bis einschließlich heute, eine Beschreibung und optional ein Foto. Meldungen stehen oben. Freigaben zeigen zusätzlich die ursprünglich gemeldeten Minuten, den Freigeber und den Zeitpunkt. Änderungen werden mit dem vorherigen Stand protokolliert.

## Benutzerrechte

| Aktion | Vera / Manuel | Maximilian / Paul |
| --- | --- | --- |
| Zeitkonten und Buchungen sehen | Beide Kinder | Eigenes Zeitkonto |
| Gartenarbeit melden | — | Nur für sich selbst |
| Zuweisung / Korrektur | Ja | — |
| Freigeben und Minuten anpassen | Ja | — |
| Bearbeiten | Alle Buchungen | Eigene Meldungen bis zur Freigabe |
| Fotos ansehen | Beide Kinder | Nur eigene Buchungen |

Kind und Buchungsart bleiben beim Bearbeiten unverändert. Eltern können auch bereits freigegebene Arbeitsminuten bearbeiten; der Saldo wird entsprechend neu berechnet. Eine nachträgliche Änderung wird dokumentiert. Wie in der Site gibt es keinen Löschknopf; Korrekturbuchungen halten das Konto nachvollziehbar.

Die Prüfung findet für **jeden WebSocket-Aufruf im Backend** anhand des angemeldeten HA-Benutzers statt. Ein frei eingegebener Name in der Karte erteilt keine Rechte. HA-Administratoren ohne Familienzuordnung besitzen zur Einrichtung und Wiederherstellung Elternrechte. Ist ein Administrator ausdrücklich einem Kind zugeordnet, gilt die zugeordnete Kinderrolle.

Die Benutzerzuordnung kann ein HA-Administrator unter **Einstellungen → Geräte & Dienste → Gartenarbeit Manager → Konfigurieren** ändern. Jede Person benötigt einen eigenen aktiven HA-Benutzer. Nach Änderungen wird die Integration automatisch neu geladen.

### Access Control

Access Control prüft sowohl die Befehlsfreigabe als auch das konkrete Ziel einer Änderung. **Advanced → Always allow** hebt nur die Befehlssperre auf. Die Meldung **„Request did not say what it would touch“** bedeutet, dass ein Schreibaufruf kein überprüfbares Ziel genannt hat. In Version 1.0.0–1.0.2 reichte die bisher empfohlene Befehlsfreigabe deshalb nicht aus. Ab 1.0.3 nennt jeder Schreibaufruf das tatsächlich betroffene Gartenzeitkonto als HA-Entität; das Backend prüft diese Zuordnung zusätzlich.

Nach dem Update HA neu starten, dann in der jeweiligen Rolle unter **Advanced → Always allow (one pattern per line)** ergänzen bzw. stehen lassen:

```text
gartenarbeit_manager/*
```

Für die Kontoentitäten **Read and control** (Lesen und Bedienen) erlauben. Die Zuordnung zu einem bereits entsprechend freigegebenen **Label genügt**; separate Einzelregeln sind dann nicht erforderlich. Alternativ folgende Entitätsregeln verwenden:

| Rolle | Freizugebende Kontoentität |
| --- | --- |
| Maximilian | `sensor.gartenarbeit_maximilian` |
| Paul | `sensor.gartenarbeit_paul` |
| Vera / Manuel | Beide Kontoentitäten |

Das sind die standardmäßig vergebenen IDs. Die tatsächlichen IDs unter **Einstellungen → Geräte & Dienste → Gartenarbeit Manager → Entitäten** prüfen, falls sie umbenannt wurden oder bereits gleichnamige Entitäten existieren. Die Kontosensoren müssen aktiviert sein. In Kinderrollen nur das eigene Konto freigeben; vorhandene breitere Freigaben entsprechend prüfen, wenn auch der Kontostand des anderen Kindes verborgen bleiben soll. Danach die Rolle speichern und die HA-Oberfläche beim jeweiligen Benutzer vollständig neu laden. Unter dem Zahnrad muss mindestens Version **1.0.3** stehen.

Alternativ die Befehle einzeln erlauben: `gartenarbeit_manager/get`, `/add`, `/update`, `/approve` und `/photo` (jeweils mit vollem Domain-Präfix). Die Familienrollen bleiben zusätzlich wirksam: Kinder können auch mit Bedienberechtigung weder Elternkorrekturen durchführen noch Gartenarbeit freigeben. Bei Kindern kann `/approve` außerdem auf der Access-Control-Ebene gesperrt bleiben.

Die Berechtigung zum Anzeigen oder Bearbeiten des HA-Dashboards wird weiterhin im Dashboard bzw. in Access Control festgelegt. Die beiden Kontosensoren enthalten ausschließlich den Saldo in Minuten: positiv = offen, negativ = Guthaben. Buchungsbeschreibungen, Fotos und Änderungsverlauf erscheinen dort nicht. Außerhalb eingeschränkter Rollen gelten für die Kontosensoren die normalen HA-Entitätsrechte; die Benutzerzuordnung der Karte allein beschränkt diese nativen Sensoren nicht.

### Buchungsformular speichert nicht

In Version 1.0.0 und 1.0.1 konnte beim lokalen Aufruf über HTTP ein Formular erscheinen, dessen Speicherfunktion nicht eingerichtet wurde. Ursache war die nur in sicheren Browserkontexten verfügbare Funktion `crypto.randomUUID()`. Version 1.0.2 verwendet eine auch über HTTP verfügbare UUID-Erzeugung. Nach dem Update Home Assistant neu starten und die HA-Oberfläche auf allen betroffenen Geräten vollständig neu laden. Die korrigierte Karte zeigt unter dem Zahnrad die Version 1.0.2. Bleibt ein Fehler bestehen, den genauen Meldungstext im Formular sowie gegebenenfalls den HA-Protokolleintrag prüfen.

## Bedienung

- **Zeitkonto:** Saldo, Zuweisungen, erledigte Minuten und ausstehende Freigaben. Buchung aufklappen für Details, Foto, Bearbeitung und Änderungsverlauf.
- **Freigaben:** Eltern sehen alle ausstehenden Meldungen. Vor der Freigabe die anrechenbaren Minuten prüfen und bei Bedarf ändern.
- **Zahnrad:** Kontoregeln, Rollen und für Eltern die Aktionen zum Zuweisen und Korrigieren.
- **Korrektur:** Minuten direkt als Zahl eingeben, z. B. `23` für zusätzliche offene Minuten oder `-37` für eine Gutschrift. Die Schnellwerte ±5/10/15 setzen das Zahlenfeld. Auch bestehende Korrekturbuchungen können frei bearbeitet werden.
- Auswahl nach Kind und Status; längere Listen werden in Gruppen von 100 Buchungen angezeigt.
- Aktualisierung alle 15 Sekunden, während die Ansicht sichtbar ist, sowie durch Herunterziehen am Seitenanfang. Offene Eingabeformulare werden dabei nicht überschrieben.

## Fotos und Speicherung

Fotos bleiben innerhalb von Home Assistant. Originaldateien bis 20 MB in JPG, PNG oder WebP werden vor dem Senden im Browser auf maximal 1600 Pixel und unter 1 MB verkleinert. HEIC-Dateien vorher als JPG sichern. Das Backend prüft Format und Dateisignatur. Der Fotozugriff nutzt die authentifizierte HA-Verbindung und dieselbe Rollenprüfung wie die Buchungen.

Konten, Buchungen und Änderungsverlauf werden lokal in der HA-Speicherung gehalten; Fotos liegen in getrennten lokalen Speicherobjekten. Bei einem HA-Backup das Konfigurationsverzeichnis einschließlich `.storage` sichern. Die Integration benötigt weder die Haushalts-Site noch ChatGPT oder weitere Cloud-Zugangsdaten. Der Zugriff über eine bereits eingerichtete Home-Assistant-Cloud-Verbindung nutzt denselben angemeldeten HA-Benutzer.

Gleichzeitige Änderungen werden über Revisionen und eine serverseitige Sperre geschützt. Eine wiederholte Meldung nach einer verlorenen Antwort erzeugt keine zweite Buchung. Neue Kontostände werden erst nach erfolgreicher Speicherung veröffentlicht.

## Übernahme aus der bisherigen Site

Die **Logik** wird übernommen. Vorhandene Site-Buchungen und Fotos werden nicht automatisch nach Home Assistant übertragen; die Integration startet mit einem leeren Zeitkonto. Die bisherige Site und ihre Daten werden durch die Installation nicht geändert.

## Gemeinsamer HA UI Kit

Gartenarbeit Manager 1.3.0 bindet [HA UI Kit 1.3.0](https://github.com/v9h45n47mh-lab/ha-ui-kit/tree/c0eba2a4b4cb99e71ffd8fe3ad78fea39e402513) fest unter `frontend/family-ui/1.3.0/` ein. Die Lock-Datei enthält die Prüfsummen; JavaScript, CSS, Manifest und Lizenz werden mit jeder Installation ausgeliefert. Die HA-Route liefert den gesamten Frontendordner für die relativen Modulimporte aus. Es gibt keinen automatischen Bezug von main/latest und keinen externen Laufzeitaufruf.

Unter dem Zahnrad zeigt die Versionszeile Oberfläche, Integration und UI-Version. Nach dem Update HA neu starten und die Oberfläche vollständig neu laden: Erwartet werden **Oberfläche 1.3.0**, **Integration 1.3.0** und **UI 1.3.0**. Alle Gestaltungsregeln kommen unverändert aus dem Kit; es gibt keine lokalen CSS-Überschreibungen. Die technische Zuordnung und der direkte Stilvergleich stehen in [UI_KIT.md](UI_KIT.md).

## Marketplace-Logo

Das Blatt mit Zeituhr liegt als transparentes PNG in 256 und 512 Pixeln einschließlich Dark-Varianten sowohl unter `brand/` als auch unter `custom_components/gartenarbeit_manager/brand/`. Damit sind die Branding-Dateien für HA und Marketplace enthalten. Das Hinzufügen als benutzerdefiniertes Repository ist möglich; eine Aufnahme in den allgemeinen Marketplace-Katalog ist ein separater Vorgang.

## Entwicklung und Prüfung

```bash
python -m unittest discover -s tests -v
npm install --ignore-scripts
npm test
node --input-type=module --check < custom_components/gartenarbeit_manager/frontend/card.js
npx playwright install --with-deps chromium
npm run test:browser
python scripts/build_release.py
```

Die Tests prüfen Kontorechnung, Rollen und Sichtbarkeit, Freigaben, Bearbeitung, Wiederholungsversuche, parallele Änderungen, Fotozugriff, Speicherfehler und die tatsächliche Kartenlogik im DOM. Die Adaptertests verwenden einen simulierten HA-Speicher; sie ersetzen keinen Installationstest auf einer laufenden HA-Instanz. GitHub prüft zusätzlich mit Hassfest und der Marketplace/HACS-Validierung. Veröffentlichung und Release-Archive erfolgen erst nach erfolgreichen CI-Prüfungen.

MIT-Lizenz.

## Zeitkonten und letzte Buchungen

Die Kontokacheln stehen immer zu zweit nebeneinander und sind quadratisch. Name oben links, aktueller Stand groß in der Mitte. Ein einzelnes eigenes Konto bleibt halbbreit. Ausstehende Minuten erscheinen als Hinweis; die vollständige Kontozusammensetzung ist als Tooltip und zugängliche Beschreibung enthalten.

„Buchungen“ unter der Trennlinie ist zunächst zugeklappt. Nach dem Aufklappen werden die zehn neuesten Buchungen angezeigt, die zu den gewählten Filtern passen, sortiert nach Erfassungszeit. Ältere Buchungen werden dadurch nicht gelöscht. „Freigaben“ enthält unabhängig davon alle noch offenen Meldungen.
