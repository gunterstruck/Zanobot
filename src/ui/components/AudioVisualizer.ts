/**
 * ZANOBOT - AUDIO VISUALIZER COMPONENT
 *
 * Professional real-time FFT frequency spectrum visualization.
 *
 * Features:
 * - Frequency domain analysis (0-22kHz)
 * - Smooth gradient (Green → Yellow → Red for intensity)
 * - 60 FPS rendering
 * - High resolution (fftSize = 2048)
 * - Shows machine acoustic signatures (peaks, resonances)
 */

export class AudioVisualizer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private analyser: AnalyserNode | null = null;
  private animationFrame: number | null = null;
  private dataArray: Uint8Array | null = null;

  // Visualization settings
  private fftSize: number = 2048;        // High resolution for bass/mid analysis
  private smoothing: number = 0.75;      // Smooth transitions (0-1)
  private barCount: number = 128;        // Number of frequency bars

  constructor(canvasId: string) {
    const canvas = document.getElementById(canvasId) as HTMLCanvasElement;
    if (!canvas) {
      throw new Error(`Canvas element not found: ${canvasId}`);
    }

    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Could not get 2D context');
    }

    this.ctx = ctx;
    this.setCanvasSize();
  }

  private setCanvasSize(): void {
    const dpr = window.devicePixelRatio || 1;
    const rect = this.canvas.getBoundingClientRect();

    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;

    this.ctx.scale(dpr, dpr);
  }

  /**
   * Start visualization from audio stream
   *
   * @param audioContext - Web Audio API context
   * @param stream - MediaStream from microphone
   */
  public start(audioContext: AudioContext, stream: MediaStream): void {
    // Create analyser node with high resolution
    this.analyser = audioContext.createAnalyser();
    this.analyser.fftSize = this.fftSize;
    this.analyser.smoothingTimeConstant = this.smoothing;
    this.analyser.minDecibels = -90;
    this.analyser.maxDecibels = -10;

    // Connect stream to analyser
    const source = audioContext.createMediaStreamSource(stream);
    source.connect(this.analyser);

    // Create data array for frequency data
    const bufferLength = this.analyser.frequencyBinCount; // fftSize / 2
    this.dataArray = new Uint8Array(bufferLength);

    console.log(`📊 FFT Visualizer started: ${this.fftSize} samples, ${bufferLength} bins`);

    // Start rendering at 60 FPS
    this.render();
  }

  /**
   * Stop visualization
   */
  public stop(): void {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }

    this.analyser = null;
    this.dataArray = null;

    // Clear canvas
    const width = this.canvas.width / (window.devicePixelRatio || 1);
    const height = this.canvas.height / (window.devicePixelRatio || 1);
    this.ctx.clearRect(0, 0, width, height);
  }

  /**
   * Render frequency spectrum (60 FPS)
   *
   * Visual strategy:
   * - X-axis: Frequency (0 Hz → ~22 kHz)
   * - Y-axis: Amplitude (dB)
   * - Color: Intensity gradient (Green → Yellow → Red)
   */
  private render(): void {
    if (!this.analyser || !this.dataArray) {
      return;
    }

    const width = this.canvas.width / (window.devicePixelRatio || 1);
    const height = this.canvas.height / (window.devicePixelRatio || 1);

    // Get frequency data (0-255 values)
    // @ts-ignore - Type mismatch between browser types
    this.analyser.getByteFrequencyData(this.dataArray);

    // Clear canvas with dark background
    this.ctx.fillStyle = '#0a0a0a';
    this.ctx.fillRect(0, 0, width, height);

    // Draw grid lines (optional, for professional look)
    this.drawGrid(width, height);

    // Draw frequency spectrum
    this.drawSpectrum(width, height);

    // Draw frequency labels
    this.drawFrequencyLabels(width, height);

    // Continue animation at 60 FPS
    this.animationFrame = requestAnimationFrame(() => this.render());
  }

  /**
   * Draw background grid
   */
  private drawGrid(width: number, height: number): void {
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    this.ctx.lineWidth = 1;

    // Horizontal lines (amplitude)
    for (let i = 0; i <= 4; i++) {
      const y = (height / 4) * i;
      this.ctx.beginPath();
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(width, y);
      this.ctx.stroke();
    }

    // Vertical lines (frequency markers)
    const markers = [0, 0.25, 0.5, 0.75, 1]; // 0%, 25%, 50%, 75%, 100%
    markers.forEach((marker) => {
      const x = width * marker;
      this.ctx.beginPath();
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, height);
      this.ctx.stroke();
    });
  }

  /**
   * Draw frequency spectrum as filled bars
   *
   * Strategy: Linear frequency distribution (could be log scale for pro audio)
   */
  private drawSpectrum(width: number, height: number): void {
    if (!this.dataArray) return;

    const barWidth = width / this.barCount;
    const binStep = Math.floor(this.dataArray.length / this.barCount);

    for (let i = 0; i < this.barCount; i++) {
      // Get frequency bin value (average multiple bins for smoother display)
      let sum = 0;
      let count = 0;

      for (let j = 0; j < binStep; j++) {
        const index = i * binStep + j;
        if (index < this.dataArray.length) {
          sum += this.dataArray[index];
          count++;
        }
      }

      const value = count > 0 ? sum / count : 0;
      const normalizedValue = value / 255; // 0-1

      // Calculate bar height
      const barHeight = normalizedValue * height;

      // Get color based on INTENSITY (not frequency)
      const color = this.getIntensityColor(normalizedValue);

      // Draw bar
      const x = i * barWidth;
      const y = height - barHeight;

      // Fill bar with gradient
      this.ctx.fillStyle = color;
      this.ctx.fillRect(x, y, barWidth - 1, barHeight);

      // Add subtle glow effect for high values
      if (normalizedValue > 0.7) {
        this.ctx.shadowBlur = 10;
        this.ctx.shadowColor = color;
        this.ctx.fillRect(x, y, barWidth - 1, barHeight);
        this.ctx.shadowBlur = 0;
      }
    }

    // Optional: Draw filled spectrum (polygon)
    this.drawFilledSpectrum(width, height);
  }

  /**
   * Draw filled spectrum line (alternative style)
   */
  private drawFilledSpectrum(width: number, height: number): void {
    if (!this.dataArray) return;

    const points: { x: number; y: number }[] = [];
    const barWidth = width / this.barCount;
    const binStep = Math.floor(this.dataArray.length / this.barCount);

    // Collect points
    for (let i = 0; i < this.barCount; i++) {
      let sum = 0;
      let count = 0;

      for (let j = 0; j < binStep; j++) {
        const index = i * binStep + j;
        if (index < this.dataArray.length) {
          sum += this.dataArray[index];
          count++;
        }
      }

      const value = count > 0 ? sum / count : 0;
      const normalizedValue = value / 255;
      const barHeight = normalizedValue * height;

      points.push({
        x: i * barWidth + barWidth / 2,
        y: height - barHeight,
      });
    }

    // Draw smooth line
    if (points.length > 1) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, height);

      // Draw to first point
      this.ctx.lineTo(points[0].x, points[0].y);

      // Draw smooth curve through points
      for (let i = 0; i < points.length - 1; i++) {
        const xc = (points[i].x + points[i + 1].x) / 2;
        const yc = (points[i].y + points[i + 1].y) / 2;
        this.ctx.quadraticCurveTo(points[i].x, points[i].y, xc, yc);
      }

      // Last point
      const lastPoint = points[points.length - 1];
      this.ctx.lineTo(lastPoint.x, lastPoint.y);
      this.ctx.lineTo(width, height);
      this.ctx.closePath();

      // Fill with subtle gradient
      const gradient = this.ctx.createLinearGradient(0, 0, 0, height);
      gradient.addColorStop(0, 'rgba(59, 130, 246, 0.3)'); // Blue top
      gradient.addColorStop(1, 'rgba(59, 130, 246, 0.05)'); // Transparent bottom

      this.ctx.fillStyle = gradient;
      this.ctx.fill();

      // Stroke line
      this.ctx.strokeStyle = 'rgba(59, 130, 246, 0.8)';
      this.ctx.lineWidth = 2;
      this.ctx.stroke();
    }
  }

  /**
   * Get color based on intensity (Green → Yellow → Red)
   *
   * @param intensity - Normalized value (0-1)
   * @returns CSS color string
   */
  private getIntensityColor(intensity: number): string {
    if (intensity < 0.3) {
      // Low: Green
      return `rgba(34, 197, 94, ${0.4 + intensity * 2})`;
    } else if (intensity < 0.6) {
      // Medium: Yellow/Orange
      const ratio = (intensity - 0.3) / 0.3;
      return `rgba(${Math.round(34 + ratio * 220)}, ${Math.round(197 - ratio * 50)}, 94, ${0.6 + intensity})`;
    } else {
      // High: Red
      return `rgba(239, 68, 68, ${0.7 + intensity * 0.3})`;
    }
  }

  /**
   * Draw frequency labels (Hz)
   */
  private drawFrequencyLabels(width: number, height: number): void {
    const sampleRate = 44100; // Assuming 44.1kHz
    const maxFreq = sampleRate / 2; // Nyquist frequency (22050 Hz)

    const labels = [
      { pos: 0, text: '0' },
      { pos: 0.25, text: '5k' },
      { pos: 0.5, text: '11k' },
      { pos: 0.75, text: '16k' },
      { pos: 1, text: '22k' },
    ];

    this.ctx.font = '10px system-ui, sans-serif';
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    this.ctx.textAlign = 'center';

    labels.forEach((label) => {
      const x = width * label.pos;
      const y = height - 5;
      this.ctx.fillText(label.text + ' Hz', x, y);
    });

    // Draw amplitude label
    this.ctx.textAlign = 'left';
    this.ctx.fillText('Amplitude', 5, 15);
  }

  /**
   * Draw static waveform from audio buffer (legacy, for reference recording)
   *
   * @param audioBuffer - Recorded audio buffer
   */
  public drawWaveform(audioBuffer: AudioBuffer): void {
    const width = this.canvas.width / (window.devicePixelRatio || 1);
    const height = this.canvas.height / (window.devicePixelRatio || 1);

    // Clear canvas
    this.ctx.fillStyle = '#0a0a0a';
    this.ctx.fillRect(0, 0, width, height);

    // Get channel data
    const channelData = audioBuffer.getChannelData(0);
    const step = Math.ceil(channelData.length / width);

    // Draw waveform
    this.ctx.strokeStyle = '#3b82f6';
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();

    for (let i = 0; i < width; i++) {
      const index = i * step;
      const value = channelData[index];

      const x = i;
      const y = (1 + value) * height / 2; // Normalize to canvas height

      if (i === 0) {
        this.ctx.moveTo(x, y);
      } else {
        this.ctx.lineTo(x, y);
      }
    }

    this.ctx.stroke();

    // Draw center line
    this.ctx.strokeStyle = '#333333';
    this.ctx.lineWidth = 1;
    this.ctx.beginPath();
    this.ctx.moveTo(0, height / 2);
    this.ctx.lineTo(width, height / 2);
    this.ctx.stroke();
  }

  /**
   * Destroy the component and clean up
   */
  public destroy(): void {
    this.stop();
  }
}
