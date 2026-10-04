import { Page, PageHeader, StateView } from "@/components/ui";

export default function ForgotPassword() {
  return (
    <Page>
      <PageHeader title="Forgot password" />
      <StateView state="loading" title="Being built" description="This page is part of the Slate build in progress." />
    </Page>
  );
}
