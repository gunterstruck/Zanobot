/**
 * ABOUT MODAL CONTROLLER
 *
 * Dynamically renders the "About Zanobo" modal content
 * based on the current language using i18n translations.
 */

import { t, getLanguage, onLanguageChange } from '../../i18n/index.js';

export class AboutModalController {
  private modalBody: HTMLElement | null = null;

  constructor() {
    this.modalBody = document.querySelector('#about-modal .modal-body');

    if (this.modalBody) {
      // Initial render
      this.render();

      // Re-render when language changes
      onLanguageChange(() => {
        this.render();
      });
    }
  }

  /**
   * Render the About modal content dynamically
   */
  private render(): void {
    if (!this.modalBody) return;

    // Get current language
    const lang = getLanguage();

    // Build HTML content
    const html = `
      <div class="about-hero">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="var(--primary-color)" stroke-width="2">
          <circle cx="12" cy="12" r="9"/>
          <circle cx="12" cy="12" r="3"/>
          <path d="M12 1v6m0 6v10M1 12h6m6 0h10"/>
        </svg>
        <h4>ZANOBO 2.0</h4>
        <p class="about-subtitle">${t('about.subtitle')}</p>
      </div>

      <p>${t('about.intro')}</p>

      <h4>${t('about.coreFeaturesTitle')}</h4>
      <ul>
        <li>${t('about.coreFeatures.offlineFirst')}</li>
        <li>${t('about.coreFeatures.similarityScore')}</li>
        <li>${t('about.coreFeatures.userThreshold')}</li>
        <li>${t('about.coreFeatures.visualFeedback')}</li>
        <li>${t('about.coreFeatures.noDataLeaks')}</li>
      </ul>

      <h4>${t('about.legalTitle')}</h4>
      <p>${t('about.legalIntro')}</p>
      <p>${t('about.legalReview')}</p>

      <h5>${t('about.ipTableTitle')}</h5>
      ${this.renderIPTable()}

      <h4>${t('about.transparencyTitle')}</h4>
      <p>${t('about.transparencyText1')}</p>
      <p>${t('about.transparencyText2')}</p>

      <p style="margin-top: 1.5rem;">
        <strong>${t('about.publicInstance')}</strong>
        <a href="${t('about.publicInstanceUrl')}" target="_blank" rel="noopener noreferrer" style="color: var(--primary-color);">
          ${t('about.publicInstanceUrl')}
        </a>
      </p>

      <div class="about-version">
        <p><strong>${t('about.version')}</strong> ${t('about.versionNumber')}</p>
        <p><strong>${t('about.developedBy')}</strong> ${t('about.developerName')}</p>
        <p><strong>${t('about.license')}</strong> ${t('about.licenseType')}</p>
        <p><strong>${t('about.stack')}</strong> ${t('about.stackTech')}</p>
      </div>
    `;

    this.modalBody.innerHTML = html;
  }

  /**
   * Render the IP comparison table
   */
  private renderIPTable(): string {
    const headers = {
      reference: t('about.ipTable.headers.reference'),
      source: t('about.ipTable.headers.source'),
      protectedScope: t('about.ipTable.headers.protectedScope'),
      zanoboDiff: t('about.ipTable.headers.zanoboDiff'),
    };

    // We have 5 rows (0-4) stored as object keys in i18n
    const rowIndices = ['0', '1', '2', '3', '4'];

    return `
      <div style="overflow-x: auto;">
        <table style="width: 100%; border-collapse: collapse; margin: 1rem 0; font-size: 0.9em;">
          <thead>
            <tr style="background: var(--surface-color); border-bottom: 2px solid var(--border-color);">
              <th style="padding: 0.75rem; text-align: left; border: 1px solid var(--border-color);">${headers.reference}</th>
              <th style="padding: 0.75rem; text-align: left; border: 1px solid var(--border-color);">${headers.source}</th>
              <th style="padding: 0.75rem; text-align: left; border: 1px solid var(--border-color);">${headers.protectedScope}</th>
              <th style="padding: 0.75rem; text-align: left; border: 1px solid var(--border-color);">${headers.zanoboDiff}</th>
            </tr>
          </thead>
          <tbody>
            ${rowIndices.map((index) => `
              <tr style="border-bottom: 1px solid var(--border-color);">
                <td style="padding: 0.75rem; border: 1px solid var(--border-color);">${t(`about.ipTable.rows.${index}.reference`)}</td>
                <td style="padding: 0.75rem; border: 1px solid var(--border-color);">${t(`about.ipTable.rows.${index}.source`)}</td>
                <td style="padding: 0.75rem; border: 1px solid var(--border-color);">${t(`about.ipTable.rows.${index}.protectedScope`)}</td>
                <td style="padding: 0.75rem; border: 1px solid var(--border-color);">${t(`about.ipTable.rows.${index}.zanoboDiff`)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }
}
