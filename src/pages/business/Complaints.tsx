import { Page, PageHeader, StateView } from "@/components/ui";

export default function Complaints() {
  return (
    <Page>
      <PageHeader title="Complaints" />
      <StateView state="loading" title="Being built" description="This page is part of the Slate build in progress." />
    </Page>
  );
}
