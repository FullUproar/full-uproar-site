/**
 * Responsive CSS styles for Game Kit pages
 * These are injected as global styles via <style> tags
 */

export const gameKitResponsiveCSS = `
  /* ==========================================================================
     ACCESSIBILITY: Focus styles for keyboard navigation
     ========================================================================== */

  /* Ensure all interactive elements have visible focus */
  .gk-container button:focus-visible,
  .gk-container a:focus-visible,
  .gk-container input:focus-visible,
  .gk-container select:focus-visible,
  .gk-container textarea:focus-visible,
  .gk-container [tabindex]:focus-visible {
    outline: 2px solid #f97316 !important;
    outline-offset: 2px !important;
  }

  /* Remove focus ring for mouse users, keep for keyboard users */
  .gk-container button:focus:not(:focus-visible),
  .gk-container a:focus:not(:focus-visible),
  .gk-container input:focus:not(:focus-visible) {
    outline: none !important;
  }

  /* High contrast focus for cards */
  .gk-container .gk-card-interactive:focus-visible {
    outline: 3px solid #f97316 !important;
    outline-offset: 3px !important;
    box-shadow: 0 0 0 6px rgba(249, 115, 22, 0.2) !important;
  }

  /* Skip link for screen readers */
  .gk-skip-link {
    position: absolute !important;
    top: -100px !important;
    left: 50% !important;
    transform: translateX(-50%) !important;
    background: #f97316 !important;
    color: #000 !important;
    padding: 12px 24px !important;
    border-radius: 8px !important;
    z-index: 9999 !important;
    font-weight: bold !important;
  }

  .gk-skip-link:focus {
    top: 10px !important;
  }

  /* ==========================================================================
     MOBILE STYLES
     ========================================================================== */

  /* Mobile breakpoint: 768px and below */
  @media (max-width: 768px) {
    /* General layout fixes */
    .gk-container {
      padding: 16px !important;
    }

    .gk-header {
      padding: 12px 16px !important;
      flex-wrap: wrap !important;
      gap: 12px !important;
    }

    .gk-main {
      padding: 16px !important;
      gap: 16px !important;
    }

    /* Title sizes */
    .gk-title {
      font-size: 24px !important;
    }

    .gk-subtitle {
      font-size: 14px !important;
    }

    /* Room code display - Host view */
    .gk-room-code {
      font-size: 32px !important;
      letter-spacing: 4px !important;
    }

    .gk-room-code-display {
      flex-direction: column !important;
      align-items: center !important;
      gap: 8px !important;
      text-align: center !important;
    }

    /* Lobby layout - stack on mobile */
    .gk-lobby-content {
      flex-direction: column !important;
      gap: 24px !important;
    }

    .gk-sidebar {
      width: 100% !important;
      order: -1 !important; /* Put sidebar (QR/join info) first on mobile */
    }

    /* Player grid - smaller cards on mobile */
    .gk-players-grid {
      grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)) !important;
      gap: 12px !important;
    }

    .gk-player-card {
      padding: 12px !important;
    }

    .gk-player-avatar {
      width: 48px !important;
      height: 48px !important;
      font-size: 24px !important;
    }

    .gk-player-name {
      font-size: 14px !important;
    }

    /* Template grid */
    .gk-template-grid {
      grid-template-columns: 1fr !important;
      gap: 16px !important;
    }

    /* Game card grid */
    .gk-game-grid {
      grid-template-columns: 1fr !important;
      gap: 16px !important;
    }

    /* Card hand - smaller cards on mobile */
    .gk-card-in-hand {
      width: 100px !important;
      min-height: 140px !important;
      padding: 10px !important;
      font-size: 12px !important;
    }

    /* Buttons - full width on mobile */
    .gk-button-row {
      flex-direction: column !important;
      gap: 8px !important;
    }

    .gk-button-row button {
      width: 100% !important;
    }

    /* Header actions - wrap better */
    .gk-header-actions {
      flex-wrap: wrap !important;
      gap: 8px !important;
      justify-content: flex-end !important;
    }

    /* Join page code input */
    .gk-code-input {
      width: 40px !important;
      height: 54px !important;
      font-size: 22px !important;
    }

    /* QR card */
    .gk-qr-card {
      padding: 16px !important;
    }

    .gk-qr-placeholder {
      width: 150px !important;
      height: 150px !important;
    }

    /* Scoreboard - horizontal scroll on mobile */
    .gk-scoreboard {
      overflow-x: auto !important;
      padding-bottom: 8px !important;
    }

    /* Modal adjustments */
    .gk-modal-content {
      padding: 20px !important;
      margin: 16px !important;
      max-height: 90vh !important;
      overflow-y: auto !important;
    }

    /* Section titles */
    .gk-section-title {
      font-size: 12px !important;
    }

    /* Stats row */
    .gk-stats-row {
      gap: 16px !important;
      flex-wrap: wrap !important;
      justify-content: center !important;
    }

    /* Game area */
    .gk-game-area {
      flex-direction: column !important;
      gap: 20px !important;
    }

    /* IRL players section */
    .gk-irl-section {
      padding: 12px !important;
    }

    .gk-irl-input-row {
      flex-direction: column !important;
      gap: 8px !important;
    }

    .gk-irl-input-row input {
      width: 100% !important;
    }

    .gk-irl-input-row button {
      width: 100% !important;
    }

    /* Builder page - complex layout */
    .gk-builder-header {
      padding: 12px 16px !important;
      flex-wrap: wrap !important;
      gap: 12px !important;
    }

    .gk-builder-header-left {
      width: 100% !important;
      justify-content: space-between !important;
    }

    .gk-builder-header-right {
      width: 100% !important;
      justify-content: flex-end !important;
      flex-wrap: wrap !important;
      gap: 8px !important;
    }

    .gk-builder-header-right button {
      padding: 8px 12px !important;
      font-size: 12px !important;
    }

    .gk-builder-main {
      flex-direction: column !important;
    }

    .gk-builder-sidebar {
      display: none !important;
    }

    .gk-builder-sidebar.gk-sidebar-visible {
      display: flex !important;
      position: fixed !important;
      left: 0 !important;
      top: 0 !important;
      bottom: 0 !important;
      width: 280px !important;
      z-index: 100 !important;
      box-shadow: 4px 0 20px rgba(0,0,0,0.5) !important;
    }

    .gk-builder-canvas {
      min-height: 60vh !important;
    }

    .gk-builder-properties {
      position: fixed !important;
      bottom: 0 !important;
      left: 0 !important;
      right: 0 !important;
      max-height: 50vh !important;
      overflow-y: auto !important;
      z-index: 50 !important;
      border-radius: 16px 16px 0 0 !important;
      box-shadow: 0 -4px 20px rgba(0,0,0,0.3) !important;
    }

    .gk-builder-tab-bar {
      overflow-x: auto !important;
      -webkit-overflow-scrolling: touch !important;
    }

    .gk-builder-tab {
      white-space: nowrap !important;
      flex-shrink: 0 !important;
    }

    /* Components tab on mobile */
    .gk-components-container {
      padding: 16px !important;
    }

    .gk-quick-add-section {
      padding: 16px !important;
    }

    .gk-quick-add-buttons {
      flex-wrap: wrap !important;
    }

    /* Card editor table */
    .gk-card-editor-table {
      font-size: 12px !important;
    }

    .gk-card-editor-table th,
    .gk-card-editor-table td {
      padding: 8px !important;
    }
  }

  /* Extra small screens: 480px and below */
  @media (max-width: 480px) {
    .gk-room-code {
      font-size: 24px !important;
      letter-spacing: 2px !important;
    }

    .gk-header {
      padding: 10px 12px !important;
    }

    .gk-logo {
      font-size: 18px !important;
    }

    .gk-join-url {
      font-size: 14px !important;
    }

    .gk-players-grid {
      grid-template-columns: repeat(2, 1fr) !important;
    }

    .gk-player-avatar {
      width: 40px !important;
      height: 40px !important;
      font-size: 20px !important;
    }

    .gk-card-in-hand {
      width: 85px !important;
      min-height: 120px !important;
      padding: 8px !important;
      font-size: 11px !important;
    }

    .gk-code-input {
      width: 36px !important;
      height: 48px !important;
      font-size: 20px !important;
    }

    .gk-qr-placeholder {
      width: 120px !important;
      height: 120px !important;
    }
  }

  /* Tablet: 769px to 1024px */
  @media (min-width: 769px) and (max-width: 1024px) {
    .gk-lobby-content {
      gap: 24px !important;
    }

    .gk-sidebar {
      width: 280px !important;
    }

    .gk-room-code {
      font-size: 40px !important;
      letter-spacing: 6px !important;
    }
  }
`;

/**
 * Component to inject responsive styles
 * Use: <ResponsiveStyles />
 */
export const ResponsiveStylesTag = () => `
  <style jsx global>{\`${gameKitResponsiveCSS}\`}</style>
`;
