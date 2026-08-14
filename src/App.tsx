import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  BookOpen,
  Brain,
  Check,
  HeartHandshake,
  Mic,
  MicOff,
  Phone,
  Send,
  Shield,
  Sparkles,
  UserRound,
  Volume2,
} from "lucide-react";

type Role = "person" | "caregiver";
type Mode = "urge" | "panic" | "caregiver" | "planning" | "learning";

type Message = {
  id: string;
  from: "user" | "assistant";
  text: string;
};

declare global {
  interface Window {
    SpeechRecognition?: typeof SpeechRecognition;
    webkitSpeechRecognition?: typeof SpeechRecognition;
  }
}

const quickPrompts = [
  "I have a strong craving right now.",
  "Help me make a 5 minute plan without typing.",
  "Write a script I can say to my caregiver.",
  "I am a caregiver and I need calm words to say.",
];

const resourceCards = [
  {
    title: "Urge Surfing",
    body: "Cravings rise, peak, and fall. Naming the sensation and timing it for 90 seconds can reduce the feeling of emergency.",
  },
  {
    title: "HALT Check",
    body: "Ask: am I hungry, angry, lonely, or tired? Fixing one body need often lowers relapse risk quickly.",
  },
  {
    title: "Caregiver Boundary",
    body: "Support works best when it is calm, specific, and non-punitive: listen, reduce access to triggers, and call help when safety changes.",
  },
];

const defaultMessages: Message[] = [
  {
    id: "welcome",
    from: "assistant",
    text:
      "I can help you slow down, make a tiny next-step plan, or draft words for someone you trust. If anyone is in immediate danger, call emergency services now.",
  },
];

