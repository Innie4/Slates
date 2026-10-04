import { Page, PageHeader, StateView } from "@/components/ui";

export default function ServiceHouseholds() {
  return (
    <Page>
      <PageHeader title="Households" />
      <StateView state="loading" title="Being built" description="This page is part of the Slate build in progress." />
    </Page>
  );
}
