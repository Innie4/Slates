import { Page, PageHeader, StateView } from "@/components/ui";

export default function Payouts() {
  return (
    <Page>
      <PageHeader title="Payouts" />
      <StateView state="loading" title="Being built" description="This page is part of the Slate build in progress." />
    </Page>
  );
}
