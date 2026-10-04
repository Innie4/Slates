import { Page, PageHeader, StateView } from "@/components/ui";

export default function PaymentDetail() {
  return (
    <Page>
      <PageHeader title="Payment" />
      <StateView state="loading" title="Being built" description="This page is part of the Slate build in progress." />
    </Page>
  );
}
