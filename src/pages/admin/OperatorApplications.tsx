import { Page, PageHeader, StateView } from "@/components/ui";

export default function OperatorApplications() {
  return (
    <Page>
      <PageHeader title="Operator applications" />
      <StateView state="loading" title="Being built" description="This page is part of the Slate build in progress." />
    </Page>
  );
}
