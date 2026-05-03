export function LoaderScreen(): JSX.Element {
  return (
    <div className="loader-screen min-h-screen flex flex-col items-center justify-center p-8 text-center">
      <div className="loader-scan" aria-hidden="true"></div>
      <div className="loader-particles" aria-hidden="true">
        <span></span><span></span><span></span><span></span><span></span>
      </div>
      <div className="spinner mb-6" role="status" aria-label="Loading portfolio">
        <span className="spinner-sweep"></span>
        <span className="spinner-core">Quality<br />Assurance</span>
        <span className="spinner-orbit orbit-1"></span>
        <span className="spinner-orbit orbit-2"></span>
        <span className="spinner-orbit orbit-3"></span>
        <span className="spinner-orbit orbit-4"></span>
        <span className="spinner-orbit orbit-5"></span>
        <span className="spinner-orbit orbit-6"></span>
      </div>
      <p className="loader-kicker">Running QA checks</p>
      <p className="loader-text text-cyber-muted">
        <span>Loading portfolio</span>
        <i></i><i></i><i></i>
      </p>
    </div>
  );
}
