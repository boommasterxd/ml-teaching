/**
 * React Error Boundary that catches rendering errors and displays
 * a user-friendly fallback UI instead of a blank screen.
 */
import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { AlertCircle } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  /** Switches to error state when a descendant throws during rendering. */
  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  /** Logs the error and component stack for debugging purposes. */
  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('ErrorBoundary caught an error:', error, info.componentStack);
  }

  /** Renders the fallback UI when an error has been caught, otherwise renders children. */
  render() {
    if (this.state.hasError) {
      return (
        <div
          role="alert"
          aria-live="assertive"
          className="min-h-screen flex items-center justify-center bg-zinc-50 px-4"
        >
          <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-zinc-200 p-8 text-center">
            <div className="inline-flex items-center justify-center p-3 bg-red-50 text-red-600 rounded-full mb-6">
              <AlertCircle className="w-8 h-8" aria-hidden="true" />
            </div>
            <h1 className="text-xl font-bold text-zinc-900 mb-3">
              Etwas ist schiefgelaufen
            </h1>
            <p className="text-zinc-600 mb-6">
              Ein unerwarteter Fehler ist aufgetreten. Bitte lade die Seite neu, um fortzufahren.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center justify-center px-6 py-3 bg-red-600 text-white font-semibold rounded-xl hover:bg-red-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2"
            >
              Seite neu laden
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
