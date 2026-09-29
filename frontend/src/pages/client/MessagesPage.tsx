import { useEffect, useState } from "react";
import {
  createMyThread,
  getMyThreadMessages,
  getMyThreads,
  sendMyThreadMessage,
  type ClientMessage,
  type MessageThread,
} from "../../services/community.service";

export default function MessagesPage() {
  const [threads, setThreads] = useState<MessageThread[]>([]);
  const [selectedThread, setSelectedThread] =
    useState<MessageThread | null>(null);
  const [messages, setMessages] = useState<ClientMessage[]>([]);
  const [subject, setSubject] = useState("");
  const [newThreadMessage, setNewThreadMessage] = useState("");
  const [reply, setReply] = useState("");
  const [message, setMessage] = useState("");

  async function loadThreads() {
    const data = await getMyThreads();
    setThreads(data);
  }

  async function openThread(thread: MessageThread) {
    const data = await getMyThreadMessages(thread._id);
    setSelectedThread(data.thread);
    setMessages(data.messages);
  }

  useEffect(() => {
    loadThreads().catch(() =>
      setMessage("Impossible de charger les messages.")
    );
  }, []);

  async function handleCreateThread(event: React.FormEvent) {
    event.preventDefault();

    try {
      await createMyThread(subject, newThreadMessage);
      setSubject("");
      setNewThreadMessage("");
      setMessage("Message envoyé à la salle.");
      await loadThreads();
    } catch {
      setMessage("Impossible d'envoyer le message.");
    }
  }

  async function handleReply(event: React.FormEvent) {
    event.preventDefault();

    if (!selectedThread || !reply.trim()) return;

    try {
      await sendMyThreadMessage(selectedThread._id, reply);
      setReply("");
      await openThread(selectedThread);
      await loadThreads();
    } catch {
      setMessage("Impossible d'envoyer la réponse.");
    }
  }

  return (
    <main className="min-h-screen bg-background px-6 py-12 text-foreground">
      <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-3">
        <section>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gold">
            Espace client
          </p>
          <h1 className="mt-2 text-4xl font-bold">Messagerie</h1>

          <form
            onSubmit={handleCreateThread}
            className="mt-8 space-y-4 rounded-2xl border border-foreground/15 p-5"
          >
            <h2 className="text-xl font-bold">Nouveau message</h2>

            <input
              required
              value={subject}
              onChange={(event) => setSubject(event.target.value)}
              placeholder="Sujet"
              maxLength={150}
              className="w-full rounded-xl border border-foreground/20 bg-transparent px-4 py-3"
            />

            <textarea
              required
              value={newThreadMessage}
              onChange={(event) => setNewThreadMessage(event.target.value)}
              placeholder="Votre message"
              maxLength={3000}
              className="min-h-32 w-full rounded-xl border border-foreground/20 bg-transparent px-4 py-3"
            />

            <button
              type="submit"
              className="rounded-xl bg-gold px-5 py-3 font-semibold text-black"
            >
              Envoyer
            </button>
          </form>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold">Conversations</h2>

          {threads.map((thread) => (
            <button
              key={thread._id}
              type="button"
              onClick={() => void openThread(thread)}
              className="block w-full rounded-xl border border-foreground/15 p-4 text-left"
            >
              <p className="font-semibold">{thread.subject}</p>
              <p className="mt-1 text-sm text-foreground/60">
                {new Date(thread.lastMessageAt).toLocaleString("fr-DZ")}
              </p>
            </button>
          ))}
        </section>

        <section className="rounded-2xl border border-foreground/15 p-5">
          <h2 className="text-xl font-bold">
            {selectedThread?.subject || "Sélectionnez une conversation"}
          </h2>

          <div className="mt-6 space-y-3">
            {messages.map((item) => (
              <article
                key={item._id}
                className={
                  item.senderType === "CLIENT"
                    ? "ml-8 rounded-xl bg-gold p-4 text-black"
                    : "mr-8 rounded-xl bg-foreground/10 p-4"
                }
              >
                <p className="text-sm font-semibold">
                  {item.senderType === "CLIENT" ? "Vous" : "La salle"}
                </p>
                <p className="mt-2">{item.body}</p>
              </article>
            ))}
          </div>

          {selectedThread && (
            <form onSubmit={handleReply} className="mt-6 flex gap-3">
              <input
                value={reply}
                onChange={(event) => setReply(event.target.value)}
                placeholder="Écrire une réponse"
                maxLength={3000}
                className="min-w-0 flex-1 rounded-xl border border-foreground/20 bg-transparent px-4 py-3"
              />

              <button
                type="submit"
                className="rounded-xl bg-gold px-5 py-3 font-semibold text-black"
              >
                Envoyer
              </button>
            </form>
          )}
        </section>

        {message && <p className="lg:col-span-3">{message}</p>}
      </div>
    </main>
  );
}