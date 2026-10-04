import { Page, PageHeader, StateView } from "@/components/ui";

export default function Analytics() {
  return (
    <Page>
      <PageHeader title="Analytics" />
      <StateView state="loading" title="Being built" description="This page is part of the Slate build in progress." />
    </Page>
  );
}
