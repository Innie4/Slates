import { Page, PageHeader, StateView } from "@/components/ui";

export default function Recycling() {
  return (
    <Page>
      <PageHeader title="Recycling" />
      <StateView state="loading" title="Being built" description="This page is part of the Slate build in progress." />
    </Page>
  );
}
