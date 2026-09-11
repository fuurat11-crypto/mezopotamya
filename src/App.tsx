import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { SiteLayout } from "./components/SiteLayout";
import Index from "./pages/Index";
import {
  AboutPage,
  ContactPage,
  CountryPage,
  EmergencyPage,
  FaqPage,
  GuidePage,
  IslamicPage,
  KurdishPage,
  LegalPage,
  ServiceDetailPage,
  ServicesPage,
  TransfersPage,
} from "./pages/ContentPages";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route element={<SiteLayout />}>
            <Route path="/" element={<Index />} />
            <Route path="/im-todesfall" element={<EmergencyPage />} />
            <Route path="/leistungen" element={<ServicesPage />} />
            <Route path="/leistungen/:slug" element={<ServiceDetailPage />} />
            <Route path="/internationale-ueberfuehrungen" element={<TransfersPage />} />
            <Route path="/ueberfuehrung-tuerkei" element={<CountryPage country="turkey" />} />
            <Route path="/ueberfuehrung-irak-kurdistan" element={<CountryPage country="iraq" />} />
            <Route path="/ueberfuehrung-syrien" element={<CountryPage country="syria" />} />
            <Route path="/islamische-bestattung" element={<IslamicPage />} />
            <Route path="/kurdische-bestattung" element={<KurdishPage />} />
            <Route path="/ueber-uns" element={<AboutPage />} />
            <Route path="/faq" element={<FaqPage />} />
            <Route path="/kontakt" element={<ContactPage />} />
            <Route path="/ratgeber" element={<GuidePage />} />
            <Route path="/impressum" element={<LegalPage type="impressum" />} />
            <Route path="/datenschutz" element={<LegalPage type="datenschutz" />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
