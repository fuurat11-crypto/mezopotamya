import { Route, Routes, useParams } from "react-router-dom";
import { AccountingLayout } from "@/components/accounting/AccountingLayout";
import { BankImport } from "@/components/accounting/BankImport";
import { Dashboard } from "@/components/accounting/Dashboard";
import { InvoiceEditor } from "@/components/accounting/InvoiceEditor";
import { InvoiceList } from "@/components/accounting/InvoiceList";
import { InvoicePrint } from "@/components/accounting/InvoicePrint";
import { PinGate } from "@/components/accounting/PinGate";
import { ReminderPrint } from "@/components/accounting/ReminderPrint";
import { SettingsPanel } from "@/components/accounting/SettingsPanel";

function EditorRoute() {
  const { id } = useParams();
  // key sorgt dafür, dass jede Rechnung (und „neu“) mit frischem Formular startet
  return <InvoiceEditor key={id ?? "neu"} />;
}

export default function Buchhaltung() {
  return (
    <PinGate>
    <Routes>
      <Route path="druck/:id" element={<InvoicePrint />} />
      <Route path="mahnung/:id" element={<ReminderPrint />} />
      <Route
        path="*"
        element={
          <AccountingLayout>
            <Routes>
              <Route index element={<Dashboard />} />
              <Route path="rechnungen" element={<InvoiceList />} />
              <Route path="neu" element={<EditorRoute />} />
              <Route path="rechnung/:id" element={<EditorRoute />} />
              <Route path="bank" element={<BankImport />} />
              <Route path="einstellungen" element={<SettingsPanel />} />
              <Route path="*" element={<Dashboard />} />
            </Routes>
          </AccountingLayout>
        }
      />
    </Routes>
    </PinGate>
  );
}
