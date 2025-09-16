import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { MessageCircle, Users, Shield, Zap, Loader2 } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { LoginAPI, SignUpAPI } from "@/http/services/auth";
import { useForm } from "@tanstack/react-form";
import { updateUserStore } from "@/store/userDetails";
import Cookies from "js-cookie";
import { useNavigate } from "@tanstack/react-router";
import { connectSocket } from "@/lib/socket";

export const LoginScreen = () => {
  const [isSignUp, setIsSignUp] = useState(false);

  const navigate = useNavigate();

  const form = useForm({
    defaultValues: {
      first_name: "",
      last_name: "",
      email: "",
      password: "",
    },
    onSubmit: ({ value }) => {
      if (isSignUp) {
        signUp(value);
      } else {
        login({
          email: value.email,
          password: value.password,
        });
      }
    },
  });

  const { mutate: signUp, isPending: signUpLoading } = useMutation({
    mutationKey: ["signUp"],
    mutationFn: async (payload: {
      first_name: string;
      last_name: string;
      email: string;
      password: string;
    }) => {
      const response = await SignUpAPI(payload);
      return response;
    },
    onSuccess: () => {
      setIsSignUp(false);
    },
  });

  const { mutate: login, isPending: loginLoading } = useMutation({
    mutationKey: ["login"],
    mutationFn: async (payload: { email: string; password: string }) => {
      const response = await LoginAPI(payload);
      return response?.data;
    },
    onSuccess: (response) => {
      const { access_token, refresh_token, ...userDetails } = response.data;
      Cookies.set("token", access_token);
      Cookies.set("refreshToken", refresh_token);
      updateUserStore({ user: userDetails });
      connectSocket(access_token);
      navigate({ to: "/chat" });
    },
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/20 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl flex items-center justify-between gap-12">
        <div className="flex-1 max-w-2xl">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-r from-primary to-primary-light rounded-2xl flex items-center justify-center">
                <MessageCircle className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-foreground">ChatFlow</h1>
            </div>
            <h2 className="text-4xl font-bold text-foreground mb-4">
              Connect with friends and groups instantly
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Experience seamless messaging with end-to-end encryption, group
              chats, and real-time message status indicators.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Group Messaging</h3>
                <p className="text-sm text-muted-foreground">
                  Create and manage groups
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                <Shield className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">End-to-End Encryption</h3>
                <p className="text-sm text-muted-foreground">
                  Your messages stay private
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                <Zap className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Real-time Status</h3>
                <p className="text-sm text-muted-foreground">
                  See when messages are read
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                <MessageCircle className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Instant Messaging</h3>
                <p className="text-sm text-muted-foreground">
                  Lightning fast delivery
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Login Form */}
        <Card className="w-full max-w-md p-8 shadow-xl border-0 bg-card/50 backdrop-blur-sm">
          <div className="mb-6 text-center">
            <h3 className="text-2xl font-bold mb-2">
              {isSignUp ? "Create Account" : "Welcome Back"}
            </h3>
            <p className="text-muted-foreground">
              {isSignUp ? "Join the conversation" : "Sign in to continue"}
            </p>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              form.handleSubmit();
            }}
            className="space-y-4"
          >
            {isSignUp && (
              <div className="s">
                <form.Field
                  name="first_name"
                  validators={{
                    onSubmit: (value) => {
                      if (!value) {
                        return "First name is required";
                      }
                    },
                  }}
                >
                  {(field) => {
                    return (
                      <div>
                        <Input
                          type="text"
                          placeholder="Enter First Name"
                          value={field.state.value}
                          onChange={(e) => field.setValue(e.target.value)}
                          className="h-12"
                          required
                        />
                        <p className="text-sm text-red-600">
                          {field.state.meta.errors}
                        </p>
                      </div>
                    );
                  }}
                </form.Field>

                <form.Field
                  name="last_name"
                  validators={{
                    onSubmit: (value) => {
                      if (!value) {
                        return "Last name is required";
                      }
                    },
                  }}
                >
                  {(field) => {
                    return (
                      <div>
                        <Input
                          type="text"
                          placeholder="Enter Last Name"
                          value={field.state.value}
                          onChange={(e) => field.setValue(e.target.value)}
                          className="h-12 mt-4"
                          required
                        />
                        <p className="text-sm text-red-600">
                          {field.state.meta.errors}
                        </p>
                      </div>
                    );
                  }}
                </form.Field>
              </div>
            )}
            <form.Field
              name="email"
              validators={{
                onSubmit: (value) => {
                  if (!value) {
                    return "Email is required";
                  }
                },
              }}
            >
              {(field) => {
                return (
                  <div>
                    <Input
                      type="email"
                      placeholder="Email Address"
                      value={field.state.value}
                      onChange={(e) => field.setValue(e.target.value)}
                      className="h-12"
                      required
                    />
                    <p className="text-sm text-red-600">
                      {field.state.meta.errors}
                    </p>
                  </div>
                );
              }}
            </form.Field>

            <form.Field
              name="password"
              validators={{
                onSubmit: (value) => {
                  if (!value) {
                    return "Password is required";
                  }
                },
              }}
            >
              {(field) => {
                return (
                  <div>
                    <Input
                      type="password"
                      placeholder="Password"
                      value={field.state.value}
                      onChange={(e) => field.setValue(e.target.value)}
                      className="h-12"
                      required
                    />
                    <p className="text-sm text-red-600">
                      {field.state.meta.errors}
                    </p>
                  </div>
                );
              }}
            </form.Field>

            <Button
              type="submit"
              className="w-full h-12 bg-primary hover:bg-primary-dark text-white font-medium"
            >
              {(signUpLoading || loginLoading) && (
                <Loader2 className="mr-2 animate-spin" />
              )}{" "}
              {isSignUp ? "Create Account" : "Sign In"}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => {
                setIsSignUp(!isSignUp);
                form.reset();
              }}
              className="text-primary cursor-pointer hover:text-primary-dark font-medium"
            >
              {isSignUp
                ? "Already have an account? Sign in"
                : "Don't have an account? Sign up"}
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
};
