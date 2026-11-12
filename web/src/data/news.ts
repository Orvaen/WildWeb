export type CoverArt = 'code' | 'rom' | 'logo' | 'road' | 'site' | 'team'
export type Post = { id: string; cat: string; date: string; title: string; sum: string; art: CoverArt; body: { h?: string; p?: string; list?: string[] }[] }

// Temps de lecture estimé (200 mots par minute)
export const readTime = (p: Post) => {
  const words = [p.sum, ...p.body.flatMap((b) => [b.h, b.p, ...(b.list ?? [])])].join(' ').split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.round(words / 200))
}
export const slug = (s: string) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

export const NEWS: Post[] = [
  { id: 'devlog-3', art: 'code', cat: 'Devlog', date: '08/11/2026', title: 'Premier rendu natif du client',
    sum: 'La fenêtre et le contexte OpenGL fonctionnent. Prochaine étape : afficher une carte lue depuis la ROM.',
    body: [
      { p: "Le client de Wild Link est écrit en C, avec Lumina pour la fenêtre et les entrées, et OpenGL pour le rendu. Cette semaine, la fenêtre s'ouvre, le contexte OpenGL est créé et la boucle principale tourne à 60 images par seconde." },
      { h: 'Ce qui marche', list: ['Ouverture de la fenêtre et redimensionnement', 'Création du contexte OpenGL 3.3', 'Boucle de jeu à pas fixe'] },
      { h: 'La suite', p: "Lire une première carte depuis la ROM et l'afficher avec ses tuiles. C'est l'étape qui valide toute l'approche." },
    ] },
  { id: 'devlog-2', art: 'rom', cat: 'Devlog', date: '02/11/2026', title: 'Pourquoi le client lit ta ROM',
    sum: 'Ce qui est extrait de la ROM, ce qui reste sur ton disque et ce qui passe par le serveur.',
    body: [
      { p: "Wild Link ne distribue aucune donnée du jeu original. Au premier lancement, tu sélectionnes la ROM du jeu et le client en extrait les cartes, les sprites et les sons." },
      { h: 'Ce qui reste chez toi', p: 'Toutes les ressources graphiques et sonores restent sur ton ordinateur.' },
      { h: 'Ce qui passe par le serveur', p: 'Ta position, tes combats, tes échanges et ton équipe. Le serveur fait foi pour la progression, ce qui limite la triche.' },
    ] },
  { id: 'annonce-nom', art: 'logo', cat: 'Annonce', date: '25/10/2026', title: 'Le projet s’appelle Wild Link',
    sum: 'Nom, logo et premières pistes pour la création de personnage.',
    body: [
      { p: 'Le projet a enfin un nom : Wild Link. Le logo reprend trois griffures creusées dans un disque, simple et lisible même en petit.' },
      { h: 'Création de personnage', p: "Dès l'entrée en jeu, tu pourras choisir l'apparence de ton dresseur, ses couleurs et ses cosmétiques." },
    ] },
  { id: 'roadmap', art: 'road', cat: 'Annonce', date: '18/10/2026', title: 'Feuille de route jusqu’à la bêta',
    sum: 'Les grandes étapes : client, serveur, alpha fermée, puis bêta ouverte.',
    body: [
      { h: 'Étapes', list: ['Client : rendu des cartes, déplacements, interface', 'Serveur : comptes, synchronisation des joueurs, combats', 'Alpha fermée : testeurs choisis sur le Discord', 'Bêta ouverte : PvP classé et Hôtel des ventes'] },
      { p: 'Les dates seront annoncées au fur et à mesure.' },
    ] },
  { id: 'site-001', art: 'site', cat: 'Mise à jour', date: '10/10/2026', title: 'Site v0.0.1',
    sum: 'Ouverture du site, de la boutique en aperçu et du système de vote.',
    body: [{ p: "Le site ouvre avec les pages Actualités, Boutique, Vote, Classement et Wiki. La boutique et le classement sont en aperçu, avec des données d'exemple." }] },
  { id: 'recrutement', art: 'team', cat: 'Communauté', date: '05/10/2026', title: 'Recrutement de testeurs',
    sum: 'Nous cherchons des testeurs pour l’alpha fermée.',
    body: [{ p: 'Tu veux tester Wild Link avant tout le monde ? Postule sur le Discord, salon #recrutement. Nous cherchons des joueurs PvP, des collectionneurs et des chasseurs de bugs.' }] },
]
