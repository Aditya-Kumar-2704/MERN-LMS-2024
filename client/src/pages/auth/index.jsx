import CommonForm from "@/components/common-form";
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
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <header className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 lg:px-6 py-4 flex items-center border-b border-blue-800">
        <Link to={"/"} className="flex items-center justify-center group cursor-pointer">
          <GraduationCap className="h-8 w-8 mr-3 group-hover:text-yellow-300 transition-colors duration-200" />
          <div className="flex flex-col group-hover:scale-105 transition-transform duration-200 origin-left">
            <span className="font-bold text-lg group-hover:text-yellow-100 transition-colors duration-200">Vikash Classes</span>
            <span className="text-xs text-blue-100 group-hover:text-yellow-200 transition-colors duration-200">Areraj</span>
          </div>
        </Link>
      </header>
      <div className="flex items-center justify-center flex-1 px-4 py-12">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Welcome Back</h1>
            <p className="text-gray-600">Excellence in Education</p>
          </div>

          <Tabs
            value={activeTab}
            defaultValue="signin"
            onValueChange={handleTabChange}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-2 bg-gray-200">
              <TabsTrigger 
                value="signin"
                className="data-[state=active]:bg-blue-600 data-[state=active]:text-white font-semibold"
              >
                Sign In
              </TabsTrigger>
              <TabsTrigger 
                value="signup"
                className="data-[state=active]:bg-blue-600 data-[state=active]:text-white font-semibold"
              >
                Sign Up
              </TabsTrigger>
            </TabsList>
            <TabsContent value="signin">
              <Card className="border-0 shadow-xl">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100 pt-6">
                  <CardTitle className="text-blue-700">Sign in to your account</CardTitle>
                  <CardDescription className="text-gray-600">
                    Enter your email and password to access your learning dashboard
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2 pt-6">
                  <CommonForm
                    formControls={signInFormControls}
                    buttonText={"Sign In"}
                    formData={signInFormData}
                    setFormData={setSignInFormData}
                    isButtonDisabled={!checkIfSignInFormIsValid()}
                    handleSubmit={handleLoginUser}
                  />
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="signup">
              <Card className="border-0 shadow-xl">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100 pt-6">
                  <CardTitle className="text-blue-700">Create a new account</CardTitle>
                  <CardDescription className="text-gray-600">
                    Create a student account. The site owner registers as admin
                    using ADMIN_EMAIL in server configuration.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2 pt-6">
                  <CommonForm
                    formControls={signUpFormControls}
                    buttonText={"Sign Up"}
                    formData={signUpFormData}
                    setFormData={setSignUpFormData}
                    isButtonDisabled={!checkIfSignUpFormIsValid()}
                    handleSubmit={handleRegisterUser}
                  />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <div className="mt-8 text-center">
            <p className="text-gray-600 text-sm">
              Having trouble?{" "}
              <a href="#" className="text-blue-600 hover:text-blue-700 font-semibold">
                Contact Support
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AuthPage;
