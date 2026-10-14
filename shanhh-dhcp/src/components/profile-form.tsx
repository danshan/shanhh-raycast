import { Action, ActionPanel, Form, showToast, Toast, useNavigation } from "@raycast/api";
import { NetworkProfile } from "../types";
import { parseDnsServers, validateProfile } from "../utils/network-profile";

interface Props {
  profile?: NetworkProfile;
  onSave: (profile: Omit<NetworkProfile, "id">) => Promise<void>;
}

export function ProfileForm({ profile, onSave }: Props) {
  const { pop } = useNavigation();
  async function handleSubmit(values: { name: string; ipAddress: string; subnetMask: string; router: string; dnsServers: string }) {
    const candidate = {
      ...values,
      name: values.name.trim(),
      dnsServers: parseDnsServers(values.dnsServers),
    };
    const error = validateProfile(candidate);
    if (error)
      return void showToast({
        style: Toast.Style.Failure,
        title: "Invalid manual profile",
        message: error,
      });
    try {
      await onSave(candidate);
      pop();
    } catch (error) {
      await showToast({
        style: Toast.Style.Failure,
        title: "Could not save profile",
        message: error instanceof Error ? error.message : undefined,
      });
    }
  }

  return (
    <Form
      navigationTitle={profile ? "Edit Network Profile" : "Create Network Profile"}
      actions={
        <ActionPanel>
          <Action.SubmitForm title="Save Profile" onSubmit={handleSubmit} />
        </ActionPanel>
      }
    >
      <Form.TextField id="name" title="Profile Name" defaultValue={profile?.name} />
      <Form.TextField id="ipAddress" title="IP Address" defaultValue={profile?.ipAddress} />
      <Form.TextField id="subnetMask" title="Subnet Mask" defaultValue={profile?.subnetMask} placeholder="255.255.255.0" />
      <Form.TextField id="router" title="Router" defaultValue={profile?.router} />
      <Form.TextField id="dnsServers" title="DNS Servers" defaultValue={profile?.dnsServers.join(", ")} placeholder="1.1.1.1, 8.8.8.8" />
      <Form.Description text="Enter DNS servers separated by commas or spaces." />
    </Form>
  );
}
