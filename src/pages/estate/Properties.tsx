import { Page, PageHeader, StateView } from "@/components/ui";

export default function Properties() {
  return (
    <Page>
      <PageHeader title="Properties" />
      <StateView state="loading" title="Being built" description="This page is part of the Slate build in progress." />
    </Page>
  );
}
