
"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { Button } from "@/components/ui/button";

interface Props {
  children?: ReactNode;
  fallbackMessage?: string;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
    this.setState({ errorInfo });
    // You could also log the error to an error reporting service here
  }

  private handleRetry = () => {
    // Attempt to reset the error state and re-render children
    // This might not always work depending on the error, but good for transient issues
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
    // Optionally, you could try to force a reload or navigate
    // window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4 text-center">
          <div className="max-w-md">
            <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-4 text-destructive">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            <h1 className="text-2xl font-bold font-headline mb-2">
              {this.props.fallbackMessage || "Oops! Something went wrong."}
            </h1>
            <p className="text-muted-foreground mb-6">
              We're sorry for the inconvenience. Please try refreshing the page or click the button below.
            </p>
            <Button onClick={this.handleRetry} size="lg">
              Try Again
            </Button>
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="mt-6 p-4 bg-muted rounded-md text-left text-xs overflow-auto">
                <h3 className="font-semibold mb-2">Error Details (Development Mode):</h3>
                <p className="font-mono text-destructive whitespace-pre-wrap break-all">
                  {this.state.error.toString()}
                </p>
                {this.state.errorInfo && (
                   <details className="mt-2">
                    <summary className="cursor-pointer">Stack Trace</summary>
                    <pre className="mt-1 whitespace-pre-wrap break-all">
                        {this.state.errorInfo.componentStack}
                    </pre>
                   </details>
                )}
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
