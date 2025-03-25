import { Preps } from "../types/common.dt";
import { getPreferenceValues } from "@raycast/api";
import fs from 'fs';

const preps = getPreferenceValues<Preps>();

function getTokenFromFile(tokenKey: string): string | null {
  const tokenFile = preps.feishuTokenFile;
  console.log("tokenFile", tokenFile)
  if (!tokenFile) {
    return null;
  }
  const lines = fs.readFileSync(tokenFile, 'utf8').split('\n');
  for (const line of lines) {
    if (line.startsWith(`${tokenKey}=`)) {
      return line.substring(`${tokenKey}=`.length).trim();
    }
  }
  return null;
}

export function getTenantToken() {
  return getTokenFromFile('TENANT_TOKEN');
}

export function getUserToken() {
  return getTokenFromFile('USER_TOKEN');
}