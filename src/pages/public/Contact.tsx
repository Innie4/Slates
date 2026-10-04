import { Page, PageHeader, StateView } from "@/components/ui";

export default function Contact() {
  return (
    <Page>
      <PageHeader title="Contact" />
      <StateView state="loading" title="Being built" description="This page is part of the Slate build in progress." />
    </Page>
  );
}
