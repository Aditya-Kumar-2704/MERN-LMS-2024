import CommonForm from "@/components/common-form";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { signInFormControls, signUpFormControls } from "@/config";
import { AuthContext } from "@/context/auth-context";
import { GraduationCap } from "lucide-react";
import { useContext, useState } from "react";
import { Link } from "react-router-dom";

function AuthPage() {
  const [activeTab, setActiveTab] = useState("signin");
  const {
    signInFormData,
    setSignInFormData,
    signUpFormData,
    setSignUpFormData,
    handleRegisterUser,
    handleLoginUser,
  } = useContext(AuthContext);

  function handleTabChange(value) {
    setActiveTab(value);
  }

  function checkIfSignInFormIsValid() {
    return (
      signInFormData &&
      signInFormData.userEmail !== "" &&
      signInFormData.password !== ""
    );
  }

  function checkIfSignUpFormIsValid() {
    return (
      signUpFormData &&
      signUpFormData.userName !== "" &&
      signUpFormData.userEmail !== "" &&
      signUpFormData.password !== ""
    );
  }

  return (
    <div className="min-h-screen overflow-hidden bg-[#040506] text-white">
      <div className="relative isolate min-h-screen">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(251,191,36,0.1),transparent_28%),linear-gradient(180deg,#040506_0%,#0b1016_55%,#040506_100%)]" />

        <header className="relative z-10 border-b border-white/10 bg-black/25 px-4 py-4 backdrop-blur lg:px-8">
          <div className="mx-auto flex max-w-7xl items-center justify-between">
            <Link to="/" className="group flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-400 text-black shadow-lg shadow-amber-400/20 transition-transform duration-200 group-hover:scale-105">
                <GraduationCap className="h-6 w-6" />
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-bold tracking-wide text-white">
                  Vikash Classes
                </span>
                <span className="text-xs uppercase tracking-[0.28em] text-slate-400">
                  Areraj
                </span>
              </div>
            </Link>

            <Link className="text-sm font-medium text-slate-300 transition hover:text-amber-300" to="/">
              Back to Home
            </Link>
          </div>
        </header>

        <main className="relative z-10 flex min-h-[calc(100vh-73px)] items-center justify-center px-4 py-10 lg:px-8">
          <section className="w-full max-w-md">
            <Card className="border border-white/10 bg-[#0c1016]/95 text-white shadow-2xl shadow-black/30">
              <CardHeader className="space-y-4 pb-4 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-400 text-black">
                  <GraduationCap className="h-7 w-7" />
                </div>
                <div>
                  <CardTitle className="text-3xl text-white">Welcome</CardTitle>
                  <CardDescription className="mt-2 text-sm leading-6 text-slate-400">
                    Sign in to your dashboard or create a student account.
                  </CardDescription>
                </div>
              </CardHeader>

              <CardContent className="pt-2">
                <Tabs
                  value={activeTab}
                  defaultValue="signin"
                  onValueChange={handleTabChange}
                  className="w-full"
                >
                  <TabsList className="grid h-auto w-full grid-cols-2 gap-2 rounded-xl border border-white/10 bg-white/[0.04] p-2">
                    <TabsTrigger
                      value="signin"
                      className="rounded-lg py-2.5 font-semibold text-slate-300 data-[state=active]:bg-amber-400 data-[state=active]:text-black data-[state=active]:shadow-none"
                    >
                      Sign In
                    </TabsTrigger>
                    <TabsTrigger
                      value="signup"
                      className="rounded-lg py-2.5 font-semibold text-slate-300 data-[state=active]:bg-amber-400 data-[state=active]:text-black data-[state=active]:shadow-none"
                    >
                      Sign Up
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="signin" className="mt-6">
                    <div className="mb-5">
                      <h2 className="text-xl font-semibold text-white">Sign in</h2>
                      <p className="mt-1 text-sm text-slate-400">
                        Enter your email and password to continue.
                      </p>
                    </div>
                    <CommonForm
                      formControls={signInFormControls}
                      buttonText={"Sign In"}
                      formData={signInFormData}
                      setFormData={setSignInFormData}
                      isButtonDisabled={!checkIfSignInFormIsValid()}
                      handleSubmit={handleLoginUser}
                      fieldsContainerClassName="gap-4"
                      labelClassName="text-sm font-medium text-slate-300"
                      inputClassName="h-11 rounded-xl border-white/10 bg-[#07090d] text-white placeholder:text-slate-500 focus-visible:ring-amber-300"
                      selectTriggerClassName="h-11 rounded-xl border-white/10 bg-[#07090d] text-white focus:ring-amber-300"
                      selectContentClassName="border-white/10 bg-[#11161e] text-white"
                      textareaClassName="min-h-[110px] rounded-xl border-white/10 bg-[#07090d] text-white placeholder:text-slate-500 focus-visible:ring-amber-300"
                      submitButtonClassName="mt-6 h-11 rounded-xl bg-amber-400 text-base font-semibold text-black hover:bg-amber-300"
                    />
                  </TabsContent>

                  <TabsContent value="signup" className="mt-6">
                    <div className="mb-5">
                      <h2 className="text-xl font-semibold text-white">Create account</h2>
                      <p className="mt-1 text-sm text-slate-400">
                        Create a student account to start learning.
                      </p>
                    </div>
                    <CommonForm
                      formControls={signUpFormControls}
                      buttonText={"Sign Up"}
                      formData={signUpFormData}
                      setFormData={setSignUpFormData}
                      isButtonDisabled={!checkIfSignUpFormIsValid()}
                      handleSubmit={handleRegisterUser}
                      fieldsContainerClassName="gap-4"
                      labelClassName="text-sm font-medium text-slate-300"
                      inputClassName="h-11 rounded-xl border-white/10 bg-[#07090d] text-white placeholder:text-slate-500 focus-visible:ring-amber-300"
                      selectTriggerClassName="h-11 rounded-xl border-white/10 bg-[#07090d] text-white focus:ring-amber-300"
                      selectContentClassName="border-white/10 bg-[#11161e] text-white"
                      textareaClassName="min-h-[110px] rounded-xl border-white/10 bg-[#07090d] text-white placeholder:text-slate-500 focus-visible:ring-amber-300"
                      submitButtonClassName="mt-6 h-11 rounded-xl bg-amber-400 text-base font-semibold text-black hover:bg-amber-300"
                    />
                  </TabsContent>
                </Tabs>

                <p className="mt-6 text-center text-sm text-slate-500">
                  Use your registered email to sign in.
                </p>
              </CardContent>
            </Card>
          </section>
        </main>
      </div>
    </div>
  );
}

export default AuthPage;
