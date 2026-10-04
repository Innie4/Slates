import { Page, PageHeader, StateView } from "@/components/ui";

export default function ServiceBusinesses() {
  return (
    <Page>
      <PageHeader title="Businesses" />
      <StateView state="loading" title="Being built" description="This page is part of the Slate build in progress." />
    </Page>
  );
}
