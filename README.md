# 🤖 Zanobot 2.0 - Industrial Machine Diagnostics PWA

**Acoustic Machine Health Monitoring using GMIA Algorithm**

## 📋 Overview

Zanobot ist eine **Progressive Web App (PWA)** für industrielle Maschinendiagnose mittels akustischer Analyse. Die App nutzt den **GMIA (Gaussian Model Independent Attributes)** Algorithmus zur Erkennung von Anomalien in Maschinengeräuschen.

### Key Features

- ✅ **Offline-first** - Alle Berechnungen lokal im Browser
- ✅ **Keine ML-Bibliotheken** - Reine mathematische GMIA-Implementierung
- ✅ **Echtzeit-Audioverarbeitung** - Web Audio API mit FFT
- ✅ **Health Scoring** - Nicht-lineare Tanh-Skalierung (0-100%)
- ✅ **IndexedDB Storage** - Persistente Modellspeicherung
- ✅ **3-Phasen-Workflow** - Identifizieren → Referenz → Diagnose

## 🚀 Quick Start

```bash
npm install
npm run dev      # Development server
npm run build    # Production build
```

## 🏗️ Architektur

```
/src
├── /core        # DSP & GMIA Algorithmus
├── /data        # IndexedDB Layer
├── /ui          # 3-Phasen UI Flow
└── main.ts      # App Entry Point
```

## 🔬 GMIA Algorithmus

**Training**: `w_p(λ) = X_p · (X_p^T · X_p + λI)^(-1) · 1`

**Scoring**: `Score = 100 · (tanh(C · cos(α)))^2`

- **λ** = 10^9 (Regularisierung)
- **Frequency Bins**: 512
- **Window Size**: 330ms / 66ms Overlap

## 📊 Technische Details

- TypeScript 5.7
- Vite Build System
- Web Audio API (44.1kHz)
- IndexedDB (idb)
- PWA (Service Worker)

**Version**: 2.0.0
**Basiert auf**: Technical Report F-202-01-01 (GMIA)
