import { Page, PageHeader, StateView } from "@/components/ui";

export default function Chargebacks() {
  return (
    <Page>
      <PageHeader title="Chargebacks" />
      <StateView state="loading" title="Being built" description="This page is part of the Slate build in progress." />
    </Page>
  );
}
