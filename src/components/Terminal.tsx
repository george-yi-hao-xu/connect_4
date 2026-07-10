import './Terminal.scss';

interface TerminalProps {
  logs: string[];
}

export function Terminal({ logs }: TerminalProps) {
  return (
    <section className="terminal">
      {logs.map((line, index) => (
        <div key={index} className="logLine">
          {line}
        </div>
      ))}
    </section>
  );
}
