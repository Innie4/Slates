import { Page, PageHeader, StateView } from "@/components/ui";

export default function CustomerDetail() {
  return (
    <Page>
      <PageHeader title="Customer" />
      <StateView state="loading" title="Being built" description="This page is part of the Slate build in progress." />
    </Page>
  );
}
