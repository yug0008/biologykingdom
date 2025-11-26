import "@/styles/globals.css";
import Layout from "@/components/Layout";
import { AuthProvider } from "../hooks/useAuth";

export default function App({ Component, pageProps, router }) {
  const noLayoutPages = ["/login", "/signup"];
  const noLayoutPrefixes = ["/pyq/exams/"];

  const isNoLayoutPage =
    noLayoutPages.includes(router.pathname) ||
    noLayoutPrefixes.some(prefix => router.pathname.startsWith(prefix));

  if (isNoLayoutPage) {
    return (
      <AuthProvider>
        <Component {...pageProps} />
      </AuthProvider>
    );
  }

  return (
    <AuthProvider>
      <Layout>
        <Component {...pageProps} />
      </Layout>
    </AuthProvider>
  );
}
