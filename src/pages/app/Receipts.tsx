import { Page, PageHeader, StateView } from "@/components/ui";

export default function Receipts() {
  return (
    <Page>
      <PageHeader title="Receipts" />
      <StateView state="loading" title="Being built" description="This page is part of the Slate build in progress." />
    </Page>
  );
}
