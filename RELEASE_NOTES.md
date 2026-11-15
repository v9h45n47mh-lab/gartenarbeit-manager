# Gartenarbeit Manager 1.4.0

Rollenrechte: eigenes Zeitkonto/Buchungen und Verwaltung aller Konten/Freigaben. Familienmitglied-Zuordnungen und Buchungseigentum bleiben erhalten. Neue Rollenrechte greifen auch nach einem Rechteentzug.

Berechtigungen werden jetzt in **Family Access → Anwendung → Rolle** verwaltet. Benutzer können mehrere Rollen erhalten; ihre Freigaben ergänzen sich. Vorhandene Anwendungsrechte werden einmalig in Rollen mit dem Zusatz „übernommen“ importiert und den bisherigen Benutzern zugeordnet. Dashboardfreigaben und die Aktivierung der Dashboardnavigation werden dadurch nicht verändert.

Zum Entziehen eines Rechts alle zugewiesenen Rollen einschließlich übernommener Rollen prüfen. Neue Benutzer erhalten nach der Übernahme keine automatischen Anwendungsrechte. Echte HA-Administratoren behalten Vollzugriff zur Wiederherstellung. Geräte-, Eigentümer- und externe Kontoberechtigungen gelten zusätzlich; eine Rolle erzeugt keine HA-Administratorrechte.

**Aktualisierung:** zuerst Family Access Manager 1.1.0 oder neuer, danach die beteiligten Anwendungen aktualisieren und Home Assistant neu starten. Solange Family Access nicht eingerichtet ist, bleibt die bisherige Rechtevergabe erhalten. Ist Family Access eingerichtet, aber nicht verfügbar oder zu alt, werden Anwendungsaktionen für normale Benutzer abgelehnt. Lokale Benutzer-/Personen-, Geräte- und Musikkontozuordnungen bleiben für Identität und Eigentum erhalten; Rechte werden zentral vergeben.
