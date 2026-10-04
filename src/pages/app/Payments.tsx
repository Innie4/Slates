import { Page, PageHeader, StateView } from "@/components/ui";

export default function Payments() {
  return (
    <Page>
      <PageHeader title="Payments" />
      <StateView state="loading" title="Being built" description="This page is part of the Slate build in progress." />
    </Page>
  );
}
