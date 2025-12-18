# 🤖 Zanobot AI Assistant

**Progressive Web App für akustische Maschinenüberwachung**

Zanobot ist eine moderne PWA, die ThiXX-OTH's elegantes UI-Framework mit der industriellen Funktionalität von Zanobo (Acoustic Machine Monitoring) verbindet.

---

## ✨ Features

### Kernfunktionen
- 📷 **QR-Code-Scanning** - Schnelle Maschinenidentifikation via Barcode
- 🎤 **Audio-Fingerprinting** - 10-Sekunden Referenzaufnahmen
- 🔬 **Live-Diagnose** - Echtzeit-Analyse des Maschinenzustands
- 📊 **Spektralanalyse** - Frequenz- und Varianzanalyse
- 📱 **Offline-fähig** - Vollständige Funktionalität ohne Internet

### UI/UX
- 🌗 **Drei-Theme-System** - Dark, Light, Brand (Zanobot Cyan/Teal)
- ✨ **Glasmorphismus** - Moderne Backdrop-Filter-Effekte
- 📱 **Mobile-First** - Optimiert für Touch-Bedienung
- ♿ **Accessibility** - WCAG-konform, Keyboard-Navigation
- 🎨 **Industrial High-End Design** - Professionelle Ästhetik

---

## 🏗️ Projektstruktur

```
zanobot-pwa/
├── index.html              # Haupt-HTML-Datei
├── manifest.json           # PWA Manifest
├── service-worker.js       # Service Worker für Offline-Support
├── config.json             # App-Konfiguration & Branding
├── css/
│   └── style.css          # Haupt-Stylesheet (Glassmorphism, Themes)
├── js/
│   ├── theme-bootstrap.js # Theme-System (lädt vor Render)
│   └── app.js             # Hauptapplikation (UI-Logik)
├── icons/                  # PWA Icons (72x72 bis 512x512)
└── assets/                 # Bilder, Screenshots, Logo
```

---

## 🚀 Installation & Start

### Lokale Entwicklung

1. **Repository klonen**
   ```bash
   cd zanobot-pwa
   ```

2. **Lokalen Server starten**
   ```bash
   # Python 3
   python -m http.server 8000

   # Node.js (http-server)
   npx http-server -p 8000

   # PHP
   php -S localhost:8000
   ```

3. **Browser öffnen**
   ```
   http://localhost:8000
   ```

### Als PWA installieren

1. Browser öffnen (Chrome, Edge, Safari)
2. Auf "Installieren" klicken (in der Adressleiste)
3. Als App verwenden

---

## 🎨 Design-Konzept

### Farbschema (Brand Theme)

| Element | Farbe | Hex |
|---------|-------|-----|
| Primary | Zanobot Cyan | `#00D4FF` |
| Secondary | Teal | `#40E0D0` |
| Accent | Mint | `#00FFC6` |
| Background | Dark Blue | `#0A1929` |
| Text Primary | White | `#FFFFFF` |
| Status Healthy | Green | `#00E676` |
| Status Warning | Orange | `#FFA726` |

### Layout-Prinzipien

- **Container Max-Width**: 900px (inspiriert von ThiXX-OTH)
- **Border Radius**: 8px (sm), 12px (md), 16px (lg), 24px (xl)
- **Spacing**: 0.5rem, 1rem, 1.5rem, 2rem, 3rem
- **Typography**: System Font Stack (SF Pro, Segoe UI, Roboto)

---

## 🛠️ Technologie-Stack

- **Frontend**: Vanilla JavaScript (ES6+), HTML5, CSS3
- **PWA**: Service Worker, Web App Manifest, Cache API
- **Audio**: Web Audio API, MediaStream API
- **Themes**: CSS Custom Properties, localStorage
- **Build**: Keine Dependencies - Pure Web Standards

---

## 📱 PWA-Features

### Offline-Funktionalität
- Cache-First-Strategie für statische Assets
- Runtime-Caching für Bilder/Icons
- Background Sync für Daten-Upload

### Performance
- Lazy Loading von Bildern
- Code-Splitting vorbereitet
- Optimierte Animationen mit `will-change`

### Installation
- Add to Homescreen Support
- Splash Screen
- App-Shortcuts für Quick Actions

---

## 🔧 Konfiguration

Die `config.json` steuert alle wichtigen App-Parameter:

```json
{
  "branding": {
    "colors": {
      "primary": "#00D4FF",
      "secondary": "#40E0D0"
    }
  },
  "audio": {
    "sampleRate": 48000,
    "recordingDuration": 10,
    "fftSize": 2048
  },
  "diagnosis": {
    "confidenceThreshold": 0.75
  }
}
```

### Theme-Customization

Um eigene Brand-Colors zu verwenden:

1. `config.json` bearbeiten
2. Brand-Theme aktivieren
3. Farben werden automatisch via CSS-Variablen angewendet

---

## 🎯 Nächste Schritte

### Phase 1: UI-Fundament ✅
- [x] HTML-Struktur mit allen Sektionen
- [x] CSS mit Glasmorphismus & Themes
- [x] Theme-Switcher & Theme-Bootstrap
- [x] PWA-Manifest & Service Worker
- [x] Basis-Interaktionen (Modals, Collapsibles)

### Phase 2: Audio-Integration (TODO)
- [ ] Portierung der Zanobo `src/dsp` Module
- [ ] Spektrogramm-Visualisierung
- [ ] FFT-Analyse und Feature-Extraction
- [ ] Audio-Recording & Playback

### Phase 3: ML-Integration (TODO)
- [ ] Portierung der Zanobo `src/ml` Module
- [ ] Fingerprint-Generierung
- [ ] Anomalie-Erkennung
- [ ] Confidence-Score-Berechnung

### Phase 4: Daten-Persistenz (TODO)
- [ ] IndexedDB für Referenzen & Historie
- [ ] LocalStorage für Settings
- [ ] Export/Import-Funktionen
- [ ] Cloud-Sync (optional)

---

## 🧪 Testing

### Browser-Kompatibilität
- ✅ Chrome/Edge (Desktop & Mobile)
- ✅ Safari (iOS/macOS)
- ✅ Firefox (Desktop & Mobile)

### Checkliste
- [ ] Responsive Design (320px - 1920px)
- [ ] Touch-Gesten funktionieren
- [ ] Theme-Wechsel ohne Flicker
- [ ] Offline-Modus funktioniert
- [ ] Audio-Permissions korrekt

---

## 📄 Lizenz

Dieses Projekt ist ein Prototyp basierend auf:
- **Zanobo** (Acoustic Machine Monitoring)
- **ThiXX-OTH** (UI Framework & Design)

---

## 🤝 Beitragen

1. Fork das Repository
2. Feature-Branch erstellen (`git checkout -b feature/AmazingFeature`)
3. Änderungen committen (`git commit -m 'Add AmazingFeature'`)
4. Branch pushen (`git push origin feature/AmazingFeature`)
5. Pull Request öffnen

---

## 📞 Support

Bei Fragen oder Problemen:
- GitHub Issues öffnen
- Dokumentation lesen
- Code-Kommentare beachten

---

**Made with 💙 by the Zanobot Team**
