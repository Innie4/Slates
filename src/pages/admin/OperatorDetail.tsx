import { Page, PageHeader, StateView } from "@/components/ui";

export default function OperatorDetail() {
  return (
    <Page>
      <PageHeader title="Operator" />
      <StateView state="loading" title="Being built" description="This page is part of the Slate build in progress." />
    </Page>
  );
}
