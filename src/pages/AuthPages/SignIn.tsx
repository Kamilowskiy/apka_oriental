import SignInForm from "../../components/auth/SignInForm";
import AuthLayout from "../../layout/AuthLayout";
import PageMeta from "../../components/common/PageMeta";

export default function SignIn() {
  return (
    <>
      <PageMeta
        title="Logowanie - Panel klienta"
        description="Zaloguj się do panelu klienta Oriental Design"
      />
      <AuthLayout 
        title="Zaloguj się do swojego konta" 
        subtitle="Wprowadź swoją nazwę użytkownika lub email oraz hasło, aby się zalogować"
      >
        <SignInForm />
      </AuthLayout>
    </>
  );
}