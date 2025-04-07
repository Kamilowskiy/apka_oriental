import SignUpForm from "../../components/auth/SignUpForm";
import AuthLayout from "../../layout/AuthLayout";
import PageMeta from "../../components/common/PageMeta";

export default function SignUp() {
  return (
    <>
      <PageMeta
        title="Rejestracja - Panel klienta"
        description="Zarejestruj nowe konto w panelu klienta Oriental Design"
      />
      <AuthLayout 
        title="Utwórz nowe konto" 
        subtitle="Wypełnij poniższy formularz, aby utworzyć nowe konto w systemie"
      >
        <SignUpForm />
      </AuthLayout>
    </>
  );
}