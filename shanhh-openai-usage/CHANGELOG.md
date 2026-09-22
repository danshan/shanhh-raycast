# Changelog

## Unreleased

- Compare weekly quota remaining with time until reset using aligned progress bars and daily ticks.
- Select the weekly window by duration, retain quota display without token history, and suppress pacing advice for invalid or expired reset times.

## 1.0.0

- Add personal ChatGPT Codex usage limits, token analytics, daily token usage, and configurable Codex binary path.
- Replace the daily token list with a local 30-day SVG dashboard chart.
- Split each rate-limit window into separate remaining and reset metadata fields.
- Show available rate-limit reset credits and add a local SVG progress bar for the primary limit.
- Show reset-credit expiration times in the dashboard.
