/**
 * ZANOBOT AI ASSISTANT - MAIN APPLICATION
 *
 * This module handles the main application logic including:
 * - UI interactions
 * - QR code scanning
 * - Audio recording and analysis
 * - Machine diagnostics
 * - Theme management
 *
 * Note: Audio processing and ML modules will be integrated later
 */

class ZanobotApp {
    constructor() {
        this.config = window.ZANOBOT_CONFIG || {};
        this.currentMachine = null;
        this.isRecording = false;
        this.audioContext = null;
        this.mediaStream = null;
        this.recordingStartTime = null;
        this.animationFrameId = null;
        this.deferredPrompt = null;

        this.init();
    }

    /**
     * Initialize application
     */
    init() {
        console.log('🤖 Zanobot AI Assistant starting...');

        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setup());
        } else {
            this.setup();
        }
    }

    /**
     * Setup application after DOM is ready
     */
    setup() {
        this.setupThemeSwitcher();
        this.setupActionButtons();
        this.setupCollapsibleSections();
        this.setupModals();
        this.setupSettings();
        this.setupPWA();
        this.checkMicrophonePermission();
        this.loadMachineData();

        console.log('✅ Zanobot initialized');
    }

    /**
     * Theme Switcher Setup
     */
    setupThemeSwitcher() {
        const themeBtns = document.querySelectorAll('.theme-btn');

        themeBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const theme = btn.dataset.theme;
                window.ZanobotTheme.setTheme(theme);

                // Update active state
                themeBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            });
        });

        // Set initial active button
        const currentTheme = window.ZanobotTheme.getTheme();
        themeBtns.forEach(btn => {
            if (btn.dataset.theme === currentTheme) {
                btn.classList.add('active');
            }
        });
    }

    /**
     * Setup main action buttons
     */
    setupActionButtons() {
        // Scan Machine Button (QR Code)
        const scanBtn = document.getElementById('scan-btn');
        if (scanBtn) {
            scanBtn.addEventListener('click', () => this.scanMachine());
        }

        // Create Machine Button (Manual Entry)
        const createMachineBtn = document.getElementById('create-machine-btn');
        if (createMachineBtn) {
            createMachineBtn.addEventListener('click', () => this.createMachine());
        }

        // Record Reference Button
        const recordBtn = document.getElementById('record-btn');
        if (recordBtn) {
            recordBtn.addEventListener('click', () => this.startReferenceRecording());
        }

        // Diagnose Button
        const diagnoseBtn = document.getElementById('diagnose-btn');
        if (diagnoseBtn) {
            diagnoseBtn.addEventListener('click', () => this.runDiagnosis());
        }

        // Quick Check Button
        const quickCheckBtn = document.querySelector('.quick-check-btn');
        if (quickCheckBtn) {
            quickCheckBtn.addEventListener('click', () => this.quickCheck());
        }

        // Add Reference Button
        const addRefBtn = document.querySelector('.add-reference-btn');
        if (addRefBtn) {
            addRefBtn.addEventListener('click', () => this.startReferenceRecording());
        }
    }

    /**
     * Setup collapsible sections
     */
    setupCollapsibleSections() {
        const sectionHeaders = document.querySelectorAll('.section-header');

        sectionHeaders.forEach(header => {
            header.addEventListener('click', () => {
                const targetId = header.dataset.target;
                const content = document.getElementById(targetId);

                if (content) {
                    const isVisible = content.style.display !== 'none';
                    content.style.display = isVisible ? 'none' : 'block';
                    header.classList.toggle('expanded', !isVisible);
                }
            });
        });
    }

    /**
     * Setup modal interactions
     */
    setupModals() {
        // Recording Modal
        const stopRecordingBtn = document.getElementById('stop-recording-btn');
        if (stopRecordingBtn) {
            stopRecordingBtn.addEventListener('click', () => this.stopRecording());
        }

        const saveReferenceBtn = document.getElementById('save-reference-btn');
        if (saveReferenceBtn) {
            saveReferenceBtn.addEventListener('click', () => this.saveReference());
        }

        // Diagnosis Modal
        const closeDiagnosisBtn = document.getElementById('close-diagnosis-modal');
        if (closeDiagnosisBtn) {
            closeDiagnosisBtn.addEventListener('click', () => this.closeModal('diagnosis-modal'));
        }

        const viewHistoryBtn = document.getElementById('view-history-btn');
        if (viewHistoryBtn) {
            viewHistoryBtn.addEventListener('click', () => {
                this.closeModal('diagnosis-modal');
                this.openHistorySection();
            });
        }

        // Close modal on background click
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeModal(modal.id);
                }
            });
        });
    }

    /**
     * Setup settings controls
     */
    setupSettings() {
        // Confidence Threshold Slider
        const confidenceSlider = document.getElementById('confidence-threshold');
        const confidenceValue = document.getElementById('confidence-value');

        if (confidenceSlider && confidenceValue) {
            confidenceSlider.addEventListener('input', (e) => {
                confidenceValue.textContent = e.target.value + '%';
            });
        }

        // Recording Duration Select
        const recordingDuration = document.getElementById('recording-duration');
        if (recordingDuration) {
            recordingDuration.addEventListener('change', (e) => {
                console.log('Recording duration changed to:', e.target.value);
            });
        }

        // Footer Links
        const impressumBtn = document.getElementById('impressum-btn');
        if (impressumBtn) {
            impressumBtn.addEventListener('click', () => this.showImpressum());
        }

        const datenschutzBtn = document.getElementById('datenschutz-btn');
        if (datenschutzBtn) {
            datenschutzBtn.addEventListener('click', () => this.showDataPrivacy());
        }

        const aboutBtn = document.getElementById('about-btn');
        if (aboutBtn) {
            aboutBtn.addEventListener('click', () => this.showAbout());
        }
    }

    /**
     * Check and request microphone permission
     */
    async checkMicrophonePermission() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            stream.getTracks().forEach(track => track.stop());
            this.showMicStatus('Mikrofon bereit', true);
        } catch (error) {
            console.warn('Microphone access denied:', error);
            this.showMicStatus('Mikrofon-Zugriff verweigert', false);
        }
    }

    /**
     * Show/hide microphone status badge
     */
    showMicStatus(message, active = false) {
        const badge = document.getElementById('mic-status-badge');
        const statusText = document.getElementById('mic-status-text');

        if (badge && statusText) {
            statusText.textContent = message;
            badge.style.display = 'flex';

            if (active) {
                badge.classList.add('active');
            } else {
                badge.classList.remove('active');
            }

            // Auto-hide after 3 seconds if not active
            if (!active) {
                setTimeout(() => {
                    badge.style.display = 'none';
                }, 3000);
            }
        }
    }

    /**
     * Load machine data (placeholder)
     */
    loadMachineData() {
        // TODO: Load from localStorage or API
        console.log('Loading machine data...');
    }

    /**
     * Scan machine via QR code (placeholder)
     */
    async scanMachine() {
        console.log('📷 Scanning QR code...');

        // TODO: Implement QR code scanner
        // For now, simulate scan
        alert('QR-Code-Scanner wird geöffnet...\n\nHinweis: Diese Funktion wird in der finalen Version implementiert.');

        // Simulate successful scan
        setTimeout(() => {
            this.currentMachine = {
                id: 'ZANOBO-' + Math.floor(Math.random() * 1000),
                name: 'Maschine ' + Math.floor(Math.random() * 100),
                barcode: '1GB4-636A0-Ba1'
            };
            console.log('Machine scanned:', this.currentMachine);
            alert(`Maschine erfolgreich gescannt!\n\nName: ${this.currentMachine.name}\nID: ${this.currentMachine.id}`);
        }, 1000);
    }

    /**
     * Create machine manually
     */
    createMachine() {
        console.log('💾 Creating machine manually...');

        const nameInput = document.getElementById('machine-name-input');
        const idInput = document.getElementById('machine-id-input');

        if (!nameInput) {
            console.error('Machine name input not found');
            return;
        }

        const machineName = nameInput.value.trim();
        const machineId = idInput ? idInput.value.trim() : '';

        // Validate input
        if (!machineName) {
            alert('Bitte geben Sie einen Maschinennamen ein.');
            nameInput.focus();
            return;
        }

        // Create machine object
        this.currentMachine = {
            id: machineId || 'ZANOBO-' + Math.floor(Math.random() * 1000),
            name: machineName,
            barcode: machineId || '1GB4-636A0-Ba1',
            createdAt: new Date().toISOString()
        };

        // TODO: Save to localStorage or API
        console.log('Machine created:', this.currentMachine);

        // Show success message
        alert(`Maschine erfolgreich angelegt!\n\nName: ${this.currentMachine.name}\nID: ${this.currentMachine.id}`);

        // Clear inputs
        nameInput.value = '';
        if (idInput) idInput.value = '';

        // Update UI to show the new machine
        this.loadMachineData();
    }

    /**
     * Start reference recording
     */
    async startReferenceRecording() {
        console.log('🎤 Starting reference recording...');

        try {
            // Request microphone access
            this.mediaStream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    channelCount: 1,
                    sampleRate: this.config.audio?.sampleRate || 48000,
                    echoCancellation: false,
                    noiseSuppression: false,
                    autoGainControl: false
                }
            });

            // Show recording modal
            this.openModal('recording-modal');
            this.isRecording = true;
            this.recordingStartTime = Date.now();

            // Initialize audio context
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const source = this.audioContext.createMediaStreamSource(this.mediaStream);
            const analyser = this.audioContext.createAnalyser();
            analyser.fftSize = this.config.audio?.fftSize || 2048;
            source.connect(analyser);

            // Start visualization
            this.visualizeWaveform(analyser);

            // Start timer
            this.updateRecordingTimer();

            // Auto-stop after duration
            const duration = (this.config.audio?.recordingDuration || 10) * 1000;
            setTimeout(() => {
                if (this.isRecording) {
                    this.stopRecording();
                }
            }, duration);

            this.showMicStatus('Aufnahme läuft...', true);

        } catch (error) {
            console.error('Failed to start recording:', error);
            alert('Mikrofon-Zugriff fehlgeschlagen. Bitte überprüfen Sie die Berechtigungen.');
        }
    }

    /**
     * Visualize waveform on canvas
     */
    visualizeWaveform(analyser) {
        const canvas = document.getElementById('waveform-canvas');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        const draw = () => {
            if (!this.isRecording) return;

            this.animationFrameId = requestAnimationFrame(draw);

            analyser.getByteTimeDomainData(dataArray);

            // Create gradient background
            const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
            gradient.addColorStop(0, 'rgba(255, 87, 51, 0.5)');
            gradient.addColorStop(0.25, 'rgba(255, 195, 0, 0.5)');
            gradient.addColorStop(0.5, 'rgba(0, 212, 255, 0.5)');
            gradient.addColorStop(0.75, 'rgba(64, 224, 208, 0.5)');
            gradient.addColorStop(1, 'rgba(0, 230, 118, 0.5)');

            ctx.fillStyle = 'rgba(17, 40, 64, 0.3)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            ctx.lineWidth = 2;
            ctx.strokeStyle = gradient;
            ctx.beginPath();

            const sliceWidth = canvas.width / bufferLength;
            let x = 0;

            for (let i = 0; i < bufferLength; i++) {
                const v = dataArray[i] / 128.0;
                const y = v * canvas.height / 2;

                if (i === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }

                x += sliceWidth;
            }

            ctx.lineTo(canvas.width, canvas.height / 2);
            ctx.stroke();
        };

        draw();
    }

    /**
     * Update recording timer
     */
    updateRecordingTimer() {
        const timerElement = document.getElementById('recording-timer');
        if (!timerElement) return;

        const updateTimer = () => {
            if (!this.isRecording) return;

            const elapsed = Math.floor((Date.now() - this.recordingStartTime) / 1000);
            const minutes = Math.floor(elapsed / 60);
            const seconds = elapsed % 60;
            timerElement.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

            requestAnimationFrame(updateTimer);
        };

        updateTimer();
    }

    /**
     * Stop recording
     */
    stopRecording() {
        console.log('⏹️ Stopping recording...');

        this.isRecording = false;

        // Stop media stream
        if (this.mediaStream) {
            this.mediaStream.getTracks().forEach(track => track.stop());
            this.mediaStream = null;
        }

        // Close audio context
        if (this.audioContext) {
            this.audioContext.close();
            this.audioContext = null;
        }

        // Stop animation
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }

        // Show save button
        const stopBtn = document.getElementById('stop-recording-btn');
        const saveBtn = document.getElementById('save-reference-btn');

        if (stopBtn) stopBtn.style.display = 'none';
        if (saveBtn) saveBtn.style.display = 'block';

        this.showMicStatus('Aufnahme beendet', false);
    }

    /**
     * Save reference recording
     */
    saveReference() {
        console.log('💾 Saving reference...');

        // TODO: Save reference data to storage
        // For now, just close modal and show success message

        this.closeModal('recording-modal');

        // Reset modal state
        const stopBtn = document.getElementById('stop-recording-btn');
        const saveBtn = document.getElementById('save-reference-btn');
        if (stopBtn) stopBtn.style.display = 'block';
        if (saveBtn) saveBtn.style.display = 'none';

        alert('Referenz erfolgreich gespeichert!');
    }

    /**
     * Run diagnosis
     */
    async runDiagnosis() {
        console.log('🔬 Running diagnosis...');

        // TODO: Implement actual diagnosis logic
        // For now, simulate diagnosis and show results

        // Simulate processing time
        await new Promise(resolve => setTimeout(resolve, 1500));

        // Generate mock results
        this.showDiagnosisResults({
            barcode: '1GB4-636A0-Ba1',
            status: 'HEALTHY',
            confidence: 87,
            hint: 'Slightly increased signal around 20 kHz',
            referenceQuality: 'GOOD'
        });
    }

    /**
     * Show diagnosis results
     */
    showDiagnosisResults(results) {
        // Update modal content
        const barcodeEl = document.getElementById('machine-barcode');
        const statusEl = document.getElementById('result-status');
        const confidenceEl = document.getElementById('result-confidence');
        const hintEl = document.getElementById('analysis-hint');

        if (barcodeEl) barcodeEl.textContent = results.barcode;
        if (statusEl) {
            statusEl.textContent = results.status;
            statusEl.className = 'result-status';
            statusEl.classList.add('status-' + results.status.toLowerCase());
        }
        if (confidenceEl) confidenceEl.textContent = results.confidence;
        if (hintEl) hintEl.textContent = 'Hint: ' + results.hint;

        // Draw analysis chart
        this.drawAnalysisChart();

        // Open modal
        this.openModal('diagnosis-modal');
    }

    /**
     * Draw analysis chart (placeholder)
     */
    drawAnalysisChart() {
        const canvas = document.getElementById('analysis-canvas');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw two wave lines (variance and frequency anomaly)
        const drawWave = (color, offset) => {
            ctx.strokeStyle = color;
            ctx.lineWidth = 2;
            ctx.beginPath();

            for (let x = 0; x < canvas.width; x++) {
                const y = canvas.height / 2 +
                         Math.sin((x + offset) * 0.02) * 20 +
                         Math.sin((x + offset) * 0.05) * 10;

                if (x === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            }

            ctx.stroke();
        };

        drawWave('#00D4FF', 0);
        drawWave('#78909C', 50);
    }

    /**
     * Quick check (combines scan + diagnose)
     */
    async quickCheck() {
        console.log('⚡ Quick check...');

        // For now, just run diagnosis
        this.runDiagnosis();
    }

    /**
     * Open modal
     */
    openModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'flex';
            document.body.style.overflow = 'hidden';
        }
    }

    /**
     * Close modal
     */
    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'none';
            document.body.style.overflow = '';
        }

        // Clean up if closing recording modal
        if (modalId === 'recording-modal' && this.isRecording) {
            this.stopRecording();
        }
    }

    /**
     * Open history section
     */
    openHistorySection() {
        const header = document.querySelector('[data-target="history"]');
        const content = document.getElementById('history');

        if (header && content) {
            content.style.display = 'block';
            header.classList.add('expanded');

            // Scroll to history
            header.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }

    /**
     * Show impressum
     */
    showImpressum() {
        alert('Impressum\n\nZanobot AI Assistant\nVersion 1.0.0\n\nEin Projekt für akustische Maschinenüberwachung.');
    }

    /**
     * Show data privacy info
     */
    showDataPrivacy() {
        alert('Datenschutz\n\nZanobot verarbeitet alle Daten lokal auf Ihrem Gerät.\nEs werden keine Daten an externe Server übertragen.');
    }

    /**
     * Show about info
     */
    showAbout() {
        alert('Über Zanobot\n\nZanobot ist ein KI-gestützter Assistent für die akustische Überwachung von Maschinen.\n\nMit Hilfe von Audio-Fingerprinting und maschinellem Lernen können Anomalien in Maschinen frühzeitig erkannt werden.');
    }

    /**
     * Setup PWA Install functionality
     */
    setupPWA() {
        // Listen for the beforeinstallprompt event
        window.addEventListener('beforeinstallprompt', (e) => {
            console.log('📱 PWA install prompt available');

            // Prevent the mini-infobar from appearing on mobile
            e.preventDefault();

            // Stash the event so it can be triggered later
            this.deferredPrompt = e;

            // Show the install button
            this.showInstallButton();
        });

        // Listen for successful installation
        window.addEventListener('appinstalled', () => {
            console.log('✅ PWA installed successfully');
            this.deferredPrompt = null;
            this.hideInstallButton();

            // Show success message
            alert('Zanobot wurde erfolgreich installiert! 🎉\n\nSie können die App jetzt vom Startbildschirm aus öffnen.');
        });

        // Check if app is already installed (standalone mode)
        if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone) {
            console.log('✅ App is running in standalone mode (installed)');
        }
    }

    /**
     * Show PWA install button
     */
    showInstallButton() {
        // Check if install button already exists
        let installBtn = document.getElementById('pwa-install-btn');

        if (!installBtn) {
            // Create install button
            installBtn = document.createElement('button');
            installBtn.id = 'pwa-install-btn';
            installBtn.className = 'pwa-install-button';
            installBtn.innerHTML = `
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="7 10 12 15 17 10"/>
                    <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
                <span>App installieren</span>
            `;
            installBtn.title = 'Zanobot als App installieren';

            // Add click handler
            installBtn.addEventListener('click', () => this.promptInstall());

            // Insert button into header
            const header = document.querySelector('.header-inline');
            if (header) {
                header.appendChild(installBtn);
            } else {
                // Fallback: append to body
                document.body.appendChild(installBtn);
            }
        }

        installBtn.style.display = 'flex';
    }

    /**
     * Hide PWA install button
     */
    hideInstallButton() {
        const installBtn = document.getElementById('pwa-install-btn');
        if (installBtn) {
            installBtn.style.display = 'none';
        }
    }

    /**
     * Prompt the user to install the PWA
     */
    async promptInstall() {
        if (!this.deferredPrompt) {
            console.log('⚠️ No install prompt available');
            return;
        }

        console.log('📱 Showing install prompt');

        // Show the install prompt
        this.deferredPrompt.prompt();

        // Wait for the user to respond to the prompt
        const { outcome } = await this.deferredPrompt.userChoice;

        console.log(`User response to install prompt: ${outcome}`);

        if (outcome === 'accepted') {
            console.log('✅ User accepted the install prompt');
        } else {
            console.log('❌ User dismissed the install prompt');
        }

        // Clear the deferredPrompt so it can only be used once
        this.deferredPrompt = null;
        this.hideInstallButton();
    }
}

// Initialize app when script loads
const app = new ZanobotApp();

// Export for use in other modules
export default app;
