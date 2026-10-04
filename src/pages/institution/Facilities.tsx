import { Page, PageHeader, StateView } from "@/components/ui";

export default function Facilities() {
  return (
    <Page>
      <PageHeader title="Facilities" />
      <StateView state="loading" title="Being built" description="This page is part of the Slate build in progress." />
    </Page>
  );
}
