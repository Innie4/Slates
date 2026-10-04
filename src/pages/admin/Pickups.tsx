import { Page, PageHeader, StateView } from "@/components/ui";

export default function Pickups() {
  return (
    <Page>
      <PageHeader title="Pickup control centre" />
      <StateView state="loading" title="Being built" description="This page is part of the Slate build in progress." />
    </Page>
  );
}
