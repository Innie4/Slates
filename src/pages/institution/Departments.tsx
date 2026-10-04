import { Page, PageHeader, StateView } from "@/components/ui";

export default function Departments() {
  return (
    <Page>
      <PageHeader title="Departments" />
      <StateView state="loading" title="Being built" description="This page is part of the Slate build in progress." />
    </Page>
  );
}
