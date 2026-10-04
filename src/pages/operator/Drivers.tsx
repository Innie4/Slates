import { Page, PageHeader, StateView } from "@/components/ui";

export default function Drivers() {
  return (
    <Page>
      <PageHeader title="Drivers" />
      <StateView state="loading" title="Being built" description="This page is part of the Slate build in progress." />
    </Page>
  );
}
