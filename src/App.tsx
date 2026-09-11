import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { SiteLayout } from "./components/SiteLayout";
import { I18nProvider } from "./i18n/I18n";
import Index from "./pages/Index";
import { AboutPage, ContactPage, CountryPage, EmergencyPage, FaqPage, GuidePage, IslamicPage, KurdishPage, LegalPage, ServiceDetailPage, ServicesPage, TransfersPage } from "./pages/ContentPages";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();
const pages = [
  { index: true, element: <Index /> },
  { path: "im-todesfall", element: <EmergencyPage /> },
  { path: "leistungen", element: <ServicesPage /> },
  { path: "leistungen/:slug", element: <ServiceDetailPage /> },
  { path: "internationale-ueberfuehrungen", element: <TransfersPage /> },
  { path: "ueberfuehrung-tuerkei", element: <CountryPage country="turkey" /> },
  { path: "ueberfuehrung-irak-kurdistan", element: <CountryPage country="iraq" /> },
  { path: "ueberfuehrung-syrien", element: <CountryPage country="syria" /> },
  { path: "islamische-bestattung", element: <IslamicPage /> },
  { path: "kurdische-bestattung", element: <KurdishPage /> },
  { path: "ueber-uns", element: <AboutPage /> },
  { path: "faq", element: <FaqPage /> },
  { path: "kontakt", element: <ContactPage /> },
  { path: "ratgeber", element: <GuidePage /> },
  { path: "impressum", element: <LegalPage type="impressum" /> },
  { path: "datenschutz", element: <LegalPage type="datenschutz" /> },
  { path: "*", element: <NotFound /> },
];

function LocalizedRoutes() {
  return <Routes>{["/", "/tr", "/ku"].map((prefix) => <Route key={prefix} path={prefix} element={<SiteLayout />}>{pages.map((page, index) => page.index ? <Route key={index} index element={page.element} /> : <Route key={page.path} path={page.path} element={page.element} />)}</Route>)}</Routes>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster /><Sonner />
      <BrowserRouter>
        <I18nProvider><LocalizedRoutes /></I18nProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
