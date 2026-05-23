import "./globals.css";
import { Roboto } from "next/font/google";
import { UserProvider } from "@/lib/context/UserContext";
import { Toaster } from "sonner";


const roboto = Roboto({
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
});

export const metadata = {
  title: "WhatsApp Bulk Messaging System",
  description: "Send bulk messages easily and instantly.",
};


export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${roboto.className} bg-gray-50 text-slate-900 [&_button]:cursor-pointer [&_a]:cursor-pointer`}>
        <UserProvider>
          <Toaster position="top-center" richColors />
          <main className="min-h-screen flex flex-col">
            {children}
          </main>
        </UserProvider>
      </body>
    </html>
  );
}