import { Page, PageHeader, StateView } from "@/components/ui";

export default function Settings() {
  return (
    <Page>
      <PageHeader title="System settings" />
      <StateView state="loading" title="Being built" description="This page is part of the Slate build in progress." />
    </Page>
  );
}
