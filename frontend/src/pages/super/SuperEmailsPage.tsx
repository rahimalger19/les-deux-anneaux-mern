import {
  useEffect,
  useState,
  type FormEvent,
} from "react";
import {
  getSuperEmailTemplates,
  testSuperSmtp,
  updateSuperEmailTemplate,
  type EmailLog,
  type EmailTemplate,
  type SmtpStatus,
} from "../../services/super-email-template.service";

const languages = ["fr", "ar", "en"] as const;

function formatDate(value?: string) {
  if (!value) {
    return "—";
  }

  return new Intl.DateTimeFormat("fr-DZ", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

export default function SuperEmailsPage() {
  const [smtp, setSmtp] = useState<SmtpStatus | null>(null);
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [logs, setLogs] = useState<EmailLog[]>([]);
  const [variables, setVariables] = useState<Record<string, string[]>>({});

  const [selectedLanguage, setSelectedLanguage] =
    useState<EmailTemplate["language"]>("fr");

  const [testEmail, setTestEmail] = useState("");
  const [message, setMessage] = useState("Chargement...");
  const [savingId, setSavingId] = useState<string | null>(null);
  const [testing, setTesting] = useState(false);

  async function loadData() {
    try {
      const data = await getSuperEmailTemplates();

      setSmtp(data.smtp);
      setTemplates(data.templates);
      setLogs(data.logs);
      setVariables(data.variables);
      setMessage("");
    } catch {
      setMessage("Impossible de charger la configuration SMTP.");
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  function updateLocalTemplate(
    templateId: string,
    field: "subject" | "content" | "format",
    value: string
  ) {
    setTemplates((current) =>
      current.map((template) =>
        template.id === templateId
          ? {
              ...template,
              [field]:
                field === "format"
                  ? (value as EmailTemplate["format"])
                  : value,
            }
          : template
      )
    );
  }

  async function handleSave(template: EmailTemplate) {
    try {
      setSavingId(template.id);

      await updateSuperEmailTemplate(template.key, {
        language: template.language,
        subject: template.subject,
        content: template.content,
        format: template.format,
      });

      setMessage("Modèle enregistré.");
      await loadData();
    } catch {
      setMessage("Impossible d’enregistrer ce modèle.");
    } finally {
      setSavingId(null);
    }
  }

  async function handleTest(event: FormEvent) {
    event.preventDefault();

    try {
      setTesting(true);

      await testSuperSmtp(testEmail);

      setTestEmail("");
      setMessage("E-mail de test envoyé.");
      await loadData();
    } catch (error: any) {
      setMessage(
        error.response?.data?.message ||
          "Impossible d’envoyer l’e-mail de test."
      );
    } finally {
      setTesting(false);
    }
  }

  const visibleTemplates = templates.filter(
    (template) => template.language === selectedLanguage
  );

  return (
    <main className="min-h-screen bg-background px-6 py-12 text-foreground">
      <div className="mx-auto max-w-6xl">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gold">
          Super administration
        </p>

        <h1 className="mt-2 text-4xl font-bold">
          SMTP et modèles d’e-mails
        </h1>

        <p className="mt-4 text-foreground/70">
          Les identifiants SMTP restent protégés dans le fichier
          <code>backend/.env</code>. Cette page expose uniquement leur état.
        </p>

        <section className="mt-8 rounded-2xl border border-foreground/15 p-6">
          <h2 className="text-xl font-bold">État SMTP</h2>

          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl bg-foreground/5 p-4">
              <p className="text-sm text-foreground/65">Hôte SMTP</p>
              <p className="mt-1 font-semibold">
                {smtp?.hostConfigured ? "Configuré" : "Absent"}
              </p>
            </div>

            <div className="rounded-xl bg-foreground/5 p-4">
              <p className="text-sm text-foreground/65">Port</p>
              <p className="mt-1 font-semibold">{smtp?.port ?? "—"}</p>
            </div>

            <div className="rounded-xl bg-foreground/5 p-4">
              <p className="text-sm text-foreground/65">Authentification</p>
              <p className="mt-1 font-semibold">
                {smtp?.authConfigured ? "Configurée" : "Absente"}
              </p>
            </div>

            <div className="rounded-xl bg-foreground/5 p-4">
              <p className="text-sm text-foreground/65">Expéditeur</p>
              <p className="mt-1 font-semibold">
                {smtp?.fromConfigured ? "Configuré" : "Absent"}
              </p>
            </div>
          </div>

          <form
            onSubmit={handleTest}
            className="mt-6 flex flex-wrap gap-3"
          >
            <input
              required
              type="email"
              value={testEmail}
              onChange={(event) => setTestEmail(event.target.value)}
              placeholder="Adresse de test"
              className="min-w-64 flex-1 rounded-xl border border-foreground/20 bg-transparent px-4 py-3"
            />

            <button
              type="submit"
              disabled={testing}
              className="rounded-xl bg-gold px-5 py-3 font-semibold text-black disabled:opacity-50"
            >
              {testing ? "Envoi..." : "Envoyer un test"}
            </button>
          </form>
        </section>

        <section className="mt-12">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h2 className="text-2xl font-bold">Modèles FR / AR / EN</h2>

            <div className="flex gap-2">
              {languages.map((language) => (
                <button
                  key={language}
                  type="button"
                  onClick={() => setSelectedLanguage(language)}
                  className={
                    selectedLanguage === language
                      ? "rounded-xl bg-gold px-4 py-2 font-semibold text-black"
                      : "rounded-xl border border-foreground/20 px-4 py-2 font-semibold"
                  }
                >
                  {language.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          <section className="mt-6 space-y-6">
            {visibleTemplates.map((template) => (
              <article
                key={template.id}
                className="rounded-2xl border border-foreground/15 p-6"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h3 className="font-bold">{template.key}</h3>

                  <span className="rounded-full bg-foreground/10 px-3 py-1 text-sm">
                    {template.language.toUpperCase()} · {template.format}
                  </span>
                </div>

                <p className="mt-3 text-sm text-foreground/65">
                  Variables :{" "}
                  {(variables[template.key] || []).join(", ") || "Aucune"}
                </p>

                <label className="mt-5 block text-sm font-semibold">
                  Objet
                </label>

                <input
                  value={template.subject}
                  onChange={(event) =>
                    updateLocalTemplate(
                      template.id,
                      "subject",
                      event.target.value
                    )
                  }
                  className="mt-2 w-full rounded-xl border border-foreground/20 bg-transparent px-4 py-3"
                />

                <label className="mt-5 block text-sm font-semibold">
                  Format
                </label>

                <select
                  value={template.format}
                  onChange={(event) =>
                    updateLocalTemplate(
                      template.id,
                      "format",
                      event.target.value
                    )
                  }
                  className="mt-2 rounded-xl border border-foreground/20 bg-transparent px-4 py-3"
                >
                  <option value="HTML">HTML</option>
                  <option value="MJML">MJML</option>
                </select>

                <label className="mt-5 block text-sm font-semibold">
                  Corps {template.format}
                </label>

                <textarea
                  dir={template.language === "ar" ? "rtl" : "ltr"}
                  value={template.content}
                  onChange={(event) =>
                    updateLocalTemplate(
                      template.id,
                      "content",
                      event.target.value
                    )
                  }
                  className="mt-2 min-h-64 w-full rounded-xl border border-foreground/20 bg-transparent px-4 py-3 font-mono text-sm"
                />

                <button
                  type="button"
                  onClick={() => void handleSave(template)}
                  disabled={savingId === template.id}
                  className="mt-5 rounded-xl bg-gold px-5 py-3 font-semibold text-black disabled:opacity-50"
                >
                  {savingId === template.id
                    ? "Enregistrement..."
                    : "Enregistrer"}
                </button>
              </article>
            ))}
          </section>
        </section>

        <section className="mt-12">
          <h2 className="text-2xl font-bold">Journal des e-mails</h2>

          <div className="mt-5 overflow-x-auto rounded-2xl border border-foreground/15">
            <table className="w-full min-w-180 text-left text-sm">
              <thead className="bg-foreground/5">
                <tr>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Destinataire</th>
                  <th className="px-4 py-3">Objet</th>
                  <th className="px-4 py-3">Modèle</th>
                  <th className="px-4 py-3">Statut</th>
                </tr>
              </thead>

              <tbody>
                {logs.map((log) => (
                  <tr
                    key={log.id}
                    className="border-t border-foreground/10"
                  >
                    <td className="px-4 py-3">
                      {formatDate(log.createdAt)}
                    </td>
                    <td className="px-4 py-3">{log.to}</td>
                    <td className="px-4 py-3">{log.subject}</td>
                    <td className="px-4 py-3">
                      {log.templateKey || "Test SMTP"}
                      {log.language
                        ? ` · ${log.language.toUpperCase()}`
                        : ""}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={
                          log.status === "SENT"
                            ? "font-semibold text-green-700"
                            : "font-semibold text-red-700"
                        }
                        title={log.error}
                      >
                        {log.status === "SENT" ? "Envoyé" : "Échec"}
                      </span>
                    </td>
                  </tr>
                ))}

                {logs.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-6 text-foreground/65"
                    >
                      Aucun e-mail n’a encore été envoyé.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>

        {message ? <p className="mt-6">{message}</p> : null}
      </div>
    </main>
  );
}