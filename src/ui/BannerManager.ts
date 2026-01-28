import { getAppSetting, saveAppSetting } from '@data/db.js';
import { getLanguage } from '../i18n/index.js';
import { notify } from '@utils/notifications.js';
import { logger } from '@utils/logger.js';

const HERO_BANNER_SETTING_KEY = 'hero_banner';
const VALID_BANNER_WIDTH = 1024;
const VALID_BANNER_HEIGHTS = new Set([400, 500]);
const DEFAULT_BANNER_PATH = './icons/zanobo_banner_1024x400.png';
const CHINESE_MOBILE_BANNER_PATH = './icons/zanobo_cn_1024x400.png';

export class BannerManager {
  private heroImage: HTMLImageElement | null;
  private uploadButton: HTMLButtonElement | null;
  private uploadInput: HTMLInputElement | null;
  private currentObjectUrl: string | null = null;

  constructor() {
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
      notify.error('Format muss 1024x500 oder 1024x400 PNG sein.');
      input.value = '';
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    const img = new Image();

    img.onload = async () => {
      const isValidSize =
        img.width === VALID_BANNER_WIDTH && VALID_BANNER_HEIGHTS.has(img.height);

      if (!isValidSize) {
        URL.revokeObjectURL(objectUrl);
        notify.error('Format muss 1024x500 oder 1024x400 PNG sein.');
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
      notify.error('Format muss 1024x500 oder 1024x400 PNG sein.');
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

    this.heroImage.src = objectUrl;
    this.currentObjectUrl = objectUrl;
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
    const defaultPath = language === 'zh' && isMobile
      ? CHINESE_MOBILE_BANNER_PATH
      : DEFAULT_BANNER_PATH;

    this.setHeroImage(defaultPath);
  }

  private isMobileDevice(): boolean {
    if (navigator.userAgentData?.mobile) {
      return true;
    }

    return /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  }
}
