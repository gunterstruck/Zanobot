import { getAppSetting, saveAppSetting } from '@data/db.js';
import { getLanguage } from '../i18n/index.js';
import { notify } from '@utils/notifications.js';
import { logger } from '@utils/logger.js';

const HERO_BANNER_SETTING_KEY = 'hero_banner';
const VALID_BANNER_WIDTHS = new Set([1024]);
const VALID_BANNER_HEIGHTS = new Set([400, 500]);

// Theme-specific banner configurations
const BANNER_CONFIG: Record<string, { default: string; large: string }> = {
  neon: {
    default: './icons/zanobo_banner_1024x400.png',
    large: './icons/zanobo_banner_1024x500.png',
  },
  light: {
    default: './icons/zanobo_banner_1024x400.png',
    large: './icons/zanobo_banner_1024x500.png',
  },
  brand: {
    // Zanobo fun theme - uses cheerful banners when available
    default: './icons/zanobo_banner_fun_de_1024x400.png',
    large: './icons/zanobo_banner_fun_de_1024x500.png',
  },
};

// Fallback banner paths
const FALLBACK_BANNER = './icons/zanobo_banner_1024x400.png';
const CHINESE_MOBILE_BANNER_PATH = './icons/zanobo_cn_1024x400.png';

export class BannerManager {
  private heroHeader: HTMLElement | null;
  private heroImage: HTMLImageElement | null;
  private uploadButton: HTMLButtonElement | null;
  private uploadInput: HTMLInputElement | null;
  private currentObjectUrl: string | null = null;

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
        this.applyDefaultBanner();
        return;
      }

      const objectUrl = URL.createObjectURL(stored.value);
      this.setHeroImage(objectUrl);
    } catch (error) {
      logger.warn('⚠️ Failed to restore hero banner from storage', error);
      this.applyDefaultBanner();
    }
  }

  private applyDefaultBanner(): void {
    if (!this.heroImage) {
      return;
    }

    const language = getLanguage();
    const isMobile = this.isMobileDevice();

    // Chinese mobile has special banner
    if (language === 'zh' && isMobile) {
      this.setHeroImage(CHINESE_MOBILE_BANNER_PATH);
      return;
    }

    // Get current theme
    const theme = document.documentElement.getAttribute('data-theme') || 'neon';
    const config = BANNER_CONFIG[theme] || BANNER_CONFIG.neon;

    // Use larger banner on mobile for emotional impact
    const bannerPath = isMobile ? config.large : config.default;

    // Try to load theme-specific banner, fallback if not found
    this.loadBannerWithFallback(bannerPath);
  }

  private loadBannerWithFallback(primaryPath: string): void {
    if (!this.heroImage) {
      return;
    }

    const img = new Image();
    img.onload = () => {
      this.setHeroImage(primaryPath);
    };
    img.onerror = () => {
      // Fallback to default banner if theme-specific doesn't exist
      logger.info(`Banner ${primaryPath} not found, using fallback`);
      this.setHeroImage(FALLBACK_BANNER);
    };
    img.src = primaryPath;
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
}
