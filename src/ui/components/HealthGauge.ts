/**
 * ZANOBOT - HEALTH GAUGE COMPONENT
 *
 * Visual gauge/dial that displays health score (0-100%).
 * Color-coded: Green (healthy), Yellow (uncertain), Red (faulty).
 */

export class HealthGauge {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private score: number = 0;
  private animationFrame: number | null = null;

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
   * Draw gauge with score and status (Real-time compatible)
   *
   * @param score - Health score (0-100)
   * @param status - Status label (optional, auto-calculated if omitted)
   */
  public draw(score: number, status?: string): void {
    this.score = Math.max(0, Math.min(100, score));
    this.render();
  }

  /**
   * Update and render the gauge with new score
   *
   * @param score - Health score (0-100)
   * @param animate - Whether to animate the transition
   */
  public updateScore(score: number, animate: boolean = true): void {
    const targetScore = Math.max(0, Math.min(100, score));

    if (animate) {
      this.animateToScore(targetScore);
    } else {
      this.score = targetScore;
      this.render();
    }
  }

  private animateToScore(targetScore: number): void {
    const startScore = this.score;
    const diff = targetScore - startScore;
    const duration = 1000; // 1 second
    const startTime = Date.now();

    const animate = (): void => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);

      this.score = startScore + diff * eased;
      this.render();

      if (progress < 1) {
        this.animationFrame = requestAnimationFrame(animate);
      }
    };

    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
    }

    animate();
  }

  private render(): void {
    const width = this.canvas.width / (window.devicePixelRatio || 1);
    const height = this.canvas.height / (window.devicePixelRatio || 1);
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 2 - 20;

    // Clear canvas
    this.ctx.clearRect(0, 0, width, height);

    // Draw background arc
    this.drawArc(centerX, centerY, radius, 0, 100, '#2a2a2a', 8);

    // Draw score arc
    const color = this.getScoreColor(this.score);
    this.drawArc(centerX, centerY, radius, 0, this.score, color, 10);

    // Draw center text
    this.drawText(centerX, centerY, this.score);
  }

  private drawArc(
    x: number,
    y: number,
    radius: number,
    startScore: number,
    endScore: number,
    color: string,
    lineWidth: number
  ): void {
    const startAngle = this.scoreToAngle(startScore);
    const endAngle = this.scoreToAngle(endScore);

    this.ctx.beginPath();
    this.ctx.arc(x, y, radius, startAngle, endAngle);
    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = lineWidth;
    this.ctx.lineCap = 'round';
    this.ctx.stroke();
  }

  private scoreToAngle(score: number): number {
    // Map score (0-100) to angle (-135° to +135°, 270° total arc)
    const startAngle = -135 * (Math.PI / 180); // -135°
    const totalAngle = 270 * (Math.PI / 180); // 270°
    return startAngle + (score / 100) * totalAngle;
  }

  private drawText(x: number, y: number, score: number): void {
    // Draw score value
    this.ctx.font = 'bold 48px system-ui, -apple-system, sans-serif';
    this.ctx.fillStyle = '#ffffff';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText(Math.round(score).toString(), x, y - 10);

    // Draw percentage symbol
    this.ctx.font = '24px system-ui, -apple-system, sans-serif';
    this.ctx.fillStyle = '#888888';
    this.ctx.fillText('%', x, y + 30);

    // Draw status label
    const status = this.getStatusLabel(score);
    this.ctx.font = '16px system-ui, -apple-system, sans-serif';
    this.ctx.fillStyle = this.getScoreColor(score);
    this.ctx.fillText(status, x, y + 60);
  }

  private getScoreColor(score: number): string {
    if (score >= 75) {
      return '#4ade80'; // Green (healthy)
    } else if (score >= 50) {
      return '#fbbf24'; // Yellow (uncertain)
    } else {
      return '#f87171'; // Red (faulty)
    }
  }

  private getStatusLabel(score: number): string {
    if (score >= 75) {
      return 'HEALTHY';
    } else if (score >= 50) {
      return 'UNCERTAIN';
    } else {
      return 'FAULTY';
    }
  }

  /**
   * Destroy the component and clean up
   */
  public destroy(): void {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
    }
  }
}
