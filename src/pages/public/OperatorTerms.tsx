import { Page, PageHeader, StateView } from "@/components/ui";

export default function OperatorTerms() {
  return (
    <Page>
      <PageHeader title="Operator terms" />
      <StateView state="loading" title="Being built" description="This page is part of the Slate build in progress." />
    </Page>
  );
}
