import { Page, PageHeader, StateView } from "@/components/ui";

export default function Compliance() {
  return (
    <Page>
      <PageHeader title="Compliance centre" />
      <StateView state="loading" title="Being built" description="This page is part of the Slate build in progress." />
    </Page>
  );
}
