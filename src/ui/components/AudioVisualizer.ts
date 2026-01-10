/**
 * ZANOBOT - AUDIO VISUALIZER COMPONENT
 *
 * Real-time waveform/frequency visualization during recording.
 * Shows frequency spectrum as bars.
 */

export class AudioVisualizer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private analyser: AnalyserNode | null = null;
  private animationFrame: number | null = null;
  private dataArray: Uint8Array | null = null;

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
    // Create analyser node
    this.analyser = audioContext.createAnalyser();
    this.analyser.fftSize = 2048;
    this.analyser.smoothingTimeConstant = 0.8;

    // Connect stream to analyser
    const source = audioContext.createMediaStreamSource(stream);
    source.connect(this.analyser);

    // Create data array
    const bufferLength = this.analyser.frequencyBinCount;
    this.dataArray = new Uint8Array(bufferLength);

    // Start rendering
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

  private render(): void {
    if (!this.analyser || !this.dataArray) {
      return;
    }

    const width = this.canvas.width / (window.devicePixelRatio || 1);
    const height = this.canvas.height / (window.devicePixelRatio || 1);

    // Get frequency data
    // @ts-ignore - Type mismatch between browser types
    this.analyser.getByteFrequencyData(this.dataArray);

    // Clear canvas
    this.ctx.fillStyle = '#0a0a0a';
    this.ctx.fillRect(0, 0, width, height);

    // Draw frequency bars
    const barCount = 64; // Number of bars to display
    const barWidth = width / barCount;
    const step = Math.floor(this.dataArray.length / barCount);

    for (let i = 0; i < barCount; i++) {
      const value = this.dataArray[i * step];
      const barHeight = (value / 255) * height;

      // Color gradient based on frequency
      const hue = (i / barCount) * 120 + 180; // 180-300 (cyan to blue)
      this.ctx.fillStyle = `hsl(${hue}, 70%, 50%)`;

      const x = i * barWidth;
      const y = height - barHeight;

      this.ctx.fillRect(x, y, barWidth - 2, barHeight);
    }

    // Continue animation
    this.animationFrame = requestAnimationFrame(() => this.render());
  }

  /**
   * Draw static waveform from audio buffer
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
