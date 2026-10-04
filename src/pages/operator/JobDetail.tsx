import { Page, PageHeader, StateView } from "@/components/ui";

export default function JobDetail() {
  return (
    <Page>
      <PageHeader title="Job" />
      <StateView state="loading" title="Being built" description="This page is part of the Slate build in progress." />
    </Page>
  );
}
