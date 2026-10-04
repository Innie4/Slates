import { Page, PageHeader, StateView } from "@/components/ui";

export default function SignUp() {
  return (
    <Page>
      <PageHeader title="Create account" />
      <StateView state="loading" title="Being built" description="This page is part of the Slate build in progress." />
    </Page>
  );
}
