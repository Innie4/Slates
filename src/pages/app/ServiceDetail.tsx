import { Page, PageHeader, StateView } from "@/components/ui";

export default function ServiceDetail() {
  return (
    <Page>
      <PageHeader title="Service" />
      <StateView state="loading" title="Being built" description="This page is part of the Slate build in progress." />
    </Page>
  );
}
