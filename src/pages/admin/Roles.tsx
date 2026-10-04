import { Page, PageHeader, StateView } from "@/components/ui";

export default function Roles() {
  return (
    <Page>
      <PageHeader title="Roles & permissions" />
      <StateView state="loading" title="Being built" description="This page is part of the Slate build in progress." />
    </Page>
  );
}
