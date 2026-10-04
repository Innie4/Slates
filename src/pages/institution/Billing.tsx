import { Page, PageHeader, StateView } from "@/components/ui";

export default function Billing() {
  return (
    <Page>
      <PageHeader title="Billing" />
      <StateView state="loading" title="Being built" description="This page is part of the Slate build in progress." />
    </Page>
  );
}
