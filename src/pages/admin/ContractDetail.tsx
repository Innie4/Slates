import { Page, PageHeader, StateView } from "@/components/ui";

export default function ContractDetail() {
  return (
    <Page>
      <PageHeader title="Contract" />
      <StateView state="loading" title="Being built" description="This page is part of the Slate build in progress." />
    </Page>
  );
}
