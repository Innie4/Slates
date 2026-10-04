import { Page, PageHeader, StateView } from "@/components/ui";

export default function Cookies() {
  return (
    <Page>
      <PageHeader title="Cookie policy" />
      <StateView state="loading" title="Being built" description="This page is part of the Slate build in progress." />
    </Page>
  );
}
