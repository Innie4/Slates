import { Page, PageHeader, StateView } from "@/components/ui";

export default function About() {
  return (
    <Page>
      <PageHeader title="About" />
      <StateView state="loading" title="Being built" description="This page is part of the Slate build in progress." />
    </Page>
  );
}
