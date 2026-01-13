/**
 * ZANOBOT - TOAST NOTIFICATION COMPONENT
 *
 * Modern, non-intrusive toast notifications to replace alert() dialogs.
 *
 * Features:
 * - Auto-dismiss with configurable duration
 * - Multiple toast types: success, error, warning, info
 * - Stacking support (multiple toasts at once)
 * - Smooth animations (slide in/out)
 * - Accessible (ARIA attributes)
 */

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastOptions {
  /** Toast message */
  message: string;
  /** Optional title */
  title?: string;
  /** Toast type */
  type?: ToastType;
  /** Duration in milliseconds (0 = permanent, requires manual close) */
  duration?: number;
  /** Show close button */
  dismissible?: boolean;
  /** Position on screen */
  position?: 'top-right' | 'top-center' | 'top-left' | 'bottom-right' | 'bottom-center' | 'bottom-left';
}

/**
 * Toast Notification Manager
 */
export class ToastManager {
  private container: HTMLElement | null = null;
  private toasts: Map<string, HTMLElement> = new Map();
  private toastCounter = 0;
  private pendingToasts: Array<{ id: string; options: Required<ToastOptions> }> = [];
  private currentPosition: Required<ToastOptions>['position'] = 'top-right';

  constructor() {
    this.initContainer();
  }

  /**
   * Initialize toast container
   */
  private initContainer(): void {
    if (typeof document === 'undefined') {
      return;
    }

    if (!document.body) {
      document.addEventListener(
        'DOMContentLoaded',
        () => {
          this.initContainer();
        },
        { once: true }
      );
      return;
    }

    // Check if container already exists
    let container = document.getElementById('toast-container');

    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      container.className = 'toast-container';
      container.setAttribute('aria-live', 'polite');
      container.setAttribute('aria-atomic', 'true');
      document.body.appendChild(container);
    }

    this.container = container;
    this.container.classList.add(`toast-container--${this.currentPosition}`);
    this.flushPendingToasts();
  }

  /**
   * Show a toast notification
   */
  public show(options: ToastOptions): string {
    const defaults: Required<ToastOptions> = {
      message: '',
      title: '',
      type: 'info',
      duration: 5000,
      dismissible: true,
      position: 'top-right',
    };

    const config = { ...defaults, ...options };
    const toastId = this.createToastId();

    if (!this.container) {
      this.initContainer();
    }

    if (!this.container) {
      this.pendingToasts.push({ id: toastId, options: config });
      return toastId;
    }

    this.renderToast(toastId, config);

    return toastId;
  }

  /**
   * Flush queued toasts once the container is ready
   */
  private flushPendingToasts(): void {
    if (!this.container || this.pendingToasts.length === 0) {
      return;
    }

    const queued = [...this.pendingToasts];
    this.pendingToasts = [];
    queued.forEach(({ id, options }) => {
      this.renderToast(id, { ...options });
    });
  }

  /**
   * Render a toast in the DOM
   */
  private renderToast(toastId: string, config: Required<ToastOptions>): void {
    if (!this.container) {
      return;
    }

    this.applyPosition(config.position);

    // Create toast element
    const toast = this.createToastElement(toastId, config);

    this.container.appendChild(toast);
    this.toasts.set(toastId, toast);

    // Trigger animation
    setTimeout(() => toast.classList.add('toast-show'), 10);

    // Auto-dismiss after duration
    if (config.duration > 0) {
      setTimeout(() => this.hide(toastId), config.duration);
    }
  }

  /**
   * Apply container position classes
   */
  private applyPosition(position: Required<ToastOptions>['position']): void {
    if (!this.container || this.currentPosition === position) {
      return;
    }

    this.container.classList.remove(`toast-container--${this.currentPosition}`);
    this.container.classList.add(`toast-container--${position}`);
    this.currentPosition = position;
  }

  /**
   * Generate a unique toast ID
   */
  private createToastId(): string {
    return `toast-${++this.toastCounter}`;
  }

  /**
   * Hide a specific toast
   */
  public hide(toastId: string): void {
    const toast = this.toasts.get(toastId);
    if (!toast) return;

    // Animate out
    toast.classList.remove('toast-show');
    toast.classList.add('toast-hide');

    // Remove from DOM after animation
    setTimeout(() => {
      if (this.container && toast.parentNode === this.container) {
        this.container.removeChild(toast);
      }
      this.toasts.delete(toastId);
    }, 300);
  }

  /**
   * Hide all toasts
   */
  public hideAll(): void {
    this.toasts.forEach((_, toastId) => this.hide(toastId));
  }

  /**
   * Create toast DOM element
   */
  private createToastElement(toastId: string, config: Required<ToastOptions>): HTMLElement {
    const toast = document.createElement('div');
    toast.id = toastId;
    toast.className = `toast toast-${config.type}`;
    toast.setAttribute('role', config.type === 'error' ? 'alert' : 'status');

    // Icon
    const icon = this.getIcon(config.type);

    // Title
    const titleHTML = config.title
      ? `<div class="toast-title">${this.escapeHTML(config.title)}</div>`
      : '';

    // Message
    const messageHTML = `<div class="toast-message">${this.escapeHTML(config.message)}</div>`;

    // Close button
    const closeButton = config.dismissible
      ? `<button class="toast-close" aria-label="Close notification" data-toast-id="${toastId}">×</button>`
      : '';

    // Compose toast
    toast.innerHTML = `
      <div class="toast-icon">${icon}</div>
      <div class="toast-content">
        ${titleHTML}
        ${messageHTML}
      </div>
      ${closeButton}
    `;

    // Add close button event listener
    if (config.dismissible) {
      const closeBtn = toast.querySelector('.toast-close');
      if (closeBtn) {
        closeBtn.addEventListener('click', () => this.hide(toastId));
      }
    }

    return toast;
  }

  /**
   * Get icon for toast type
   */
  private getIcon(type: ToastType): string {
    const icons = {
      success: '✅',
      error: '❌',
      warning: '⚠️',
      info: 'ℹ️',
    };

    return icons[type] || icons.info;
  }

  /**
   * Escape HTML to prevent XSS
   */
  private escapeHTML(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Shorthand: Show success toast
   */
  public success(message: string, title?: string, duration = 5000): string {
    return this.show({ message, title, type: 'success', duration });
  }

  /**
   * Shorthand: Show error toast
   */
  public error(message: string, title?: string, duration = 0): string {
    return this.show({ message, title, type: 'error', duration });
  }

  /**
   * Shorthand: Show warning toast
   */
  public warning(message: string, title?: string, duration = 7000): string {
    return this.show({ message, title, type: 'warning', duration });
  }

  /**
   * Shorthand: Show info toast
   */
  public info(message: string, title?: string, duration = 5000): string {
    return this.show({ message, title, type: 'info', duration });
  }
}

/**
 * Global toast manager instance
 */
export const toast = new ToastManager();
