# GitHub Data Finder

A web app for looking up any GitHub user's public profile — avatar, bio,
stats, and top repositories — by username.

## Features

- Profile card with avatar, bio, location, company, blog, join date, and an
  "open to work" badge when set
- Follower/following/repo/gist stat tiles
- Top 6 public repositories (by stars), with language, star/fork counts, and
  last-updated time
- Quick-start example usernames and a persisted "recent searches" history
- Loading, error (not found / rate limited / network), and empty states
- Copy-profile-link and raw-JSON shortcuts
- Light/dark theme, persisted and applied before first paint
- Responsive layout down to mobile widths

## Usage

1. Enter a GitHub username in the search bar (or pick an example/recent chip)
   and submit.
2. The app fetches the user's public data and top repositories from the
   [GitHub REST API](https://docs.github.com/en/rest/users/users) and renders
   them below.
3. Toggle the switch in the header to flip between light and dark theme.

## Getting started

```bash
npm install
npm run dev    # starts a local dev server with hot reload
npm run build  # produces a production build in dist/
```

Built with [Parcel](https://parceljs.org/).

## Project structure

- [index.html](index.html) — app markup and entry point
- [scripts/main.js](scripts/main.js) — fetches GitHub data and renders the
  profile card, repo grid, and empty/loading/error states
- [scripts/theme.js](scripts/theme.js) — light/dark theme toggle
- [styles/](styles/) — base reset ([normalize.css](styles/normalize.css)),
  design tokens and theme colors ([theme.css](styles/theme.css)), and layout
  and component styles ([main.css](styles/main.css))

## License

MIT — see [LICENSE.txt](LICENSE.txt).
