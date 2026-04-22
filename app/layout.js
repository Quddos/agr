import "./globals.css";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";

export const metadata = {
  title: "Agric Management System",
  description: "Agricultural operations, crop and statement management platform",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/file.svg",
    apple: "/file.svg",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-zinc-50 text-zinc-900">
        <ServiceWorkerRegister />
        {children}
      </body>
    </html>
  );
}
