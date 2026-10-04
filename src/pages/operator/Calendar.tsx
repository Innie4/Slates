import { Page, PageHeader, StateView } from "@/components/ui";

export default function Calendar() {
  return (
    <Page>
      <PageHeader title="Calendar" />
      <StateView state="loading" title="Being built" description="This page is part of the Slate build in progress." />
    </Page>
  );
}
