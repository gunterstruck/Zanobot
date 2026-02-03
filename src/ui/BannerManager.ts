import { getAppSetting, saveAppSetting } from '@data/db.js';
import { getLanguage } from '../i18n/index.js';
import { notify } from '@utils/notifications.js';
import { logger } from '@utils/logger.js';

const HERO_BANNER_SETTING_KEY = 'hero_banner';
const VALID_BANNER_WIDTHS = new Set([1024]);
const VALID_BANNER_HEIGHTS = new Set([400, 500]);
const DEFAULT_BANNER_PATH = './icons/zanobo_banner_1024x400.png';
const CHINESE_MOBILE_BANNER_PATH = './icons/zanobo_cn_1024x400.png';

/**
 * Theme-to-banner mapping for automatic banner selection
 * Each theme gets a visually appropriate default banner
 */
const THEME_BANNER_PATHS: Record<string, string> = {
  // Dark Theme (neon): technical, professional, high contrast - dark banner with neon blue head
  neon: './icons/dark_1024x400.png',
  // Zanobo Theme (brand): brand identity, emotional, creative - colorful banner
  brand: './icons/colorful_1024x400.png',
  // Light Theme: factual, calm, neutral - light blue/whitish banner
  light: './icons/lightblue_1024x400.png',
  // Focus Theme (Steve Jobs): maximum clarity, focus on action - same light banner as Light Theme
  focus: './icons/lightblue_1024x400.png',
};

export class BannerManager {
  private heroHeader: HTMLElement | null;
  private heroImage: HTMLImageElement | null;
  private uploadButton: HTMLButtonElement | null;
  private uploadInput: HTMLInputElement | null;
  private currentObjectUrl: string | null = null;
  private hasCustomBanner: boolean = false;

  constructor() {
    this.heroHeader = document.querySelector('.hero-header');
    this.heroImage = document.querySelector('.hero-header img');
    this.uploadButton = document.querySelector('#hero-banner-upload-btn');
    this.uploadInput = document.querySelector('#hero-banner-upload-input');

    if (!this.heroImage || !this.uploadButton || !this.uploadInput) {
      logger.warn('⚠️ Hero banner upload UI not found, skipping BannerManager setup');
      return;
    }

    this.bindEvents();
    void this.restoreBannerFromStorage();
  }

  private bindEvents(): void {
    this.uploadButton?.addEventListener('click', () => {
      this.uploadInput?.click();
    });

    this.uploadInput?.addEventListener('change', (event) => {
      void this.handleFileSelection(event);
    });
  }

  private async handleFileSelection(event: Event): Promise<void> {
    const input = event.currentTarget as HTMLInputElement | null;
    const file = input?.files?.[0];

    if (!file) {
      return;
    }

    if (file.type !== 'image/png') {
      notify.error('Format muss 1024x400/500 PNG sein.');
      input.value = '';
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    const img = new Image();

    img.onload = async () => {
      const isValidSize =
        VALID_BANNER_WIDTHS.has(img.width) && VALID_BANNER_HEIGHTS.has(img.height);

      if (!isValidSize) {
        URL.revokeObjectURL(objectUrl);
        notify.error('Format muss 1024x400/500 PNG sein.');
        input.value = '';
        return;
      }

      try {
        await saveAppSetting(HERO_BANNER_SETTING_KEY, file);
        this.setHeroImage(objectUrl);
        this.hasCustomBanner = true;
        notify.success('Bannerbild wurde gespeichert.');
      } catch (error) {
        URL.revokeObjectURL(objectUrl);
        logger.error('❌ Failed to save hero banner', error);
        notify.error('Bannerbild konnte nicht gespeichert werden.', error as Error);
      } finally {
        input.value = '';
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      notify.error('Format muss 1024x400/500 PNG sein.');
      input.value = '';
    };

    img.src = objectUrl;
  }

  private setHeroImage(objectUrl: string): void {
    if (!this.heroImage) {
      return;
    }

    if (this.currentObjectUrl && this.currentObjectUrl !== objectUrl) {
      URL.revokeObjectURL(this.currentObjectUrl);
    }

    this.heroImage.onload = () => {
      this.updateHeroHeight();
    };
    this.heroImage.src = objectUrl;
    this.currentObjectUrl = objectUrl;

    if (this.heroImage.complete) {
      this.updateHeroHeight();
    }
  }

  private async restoreBannerFromStorage(): Promise<void> {
    if (!this.heroImage) {
      return;
    }

    try {
      const stored = await getAppSetting<Blob>(HERO_BANNER_SETTING_KEY);
      if (!stored?.value) {
        this.hasCustomBanner = false;
        this.applyDefaultBanner();
        return;
      }

      const objectUrl = URL.createObjectURL(stored.value);
      this.setHeroImage(objectUrl);
      this.hasCustomBanner = true;
    } catch (error) {
      logger.warn('⚠️ Failed to restore hero banner from storage', error);
      this.hasCustomBanner = false;
      this.applyDefaultBanner();
    }
  }

  private applyDefaultBanner(): void {
    if (!this.heroImage) {
      return;
    }

    const language = getLanguage();
    const isMobile = this.isMobileDevice();

    // Chinese mobile users get a localized banner
    if (language === 'zh' && isMobile) {
      this.setHeroImage(CHINESE_MOBILE_BANNER_PATH);
      return;
    }

    // Apply theme-specific default banner
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'brand';
    const themeBannerPath = THEME_BANNER_PATHS[currentTheme] || DEFAULT_BANNER_PATH;

    this.setHeroImage(themeBannerPath);
  }

  private updateHeroHeight(): void {
    if (!this.heroImage || !this.heroHeader) {
      return;
    }

    const height = this.heroImage.naturalHeight || this.heroImage.height;

    if (height) {
      this.heroHeader.style.setProperty('--hero-banner-height', `${height}px`);
    } else {
      this.heroHeader.style.removeProperty('--hero-banner-height');
    }
  }

  private isMobileDevice(): boolean {
    const userAgentData = (navigator as Navigator & { userAgentData?: { mobile?: boolean } }).userAgentData;

    if (userAgentData?.mobile) {
      return true;
    }

    return /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  }

  /**
   * Apply theme-appropriate banner when theme changes.
   * Only updates the banner if no custom banner has been uploaded by the user.
   */
  public applyThemeBanner(): void {
    if (this.hasCustomBanner) {
      return;
    }
    this.applyDefaultBanner();
  }
}
