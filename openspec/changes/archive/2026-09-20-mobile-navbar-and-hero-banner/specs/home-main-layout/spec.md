## MODIFIED Requirements

### Requirement: Responsive Base Layout with Figma Identity
The application SHALL render a consistent, responsive layout comprising `AppNavbar` and `AppFooter` themed with Empório Henz's deep navy palette (`#123854`), secondary vibrant blue (`#007CD8`), and warm accents, with dedicated responsive layouts for desktop and mobile viewports.

#### Scenario: Unauthenticated visitor views desktop navigation header
- **WHEN** an unauthenticated visitor accesses any page on viewport >= 768px (md)
- **THEN** `AppNavbar` SHALL display the store logo, centered search input, quick action links ("Sobre a loja", "Salvos", "Minha conta"), and the secondary category bar with dropdown menus on hover

#### Scenario: Unauthenticated visitor views mobile navigation header
- **WHEN** an unauthenticated visitor accesses any page on viewport < 768px (mobile)
- **THEN** `AppNavbar` SHALL display a top row with hamburger button (`[☰]`), centered logo, and action icons for "Salvos" (`[♥]`) and "Minha conta" (`[👤]`), followed by a full-width search bar row and the centered delivery notice banner

#### Scenario: Authenticated user views mobile navigation header
- **WHEN** an authenticated user accesses any page on viewport < 768px
- **THEN** `AppNavbar` SHALL display the user's avatar initial in the top-right profile icon and provide account options within the mobile drawer

#### Scenario: Complete institutional footer
- **WHEN** a user scrolls to the bottom of the page
- **THEN** `AppFooter` SHALL display the store address in Cruzeiro do Sul - RS, business hours, social links, and a subtle portal link for internal team access

### Requirement: High-End Home Showcase Page
The application SHALL provide a rich `HomeView` at `/` showcasing hero banner, environments, and highlighted furniture collections, with segregated desktop and mobile hero banner components.

#### Scenario: Visitor views desktop hero banner
- **WHEN** a user navigates to `/` on viewport >= 768px (md)
- **THEN** the page SHALL present `HeroBannerDesktop` featuring the 12-column grid, 3-seater sofa scene (`hero-furniture.png`), title, and floating 3-benefit card ("Receba montado", "Sinta as amostras", "Parcele em até 10x")

#### Scenario: Visitor views mobile hero banner
- **WHEN** a user navigates to `/` on viewport < 768px (mobile)
- **THEN** the page SHALL present `HeroBannerMobile` featuring the vertical 26px typography, organic navy backdrop, cropped armchair scene (`hero-banner-mobile.png`), and SHALL NOT render the 3-benefit card inside the banner

#### Scenario: Category showcase grid alignment on mobile
- **WHEN** a user views the category showcase grid on viewport < 768px
- **THEN** the category showcase grid SHALL render in 2 columns with non-overlapping positive top margin, white card background, and navy bottom label with right chevron

## ADDED Requirements

### Requirement: Mobile Drawer Navigation Menu
The application SHALL provide an off-canvas drawer navigation menu accessible via the hamburger icon on mobile viewports (< 768px) adhering to the visual design in `munu-mobile.png`.

#### Scenario: User opens mobile drawer menu
- **WHEN** the user clicks the hamburger button (`[☰]`) on mobile
- **THEN** a drawer menu SHALL slide in from the left over a dimmed backdrop, featuring a navy header (`#123854`) with the Empório Henz logo and a secondary blue body (`#007CD8`)

#### Scenario: User toggles category accordion in mobile drawer
- **WHEN** the user clicks a category item in the drawer
- **THEN** the drawer SHALL expand the subcategories accordion with animated transition and rotate the chevron indicator

#### Scenario: User navigates or closes drawer
- **WHEN** the user selects a category, subcategory, or clicks the backdrop
- **THEN** the navigation SHALL transition to the destination and automatically close the drawer
