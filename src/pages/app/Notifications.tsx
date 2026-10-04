import { Page, PageHeader, StateView } from "@/components/ui";

export default function Notifications() {
  return (
    <Page>
      <PageHeader title="Notifications" />
      <StateView state="loading" title="Being built" description="This page is part of the Slate build in progress." />
    </Page>
  );
}
