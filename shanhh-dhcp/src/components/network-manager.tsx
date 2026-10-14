import { Action, ActionPanel, Alert, confirmAlert, Icon, List, LocalStorage, showToast, Toast, useNavigation } from "@raycast/api";
import { randomUUID } from "node:crypto";
import { useCallback, useEffect, useState } from "react";
import { getServiceInfo, listNetworkServices, setDhcp, setManual } from "../clients/networksetup-client";
import { NetworkProfile, NetworkServiceInfo } from "../types";
import { parseStoredProfiles } from "../utils/network-profile";
import { ProfileForm } from "./profile-form";

const STORAGE_KEY = "networkProfiles";

export function NetworkManager() {
  const [services, setServices] = useState<NetworkServiceInfo[]>([]);
  const [profiles, setProfiles] = useState<NetworkProfile[]>([]);
  const [serviceDetails, setServiceDetails] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const { push } = useNavigation();

  const reload = useCallback(async () => {
    setIsLoading(true);
    try {
      const [servicesResult, profilesResult] = await Promise.allSettled([listNetworkServices(), LocalStorage.getItem<string>(STORAGE_KEY)]);
      if (servicesResult.status === "fulfilled") {
        const available = servicesResult.value;
        setServices(available);
        const details = await Promise.all(
          available.map(async (service) => {
            try {
              const info = await getServiceInfo(service.name);
              return [service.name, `IP ${info.ipv4} · Router ${info.router} · DNS ${info.dns}`] as const;
            } catch {
              return [service.name, "Network details unavailable"] as const;
            }
          }),
        );
        setServiceDetails(Object.fromEntries(details));
      } else {
        await showToast({
          style: Toast.Style.Failure,
          title: "Could not load network services",
          message: servicesResult.reason instanceof Error ? servicesResult.reason.message : undefined,
        });
      }
      if (profilesResult.status === "fulfilled") {
        try {
          setProfiles(parseStoredProfiles(profilesResult.value));
        } catch (error) {
          await showToast({
            style: Toast.Style.Failure,
            title: "Could not read saved profiles",
            message: error instanceof Error ? error.message : undefined,
          });
        }
      } else {
        await showToast({
          style: Toast.Style.Failure,
          title: "Could not read saved profiles",
          message: profilesResult.reason instanceof Error ? profilesResult.reason.message : undefined,
        });
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  async function saveProfile(value: Omit<NetworkProfile, "id">, id?: string) {
    if (profiles.some((item) => item.id !== id && item.name.toLocaleLowerCase() === value.name.toLocaleLowerCase())) {
      throw new Error("A profile with this name already exists");
    }
    const updated = id ? profiles.map((item) => (item.id === id ? { ...value, id } : item)) : [...profiles, { ...value, id: randomUUID() }];
    await LocalStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    setProfiles(updated);
    await showToast({
      style: Toast.Style.Success,
      title: id ? "Profile updated" : "Profile created",
    });
  }

  function openForm(profile?: NetworkProfile) {
    push(<ProfileForm profile={profile} onSave={(value) => saveProfile(value, profile?.id)} />);
  }

  function openManualPicker(service: string) {
    push(<ManualProfilePicker service={service} profiles={profiles} onApply={(profile) => apply(service, profile)} onCreate={() => openForm()} onEdit={openForm} onDelete={deleteProfile} />);
  }

  async function apply(service: string, profile?: NetworkProfile) {
    const confirmed = await confirmAlert({
      title: profile ? `Apply ${profile.name}?` : "Switch to DHCP?",
      message: `This changes the IPv4 and DNS settings for ${service}.`,
      primaryAction: { title: "Apply", style: Alert.ActionStyle.Destructive },
    });
    if (!confirmed) return;
    const toast = await showToast({
      style: Toast.Style.Animated,
      title: profile ? "Applying manual configuration" : "Enabling DHCP",
    });
    try {
      if (profile) await setManual(service, profile);
      else await setDhcp(service);
      toast.style = Toast.Style.Success;
      toast.title = "Network configuration updated";
      await reload();
    } catch (error) {
      toast.style = Toast.Style.Failure;
      toast.title = "Could not update network configuration";
      toast.message = error instanceof Error ? error.message : undefined;
    }
  }

  async function deleteProfile(profile: NetworkProfile) {
    const confirmed = await confirmAlert({
      title: `Delete ${profile.name}?`,
      primaryAction: { title: "Delete", style: Alert.ActionStyle.Destructive },
    });
    if (!confirmed) return;
    const updated = profiles.filter((item) => item.id !== profile.id);
    await LocalStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    setProfiles(updated);
    await showToast({ style: Toast.Style.Success, title: "Profile deleted" });
  }

  return (
    <List isLoading={isLoading} searchBarPlaceholder="Filter network services and profiles">
      <List.Section title="Network Services">
        {services.map((service) => (
          <List.Item
            key={service.name}
            title={service.name}
            subtitle={serviceDetails[service.name]}
            icon={Icon.Globe}
            accessories={service.device ? [{ text: service.device }] : []}
            actions={
              <ActionPanel>
                {/* eslint-disable-next-line @raycast/prefer-title-case -- DHCP is an acronym and remains uppercase. */}
                <Action title="Select DHCP" icon={Icon.ArrowClockwise} onAction={() => void apply(service.name)} />
                <Action title="Select Manual Configuration" icon={Icon.Network} onAction={() => openManualPicker(service.name)} />
                <Action title="Refresh" icon={Icon.Repeat} onAction={() => void reload()} />
              </ActionPanel>
            }
          />
        ))}
      </List.Section>
      <List.Section title="Manual Profiles" subtitle={`${profiles.length}`}>
        {profiles.map((profile) => (
          <List.Item
            key={profile.id}
            title={profile.name}
            subtitle={`${profile.ipAddress} · ${profile.router}`}
            icon={Icon.Network}
            accessories={[{ text: `DNS ${profile.dnsServers.join(", ")}` }]}
            actions={
              <ActionPanel>
                <Action title="Edit Profile" icon={Icon.Pencil} onAction={() => openForm(profile)} />
                <Action title="Delete Profile" icon={Icon.Trash} style={Action.Style.Destructive} onAction={() => void deleteProfile(profile)} />
              </ActionPanel>
            }
          />
        ))}
      </List.Section>
      <List.EmptyView
        title="No Network Services"
        description="Check your macOS network settings and refresh."
        actions={
          <ActionPanel>
            <Action title="Refresh" onAction={() => void reload()} />
          </ActionPanel>
        }
      />
      <List.Item
        title="Create Manual Profile"
        icon={Icon.Plus}
        actions={
          <ActionPanel>
            <Action title="Create Profile" onAction={() => openForm()} />
          </ActionPanel>
        }
      />
    </List>
  );
}

interface ManualProfilePickerProps {
  service: string;
  profiles: NetworkProfile[];
  onApply: (profile: NetworkProfile) => void;
  onCreate: () => void;
  onEdit: (profile: NetworkProfile) => void;
  onDelete: (profile: NetworkProfile) => void;
}

function ManualProfilePicker({ service, profiles, onApply, onCreate, onEdit, onDelete }: ManualProfilePickerProps) {
  return (
    <List navigationTitle={`Manual Configuration for ${service}`} searchBarPlaceholder="Choose a saved manual profile">
      <List.Section title="Saved Manual Profiles">
        {profiles.map((profile) => (
          <List.Item
            key={profile.id}
            title={profile.name}
            subtitle={`${profile.ipAddress} · ${profile.router}`}
            icon={Icon.Network}
            accessories={[{ text: `DNS ${profile.dnsServers.join(", ")}` }]}
            actions={
              <ActionPanel>
                <Action title="Apply This Profile" icon={Icon.CheckCircle} onAction={() => onApply(profile)} />
                <Action title="Edit Profile" icon={Icon.Pencil} onAction={() => onEdit(profile)} />
                <Action title="Delete Profile" icon={Icon.Trash} style={Action.Style.Destructive} onAction={() => onDelete(profile)} />
              </ActionPanel>
            }
          />
        ))}
      </List.Section>
      <List.Item
        title="Create Manual Profile"
        icon={Icon.Plus}
        actions={
          <ActionPanel>
            <Action title="Create Profile" onAction={onCreate} />
          </ActionPanel>
        }
      />
    </List>
  );
}
