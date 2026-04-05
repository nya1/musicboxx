## ADDED Requirements

### Requirement: Installable progressive web app

The system SHALL be installable as a PWA via a valid **web app manifest** (name, short name, start URL, display mode, theme/background colors, icons).

#### Scenario: Manifest present

- **WHEN** a client inspects the deployed application
- **THEN** a `manifest` is linked and describes the Musicboxx application identity including the name **Musicboxx**

### Requirement: Icons for install and home screen

The system SHALL provide **maskable** and standard icons at sizes appropriate for mobile home screens and install prompts.

#### Scenario: Install prompt assets

- **WHEN** the user installs the PWA on a supported mobile browser
- **THEN** the installed icon and splash-related theming use the declared manifest icons and colors without broken image placeholders

### Requirement: Service worker for app shell

The system SHALL register a **service worker** that precaches core static assets so the application shell loads when the device is offline or the network is slow.

#### Scenario: Offline shell

- **WHEN** the user opens the installed PWA without network connectivity
- **THEN** the main application shell still loads (navigation chrome and empty/error states as appropriate) even if live metadata or thumbnail fetches cannot complete

### Requirement: Mobile-first responsive layout

The system SHALL present a **single-column**, touch-friendly layout on small viewports, with readable typography and adequate tap targets for primary actions.

#### Scenario: Narrow viewport

- **WHEN** the viewport width matches a typical phone size
- **THEN** lists, forms, and actions remain usable without horizontal scrolling for standard content

### Requirement: Minimalist Vercel-like visual language

The system SHALL use a **minimal** UI: neutral background and borders, restrained use of color (single accent for primary actions), typography-led hierarchy, and sparse chrome consistent with a “Vercel-like” aesthetic.

#### Scenario: Primary action visible

- **WHEN** the user views the main library screen
- **THEN** primary actions (e.g. add via paste) are visually clear without heavy decorative elements or cluttered toolbars

### Requirement: Light and dark appearance

The system SHALL support **light** and **dark** color schemes (system preference with optional in-app toggle) while preserving contrast and the minimalist aesthetic.

#### Scenario: Dark scheme

- **WHEN** the user prefers dark color scheme (system or app setting)
- **THEN** backgrounds, text, and borders adopt dark-scheme tokens without losing readability

### Requirement: Accessible core flows

The system SHALL expose accessible names for interactive controls and SHALL maintain visible focus styles for keyboard/focus navigation on core flows (add song, browse playlists, open in YouTube).

#### Scenario: Add flow

- **WHEN** the user navigates the “add song” flow with assistive technology or keyboard
- **THEN** inputs and buttons have discernible names and focus order is logical
