# Changelog

## Unreleased

- Render missing token records and their legend as borderless white cells in both themes.
- Compare weekly quota remaining with time until reset using aligned progress bars and daily ticks.
- Select the weekly window by duration, retain quota display without token history, and suppress pacing advice for invalid or expired reset times.
- Replace the 30-day daily token bar chart with a local 365-day GitHub-style heatmap aligned to the latest API start date, with ten positive intensity levels, distinct zero and missing states, a data-through date, and a legend.

## 1.0.0

- Add personal ChatGPT Codex usage limits, token analytics, daily token usage, and configurable Codex binary path.
- Replace the daily token list with a local 30-day SVG dashboard chart.
- Split each rate-limit window into separate remaining and reset metadata fields.
- Show available rate-limit reset credits and add a local SVG progress bar for the primary limit.
- Show reset-credit expiration times in the dashboard.
