import { Page, PageHeader, StateView } from "@/components/ui";

export default function OperatorVerification() {
  return (
    <Page>
      <PageHeader title="Operator verification" />
      <StateView state="loading" title="Being built" description="This page is part of the Slate build in progress." />
    </Page>
  );
}
