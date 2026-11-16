## ADDED Requirements

### Requirement: Category Navigation Driven by the Categories API

The application SHALL build the navbar category bar (desktop) and the mobile drawer category accordion from `GET /api/v1/categorias`, showing only active categories and their active subtypes, loaded once and shared across components.

#### Scenario: Desktop bar lists registered categories with their subtypes

- **WHEN** a visitor views any public page on viewport >= 768px and the categories request succeeds
- **THEN** the secondary category bar SHALL list the active categories in the order returned by the API, and hovering a category SHALL open a dropdown listing its active subtypes linking to `/catalogo?categoria=<slug>&subcategoria=<subtype name>`

#### Scenario: Category without subtypes

- **WHEN** an active category has no active subtypes
- **THEN** the bar SHALL render it as a plain link to `/catalogo?categoria=<slug>` without chevron or dropdown

#### Scenario: More categories than the bar fits

- **WHEN** there are 7 or more active categories
- **THEN** the bar SHALL show the first 5 categories followed by a "Mais" button, keeping at most 6 items in the bar
- **AND** opening "Mais" (hover, click or keyboard) SHALL show a dropdown listing each remaining category as a link with its subtypes below it
- **AND** the dropdown SHALL close on Escape, on outside click and after a link is chosen

#### Scenario: Six or fewer categories

- **WHEN** there are 6 or fewer active categories
- **THEN** the bar SHALL show all of them and SHALL NOT render the "Mais" button

#### Scenario: Categories request pending or failed

- **WHEN** the categories request is still loading or has failed
- **THEN** the bar SHALL keep the delivery notice and render no category links

#### Scenario: Mobile drawer lists every category

- **WHEN** the user opens the mobile drawer
- **THEN** the accordion SHALL list every active category (no item limit), each expanding to "Ver todos em <categoria>" plus its active subtypes

#### Scenario: Admin session does not leak inactive records

- **WHEN** an Administrator, whose token makes the API return inactive records, browses the public site
- **THEN** the navbar and drawer SHALL still hide inactive categories and inactive subtypes

### Requirement: Home Category Showcase Matched Against Registered Categories

The home category showcase SHALL keep its fixed set of six Figma cards and images, but SHALL only display cards whose category exists among the active categories, linking to the category slug returned by the API.

#### Scenario: Card matches a registered category

- **WHEN** the categories request succeeds and a category's slug, or the slugified category name, equals a card's slug
- **THEN** the card SHALL be displayed and SHALL link to `/catalogo?categoria=<API slug>`

#### Scenario: Card without a registered category

- **WHEN** the categories request succeeds and no active category matches a card
- **THEN** that card SHALL NOT be displayed

#### Scenario: Categories request pending or failed

- **WHEN** the categories request is still loading or has failed
- **THEN** the showcase SHALL display all six fixed cards so the layout does not shift or disappear
