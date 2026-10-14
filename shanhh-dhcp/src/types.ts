export interface NetworkProfile {
  id: string;
  name: string;
  ipAddress: string;
  subnetMask: string;
  router: string;
  dnsServers: string[];
}

export interface NetworkServiceInfo {
  name: string;
  hardwarePort: string;
  device: string;
}
