import { Page, PageHeader, StateView } from "@/components/ui";

export default function Jobs() {
  return (
    <Page>
      <PageHeader title="Jobs" />
      <StateView state="loading" title="Being built" description="This page is part of the Slate build in progress." />
    </Page>
  );
}
