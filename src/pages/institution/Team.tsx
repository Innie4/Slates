import { Page, PageHeader, StateView } from "@/components/ui";

export default function Team() {
  return (
    <Page>
      <PageHeader title="Team" />
      <StateView state="loading" title="Being built" description="This page is part of the Slate build in progress." />
    </Page>
  );
}
