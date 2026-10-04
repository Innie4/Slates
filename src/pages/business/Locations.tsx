import { Page, PageHeader, StateView } from "@/components/ui";

export default function Locations() {
  return (
    <Page>
      <PageHeader title="Locations" />
      <StateView state="loading" title="Being built" description="This page is part of the Slate build in progress." />
    </Page>
  );
}
