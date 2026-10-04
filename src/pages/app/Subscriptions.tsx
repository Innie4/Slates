import { Page, PageHeader, StateView } from "@/components/ui";

export default function Subscriptions() {
  return (
    <Page>
      <PageHeader title="Subscriptions" />
      <StateView state="loading" title="Being built" description="This page is part of the Slate build in progress." />
    </Page>
  );
}
