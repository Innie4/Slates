import { Page, PageHeader, StateView } from "@/components/ui";

export default function Vehicles() {
  return (
    <Page>
      <PageHeader title="Vehicles" />
      <StateView state="loading" title="Being built" description="This page is part of the Slate build in progress." />
    </Page>
  );
}
