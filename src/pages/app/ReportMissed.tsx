import { Page, PageHeader, StateView } from "@/components/ui";

export default function ReportMissed() {
  return (
    <Page>
      <PageHeader title="Report missed pickup" />
      <StateView state="loading" title="Being built" description="This page is part of the Slate build in progress." />
    </Page>
  );
}
