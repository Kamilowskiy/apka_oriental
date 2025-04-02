import { useEffect, useState } from "react";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import PageMeta from "../../components/common/PageMeta";

// Definicja typu klienta
interface Client {
  id: number;
  company_name: string;
  nip: string;
  address: string;
  contact_first_name: string;
  contact_last_name: string;
  contact_phone: string;
  email: string;
}

export default function Clients() {
  const [clients, setClients] = useState<Client[]>([]);

  useEffect(() => {
    fetch("http://localhost:5000/api/clients")
      .then((response) => response.json())
      .then((data) => setClients(data))
      .catch((error) => console.error("Błąd pobierania klientów:", error));
  }, []);

  return (
    <>
      <PageMeta title="Lista klientów" description="Lista klientów pobrana z bazy danych" />
      <PageBreadcrumb pageTitle="Klienci" />
      <div className="space-y-6">
        <ComponentCard title="Lista klientów">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-200">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border px-4 py-2">ID</th>
                  <th className="border px-4 py-2">Firma</th>
                  <th className="border px-4 py-2">NIP</th>
                  <th className="border px-4 py-2">Adres</th>
                  <th className="border px-4 py-2">Kontakt</th>
                  <th className="border px-4 py-2">Email</th>
                </tr>
              </thead>
              <tbody>
                {clients.map((client) => (
                  <tr key={client.id} className="text-center">
                    <td className="border px-4 py-2">{client.id}</td>
                    <td className="border px-4 py-2">{client.company_name}</td>
                    <td className="border px-4 py-2">{client.nip}</td>
                    <td className="border px-4 py-2">{client.address}</td>
                    <td className="border px-4 py-2">{client.contact_first_name} {client.contact_last_name}</td>
                    <td className="border px-4 py-2">{client.email}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ComponentCard>
      </div>
    </>
  );
}
