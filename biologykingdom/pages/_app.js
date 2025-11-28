import "@/styles/globals.css";
import Layout from "@/components/Layout";
import { AuthProvider } from "../hooks/useAuth";
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "../lib/react-query";

export default function App({ Component, pageProps, router }) {
  // Pages that SHOULD NOT use layout
  const noLayoutPages = ["/login", "/signup"];
  const noLayoutPrefixes = ["/pyq/exams/"];

  const isNoLayoutPage =
    noLayoutPages.includes(router.pathname) ||
    noLayoutPrefixes.some(prefix =>
      router.pathname.startsWith(prefix)
    );

  // Common wrapper with all providers
  const AppContent = (
    <>
      <Component {...pageProps} />
      <ReactQueryDevtools initialIsOpen={false} />
    </>
  );

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        {isNoLayoutPage ? (
          AppContent
        ) : (
          <Layout>
            {AppContent}
          </Layout>
        )}
      </AuthProvider>
    </QueryClientProvider>
  );
}