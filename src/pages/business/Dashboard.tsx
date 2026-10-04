import { Page, PageHeader, StateView } from "@/components/ui";

export default function Dashboard() {
  return (
    <Page>
      <PageHeader title="Overview" />
      <StateView state="loading" title="Being built" description="This page is part of the Slate build in progress." />
    </Page>
  );
}
