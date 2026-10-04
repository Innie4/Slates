import { Page, PageHeader, StateView } from "@/components/ui";

export default function Cities() {
  return (
    <Page>
      <PageHeader title="Cities" />
      <StateView state="loading" title="Being built" description="This page is part of the Slate build in progress." />
    </Page>
  );
}
