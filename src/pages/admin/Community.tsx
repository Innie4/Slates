import { Page, PageHeader, StateView } from "@/components/ui";

export default function Community() {
  return (
    <Page>
      <PageHeader title="Community projects" />
      <StateView state="loading" title="Being built" description="This page is part of the Slate build in progress." />
    </Page>
  );
}
