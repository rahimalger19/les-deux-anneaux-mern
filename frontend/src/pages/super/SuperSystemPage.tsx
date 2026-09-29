import { useEffect, useState, type FormEvent } from "react";
import {
  createDatabaseBackup,
  createFeatureFlag,
  getSuperSystem,
  updateFeatureFlag,
  updateLegalDocument,
  type BackupRecord,
  type SystemJob,
  type SystemLegalDocument,
} from "../../services/super-system.service";
type FeatureFlag = {
  id: string;
  key: string;
  description: string;
  enabled: boolean;
};

type AuditLog = {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  createdAt: string;
  actor: { name: string } | null;
};

export default function SuperSystemPage() {
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [message, setMessage] = useState("");
  const [flagKey, setFlagKey] = useState("");
  const [description, setDescription] = useState("");
  const [legalDocuments, setLegalDocuments] = useState<SystemLegalDocument[]>([]);
const [backups, setBackups] = useState<BackupRecord[]>([]);
const [jobs, setJobs] = useState<SystemJob[]>([]);
const [selectedLegalKey, setSelectedLegalKey] = useState("");
const [legalLanguage, setLegalLanguage] =
  useState<"fr" | "ar" | "en">("fr");
const [savingLegal, setSavingLegal] = useState(false);

  async function loadData() {
    
    try {
      const data = await getSuperSystem();
      setFlags(data.flags);
      setAuditLogs(data.auditLogs);
      setLegalDocuments(data.legalDocuments);
setBackups(data.backups);
setJobs(data.jobs);

setSelectedLegalKey((current) =>
  current || data.legalDocuments[0]?.key || ""
);
    } catch {
      setMessage("Impossible de charger l’administration système.");
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  async function handleCreateFlag(event: FormEvent) {
    event.preventDefault();

    try {
      await createFeatureFlag({
        key: flagKey,
        description,
        enabled: false,
      });

      setFlagKey("");
      setDescription("");
      await loadData();
    } catch {
      setMessage("Impossible de créer le feature flag.");
    }
  }

  async function handleBackup() {
    try {
      await createDatabaseBackup();
     setMessage("Sauvegarde ajoutée à la file de jobs.");
      await loadData();
    } catch {
      setMessage(
        "Impossible de créer la sauvegarde. Vérifiez BACKUP_DIR et mongodump."
      );
    }
  }
  
  const selectedLegalDocument = legalDocuments.find(
  (document) => document.key === selectedLegalKey
);

function updateSelectedLegalDocument(
  field: "title" | "content",
  value: string
) {
  if (!selectedLegalDocument) {
    return;
  }

  setLegalDocuments((current) =>
    current.map((document) =>
      document.key === selectedLegalDocument.key
        ? {
            ...document,
            [field]: {
              ...document[field],
              [legalLanguage]: value,
            },
          }
        : document
    )
  );
}

async function handleSaveLegalDocument() {
  if (!selectedLegalDocument) {
    return;
  }

  try {
    setSavingLegal(true);

    await updateLegalDocument(selectedLegalDocument.key, {
      title: selectedLegalDocument.title,
      content: selectedLegalDocument.content,
      published: selectedLegalDocument.published,
    });

    setMessage("Document légal enregistré.");
    await loadData();
  } catch {
    setMessage("Impossible d’enregistrer le document légal.");
  } finally {
    setSavingLegal(false);
  }
}

  return (
    <main className="min-h-screen bg-background px-6 py-12 text-foreground">
      <div className="mx-auto max-w-6xl">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gold">
          Super administration
        </p>

        <h1 className="mt-2 text-4xl font-bold">Système</h1>

         <section className="mt-8 rounded-2xl border border-foreground/15 p-6">
  <div className="flex flex-wrap items-center justify-between gap-4">
    <div>
      <h2 className="text-2xl font-bold">Sauvegardes MongoDB</h2>
      <p className="mt-2 text-sm text-foreground/65">
        La sauvegarde est ajoutée à la file de jobs, puis exécutée en arrière-plan.
      </p>
    </div>

    <button
      type="button"
      onClick={() => void handleBackup()}
      className="rounded-xl bg-gold px-5 py-3 font-semibold text-black"
    >
      Mettre une sauvegarde en file
    </button>
  </div>

  <div className="mt-6 space-y-3">
    {backups.length === 0 ? (
      <p className="text-foreground/65">Aucune sauvegarde enregistrée.</p>
    ) : (
      backups.map((backup) => (
        <article
          key={backup.id}
          className="rounded-xl border border-foreground/15 p-4"
        >
          <p className="font-semibold">
            {backup.fileName || "Sauvegarde en préparation"}
          </p>

          <p className="mt-1 text-sm text-foreground/65">
            {backup.status} ·{" "}
            {new Date(backup.createdAt).toLocaleString("fr-DZ")}
            {typeof backup.sizeBytes === "number"
              ? ` · ${Math.round(backup.sizeBytes / 1024)} Ko`
              : ""}
          </p>

          {backup.error ? (
            <p className="mt-2 text-sm text-red-700">{backup.error}</p>
          ) : null}
        </article>
      ))
    )}
  </div>
</section>

        <section className="mt-8 rounded-2xl border border-foreground/15 p-6">
          <h2 className="text-2xl font-bold">Feature flags</h2>

          <form onSubmit={handleCreateFlag} className="mt-5 grid gap-3 md:grid-cols-3">
            <input
              required
              value={flagKey}
              onChange={(event) => setFlagKey(event.target.value)}
              placeholder="ex. nouvelle-fonction"
              className="rounded-xl border border-foreground/20 bg-transparent px-4 py-3"
            />

            <input
              required
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Description"
              className="rounded-xl border border-foreground/20 bg-transparent px-4 py-3"
            />

            <button
              type="submit"
              className="rounded-xl bg-black px-5 py-3 font-semibold text-ivory dark:bg-gold dark:text-black"
            >
              Ajouter
            </button>
          </form>

          <div className="mt-6 space-y-3">
            {flags.map((flag) => (
              <div
                key={flag.id}
                className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-foreground/15 p-4"
              >
                <div>
                  <p className="font-semibold">{flag.key}</p>
                  <p className="text-sm text-foreground/65">
                    {flag.description}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    void updateFeatureFlag(flag.id, !flag.enabled).then(loadData)
                  }
                  className="rounded-xl border border-foreground/20 px-4 py-2 font-semibold"
                >
                  {flag.enabled ? "Désactiver" : "Activer"}
                </button>
              </div>
            ))}
          </div>
        </section>
         
         <section className="mt-8 rounded-2xl border border-foreground/15 p-6">
  <h2 className="text-2xl font-bold">CMS légal</h2>

  <p className="mt-2 text-sm text-foreground/65">
    Publiez uniquement les textes validés par votre structure ou un conseil
    juridique. Les documents non publiés restent invisibles au public.
  </p>

  <div className="mt-5 grid gap-4 md:grid-cols-2">
    <select
      value={selectedLegalKey}
      onChange={(event) => setSelectedLegalKey(event.target.value)}
      className="rounded-xl border border-foreground/20 bg-transparent px-4 py-3"
    >
      {legalDocuments.map((document) => (
        <option key={document.key} value={document.key}>
          {document.key}
        </option>
      ))}
    </select>

    <select
      value={legalLanguage}
      onChange={(event) =>
        setLegalLanguage(event.target.value as "fr" | "ar" | "en")
      }
      className="rounded-xl border border-foreground/20 bg-transparent px-4 py-3"
    >
      <option value="fr">Français</option>
      <option value="ar">العربية</option>
      <option value="en">English</option>
    </select>
  </div>

  {selectedLegalDocument ? (
    <div className="mt-5">
      <label className="flex items-center gap-3 font-semibold">
        <input
          type="checkbox"
          checked={selectedLegalDocument.published}
          onChange={(event) =>
            setLegalDocuments((current) =>
              current.map((document) =>
                document.key === selectedLegalDocument.key
                  ? {
                      ...document,
                      published: event.target.checked,
                    }
                  : document
              )
            )
          }
        />
        Publier ce document
      </label>

      <label className="mt-5 block text-sm font-semibold">
        Titre
      </label>

      <input
        value={selectedLegalDocument.title[legalLanguage]}
        onChange={(event) =>
          updateSelectedLegalDocument("title", event.target.value)
        }
        className="mt-2 w-full rounded-xl border border-foreground/20 bg-transparent px-4 py-3"
      />

      <label className="mt-5 block text-sm font-semibold">
        Contenu
      </label>

      <textarea
        value={selectedLegalDocument.content[legalLanguage]}
        onChange={(event) =>
          updateSelectedLegalDocument("content", event.target.value)
        }
        className="mt-2 min-h-72 w-full rounded-xl border border-foreground/20 bg-transparent px-4 py-3"
      />

      <button
        type="button"
        onClick={() => void handleSaveLegalDocument()}
        disabled={savingLegal}
        className="mt-5 rounded-xl bg-gold px-5 py-3 font-semibold text-black disabled:opacity-50"
      >
        {savingLegal ? "Enregistrement..." : "Enregistrer le document"}
      </button>
    </div>
  ) : (
    <p className="mt-5 text-foreground/65">
      Aucun document légal disponible.
    </p>
  )}
</section>

        <section className="mt-8 rounded-2xl border border-foreground/15 p-6">
  <h2 className="text-2xl font-bold">File de jobs</h2>

  <div className="mt-5 space-y-3">
    {jobs.length === 0 ? (
      <p className="text-foreground/65">Aucun job système.</p>
    ) : (
      jobs.map((job) => (
        <article
          key={job.id}
          className="rounded-xl border border-foreground/15 p-4"
        >
          <p className="font-semibold">
            {job.type} · {job.status}
          </p>

          <p className="mt-1 text-sm text-foreground/65">
            Tentative {job.attempts} ·{" "}
            {new Date(job.createdAt).toLocaleString("fr-DZ")} ·{" "}
            {job.createdBy?.name || "Système"}
          </p>

          {job.error ? (
            <p className="mt-2 text-sm text-red-700">{job.error}</p>
          ) : null}
        </article>
      ))
    )}
  </div>
</section>

        <section className="mt-8 rounded-2xl border border-foreground/15 p-6">
          <h2 className="text-2xl font-bold">Journal d’audit</h2>

          <div className="mt-5 space-y-3">
            {auditLogs.map((log) => (
              <article
                key={log.id}
                className="rounded-xl border border-foreground/15 p-4"
              >
                <p className="font-semibold">{log.action}</p>
                <p className="mt-1 text-sm text-foreground/65">
                  {log.entityType} · {log.actor?.name || "Système"} ·{" "}
                  {new Date(log.createdAt).toLocaleString("fr-DZ")}
                </p>
              </article>
            ))}
          </div>
        </section>

        {message ? <p className="mt-6">{message}</p> : null}
      </div>
    </main>
  );
}