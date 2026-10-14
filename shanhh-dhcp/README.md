# Shanhh DHCP

Shanhh DHCP lists macOS network services, switches a selected service to DHCP, and saves named manual IPv4 profiles.

## Features

- Switch a network service to DHCP.
- Create, edit, and delete named manual profiles with IPv4 address, subnet mask, router, and DNS servers.
- Apply a saved profile to a selected network service after confirmation.
- Keep profiles in Raycast LocalStorage, isolated to this Extension.

System configuration uses `/usr/sbin/networksetup`. macOS may require authorization to apply changes. This Extension manages IPv4 and DNS settings; it does not modify IPv6, proxies, or search domains.

## Development

```bash
npm ci
npm run dev
npm test
npm run lint
npm run build
```

Publishing with `npm run publish` has remote effects and requires explicit authorization.
