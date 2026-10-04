import { Page, PageHeader, StateView } from "@/components/ui";

export default function ComplaintDetail() {
  return (
    <Page>
      <PageHeader title="Complaint" />
      <StateView state="loading" title="Being built" description="This page is part of the Slate build in progress." />
    </Page>
  );
}
