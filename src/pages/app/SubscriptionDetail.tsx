import { Page, PageHeader, StateView } from "@/components/ui";

export default function SubscriptionDetail() {
  return (
    <Page>
      <PageHeader title="Subscription" />
      <StateView state="loading" title="Being built" description="This page is part of the Slate build in progress." />
    </Page>
  );
}
