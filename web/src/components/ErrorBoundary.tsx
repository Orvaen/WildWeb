import { Component, type ReactNode } from 'react'

// Affiche un message au lieu d'une page blanche si un composant plante.
export default class ErrorBoundary extends Component<{ children: ReactNode; resetKey?: string }, { error: Error | null }> {
  state = { error: null as Error | null }
  static getDerivedStateFromError(error: Error) { return { error } }
  componentDidUpdate(prev: { resetKey?: string }) {
    if (prev.resetKey !== this.props.resetKey && this.state.error) this.setState({ error: null })
  }
  render() {
    if (!this.state.error) return this.props.children
    return (
      <div className="wrap grid justify-items-start gap-3 pt-11 pb-16">
        <h1 className="text-2xl font-extrabold">Oups, cette page a planté</h1>
        <p className="text-mute">Recharge la page. Si ça continue, redémarre l'API et le site (Ctrl+C puis npm run dev).</p>
        <pre className="max-w-full overflow-x-auto rounded-lg bg-raised px-3 py-2 text-[.8rem] text-bad">{this.state.error.message}</pre>
        <button className="btn btn-primary" onClick={() => location.reload()}>Recharger</button>
      </div>
    )
  }
}
