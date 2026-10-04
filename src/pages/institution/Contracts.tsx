import { Page, PageHeader, StateView } from "@/components/ui";

export default function Contracts() {
  return (
    <Page>
      <PageHeader title="Contracts" />
      <StateView state="loading" title="Being built" description="This page is part of the Slate build in progress." />
    </Page>
  );
}
