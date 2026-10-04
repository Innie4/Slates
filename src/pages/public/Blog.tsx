import { Page, PageHeader, StateView } from "@/components/ui";

export default function Blog() {
  return (
    <Page>
      <PageHeader title="Blog" />
      <StateView state="loading" title="Being built" description="This page is part of the Slate build in progress." />
    </Page>
  );
}
