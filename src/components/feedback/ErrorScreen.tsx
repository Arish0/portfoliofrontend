type ErrorScreenProps = {
  message: string;
};

export function ErrorScreen({ message }: ErrorScreenProps): JSX.Element {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center">
      <h1 className="text-4xl font-syne font-bold mb-4 text-cyber-accent">Portfolio load failed</h1>
      <p className="text-cyber-muted">{message}</p>
    </div>
  );
}