export function App() {
  const [messages, setMessages] = useState<Message[]>(defaultMessages);
  const [input, setInput] = useState("");
  const [role, setRole] = useState<Role>("person");
  const [mode, setMode] = useState<Mode>("urge");
  const [isListening, setIsListening] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [supportName, setSupportName] = useState(() => localStorage.getItem("supportName") ?? "");
  const [supportPhone, setSupportPhone] = useState(() => localStorage.getItem("supportPhone") ?? "");
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  const speechSupported = useMemo(
    () => Boolean(window.SpeechRecognition || window.webkitSpeechRecognition),
    [],
  );

  useEffect(() => {
    localStorage.setItem("supportName", supportName);
    localStorage.setItem("supportPhone", supportPhone);
  }, [supportName, supportPhone]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const speak = (text: string) => {
    if (!voiceEnabled || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text.replace(/\*/g, ""));
    utterance.rate = 0.95;
    utterance.pitch = 1;
    window.speechSynthesis.speak(utterance);
  };

  const sendMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isLoading) return;

    const userMessage: Message = { id: crypto.randomUUID(), from: "user", text: trimmed };
    setMessages((current) => [...current, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: trimmed,
          role,
          mode,
          supportName,
          supportPhone,
          history: messages.slice(-8),
        }),
      });

      if (!response.ok) {
        throw new Error("AI service failed");
      }

      const data = (await response.json()) as { reply: string };
      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        from: "assistant",
        text: data.reply,
      };
      setMessages((current) => [...current, assistantMessage]);
      speak(data.reply);
    } catch {
      const fallback =
        "I could not reach the AI service. For the next minute: put both feet on the floor, drink water if safe, move away from triggers, and contact your support person or local emergency services if safety is at risk.";
      setMessages((current) => [
        ...current,
        { id: crypto.randomUUID(), from: "assistant", text: fallback },
      ]);
      speak(fallback);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleListening = () => {
    if (!speechSupported) return;
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition) return;
    const recognition = new Recognition();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.continuous = false;
    recognition.onresult = (event) => {
      const transcript = event.results[0]?.[0]?.transcript ?? "";
      setInput(transcript);
      void sendMessage(transcript);
    };
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);
    recognitionRef.current = recognition;
    setIsListening(true);
    recognition.start();
  };

  return (
    <main className="app">
      <section className="hero">
        <div className="hero-copy">
          <div className="brand">
            <Shield size={28} />
            <span>Recovery and Prevention Platform</span>
          </div>
          <h1>Voice-first support when the next minute matters.</h1>
          <p>
            A GenAI companion for people navigating substance use recovery and for caregivers who
            need calm, contextual scripts under pressure.
          </p>
        </div>
        <div className="safety-strip">
          <AlertTriangle size={18} />
          <span>This is not medical care. If there is immediate danger, call emergency services.</span>
        </div>
      </section>

      <section className="workspace">
        <aside className="panel side-panel">
          <div className="control-group">
            <label>Perspective</label>
            <div className="segmented">
              <button className={role === "person" ? "active" : ""} onClick={() => setRole("person")}>
                <UserRound size={16} /> Me
              </button>
              <button
                className={role === "caregiver" ? "active" : ""}
                onClick={() => {
                  setRole("caregiver");
                  setMode("caregiver");
                }}
              >
                <HeartHandshake size={16} /> Caregiver
              </button>
            </div>
          </div>

          <div className="control-group">
            <label>Need right now</label>
            <div className="mode-grid">
              {[
                ["urge", Brain, "Craving"],
                ["panic", AlertTriangle, "Emergency"],
                ["caregiver", HeartHandshake, "Care"],
                ["planning", Check, "Plan"],
                ["learning", BookOpen, "Learn"],
              ].map(([value, Icon, label]) => (
                <button
                  key={value as string}
                  className={mode === value ? "active tile" : "tile"}
                  onClick={() => setMode(value as Mode)}
                >
                  <Icon size={18} />
                  <span>{label as string}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="control-group">
            <label>Trusted support</label>
            <input
              placeholder="Name"
              value={supportName}
              onChange={(event) => setSupportName(event.target.value)}
            />
            <input
              placeholder="Phone"
              value={supportPhone}
              onChange={(event) => setSupportPhone(event.target.value)}
            />
            <a className="call-link" href={supportPhone ? `tel:${supportPhone}` : undefined}>
              <Phone size={16} /> Call support
            </a>
          </div>
        </aside>

        <section className="panel chat-panel">
          <div className="chat-header">
            <div>
              <h2>Recovery Companion</h2>
              <p>{speechSupported ? "Voice input is ready in supported browsers." : "Speech input is not supported here."}</p>
            </div>
            <button className="icon-button" onClick={() => setVoiceEnabled((enabled) => !enabled)}>
              <Volume2 size={18} />
              <span>{voiceEnabled ? "Voice on" : "Voice off"}</span>
            </button>
          </div>

          <div className="messages">
            {messages.map((message) => (
              <article key={message.id} className={`message ${message.from}`}>
                {message.text}
              </article>
            ))}
            {isLoading && <article className="message assistant">Thinking through a safe next step...</article>}
            <div ref={chatEndRef} />
          </div>

          <div className="quick-prompts">
            {quickPrompts.map((prompt) => (
              <button key={prompt} onClick={() => void sendMessage(prompt)}>
                <Sparkles size={14} /> {prompt}
              </button>
            ))}
          </div>

          <form
            className="composer"
            onSubmit={(event) => {
              event.preventDefault();
              void sendMessage(input);
            }}
          >
            <button
              type="button"
              className={isListening ? "mic listening" : "mic"}
              onClick={toggleListening}
              disabled={!speechSupported}
              title="Start voice input"
            >
              {isListening ? <MicOff size={22} /> : <Mic size={22} />}
            </button>
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Speak or type what is happening..."
            />
            <button type="submit" disabled={isLoading || !input.trim()} title="Send">
              <Send size={20} />
            </button>
          </form>
        </section>

        <aside className="panel resources-panel">
          <h2>Grounding Resources</h2>
          {resourceCards.map((resource) => (
            <article className="resource" key={resource.title}>
              <h3>{resource.title}</h3>
              <p>{resource.body}</p>
            </article>
          ))}
        </aside>
      </section>
    </main>
  );
}
