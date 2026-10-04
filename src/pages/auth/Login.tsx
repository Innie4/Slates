import { Page, PageHeader, StateView } from "@/components/ui";

export default function Login() {
  return (
    <Page>
      <PageHeader title="Sign in" />
      <StateView state="loading" title="Being built" description="This page is part of the Slate build in progress." />
    </Page>
  );
}
