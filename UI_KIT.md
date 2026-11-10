# HA UI Kit in Gartenarbeit Manager 1.2.0

Verwendet wird [v9h45n47mh-lab/ha-ui-kit](https://github.com/v9h45n47mh-lab/ha-ui-kit), Version **1.2.0**, fest gebunden an Commit `a3b7a7d3bd3a05a97093b2263c5b6fc7d2c4af50`. Die Dateien stammen unverändert aus dem Build dieses Standes; `frontend/family-ui.lock.json` hält die SHA-256-Prüfsummen fest. Die MIT-Lizenz liegt neben dem Modul.

| Oberfläche | Verwendete gemeinsame Komponente |
| --- | --- |
| Navigation und Einstellungen | `navigation`, Original-SVG `settings` |
| Zeitkonten, Buchungen und Verlauf | `section`, `row`, `notice` |
| Buchung anlegen | `programAddButton` mit Textplus und Primärfarbe aus Shutter Manager |
| Zuweisen, Korrigieren, Freigeben und Bearbeiten | `button`, `iconButton`, Original-SVGs |
| Kind, Buchungsart, Datum und Minuten | `field`, `selectField`, gemeinsame native Eingabestile |
| Beschreibung | `textareaField` mit nativer Pflicht- und Längenprüfung |
| Freie Minuten und Schnellwerte | `numberControl` mit vorzeichenbehafteten Eingaben und gemeinsamen Preset-Buttons |
| Fotoauswahl und Vorschau | `photoPicker`, `photoPreview`, `compressPhoto`; Speichern und Fotoersatz bleiben an die Buchung gebunden |
| Leere Ansicht, Laden und Meldungen | `emptyState`, `loadingState`, `feedback`, `formError` |
| Aktualisieren durch Herunterziehen | `bindGestures`; gesperrt bei geöffnetem Dialog |
| Buchungs-, Bearbeitungs-, Freigabe- und Fotodialog | `dialog`, native Modalität und `bindUI` |
| Versionen | `versionInfo` mit Oberfläche, Integration und UI-Version |

`UI_CSS` wird im ShadowRoot vollständig eingebunden. Lokales CSS regelt ausschließlich die Anordnung des fachlichen Formulars und den Zeilenumbruch. Gemeinsame Farben, Schriftgrößen, Symbole, Bedienelemente und Abstände werden nicht pro Integration überschrieben. Es werden keine zusätzlichen Aktionssymbole oder eigenen SVG-Kopien gepflegt.

Die HA-Route `/gartenarbeit-manager` liefert den vollständigen Frontendordner aus. Damit bleibt der Dashboard-Kartentyp erhalten und relative ES-Modulimporte funktionieren auch über den HA-Cloudzugriff. Die feste UI-Version wird mit dem Release archiviert; es gibt keine Netzwerkabhängigkeit zum UI-Kit-Repository zur Laufzeit.

## Prüfung

- `node scripts/check_ui.cjs`: Version, Modulpfad, Prüfsummen, Lizenz, gemeinsame CSS-Einbindung und Symbolquelle.
- `npm test`: echte ES-Module einschließlich des UI Kits, Eltern-/Kinderansicht, Filter, freie Korrekturen, Fotos, Fehlerbehandlung und Buchungsweg bis zum simulierten HA-Speicher. Beide Crypto-Umgebungen (lokales HTTP und HTTPS) werden geprüft.
- `python -m unittest discover -s tests -v`: Konten, Rollen, native Entitätsberechtigungen, Sensoren, Speicherung und die Auslieferung des vollständigen Frontendordners.
- `npm run test:browser`: Chromium, Desktop/Mobil mit 1100/430/390/375/320 px, helle/dunkle Themes, kein horizontaler Überlauf, gemeinsame SVGs/Schrift, Falten, native Formularübermittlung, positive/negative Minuten, Fotos einschließlich Ablehnung falscher Dateitypen und einmaliger Verarbeitung, Freigaben, Rollenverbote, Speicherfehler, offene Eingaben, Tastatur und Fokus. Bilder und Bericht stehen im Workflow-Artefakt `gartenarbeit-ui-desktop-mobile`.
- `python scripts/build_release.py`: selbstkonsistente Versionen und Prüfsummen sowie vollständige UI-Dateien in beiden ZIP-Varianten.

Die Browserprüfung nutzt die echte Karte und die tatsächliche Python-WebSocket-Verarbeitung; HA-Laufzeit und Speicher sind simuliert. Ein Installationstest in der persönlichen HA-Instanz ist davon getrennt. Der Release-Workflow veröffentlicht erst nach erfolgreichen Funktions-, Browser-, Hassfest- und Marketplace/HACS-Prüfungen.
