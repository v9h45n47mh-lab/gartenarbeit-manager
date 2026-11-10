# HA UI Kit in Gartenarbeit Manager 1.3.0

Verwendet wird [v9h45n47mh-lab/ha-ui-kit](https://github.com/v9h45n47mh-lab/ha-ui-kit), Version **1.3.0**, fest gebunden an Commit `c0eba2a4b4cb99e71ffd8fe3ad78fea39e402513`. Die Dateien stammen unverändert aus dem Build dieses Standes; `frontend/family-ui.lock.json` hält die SHA-256-Prüfsummen fest. Die MIT-Lizenz liegt neben dem Modul.

| Oberfläche | Verwendete gemeinsame Komponente |
| --- | --- |
| Navigation und Einstellungen | `navigation`, Original-SVG `settings` |
| Zeitkonten | `accountTiles`, `accountTile`: zwei quadratische halbe Breiten, auch mobil |
| Auf-/zuklappbarer Buchungsbereich | `section`, gespeicherter Klappzustand; höchstens zehn neueste passende Buchungen |
| Buchungslisten und Änderungsverlauf | `section`, `row`, `historyList`, `counter`, `notice` |
| Buchung anlegen | `programAddButton` mit Textplus und Primärfarbe aus Shutter Manager |
| Zuweisen, Korrigieren, Freigeben und Bearbeiten | `button`, `iconButton`, Original-SVGs |
| Kind, Buchungsart, Datum und Minuten | `field`, `selectField`, gemeinsame native Eingabestile |
| Beschreibung | `textareaField` mit nativer Pflicht- und Längenprüfung |
| Freie Minuten und Schnellwerte | `numberControl` mit vorzeichenbehafteten Eingaben und gemeinsamen Preset-Buttons |
| Fotoauswahl und Vorschau | `photoPicker`, `photoPreview`, `compressPhoto`; Speichern und Fotoersatz bleiben an die Buchung gebunden |
| Leere Ansicht, Laden und Meldungen | `emptyState`, `loadingState`, `feedback`, `formError` |
| Aktualisieren durch Herunterziehen | `bindGestures`; gesperrt bei geöffnetem Dialog |
| Buchungs-, Bearbeitungs- und Freigabedialog | `dialog`, native Modalität und `bindUI` |
| Foto-Großansicht | `photoDialog`; der offene native Dialog bleibt beim asynchronen Laden bestehen |
| Formulareinteilung | Unveränderte Kit-Klassen `grid` und `full` |
| Versionen | `versionInfo` mit Oberfläche, Integration und UI-Version |

`UI_CSS` ist die einzige CSS-Quelle im ShadowRoot. Es gibt keine lokalen Regeln, Inline-Stile oder Überschreibungen für Schrift, Farben, Einrückungen, Abstände, Symbole oder Bedienelemente. Das Formular verwendet das gemeinsame Raster. Fachliche Texte, Rollenentscheidungen und Buchungswerte bleiben in der Integration. Zusätzliche Klassen und Datenattribute dienen nur der Auswahl von Elementen und erhalten keine eigene Gestaltung.

Die HA-Route `/gartenarbeit-manager` liefert den vollständigen Frontendordner aus. Damit bleibt der Dashboard-Kartentyp erhalten und relative ES-Modulimporte funktionieren auch über den HA-Cloudzugriff. Die feste UI-Version wird mit dem Release archiviert; es gibt keine Netzwerkabhängigkeit zum UI-Kit-Repository zur Laufzeit.

## Prüfung

- `node scripts/check_ui.cjs`: Version, Modulpfad, Prüfsummen, Lizenz, alleinige unveränderte CSS-Einbindung, keine lokalen Gestaltungsregeln und gemeinsame Komponenten/Symbole.
- `npm test`: echte ES-Module einschließlich des UI Kits, Eltern-/Kinderansicht, Filter, freie Korrekturen, Fotos, Fehlerbehandlung und Buchungsweg bis zum simulierten HA-Speicher. Beide Crypto-Umgebungen (lokales HTTP und HTTPS) werden geprüft.
- `python -m unittest discover -s tests -v`: Konten, Rollen, native Entitätsberechtigungen, Sensoren, Speicherung und die Auslieferung des vollständigen Frontendordners.
- `npm run test:browser`: Chromium, Desktop/Mobil mit 1100/430/390/375/320 px, helle/dunkle Themes, kein horizontaler Überlauf, gemeinsame SVGs/Schrift, Falten, native Formularübermittlung, positive/negative Minuten, Fotos einschließlich Ablehnung falscher Dateitypen und einmaliger Verarbeitung, Freigaben, Rollenverbote, Speicherfehler, offene Eingaben, Tastatur und Fokus. Bilder und Bericht stehen im Workflow-Artefakt `gartenarbeit-ui-desktop-mobile`.
- `tests/ui_parity.cjs` rendert die Originalkomponenten separat im gleichen Browser und Theme. Buchungslisten werden in allen fünf Breiten, Korrekturformulare und Foto-Großansicht bei 1100/390/320 px sowie Meldungsformular/Fotovorschau bei 1100/320 px jeweils hell/dunkel verglichen: Schriftfamilie, -größe und -stärke, Zeilenhöhe, Farben, Innen-/Außenabstände, Rasterabstände, Einrückung und SVG-Füllung/-Strich. Die Großansicht prüft zusätzlich Escape und Fokusrückgabe. Die Testreferenz ist kein Teil der ausgelieferten Karte.
- `python scripts/build_release.py`: selbstkonsistente Versionen und Prüfsummen sowie vollständige UI-Dateien in beiden ZIP-Varianten.

Die Browserprüfung nutzt die echte Karte und die tatsächliche Python-WebSocket-Verarbeitung; HA-Laufzeit und Speicher sind simuliert. Ein Installationstest in der persönlichen HA-Instanz ist davon getrennt. Der Release-Workflow veröffentlicht erst nach erfolgreichen Funktions-, Browser-, Hassfest- und Marketplace/HACS-Prüfungen.

Die Kacheln werden zusätzlich auf quadratische Geometrie, gleiche halbe Breiten und eine gemeinsame Zeile bei allen fünf Bildschirmbreiten geprüft. Der Stilabgleich schließt Kachelraster, Namens-/Wert-/Einheiten- und Hinweistexte ein. Die App-Tests prüfen Standardzustand und Erhalt des Buchungs-Klappzustands, zehn neueste Einträge nach Erfassungszeit, Filter, unveränderte Datenmenge und alle offenen Freigaben.
