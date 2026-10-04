import { Page, PageHeader, StateView } from "@/components/ui";

export default function ServiceAreas() {
  return (
    <Page>
      <PageHeader title="Service areas" />
      <StateView state="loading" title="Being built" description="This page is part of the Slate build in progress." />
    </Page>
  );
}
