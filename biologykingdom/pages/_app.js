import "@/styles/globals.css";
import Layout from "@/components/Layout";
import { AuthProvider } from '../hooks/useAuth'

export default function App({ Component, pageProps, router }) {
  const noLayoutPages = ["/login", "/signup"]; // jinke liye layout nahi chahiye

  const isNoLayoutPage = noLayoutPages.includes(router.pathname);

  // Agar no-layout page hai, to direct page return karo
  if (isNoLayoutPage) {
    return <Component {...pageProps} />;
  }

  // baaki sab pages layout ke andar
  return (<AuthProvider>
    <Layout>
      <Component {...pageProps} />
    </Layout></AuthProvider>
  );
}
