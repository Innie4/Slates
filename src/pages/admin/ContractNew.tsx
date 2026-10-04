import { Page, PageHeader, StateView } from "@/components/ui";

export default function ContractNew() {
  return (
    <Page>
      <PageHeader title="New contract" />
      <StateView state="loading" title="Being built" description="This page is part of the Slate build in progress." />
    </Page>
  );
}
