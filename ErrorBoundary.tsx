
import React from 'react';

interface Props {
    children: React.ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: React.ErrorInfo | null;
}

class ErrorBoundary extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error, errorInfo: null };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        this.setState({ error, errorInfo });
        console.error("Uncaught error:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={{ padding: '40px', color: 'black', background: 'var(--color-background, #F9F9F7)', height: '100vh', fontFamily: 'Inter, sans-serif', textAlign: 'center' }}>
                    <h1 style={{ color: 'black', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.15em' }}>Algo salió mal</h1>
                    <p style={{ color: '#666', marginBottom: '20px' }}>Por favor, intenta recargar la página.</p>
                    {this.state.error && (
                        <div style={{ background: 'white', border: '1px solid #E5D5C5', padding: '20px', borderRadius: '0px', textAlign: 'left', margin: '0 auto', maxWidth: '800px', overflow: 'auto' }}>
                            <h3 style={{ color: 'black', fontWeight: 'bold' }}>{this.state.error.toString()}</h3>
                            <pre style={{ color: '#666', fontSize: '12px' }}>
                                {this.state.errorInfo?.componentStack}
                            </pre>
                        </div>
                    )}
                    <button
                        onClick={() => {
                            sessionStorage.clear();
                            window.location.reload();
                        }}
                        style={{ marginTop: '30px', padding: '15px 30px', background: 'black', color: 'white', border: 'none', borderRadius: '0px', fontWeight: 'bold', cursor: 'pointer', letterSpacing: '0.1em' }}
                    >
                        RECARGAR PÁGINA
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
