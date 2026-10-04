import { Page, PageHeader, StateView } from "@/components/ui";

export default function BlogPost() {
  return (
    <Page>
      <PageHeader title="Article" />
      <StateView state="loading" title="Being built" description="This page is part of the Slate build in progress." />
    </Page>
  );
}
