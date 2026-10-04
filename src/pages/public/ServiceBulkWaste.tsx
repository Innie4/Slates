import { Page, PageHeader, StateView } from "@/components/ui";

export default function ServiceBulkWaste() {
  return (
    <Page>
      <PageHeader title="Bulk waste" />
      <StateView state="loading" title="Being built" description="This page is part of the Slate build in progress." />
    </Page>
  );
}
