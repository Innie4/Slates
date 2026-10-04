import { Page, PageHeader, StateView } from "@/components/ui";

export default function Profile() {
  return (
    <Page>
      <PageHeader title="Profile" />
      <StateView state="loading" title="Being built" description="This page is part of the Slate build in progress." />
    </Page>
  );
}
