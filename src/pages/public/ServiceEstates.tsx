import { Page, PageHeader, StateView } from "@/components/ui";

export default function ServiceEstates() {
  return (
    <Page>
      <PageHeader title="Estates" />
      <StateView state="loading" title="Being built" description="This page is part of the Slate build in progress." />
    </Page>
  );
}
