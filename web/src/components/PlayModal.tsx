import { useState } from 'react'
import { useUi } from '../context/UiContext'
import { Modal, Segmented } from './ui'

type OS = 'Windows' | 'Linux' | 'macOS'

export default function PlayModal() {
  const { playOpen, setPlayOpen } = useUi()
  const [os, setOs] = useState<OS>('Windows')
  const [note, setNote] = useState("Le téléchargement ouvrira avec l'alpha.")
  return (
    <Modal open={playOpen} onClose={() => setPlayOpen(false)} labelledBy="play-title">
      <h3 id="play-title" className="text-[1.1rem] font-extrabold">Télécharger Wild Link</h3>
      <Segmented value={os} options={[['Windows', 'Windows'], ['Linux', 'Linux'], ['macOS', 'macOS']]} onChange={setOs} />
      <ol className="grid list-decimal gap-1 pl-5 text-mute">
        <li>Installe le client {os}.</li>
        <li>Connecte-toi avec ton compte Wild Link.</li>
        <li>Sélectionne la ROM de Pokémon Rouge Feu, puis clique sur Rejoindre.</li>
      </ol>
      <button className="btn btn-primary btn-lg" onClick={() => setNote("Pas encore disponible : le client sortira avec l'alpha.")}>Télécharger pour {os}</button>
      <p className="text-[.86rem] text-mute">{note}</p>
    </Modal>
  )
}
